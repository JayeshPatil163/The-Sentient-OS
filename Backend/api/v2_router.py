"""
v2_router.py — FastAPI router for the v2 classification-based scheduling endpoint.

This router is mounted at /v2 in main.py.  It is completely isolated from the
original /simulate endpoint — same request schema, different model + logic.

Key differences from v1 (/simulate):
  - Loads `cpu_scheduler_full_pipeline.joblib` (classifier, not regressor)
  - Model predicts category labels: 0=Short, 1=Medium, 2=Long
  - Categories are mapped to representative burst times via CATEGORY_BURST_MAP
  - Schedulers come from simulation_core_v2 (category-aware)
  - Response includes `category_labels` and `category_names` arrays

Available algorithms (same names as v1 for easy frontend comparison):
  - "ADRR"  → ADRRv2  (Category-Aware ADRR)
  - "RR"    → RoundRobinV2
  - "SJF"   → SJFV2

Model feature set (cpu_scheduler_full_pipeline.joblib):
  instruction_count, cpu_cycles_per_instruction, cpu_frequency_ghz,
  num_cores_assigned, process_type, io_operations_count, cache_miss_rate,
  page_faults, context_switch_count, memory_required_mb, priority, arrival_time
"""

import os
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from simulation_core_v2.process_v2 import ProcessV2, CATEGORY_BURST_MAP, CATEGORY_LABELS
from simulation_core_v2.schedulers_v2 import (
    run_simulation_v2,
    ADRRv2,
    RoundRobinV2,
    SJFV2,
)

# ---------------------------------------------------------------------------
# Router setup
# ---------------------------------------------------------------------------

router = APIRouter(tags=["v2"])

# Load the new classifier model once at startup
_V2_MODEL_PATH = "predictive_engine/cpu_scheduler_full_pipeline.joblib"

try:
    v2_model = joblib.load(_V2_MODEL_PATH)
    print(f"[v2_router] Loaded model from {_V2_MODEL_PATH}")
except Exception as e:
    raise RuntimeError(
        f"[v2_router] Failed to load v2 model at '{_V2_MODEL_PATH}': {e}"
    )

# ---------------------------------------------------------------------------
# Request schema — uses the actual features the new model was trained on.
#
# Features (in model order):
#   instruction_count         — total instructions executed
#   cpu_cycles_per_instruction — CPI (higher = less efficient)
#   cpu_frequency_ghz         — clock speed of assigned CPU
#   num_cores_assigned        — number of CPU cores
#   process_type              — categorical int (0=batch, 1=interactive, 2=daemon, …)
#   io_operations_count       — total I/O operations issued
#   cache_miss_rate           — L2/L3 miss rate (0.0 – 1.0)
#   page_faults               — number of page fault events
#   context_switch_count      — number of context switches
#   memory_required_mb        — peak memory footprint in MB
#   priority                  — scheduling priority (1=low, 10=high)
#   arrival_time              — time at which process becomes ready (ms)
# ---------------------------------------------------------------------------

class ProcessInputV2(BaseModel):
    pid: int
    arrival_time: float = 0
    instruction_count: float = 1_000_000
    cpu_cycles_per_instruction: float = 1.5
    cpu_frequency_ghz: float = 3.0
    num_cores_assigned: int = 1
    process_type: int = 0
    io_operations_count: float = 100
    cache_miss_rate: float = 0.1        # 0.0 – 1.0
    page_faults: float = 10
    context_switch_count: float = 5
    memory_required_mb: float = 256
    priority: int = 5                   # 1 (low) – 10 (high)


class SimulationRequestV2(BaseModel):
    algorithms: List[str]
    processes: List[ProcessInputV2]
    time_quantum: Optional[int] = 20


# ---------------------------------------------------------------------------
# Feature engineering — assembles the exact column order the model expects
# ---------------------------------------------------------------------------

_MODEL_FEATURES = [
    "instruction_count",
    "cpu_cycles_per_instruction",
    "cpu_frequency_ghz",
    "num_cores_assigned",
    "process_type",
    "io_operations_count",
    "cache_miss_rate",
    "page_faults",
    "context_switch_count",
    "memory_required_mb",
    "priority",
    "arrival_time",
]


def _build_feature_df(data: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(data)

    # Use model's declared feature order if available (robust to future retraining)
    if hasattr(v2_model, "feature_names_in_"):
        ordered_features = list(v2_model.feature_names_in_)
    else:
        ordered_features = _MODEL_FEATURES

    for col in ordered_features:
        if col not in df.columns:
            df[col] = 0

    return df[ordered_features]


# ---------------------------------------------------------------------------
# /v2/simulate endpoint
# ---------------------------------------------------------------------------

@router.post("/simulate")
async def simulate_scheduling_v2(request: SimulationRequestV2):
    """
    Run CPU scheduling simulation using the classification-based ML model.

    The model predicts burst-time categories (0=Short, 1=Medium, 2=Long)
    instead of raw burst times.  Representative burst times are used for the
    actual simulation so all three schedulers can produce meaningful metrics.
    """
    raw_data = [p.dict() for p in request.processes]

    # --- Prediction ---
    try:
        X = _build_feature_df(raw_data)
        category_labels: list[int] = [int(c) for c in v2_model.predict(X)]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"v2 prediction error: {str(e)}")

    category_names = [CATEGORY_LABELS.get(c, "Unknown") for c in category_labels]

    print("[v2_router] Predicted categories:", category_labels)
    print("[v2_router] Category names:", category_names)

    # --- Build ProcessV2 objects ---
    sim_processes = []
    for i, row in enumerate(raw_data):
        sim_processes.append(
            ProcessV2(
                pid=int(row["pid"]),
                arrival_time=int(row["arrival_time"]),
                category=category_labels[i],
            )
        )

    # --- Run requested scheduling algorithms ---
    results = []

    if "ADRR" in request.algorithms:
        results.append(run_simulation_v2(ADRRv2, sim_processes))

    if "RR" in request.algorithms:
        results.append(
            run_simulation_v2(RoundRobinV2, sim_processes, time_quantum=request.time_quantum)
        )

    if "SJF" in request.algorithms:
        results.append(run_simulation_v2(SJFV2, sim_processes))

    if not results:
        raise HTTPException(
            status_code=400,
            detail="No valid algorithm specified. Use 'ADRR', 'RR', or 'SJF'.",
        )

    # --- Flatten execution log ---
    execution_log = []
    for res in results:
        for seg in res["Gantt Chart"]:
            execution_log.append({
                "pid": seg["pid"],
                "start": seg["start"],
                "end": seg["end"],
            })

    return {
        "status": "success",
        "results": results,
        "category_labels": category_labels,
        "category_names": category_names,
        "execution_log": execution_log,
    }
