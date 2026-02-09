import { useState } from "react";
import { ProcessTable, Process } from "@/components/ProcessTable";
import { AlgorithmSelector } from "@/components/AlgorithmSelector";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Cpu, Database, Play } from "lucide-react";
import { simulateScheduling } from "@/services/apiService";

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>([
    {
      id: "1",
      pid: "P1",
      arrivalTime: 0,
      userId: "U1",
      groupId: "G1",
      reqMemory: 100,
      reqTime: 8,
    },
  ]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(["ADRR"]);
  const [timeQuantum, setTimeQuantum] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const loadSampleData = () => {
    const sampleProcesses: Process[] = [
      {
        id: "1",
        pid: "P1",
        arrivalTime: 0,
        userId: "U1",
        groupId: "G1",
        reqMemory: 100,
        reqTime: 8,
      },
      {
        id: "2",
        pid: "P2",
        arrivalTime: 1,
        userId: "U2",
        groupId: "G1",
        reqMemory: 200,
        reqTime: 4,
      },
      {
        id: "3",
        pid: "P3",
        arrivalTime: 2,
        userId: "U1",
        groupId: "G2",
        reqMemory: 150,
        reqTime: 9,
      },
      {
        id: "4",
        pid: "P4",
        arrivalTime: 3,
        userId: "U3",
        groupId: "G1",
        reqMemory: 300,
        reqTime: 5,
      },
    ];
    setProcesses(sampleProcesses);
    toast.success("Sample data loaded successfully");
  };

  const runSimulation = async () => {
    if (processes.length === 0) {
      toast.error("Please add at least one process");
      return;
    }

    setIsRunning(true);
    setResults(null);

    for (const p of processes) {
      if (p.reqTime <= 0 || p.reqMemory <= 0) {
        toast.error(`Process ${p.pid} must have a positive ReqTime and Memory.`);
        setIsRunning(false);
        return;
      }
    }

    const toInt = (val) => {
      const cleaned = String(val).replace(/\D/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    const requestBody: any = {
      algorithms: selectedAlgorithms,
      processes: processes.map((p) => ({
        pid: toInt(p.pid),
        arrival_time: p.arrivalTime,
        UserID: toInt(p.userId),
        GroupID: toInt(p.groupId),
        ReqTime: p.reqTime,
        ReqMemory: p.reqMemory,
      })),
      time_quantum: timeQuantum,
    };

    try {
      const response = await simulateScheduling(requestBody);

      const data = await response.data;
      setResults(data);
      toast.success("Simulation completed successfully");
    } catch (error) {
      toast.error("Failed to run simulation. Please ensure the backend server is running.");
      console.error("Simulation error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-accent py-8 px-6 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <img src="../public/Sentient_OS.png" alt="" className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-3xl font-bold text-primary-foreground">
              CPU Scheduling Simulator
            </h1>
          </div>
          <p className="text-primary-foreground/90 text-sm">
            Compare ADRR and traditional scheduling algorithms
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Process Configuration</CardTitle>
                </div>
                <CardDescription>
                  Define the processes for the simulation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProcessTable processes={processes} onProcessesChange={setProcesses} />
                <Button variant="secondary" onClick={loadSampleData} className="w-full">
                  Load Sample Data
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Selection</CardTitle>
                <CardDescription>
                  Choose a scheduling algorithm
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
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </div>

        {results && (
          <div className="mt-8">
            <ResultsDisplay
              metrics={results}
            // ganttData={results.gantt_data}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
