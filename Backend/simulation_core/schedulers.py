from collections import deque
import copy

def run_simulation(scheduler_class, processes, **kwargs):
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

class RoundRobinScheduler:
    def __init__(self, processes, time_quantum):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.time_quantum = time_quantum
        self.ready_queue = deque()
        self.name = f"Round Robin (TQ={time_quantum})"

    def run(self):
        time = 0
        completed_processes = []
        
        while self.processes or self.ready_queue:
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            current_process = self.ready_queue.popleft()

            if current_process.start_time == -1:
                current_process.start_time = time

            exec_time = min(self.time_quantum, current_process.remaining_time)

            current_process.execution_segment.append(
                {
                    "pid": f"P{current_process.pid}",
                    "start": time,
                    "end": time + exec_time
                }
            )

            current_process.remaining_time -= exec_time
            time += exec_time

            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if current_process.remaining_time == 0:
                current_process.completion_time = time
                current_process.turnaround_time = current_process.completion_time - current_process.arrival_time
                current_process.waiting_time = current_process.turnaround_time - current_process.burst_time
                completed_processes.append(current_process)
            else:
                self.ready_queue.append(current_process)
                
        return completed_processes

class SJFScheduler:
    def __init__(self, processes):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.name = "Shortest Job First (Non-Preemptive)"

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

            ready_queue.sort(key=lambda p: p.burst_time)
            
            current_process = ready_queue.pop(0)

            current_process.execution_segment.append(
                {
                    "pid": f"P{current_process.pid}",
                    "start": time,
                    "end": time + current_process.burst_time
                }
            )
            
            current_process.start_time = time
            current_process.completion_time = time + current_process.burst_time
            current_process.turnaround_time = current_process.completion_time - current_process.arrival_time
            current_process.waiting_time = current_process.turnaround_time - current_process.burst_time
            
            time = current_process.completion_time
            completed_processes.append(current_process)
            
        return completed_processes
    
class ADRRScheduler:
    def __init__(self, processes):
        self.processes = sorted(processes, key=lambda p: p.arrival_time)
        self.ready_queue = deque()
        self.name = "ADRR (AI-Powered)"
        self.previous_time_quantum = 1

    def run(self):
        time = 0
        completed_processes = []
        
        while self.processes or self.ready_queue:
            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if not self.ready_queue:
                time += 1
                continue

            sorted_ready_queue = sorted(self.ready_queue, key=lambda p: p.burst_time)
            
            min_burst = sorted_ready_queue[0].burst_time
            max_burst = sorted_ready_queue[-1].burst_time
            
            time_quantum = abs(max_burst - min_burst)
            
            if time_quantum == 0:
                if len(sorted_ready_queue) == 1:
                    time_quantum = sorted_ready_queue[0].remaining_time
                else:
                    time_quantum = self.previous_time_quantum
            
            self.previous_time_quantum = time_quantum

            current_process = self.ready_queue.popleft()

            if current_process.start_time == -1:
                current_process.start_time = time

            exec_time = min(time_quantum, current_process.remaining_time)
            current_process.execution_segment.append(
                {
                    "pid": f"P{current_process.pid}",
                    "start": time,
                    "end": time + exec_time
                }
            )
            current_process.remaining_time -= exec_time
            time += exec_time

            while self.processes and self.processes[0].arrival_time <= time:
                self.ready_queue.append(self.processes.pop(0))

            if current_process.remaining_time == 0:
                current_process.completion_time = time
                current_process.turnaround_time = current_process.completion_time - current_process.arrival_time
                current_process.waiting_time = current_process.turnaround_time - current_process.burst_time
                completed_processes.append(current_process)
            else:
                self.ready_queue.append(current_process)
                
        return completed_processes