from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware
import os
from simulation_core.process import Process
from simulation_core.schedulers import run_simulation, RoundRobinScheduler, ADRRScheduler, SJFScheduler
from typing import Optional

app = FastAPI()

MODEL_PATH = "predictive_engine/predictive_engine.joblib"
model = joblib.load(MODEL_PATH)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessInput(BaseModel):
    pid: int
    arrival_time: int
    UserID: int
    GroupID: int
    ReqTime: int
    ReqMemory: int

class SimulationRequest(BaseModel):
    algorithms: List[str]
    processes: List[ProcessInput]
    time_quantum: Optional[int] = 10

@app.post("/simulate")
async def simulate_scheduling(request: SimulationRequest):
    data = [p.dict() for p in request.processes]
    df = pd.DataFrame(data)

    df_for_prediction = df.copy()
    df_for_prediction['JobID'] = df_for_prediction['pid']
    df_for_prediction['SubmitTime'] = df_for_prediction['arrival_time']
    df_for_prediction['QueueID'] = df_for_prediction.get('GroupID', 0) 
    df_for_prediction['UsedMemory'] = df_for_prediction.get('ReqMemory', 0)
    df_for_prediction['WaitTime'] = 0 
    
    if hasattr(model, 'feature_names_in_'):
        ordered_features = list(model.feature_names_in_)
    else:
        ordered_features = ['JobID', 'SubmitTime', 'WaitTime', 'UsedMemory', 
                            'ReqTime', 'UserID', 'GroupID', 'QueueID']

    for col in ordered_features:
        if col not in df_for_prediction.columns:
            df_for_prediction[col] = 0
    
    try:
        X = df_for_prediction[ordered_features]
        predicted_bursts = model.predict(X)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

    sim_processes = []
    print(predicted_bursts)
    print("Predicted values above")
    for i, row in df.iterrows():
        print(predicted_bursts[i])
        sim_processes.append(Process(
            pid=int(row['pid']),
            arrival_time=int(row['arrival_time']),
            burst_time=int(predicted_bursts[i])
        ))

    results = []
    if "ADRR" in request.algorithms:
        adrr_results = run_simulation(ADRRScheduler, sim_processes)
        results.append(adrr_results)
    if "RR" in request.algorithms:
        rr_results = run_simulation(RoundRobinScheduler, sim_processes, time_quantum=request.time_quantum)
        results.append(rr_results)
    if "SJF" in request.algorithms:
        sjf_results = run_simulation(SJFScheduler, sim_processes)
        results.append(sjf_results)

    return {
        "status": "success",
        "results": results,
        "predictions": predicted_bursts.tolist()
    }