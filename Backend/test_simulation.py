# Testing if scheduling algorithm work or not

import pandas as pd
from simulation_core.process import Process
from simulation_core.schedulers import run_simulation, RoundRobinScheduler, SJFScheduler

def load_processes_from_csv(filepath):
    df = pd.read_csv(filepath)
    processes = []
    for _, row in df.iterrows():
        processes.append(Process(
            pid=int(row['pid']),
            arrival_time=int(row['arrival_time']),
            burst_time=int(row['burst_time'])
        ))
    return processes

def main():
    processes = load_processes_from_csv('data/sample_processes.csv')
    print(f"Loaded {len(processes)} processes for simulation.\n")
    # SJF
    sjf_results = run_simulation(SJFScheduler, processes)
    
    # RR
    rr_results = run_simulation(RoundRobinScheduler, processes, time_quantum=4)
    
    # Results
    results_df = pd.DataFrame([sjf_results, rr_results])
    print(results_df.to_string(index=False))

if __name__ == "__main__":
    main()