import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Layout, Terminal, Plus, ShieldCheck } from 'lucide-react';
import { simulateScheduling } from "@/services/apiService";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { toast } from "sonner";
import { AlgorithmSelector } from '@/components/AlgorithmSelector';

const SystemDashboard = () => {

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeWorkload, setActiveWorkload] = useState<string | null>(null);
  const [logs, setLogs] = useState<any>([]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(["ADRR"]);
  const [timeQuantum, setTimeQuantum] = useState(20);


  const taskProfiles = {
  Browser: {
    count: 30,
    burstRange: [50, 300],
    memoryRange: [100, 500]
  },
  IDE: {
    count: 40,
    burstRange: [200, 800],
    memoryRange: [500, 1500]
  },
  Compilation: {
    count: 60,
    burstRange: [500, 2000],
    memoryRange: [800, 2000]
  },
  File_Compression: {
    count: 35,
    burstRange: [300, 1200],
    memoryRange: [400, 1200]
  }
};

const generateProcessesFromTask = (taskType) => {
  const config = taskProfiles[taskType];

  return Array.from({ length: config.count }, (_, i) => ({
    id: `${i + 1}`,
    pid: `P${i + 1}`,
    arrivalTime: Math.floor(Math.random() * 20),
    userId: "U1",
    groupId: "G1",
    reqMemory:
      Math.floor(Math.random() * (config.memoryRange[1] - config.memoryRange[0])) +
      config.memoryRange[0],
    reqTime:
      Math.floor(Math.random() * (config.burstRange[1] - config.burstRange[0])) +
      config.burstRange[0],
  }));
};


  const generateLogs = (processes:any[]) => {

    const newLogs:string[] = [];

    processes.forEach((p,i)=>{
      newLogs.push(`[${i*0.02}s] Process ${p.pid} entered ready queue`);
      newLogs.push(`[${i*0.03}s] Scheduler dispatched ${p.pid}`);
    });

    newLogs.push(`[Scheduler] Dynamic Quantum Adjusted`);
    newLogs.push(`[Scheduler] ADRR optimization cycle complete`);

    setLogs(newLogs);

  };



  const executeWorkload = async (taskType) => {
  setIsRunning(true);
  setActiveWorkload(taskType);
  setResults(null);

  const processes = generateProcessesFromTask(taskType);

  const requestBody = {
    algorithms: selectedAlgorithms,
    processes: processes.map((p) => ({
      pid: parseInt(p.id),
      arrival_time: p.arrivalTime,
      UserID: 1,
      GroupID: 1,
      ReqTime: p.reqTime,
      ReqMemory: p.reqMemory,
    })),
    time_quantum: timeQuantum,
  };

  try {
    const response = await simulateScheduling(requestBody);
    setResults(response.data);
    setLogs(response.data.execution_log);
    toast.success(`${taskType} workload executed`);
  } catch (error) {
    toast.error("Scheduler failed");
  } finally {
    setIsRunning(false);
  }
};

  return (

  <div className="min-h-screen bg-[#F8F9FA] text-[#1e1e1e]">

    <nav className="border-b border-black/5 bg-white sticky top-0 z-50">

      <div className="container mx-auto px-8 h-20 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">

            <Cpu size={18}/>

          </div>

          <span className="font-semibold text-lg">
            SentientOS <span className="text-black/40 font-normal">Scheduler Lab</span>
          </span>

        </div>

      </div>

    </nav>

    <main className="container mx-auto px-8 py-12">

      <header className="max-w-2xl mb-16">

        <h1 className="text-5xl font-bold mb-4">
          AI Driven Kernel Scheduling
        </h1>

        <p className="text-lg text-black/50">
          Run realistic system workloads and observe how the ADRR engine dynamically adapts time quantum to reduce latency and improve CPU efficiency.
        </p>

      </header>

      <div className="grid grid-cols-12 gap-12">

        <div className="col-span-4 space-y-4">

  {Object.keys(taskProfiles).map((key) => (
    <div
      key={key}
      className="relative group cursor-pointer rounded-2xl border bg-white p-6 overflow-hidden"
    >
      <div>
        <p className="font-bold text-lg">{key.replace("_", " ")}</p>
        <p className="text-sm text-black/40">
          {taskProfiles[key].count} processes
        </p>
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-end m-10">
        
        <button
          onClick={() => executeWorkload(key)}
          className="bg-gray-100 hover:bg-black hover:text-white text-black px-5 py-3 rounded-full flex items-center gap-2 font-semibold shadow-lg hover:scale-105 transition"
        >
          ▶ Run
        </button>

      </div>
    </div>
  ))}

            <AlgorithmSelector
              selectedAlgorithms={selectedAlgorithms}
              timeQuantum={timeQuantum}
              onAlgorithmChange={setSelectedAlgorithms}
              onTimeQuantumChange={setTimeQuantum}
            />

        </div>

        <div className="col-span-8">

          <div className="bg-white rounded-xl border p-8 min-h-[600px]">

            <AnimatePresence mode="wait">

              {isRunning && (

                <motion.div
                initial={{opacity:0}}
                animate={{opacity:1}}
                exit={{opacity:0}}
                className="text-center">

                  <p className="font-bold mb-4">Executing System Workload...</p>

                </motion.div>

              )}

              {!isRunning && !results && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">

                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
                    <Cpu className="text-black/20" size={32} />
                </div>

                <h3 className="text-xl font-bold mb-2">
                    System Idle
                </h3>
                <p className="text-black/40 max-w-sm leading-relaxed">
                    No workload is currently running. Select a system task to simulate real-world process scheduling and observe how different algorithms perform under load.
                </p>

                <p className="mt-4 text-xs text-black/30">
                    Choose a task from the left panel to begin execution
                </p>

                </div>
)}

              {!isRunning && results && (

                <ResultsDisplay metrics={results}/>

              )}
              {activeWorkload && (
                  <div className="mt-4 text-sm text-black/60">
                    Workload: {activeWorkload.replace("_", " ")} |
                    Processes: {taskProfiles[activeWorkload].count}
                  </div>
              )}

            </AnimatePresence>

            {logs.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-bold mb-2">Execution Trace</h3>
                    <div className="text-sm font-mono bg-black text-green-400 p-4 rounded-lg max-h-60 overflow-auto">
                        {logs.map((log, i) => (
                            <div key={i}>
                                [{log.start}] {log.pid} → [{log.start} - {log.end}]
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>

        </div>

      </div>

    </main>

  </div>

  );

};

export default SystemDashboard;