/**
 * IndexV2.tsx — Scheduler simulator page wired to the v2 classification-based
 * ML pipeline (/v2/simulate endpoint).
 *
 * Uses cpu_scheduler_full_pipeline.joblib which classifies processes as:
 *   Short (0) | Medium (1) | Long (2)
 * based on CPU hardware metrics instead of HPC job metadata.
 *
 * The old Index.tsx is 100% untouched — navigating to "/simulator" still uses it.
 */

import { useState } from "react";
import { ProcessTableV2, ProcessV2Row, defaultProcess } from "@/components/ProcessTableV2";
import { AlgorithmSelector } from "@/components/AlgorithmSelector";
import { ResultsDisplayV2 } from "@/components/ResultsDisplayV2";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { BrainCircuit, Database, Play, Sparkles } from "lucide-react";
import {
  simulateSchedulingV2,
  SimulationResponseV2,
} from "@/services/apiServiceV2";

const IndexV2 = () => {
  const [processes, setProcesses] = useState<ProcessV2Row[]>([
    defaultProcess(1),
  ]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(["ADRR"]);
  const [timeQuantum, setTimeQuantum] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResponseV2 | null>(null);

  // -----------------------------------------------------------------------
  // Sample data — representative mix of Short / Medium / Long processes
  // -----------------------------------------------------------------------
  const loadSampleData = () => {
    const sample: ProcessV2Row[] = [
      // Short — tiny script, fast clock, minimal I/O
      {
        id: "s1", pidLabel: "P1", pid: 1,
        arrival_time: 0, instruction_count: 200_000,
        cpu_cycles_per_instruction: 1.1, cpu_frequency_ghz: 4.0,
        num_cores_assigned: 1, process_type: 1,
        io_operations_count: 5, cache_miss_rate: 0.02,
        page_faults: 2, context_switch_count: 1,
        memory_required_mb: 32, priority: 8,
      },
      // Short — another tiny interactive task
      {
        id: "s2", pidLabel: "P2", pid: 2,
        arrival_time: 1, instruction_count: 500_000,
        cpu_cycles_per_instruction: 1.3, cpu_frequency_ghz: 3.8,
        num_cores_assigned: 1, process_type: 1,
        io_operations_count: 15, cache_miss_rate: 0.03,
        page_faults: 4, context_switch_count: 2,
        memory_required_mb: 64, priority: 7,
      },
      // Medium — moderate compute job
      {
        id: "s3", pidLabel: "P3", pid: 3,
        arrival_time: 2, instruction_count: 20_000_000,
        cpu_cycles_per_instruction: 2.5, cpu_frequency_ghz: 3.2,
        num_cores_assigned: 2, process_type: 0,
        io_operations_count: 500, cache_miss_rate: 0.12,
        page_faults: 40, context_switch_count: 15,
        memory_required_mb: 512, priority: 5,
      },
      // Medium — daemon with moderate I/O
      {
        id: "s4", pidLabel: "P4", pid: 4,
        arrival_time: 3, instruction_count: 40_000_000,
        cpu_cycles_per_instruction: 3.0, cpu_frequency_ghz: 2.8,
        num_cores_assigned: 2, process_type: 2,
        io_operations_count: 1200, cache_miss_rate: 0.20,
        page_faults: 80, context_switch_count: 30,
        memory_required_mb: 1024, priority: 4,
      },
      // Long — heavy batch job
      {
        id: "s5", pidLabel: "P5", pid: 5,
        arrival_time: 4, instruction_count: 1_500_000_000,
        cpu_cycles_per_instruction: 4.2, cpu_frequency_ghz: 2.4,
        num_cores_assigned: 8, process_type: 0,
        io_operations_count: 8000, cache_miss_rate: 0.42,
        page_faults: 400, context_switch_count: 180,
        memory_required_mb: 8192, priority: 2,
      },
      // Long — large real-time simulation
      {
        id: "s6", pidLabel: "P6", pid: 6,
        arrival_time: 5, instruction_count: 2_000_000_000,
        cpu_cycles_per_instruction: 3.8, cpu_frequency_ghz: 2.2,
        num_cores_assigned: 16, process_type: 3,
        io_operations_count: 12000, cache_miss_rate: 0.50,
        page_faults: 600, context_switch_count: 250,
        memory_required_mb: 16384, priority: 1,
      },
    ];
    setProcesses(sample);
    toast.success("Sample data loaded — 2 Short, 2 Medium, 2 Long processes");
  };

  // -----------------------------------------------------------------------
  // Run simulation (v2)
  // -----------------------------------------------------------------------
  const runSimulation = async () => {
    if (processes.length === 0) {
      toast.error("Please add at least one process");
      return;
    }

    setIsRunning(true);
    setResults(null);

    const requestBody = {
      algorithms: selectedAlgorithms,
      processes: processes.map((p) => ({
        pid: p.pid,
        arrival_time: p.arrival_time,
        instruction_count: p.instruction_count,
        cpu_cycles_per_instruction: p.cpu_cycles_per_instruction,
        cpu_frequency_ghz: p.cpu_frequency_ghz,
        num_cores_assigned: p.num_cores_assigned,
        process_type: p.process_type,
        io_operations_count: p.io_operations_count,
        cache_miss_rate: p.cache_miss_rate,
        page_faults: p.page_faults,
        context_switch_count: p.context_switch_count,
        memory_required_mb: p.memory_required_mb,
        priority: p.priority,
      })),
      time_quantum: timeQuantum,
    };

    try {
      const response = await simulateSchedulingV2(requestBody);
      setResults(response.data);
      const cats = response.data.category_names;
      const short = cats.filter((c) => c === "Short").length;
      const medium = cats.filter((c) => c === "Medium").length;
      const long = cats.filter((c) => c === "Long").length;
      toast.success(`Classified: ${short} Short · ${medium} Medium · ${long} Long`);
    } catch (error) {
      toast.error(
        "Failed to run v2 simulation. Ensure the backend is running and the v2 model is loaded."
      );
      console.error("v2 simulation error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-primary to-accent py-8 px-6 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-3xl font-bold text-primary-foreground">
              CPU Scheduling Simulator
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30">
              <Sparkles className="h-3 w-3" />
              v2 · AI Classify
            </span>
          </div>
          <p className="text-primary-foreground/90 text-sm">
            Powered by{" "}
            <strong>cpu_scheduler_full_pipeline</strong> — classifies each
            process as <strong>Short</strong>, <strong>Medium</strong>, or{" "}
            <strong>Long</strong> from hardware metrics before scheduling
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Process table — takes up more space due to many columns */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Process Configuration</CardTitle>
                </div>
                <CardDescription>
                  Provide CPU hardware metrics for each process — the AI model
                  will classify them before scheduling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProcessTableV2
                  processes={processes}
                  onProcessesChange={setProcesses}
                />
                <Button
                  variant="secondary"
                  onClick={loadSampleData}
                  className="w-full"
                >
                  Load Sample Data (2 Short + 2 Medium + 2 Long)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — algorithm selector + run button + model info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Selection</CardTitle>
                <CardDescription>
                  Choose a category-aware scheduling algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlgorithmSelector
                  selectedAlgorithms={selectedAlgorithms}
                  timeQuantum={timeQuantum}
                  onAlgorithmChange={setSelectedAlgorithms}
                  onTimeQuantumChange={setTimeQuantum}
                />
              </CardContent>
            </Card>

            <Button
              onClick={runSimulation}
              disabled={isRunning}
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Classifying &amp; Scheduling…
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run v2 Simulation
                </>
              )}
            </Button>

            {/* Model info card */}
            <Card className="border-violet-500/20 bg-violet-500/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <BrainCircuit className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-violet-300">Active Model</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
                      cpu_scheduler_full_pipeline.joblib
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Output categories:
                      </p>
                      <p className="text-xs">
                        <span className="text-emerald-400 font-medium">● Short</span>
                        {" · "}
                        <span className="text-amber-400 font-medium">● Medium</span>
                        {" · "}
                        <span className="text-red-400 font-medium">● Long</span>
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Burst time mapping:</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Short→10ms · Med→50ms · Long→150ms
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-8">
            <ResultsDisplayV2 metrics={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexV2;
