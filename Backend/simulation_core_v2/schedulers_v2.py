"""
schedulers_v2.py — Category-aware CPU scheduling algorithms for the v2 pipeline.

All schedulers here work with ProcessV2 objects whose burst times are derived
from ML-predicted categories (0=Short, 1=Medium, 2=Long).  The key difference
from v1 schedulers is that ADRR v2 uses the *category distribution* in the
ready queue — not raw burst-time spread — to adapt its time quantum.

Scheduler classes:
    RoundRobinV2    — Standard RR with a caller-supplied time quantum.
    SJFV2           — Non-preemptive SJF; ties broken by category then arrival.
    ADRRv2          — Adaptive Dynamic Round Robin using category-aware TQ logic.
"""

from collections import deque
import copy
import time as t


# ---------------------------------------------------------------------------
# Category → time-quantum defaults used by ADRRv2
# ---------------------------------------------------------------------------
CATEGORY_TQ_MAP = {
    0: 10,    # Short  → small quantum (finish quickly)
    1: 50,    # Medium → moderate quantum
    2: 150,   # Long   → large quantum (avoid excessive context switching)
}


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def run_simulation_v2(scheduler_class, processes, **kwargs):
    """Deep-copy processes before handing them off so the originals are intact."""
    processes_copy = copy.deepcopy(processes)
    scheduler = scheduler_class(processes_copy, **kwargs)
    completed_processes = scheduler.run()

    total_wt = sum(p.waiting_time for p in completed_processes)
    total_tt = sum(p.turnaround_time for p in completed_processes)
    num_processes = len(completed_processes)

    gantt_chart = []
    for p in completed_processes:
        gantt_chart.extend(p.execution_segment)
    gantt_chart.sort(key=lambda x: x["start"])

    return {
        "Algorithm": scheduler.name,
        "Average Waiting Time": round(total_wt / num_processes, 2),
        "Average Turnaround Time": round(total_tt / num_processes, 2),
        "Gantt Chart": gantt_chart,
    }


# ---------------------------------------------------------------------------
# Round Robin V2
# ---------------------------------------------------------------------------

class RoundRobinV2:
    """Standard Round Robin — time quantum supplied by caller."""

    def __init__(self, processes, time_quantum: int = 20):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.time_quantum = time_quantum
        self.ready_queue = deque()
        self.name = f"Round Robin V2 (TQ={time_quantum})"

    def run(self):
        time = 0
        completed_processes = []

        while self.processes or self.ready_queue:
            # Admit newly arrived processes
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            current = self.ready_queue.popleft()
            if current.start_time == -1:
                current.start_time = time

            exec_time = min(self.time_quantum, current.remaining_time)
            current.execution_segment.append({
                "pid": f"P{current.pid}",
                "start": time,
                "end": time + exec_time,
            })
            current.remaining_time -= exec_time
            time += exec_time
            t.sleep(0.005)

            # Admit processes that arrived during execution
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if current.remaining_time == 0:
                current.completion_time = time
                current.turnaround_time = current.completion_time - current.arrival_time
                current.waiting_time = current.turnaround_time - current.burst_time
                completed_processes.append(current)
            else:
                self.ready_queue.append(current)

        return completed_processes


# ---------------------------------------------------------------------------
# SJF V2
# ---------------------------------------------------------------------------

class SJFV2:
    """
    Non-preemptive Shortest Job First — category-aware.
    
    Processes are sorted by category (0 < 1 < 2) so Short jobs run first.
    Within the same category, arrival time is used as a tiebreaker.
    """

    def __init__(self, processes):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.name = "SJF V2 (Category-Aware)"

    def run(self):
        time = 0
        completed_processes = []
        ready_queue = []

        while self.processes or ready_queue:
            while self.processes and self.processes[0].arrival_time <= time:
                ready_queue.append(self.processes.pop(0))

            if not ready_queue:
                time += 1
                continue

            # Primary sort: category (lower = shorter = higher priority)
            # Secondary sort: burst_time for within-category ordering
            ready_queue.sort(key=lambda p: (p.category, p.burst_time))
            current = ready_queue.pop(0)

            current.execution_segment.append({
                "pid": f"P{current.pid}",
                "start": time,
                "end": time + current.burst_time,
            })
            current.start_time = time
            current.completion_time = time + current.burst_time
            current.turnaround_time = current.completion_time - current.arrival_time
            current.waiting_time = current.turnaround_time - current.burst_time

            time = current.completion_time
            completed_processes.append(current)

        return completed_processes


# ---------------------------------------------------------------------------
# ADRR V2  — Adaptive Dynamic Round Robin (Category-Aware)
# ---------------------------------------------------------------------------

class ADRRv2:
    """
    Adaptive Dynamic Round Robin — v2 (Category-Aware).

    Instead of deriving the time quantum from the raw spread between max and
    min burst times (v1 approach), ADRRv2 derives it from the *dominant
    category* of processes currently in the ready queue:

        dominant category = the category label (0/1/2) that appears most often
                            in the current ready queue snapshot.

    This ensures that when the queue is dominated by Short jobs the TQ stays
    small (low overhead, fast throughput) and when Long jobs dominate the TQ
    grows (fewer context switches, better CPU utilisation).

    Tie-breaking for dominant category: prefer lower category (shorter first).
    """

    def __init__(self, processes):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.ready_queue = deque()
        self.name = "ADRR V2 (Category-Aware)"
        self._previous_tq = CATEGORY_TQ_MAP[1]  # Start with medium TQ

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _dominant_category(self) -> int:
        """Return the most-frequent category in the ready queue."""
        if not self.ready_queue:
            return 1  # Default to medium

        counts = {0: 0, 1: 0, 2: 0}
        for p in self.ready_queue:
            counts[p.category] = counts.get(p.category, 0) + 1

        # Pick the category with the highest count; prefer lower category on tie
        dominant = min(counts, key=lambda c: (-counts[c], c))
        return dominant

    def _compute_tq(self) -> int:
        """Derive a time quantum from the dominant ready-queue category."""
        dom = self._dominant_category()
        tq = CATEGORY_TQ_MAP[dom]
        self._previous_tq = tq
        return tq

    # ------------------------------------------------------------------
    # Main scheduling loop
    # ------------------------------------------------------------------

    def run(self):
        time = 0
        completed_processes = []

        while self.processes or self.ready_queue:
            # Admit newly arrived processes
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            # Compute adaptive TQ from the current ready queue composition
            time_quantum = self._compute_tq()

            current = self.ready_queue.popleft()
            if current.start_time == -1:
                current.start_time = time

            exec_time = min(time_quantum, current.remaining_time)
            current.execution_segment.append({
                "pid": f"P{current.pid}",
                "start": time,
                "end": time + exec_time,
            })
            current.remaining_time -= exec_time
            time += exec_time
            t.sleep(0.005)

            # Admit processes that arrived during this execution slice
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if current.remaining_time == 0:
                current.completion_time = time
                current.turnaround_time = current.completion_time - current.arrival_time
                current.waiting_time = current.turnaround_time - current.burst_time
                completed_processes.append(current)
            else:
                self.ready_queue.append(current)

        return completed_processes
