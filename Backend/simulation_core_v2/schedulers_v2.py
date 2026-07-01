from collections import deque
import copy
import time as t

CATEGORY_TQ_MAP = {
    0: 10,
    1: 50,
    2: 150,
}


def run_simulation_v2(scheduler_class, processes, **kwargs):
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


class RoundRobinV2:
    def __init__(self, processes, time_quantum: int = 20):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.time_quantum = time_quantum
        self.ready_queue = deque()
        self.name = f"Round Robin V2 (TQ={time_quantum})"

    def run(self):
        time = 0
        completed_processes = []

        while self.processes or self.ready_queue:
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            current = self.ready_queue.popleft()
            if current.start_time == -1:
                current.start_time = time

            exec_time = min(self.time_quantum, current.remaining_time)
            current.execution_segment.append({"pid": f"P{current.pid}", "start": time, "end": time + exec_time})
            current.remaining_time -= exec_time
            time += exec_time
            t.sleep(0.005)

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


class SJFV2:
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

            ready_queue.sort(key=lambda p: (p.category, p.burst_time))
            current = ready_queue.pop(0)

            current.execution_segment.append({"pid": f"P{current.pid}", "start": time, "end": time + current.burst_time})
            current.start_time = time
            current.completion_time = time + current.burst_time
            current.turnaround_time = current.completion_time - current.arrival_time
            current.waiting_time = current.turnaround_time - current.burst_time

            time = current.completion_time
            completed_processes.append(current)

        return completed_processes


class ADRRv2:
    def __init__(self, processes):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.ready_queue = deque()
        self.name = "ADRR V2 (Category-Aware)"
        self._previous_tq = CATEGORY_TQ_MAP[1]

    def _dominant_category(self) -> int:
        if not self.ready_queue:
            return 1
        counts = {0: 0, 1: 0, 2: 0}
        for p in self.ready_queue:
            counts[p.category] = counts.get(p.category, 0) + 1
        return min(counts, key=lambda c: (-counts[c], c))

    def _compute_tq(self) -> int:
        tq = CATEGORY_TQ_MAP[self._dominant_category()]
        self._previous_tq = tq
        return tq

    def run(self):
        time = 0
        completed_processes = []

        while self.processes or self.ready_queue:
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            time_quantum = self._compute_tq()
            current = self.ready_queue.popleft()
            if current.start_time == -1:
                current.start_time = time

            exec_time = min(time_quantum, current.remaining_time)
            current.execution_segment.append({"pid": f"P{current.pid}", "start": time, "end": time + exec_time})
            current.remaining_time -= exec_time
            time += exec_time
            t.sleep(0.005)

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
