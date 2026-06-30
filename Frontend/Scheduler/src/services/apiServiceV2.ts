/**
 * apiServiceV2.ts — Typed Axios client for the v2 classification-based
 * scheduling endpoint (/v2/simulate).
 *
 * The new model (cpu_scheduler_full_pipeline.joblib) uses CPU hardware metrics
 * as features — not HPC job metadata like the v1 model.
 * The old apiService.js is completely untouched.
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiServiceV2 = axios.create({
  baseURL: `${API_BASE_URL}/v2`,
  headers: {
    "Content-Type": "application/json",
  },
});

// -------------------------------------------------------------------------
// Request types — matches cpu_scheduler_full_pipeline.joblib feature set
// -------------------------------------------------------------------------

export interface ProcessInputV2 {
  pid: number;
  arrival_time: number;
  instruction_count: number;
  cpu_cycles_per_instruction: number;
  cpu_frequency_ghz: number;
  num_cores_assigned: number;
  process_type: number;          // 0=batch, 1=interactive, 2=daemon
  io_operations_count: number;
  cache_miss_rate: number;       // 0.0 – 1.0
  page_faults: number;
  context_switch_count: number;
  memory_required_mb: number;
  priority: number;              // 1 (low) – 10 (high)
}

export interface SimulationRequestV2 {
  algorithms: string[];
  processes: ProcessInputV2[];
  time_quantum?: number;
}

// -------------------------------------------------------------------------
// Response types
// -------------------------------------------------------------------------

export interface GanttDataPoint {
  pid: string;
  start: number;
  end: number;
}

export interface SchedulerResultV2 {
  Algorithm: string;
  "Average Waiting Time": number;
  "Average Turnaround Time": number;
  "Gantt Chart": GanttDataPoint[];
}

export interface SimulationResponseV2 {
  status: "success";
  results: SchedulerResultV2[];
  category_labels: number[];   // 0 = Short, 1 = Medium, 2 = Long
  category_names: string[];    // "Short" | "Medium" | "Long"
  execution_log: GanttDataPoint[];
}

// -------------------------------------------------------------------------
// API call
// -------------------------------------------------------------------------

export const simulateSchedulingV2 = (
  body: SimulationRequestV2
): Promise<{ data: SimulationResponseV2 }> => {
  return apiServiceV2.post<SimulationResponseV2>("/simulate", body);
};
