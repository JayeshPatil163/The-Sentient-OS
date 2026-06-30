/**
 * ProcessTableV2.tsx — Process input table for the v2 classification pipeline.
 *
 * Uses the actual feature set of cpu_scheduler_full_pipeline.joblib:
 *   instruction_count, cpu_cycles_per_instruction, cpu_frequency_ghz,
 *   num_cores_assigned, process_type, io_operations_count, cache_miss_rate,
 *   page_faults, context_switch_count, memory_required_mb, priority, arrival_time
 *
 * The old ProcessTable.tsx is untouched.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ProcessInputV2 } from "@/services/apiServiceV2";

// Internal type adds a UI-only `id` and friendly display `pid` string
export interface ProcessV2Row extends ProcessInputV2 {
  id: string;
  pidLabel: string;
}

interface ProcessTableV2Props {
  processes: ProcessV2Row[];
  onProcessesChange: (p: ProcessV2Row[]) => void;
}

const PROCESS_TYPES = [
  { value: 0, label: "Batch" },
  { value: 1, label: "Interactive" },
  { value: 2, label: "Daemon" },
  { value: 3, label: "Real-time" },
];

let _nextId = 1;
const newId = () => String(_nextId++);

export const defaultProcess = (n: number): ProcessV2Row => ({
  id: newId(),
  pidLabel: `P${n}`,
  pid: n,
  arrival_time: n - 1,
  instruction_count: 5_000_000,
  cpu_cycles_per_instruction: 2.0,
  cpu_frequency_ghz: 3.0,
  num_cores_assigned: 1,
  process_type: 0,
  io_operations_count: 100,
  cache_miss_rate: 0.1,
  page_faults: 20,
  context_switch_count: 10,
  memory_required_mb: 256,
  priority: 5,
});

// Column definitions — each maps to a ProcessInputV2 field
const COLUMNS: {
  key: keyof ProcessInputV2;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}[] = [
  { key: "arrival_time", label: "Arrival (ms)", min: 0, step: 1, placeholder: "0" },
  { key: "instruction_count", label: "Instructions", min: 1, step: 100000, placeholder: "5000000" },
  { key: "cpu_cycles_per_instruction", label: "CPI", min: 0.1, max: 20, step: 0.1, placeholder: "2.0" },
  { key: "cpu_frequency_ghz", label: "CPU GHz", min: 0.1, max: 10, step: 0.1, placeholder: "3.0" },
  { key: "num_cores_assigned", label: "Cores", min: 1, max: 128, step: 1, placeholder: "1" },
  { key: "io_operations_count", label: "I/O Ops", min: 0, step: 10, placeholder: "100" },
  { key: "cache_miss_rate", label: "Cache Miss %", min: 0, max: 1, step: 0.01, placeholder: "0.10" },
  { key: "page_faults", label: "Page Faults", min: 0, step: 1, placeholder: "20" },
  { key: "context_switch_count", label: "Ctx Switches", min: 0, step: 1, placeholder: "10" },
  { key: "memory_required_mb", label: "Memory (MB)", min: 1, step: 64, placeholder: "256" },
  { key: "priority", label: "Priority (1-10)", min: 1, max: 10, step: 1, placeholder: "5" },
];

export const ProcessTableV2 = ({ processes, onProcessesChange }: ProcessTableV2Props) => {
  const addProcess = () => {
    const n = processes.length + 1;
    onProcessesChange([...processes, defaultProcess(n)]);
  };

  const removeProcess = (id: string) => {
    onProcessesChange(processes.filter((p) => p.id !== id));
  };

  const updateProcess = (id: string, field: keyof ProcessV2Row, value: string | number) => {
    onProcessesChange(
      processes.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <div className="space-y-3">
      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                PID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Del
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processes.map((proc) => (
              <tr key={proc.id} className="hover:bg-muted/20 transition-colors">
                {/* PID (read-only label) */}
                <td className="px-3 py-2 font-mono font-semibold text-primary">
                  {proc.pidLabel}
                </td>

                {/* Process type dropdown */}
                <td className="px-3 py-2">
                  <select
                    value={proc.process_type}
                    onChange={(e) => updateProcess(proc.id, "process_type", Number(e.target.value))}
                    className="w-28 h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {PROCESS_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Numeric fields */}
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    <Input
                      type="number"
                      value={proc[col.key] as number}
                      min={col.min}
                      max={col.max}
                      step={col.step}
                      placeholder={col.placeholder}
                      onChange={(e) =>
                        updateProcess(proc.id, col.key, parseFloat(e.target.value) || 0)
                      }
                      className="h-8 w-24 text-xs font-mono"
                    />
                  </td>
                ))}

                {/* Delete */}
                <td className="px-3 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProcess(proc.id)}
                    disabled={processes.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addProcess}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Process
      </Button>
    </div>
  );
};
