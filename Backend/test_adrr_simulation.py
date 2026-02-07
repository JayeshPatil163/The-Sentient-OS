# This is for testing purpose if model works or not

import pandas as pd
import joblib
from simulation_core.process import Process
from simulation_core.schedulers import run_simulation, RoundRobinScheduler, ADRRScheduler

def load_model(path="predictive_engine/predictive_engine.joblib"):
    try:
        model = joblib.load(path)
        print("model loaded successfully.") 
        return model
    except FileNotFoundError:
        print("Model not found")
        return None

def predict_burst_times(model, processes_df):
    df_for_prediction = processes_df.copy()

    # required features for prediction
    df_for_prediction['JobID'] = df_for_prediction['pid']
    df_for_prediction['SubmitTime'] = df_for_prediction['arrival_time']
    
    if 'QueueID' not in df_for_prediction.columns:
        df_for_prediction['QueueID'] = df_for_prediction['GroupID']
    
    if 'UsedMemory' not in df_for_prediction.columns:
        df_for_prediction['UsedMemory'] = df_for_prediction['ReqMemory']
    
    if 'WaitTime' not in df_for_prediction.columns:
        df_for_prediction['WaitTime'] = 0
    
    if hasattr(model, 'feature_names_in_'):
        expected_features = list(model.feature_names_in_)
        print(f"Model expects these features: {expected_features}")
    else:
        expected_features = ['JobID', 'SubmitTime', 'QueueID', 'UsedMemory', 'WaitTime', 
                           'UserID', 'GroupID', 'ReqTime']
    
    missing_features = [f for f in expected_features if f not in df_for_prediction.columns]
    if missing_features:
        print(f"Missing features: {missing_features}")
        print(f"Available columns: {list(df_for_prediction.columns)}")
        return None
    
    X = df_for_prediction[expected_features]
    predictions = model.predict(X)
    return predictions

def main():
    print("--- AI-Powered CPU Scheduling Simulation ---")
    model = load_model()
    if model is None:
        return

    processes_df = pd.read_csv('data/simulation_processes.csv')
    print(f"Loaded {len(processes_df)} processes for simulation.")

    predicted_bursts = predict_burst_times(model, processes_df)
    if predicted_bursts is None:
        return

    processes = []
    for i, row in processes_df.iterrows():
        processes.append(Process(
            pid=int(row['pid']),
            arrival_time=int(row['arrival_time']),
            burst_time=int(predicted_bursts[i])
        ))

    print("\n--- Running Simulations with Predicted Burst Times ---")

    # ADRR
    adrr_results = run_simulation(ADRRScheduler, processes)

    # RR
    rr_results = run_simulation(RoundRobinScheduler, processes, time_quantum=10)

    results_df = pd.DataFrame([adrr_results, rr_results])
    print("\n--- Simulation Results ---")
    print(results_df.to_string(index=False))
    print("\n--- End of Simulation ---")

if __name__ == "__main__":
    main()