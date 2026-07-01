/**
 * SystemDashboardV2.tsx
 *
 * v2 "Living OS" simulation dashboard with:
 * - Single Core / Multi-Core toggle
 * - ML classification → process categories
 * - Category-aware scheduling (ADRR v2) vs Blind FIFO (Legacy RR)
 * - Live core animation, process state machine, kernel log, multi-core Gantt
 * - Side-by-side performance comparison showing ADRR v2 advantage
 *
 * Why ADRR v2 wins:
 *   Single-core: Short jobs go first (SJF), never wait behind 150ms Long jobs.
 *   Multi-core:  Short→P-cores (fast), Long→E-cores (background), Medium balanced.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, Cpu, Layers, Layers2 } from 'lucide-react';
import { toast } from 'sonner';

import { simulateSchedulingV2 } from '@/services/apiServiceV2';
import {
  assignProcessesToCores,
  assignProcessesNaive,
  generateWorkloadProcesses,
  getCoreConfigs,
  MultiCoreResult,
  ScheduledProcess,
  WORKLOAD_PROFILES,
} from '@/lib/multicore-scheduler';

import { WorkloadLauncher }  from '@/components/dashboard-v2/WorkloadLauncher';
import { CoreGrid }          from '@/components/dashboard-v2/CoreGrid';
import { ProcessManager }    from '@/components/dashboard-v2/ProcessManager';
import { MultiCoreGantt }    from '@/components/dashboard-v2/MultiCoreGantt';
import { KernelLog }         from '@/components/dashboard-v2/KernelLog';
import { PerformancePanel }  from '@/components/dashboard-v2/PerformancePanel';

type MultiCoreCount = 2 | 4 | 8;
type CoreMode = 'single' | 'multi';
type Phase = 'idle' | 'classifying' | 'simulating' | 'done';

const ANIMATION_DURATION_MS = 7000;
const TICK_MS = 80;


const SystemDashboardV2 = () => {
  // ── Config ────────────────────────────────────────────────────────────────
  const [coreMode,      setCoreMode]      = useState<CoreMode>('single');
  const [multiCoreCount, setMultiCoreCount] = useState<MultiCoreCount>(4);
  const [activeWorkload, setActiveWorkload] = useState<string | null>(null);
  const [phase,         setPhase]         = useState<Phase>('idle');

  // The actual core count used for simulation
  const effectiveCoreCount = coreMode === 'single' ? 1 : multiCoreCount;

  // ── Results ───────────────────────────────────────────────────────────────
  const [adrrResult,   setAdrrResult]   = useState<MultiCoreResult | null>(null);
  const [legacyResult, setLegacyResult] = useState<MultiCoreResult | null>(null);

  // ── Animation ─────────────────────────────────────────────────────────────
  const [animProgress, setAnimProgress] = useState(0);
  const [logVisible,   setLogVisible]   = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live process states ────────────────────────────────────────────────────
  const [liveProcesses,  setLiveProcesses]  = useState<ScheduledProcess[]>([]);
  const [currentPerCore, setCurrentPerCore] = useState<Record<number, ScheduledProcess | null>>({});

  // ── System clock ──────────────────────────────────────────────────────────
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const startAnimation = useCallback((result: MultiCoreResult) => {
    if (animRef.current) clearInterval(animRef.current);
    setAnimProgress(0);
    setLogVisible(0);
    setLiveProcesses(result.allProcesses.map(p => ({ ...p, state: 'READY' as const })));
    setCurrentPerCore({});

    const totalSteps = Math.ceil(ANIMATION_DURATION_MS / TICK_MS);
    const logChunk   = result.kernelLogs.length / totalSteps;
    let step = 0;

    animRef.current = setInterval(() => {
      step++;
      const progress = Math.min(100, (step / totalSteps) * 100);
      const simTime  = (progress / 100) * result.totalTime;

      setAnimProgress(progress);
      setLogVisible(Math.min(result.kernelLogs.length, Math.ceil(step * logChunk)));

      // Per-core current process
      const cpc: Record<number, ScheduledProcess | null> = {};
      result.cores.forEach(cs => {
        const active = cs.timeline.find(seg => seg.start <= simTime && seg.end > simTime);
        cpc[cs.config.id] = active
          ? cs.processes.find(p => p.pidLabel === active.pid) ?? null
          : null;
      });
      setCurrentPerCore(cpc);

      // Process state machine
      setLiveProcesses(prev => prev.map(p => {
        if (p.endTime   <= simTime) return { ...p, state: 'DONE'    };
        if (p.startTime <= simTime) return { ...p, state: 'RUNNING' };
        return                              { ...p, state: 'READY'   };
      }));

      if (progress >= 100) {
        clearInterval(animRef.current!);
        setPhase('done');
        setLiveProcesses(prev => prev.map(p => ({ ...p, state: 'DONE' })));
        setCurrentPerCore({});
      }
    }, TICK_MS);
  }, []);

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Run workload
  // ─────────────────────────────────────────────────────────────────────────
  const executeWorkload = async (workloadType: string) => {
    if (phase === 'classifying' || phase === 'simulating') return;

    setPhase('classifying');
    setActiveWorkload(workloadType);
    setAdrrResult(null);
    setLegacyResult(null);
    setAnimProgress(0);
    setLogVisible(0);
    setLiveProcesses([]);
    setCurrentPerCore({});

    const procs   = generateWorkloadProcesses(workloadType);
    const profile = WORKLOAD_PROFILES[workloadType];

    try {
      const response = await simulateSchedulingV2({
        algorithms:   ['ADRR', 'RR'],
        processes:    procs,
        time_quantum: 20,
      });

      const { category_labels, category_names } = response.data;
      const cc = effectiveCoreCount as 1 | 2 | 4 | 8;

      const adrrMC   = assignProcessesToCores(category_labels, category_names, cc);
      const legacyMC = assignProcessesNaive(category_labels, category_names, cc);

      setAdrrResult(adrrMC);
      setLegacyResult(legacyMC);

      const s = category_labels.filter(c => c === 0).length;
      const m = category_labels.filter(c => c === 1).length;
      const l = category_labels.filter(c => c === 2).length;
      toast.success(`${profile.displayName}: ${s} Short · ${m} Medium · ${l} Long → ${cc}-core simulation`);

      setPhase('simulating');
      startAnimation(adrrMC);
    } catch {
      toast.error('Backend unreachable — ensure uvicorn is running on :8000');
      setPhase('idle');
    }
  };

  const switchCoreMode = (mode: CoreMode) => {
    if (phase === 'classifying' || phase === 'simulating') return;
    setCoreMode(mode);
    // Reset results — user needs to re-run to see mode change
    if (adrrResult) {
      setAdrrResult(null);
      setLegacyResult(null);
      setPhase('idle');
      setLiveProcesses([]);
      setCurrentPerCore({});
      setAnimProgress(0);
      setLogVisible(0);
      toast.info(`Switched to ${mode === 'single' ? 'Single Core' : 'Multi-Core'} mode — re-run workload to simulate`);
    }
  };

  const isIdle    = phase === 'idle';
  const isRunning = phase === 'classifying' || phase === 'simulating';
  const isDone    = phase === 'done';

  const coreConfigs = getCoreConfigs(effectiveCoreCount as 1 | 2 | 4 | 8);
  const pCoreCount  = coreConfigs.filter(c => c.type === 'P-core').length;
  const eCoreCount  = coreConfigs.filter(c => c.type === 'E-core').length;

  return (
    <div className="min-h-screen text-slate-200" style={{ background: '#070B14', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav Bar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md"
        style={{ background: 'rgba(7,11,20,0.92)' }}>
        <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-bold text-sm text-slate-200">SentientOS</span>
            <span className="text-slate-600 text-sm font-light hidden sm:block">Scheduler Lab</span>
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">v2</span>
          </div>

          {/* ── Single / Multi toggle ── */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => switchCoreMode('single')}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${coreMode === 'single'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Single Core
            </button>
            <button
              onClick={() => switchCoreMode('multi')}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${coreMode === 'multi'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Layers2 className="w-3.5 h-3.5" />
              Multi-Core
            </button>
          </div>

          {/* Multi-core count selector — only visible in multi mode */}
          <AnimatePresence>
            {coreMode === 'multi' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <Cpu className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">Cores:</span>
                {([2, 4, 8] as MultiCoreCount[]).map(n => (
                  <button
                    key={n}
                    onClick={() => !isRunning && setMultiCoreCount(n)}
                    disabled={isRunning}
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg transition-all shrink-0
                      ${multiCoreCount === n
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clock + phase */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <span className="text-xs font-mono text-slate-600 tabular-nums hidden md:block">
              {clock.toLocaleTimeString()}
            </span>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg
              ${phase === 'simulating' ? 'bg-blue-500/15 text-blue-400' :
                phase === 'done'       ? 'bg-emerald-500/15 text-emerald-400' :
                phase === 'classifying'? 'bg-violet-500/15 text-violet-400' :
                                         'bg-white/5 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full
                ${phase === 'simulating'  ? 'bg-blue-400 animate-pulse' :
                  phase === 'done'        ? 'bg-emerald-400' :
                  phase === 'classifying' ? 'bg-violet-400 animate-pulse' :
                                            'bg-slate-600'}`} />
              {phase === 'idle'        && 'Idle'}
              {phase === 'classifying' && 'Classifying…'}
              {phase === 'simulating'  && 'Simulating…'}
              {phase === 'done'        && 'Complete'}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 pt-7 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 leading-tight">
              AI-Powered{' '}
              {coreMode === 'single' ? 'Single-Core' : `${effectiveCoreCount}-Core`}{' '}
              Scheduling
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              {coreMode === 'single'
                ? <>The ML model classifies each process, then <span className="text-emerald-400 font-semibold">ADRR v2 runs Short jobs first</span> (SJF-style) while Legacy RR uses blind FIFO — watch short jobs wait behind long ones.</>
                : <>Processes are classified then routed to optimal cores: <span className="text-emerald-400 font-semibold">Short→P-cores</span>, <span className="text-red-400 font-semibold">Long→E-cores</span>. Legacy RR distributes blindly, causing short jobs to wait behind long jobs on fast cores.</>
              }
            </p>
          </div>

          {/* CPU badge */}
          <div className="shrink-0 rounded-xl border border-white/6 bg-[#0D1526] px-5 py-3 text-right">
            <p className="text-xs text-slate-600 mb-1 uppercase tracking-wider">Active Mode</p>
            <p className="text-sm font-bold text-slate-200">
              {coreMode === 'single' ? '1-Core' : `${effectiveCoreCount}-Core`}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {coreMode === 'single' ? '1P + 0E cores' : `${pCoreCount}P + ${eCoreCount}E cores`}
            </p>
          </div>
        </div>

        {/* Mode-specific hint */}
        <AnimatePresence mode="wait">
          {coreMode === 'single' && (
            <motion.div
              key="single-hint"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 flex items-center gap-3 text-xs rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5"
            >
              <span className="text-emerald-400 font-semibold">💡 Best for demos:</span>
              <span className="text-slate-400">
                Single core makes the performance difference crystal clear — Short jobs complete in 7.5ms with ADRR v2 vs waiting up to 150ms in Legacy RR.
              </span>
            </motion.div>
          )}
          {coreMode === 'multi' && (
            <motion.div
              key="multi-hint"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 flex items-center gap-3 text-xs rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5"
            >
              <span className="text-violet-400 font-semibold">🔲 Multi-Core:</span>
              <span className="text-slate-400">
                Short processes pinned to P-cores (4.0 GHz), Long processes offloaded to E-cores — ADRR v2 keeps fast cores unblocked.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-12 gap-4">

          {/* Left: Workload launcher */}
          <div className="col-span-3">
            <WorkloadLauncher
              activeWorkload={activeWorkload}
              isRunning={isRunning}
              onLaunch={executeWorkload}
            />
          </div>

          {/* Center: Core grid + Gantt */}
          <div className="col-span-6 space-y-4">
            <div className="rounded-xl border border-white/5 bg-[#0A0F1A] p-4">
              <CoreGrid
                cores={adrrResult?.cores ?? []}
                currentProcessPerCore={currentPerCore}
                animationProgress={animProgress}
                isIdle={isIdle}
                coreMode={coreMode}
              />
            </div>

            {adrrResult && (
              <MultiCoreGantt
                cores={adrrResult.cores}
                animationProgress={animProgress}
                totalTime={adrrResult.totalTime}
                coreMode={coreMode}
              />
            )}

            {isIdle && (
              <div className="rounded-xl border border-white/5 bg-[#0A0F1A] h-44 flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  {coreMode === 'single' ? 'Single-Core Timeline' : 'Multi-Core Gantt'}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  Launch a workload to see process scheduling in action
                </p>
              </div>
            )}

            {phase === 'classifying' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 flex flex-col items-center text-center"
              >
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/40 border-t-violet-400 animate-spin mb-4" />
                <p className="text-sm font-semibold text-violet-300">Classifying processes via ML model…</p>
                <p className="text-xs text-slate-500 mt-1">cpu_scheduler_full_pipeline.joblib → Short / Medium / Long</p>
              </motion.div>
            )}
          </div>

          {/* Right: Process Manager + Kernel Log */}
          <div className="col-span-3 flex flex-col gap-4">
            <div style={{ height: 280 }}>
              <ProcessManager
                processes={liveProcesses}
                cores={adrrResult?.cores ?? []}
                isIdle={isIdle}
              />
            </div>
            <div className="flex-1 rounded-xl border border-white/5 overflow-hidden"
              style={{ minHeight: 300, background: '#070B11' }}>
              <KernelLog
                logs={adrrResult?.kernelLogs ?? []}
                visibleCount={logVisible}
                isRunning={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Performance comparison */}
        <AnimatePresence>
          {isDone && adrrResult && legacyResult && activeWorkload && (
            <PerformancePanel
              adrrResult={adrrResult}
              legacyResult={legacyResult}
              workloadName={activeWorkload}
              coreCount={effectiveCoreCount}
              coreMode={coreMode}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="container mx-auto px-6 pb-8 text-center">
        <p className="text-xs text-slate-700">
          Old dashboard at{' '}
          <a href="/system-dashboard" className="text-slate-500 hover:text-slate-400 underline">/system-dashboard</a>
          {' · '}v2 API: <span className="font-mono text-slate-600">POST /v2/simulate</span>
        </p>
      </div>
    </div>
  );
};

export default SystemDashboardV2;
