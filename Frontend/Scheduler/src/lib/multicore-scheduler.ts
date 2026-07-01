export const CATEGORY_BURST: Record<number, number> = { 0: 10, 1: 50, 2: 150 };

export const CATEGORY_NAMES: Record<number, string> = { 0: 'Short', 1: 'Medium', 2: 'Long' };

export const CATEGORY_COLORS: Record<number, string> = {
  0: '#10B981',
  1: '#F59E0B',
  2: '#EF4444',
};

export type CoreType = 'P-core' | 'E-core';

export interface CoreConfig {
  id: number;
  type: CoreType;
  frequencyGhz: number;
  label: string;
  preferredCategories: number[];
  glowColor: string;
}

export interface ScheduledProcess {
  pid: number;
  pidLabel: string;
  category: number;
  categoryName: string;
  burstTime: number;
  arrivalTime: number;
  coreId: number;
  startTime: number;
  endTime: number;
  state: 'READY' | 'RUNNING' | 'DONE';
  waitingTime: number;
  turnaroundTime: number;
}

export interface TimelineSegment {
  pid: string;
  category: number;
  categoryName: string;
  coreId: number;
  start: number;
  end: number;
}

export interface CoreState {
  config: CoreConfig;
  processes: ScheduledProcess[];
  timeline: TimelineSegment[];
  utilization: number;
  totalTime: number;
  totalBusy: number;
}

export interface MultiCoreResult {
  cores: CoreState[];
  allProcesses: ScheduledProcess[];
  totalTime: number;
  kernelLogs: string[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  responsiveness: number;
  mode: 'ADRR-v2' | 'Legacy-RR';
}

export function getCoreConfigs(coreCount: 1 | 2 | 4 | 8): CoreConfig[] {
  if (coreCount === 1) return [
    { id: 0, type: 'P-core', frequencyGhz: 4.0, label: 'Core 0', preferredCategories: [0, 1, 2], glowColor: '#3B82F6' },
  ];

  if (coreCount === 2) return [
    { id: 0, type: 'P-core', frequencyGhz: 4.0, label: 'Core 0', preferredCategories: [0, 1], glowColor: '#3B82F6' },
    { id: 1, type: 'E-core', frequencyGhz: 2.4, label: 'Core 1', preferredCategories: [2, 1], glowColor: '#F59E0B' },
  ];

  if (coreCount === 4) return [
    { id: 0, type: 'P-core', frequencyGhz: 4.0, label: 'Core 0', preferredCategories: [0],    glowColor: '#3B82F6' },
    { id: 1, type: 'P-core', frequencyGhz: 3.8, label: 'Core 1', preferredCategories: [0, 1], glowColor: '#6366F1' },
    { id: 2, type: 'E-core', frequencyGhz: 2.8, label: 'Core 2', preferredCategories: [1, 2], glowColor: '#F59E0B' },
    { id: 3, type: 'E-core', frequencyGhz: 2.4, label: 'Core 3', preferredCategories: [2],    glowColor: '#EF4444' },
  ];

  return [
    { id: 0, type: 'P-core', frequencyGhz: 4.0, label: 'Core 0', preferredCategories: [0],    glowColor: '#3B82F6' },
    { id: 1, type: 'P-core', frequencyGhz: 3.9, label: 'Core 1', preferredCategories: [0],    glowColor: '#3B82F6' },
    { id: 2, type: 'P-core', frequencyGhz: 3.8, label: 'Core 2', preferredCategories: [0, 1], glowColor: '#6366F1' },
    { id: 3, type: 'P-core', frequencyGhz: 3.7, label: 'Core 3', preferredCategories: [0, 1], glowColor: '#6366F1' },
    { id: 4, type: 'E-core', frequencyGhz: 2.8, label: 'Core 4', preferredCategories: [1, 2], glowColor: '#F59E0B' },
    { id: 5, type: 'E-core', frequencyGhz: 2.6, label: 'Core 5', preferredCategories: [1, 2], glowColor: '#F59E0B' },
    { id: 6, type: 'E-core', frequencyGhz: 2.4, label: 'Core 6', preferredCategories: [2],    glowColor: '#EF4444' },
    { id: 7, type: 'E-core', frequencyGhz: 2.2, label: 'Core 7', preferredCategories: [2],    glowColor: '#EF4444' },
  ];
}

export function assignProcessesToCores(
  categoryLabels: number[],
  categoryNames: string[],
  coreCount: 1 | 2 | 4 | 8,
): MultiCoreResult {
  return _simulate(getCoreConfigs(coreCount), categoryLabels, categoryNames, 'ADRR-v2');
}

export function assignProcessesNaive(
  categoryLabels: number[],
  categoryNames: string[],
  coreCount: 1 | 2 | 4 | 8,
): MultiCoreResult {
  return _simulate(getCoreConfigs(coreCount), categoryLabels, categoryNames, 'Legacy-RR');
}

function _simulate(
  cores: CoreConfig[],
  categoryLabels: number[],
  categoryNames: string[],
  mode: 'ADRR-v2' | 'Legacy-RR',
): MultiCoreResult {
  const pCores = cores.filter(c => c.type === 'P-core');
  const eCores = cores.filter(c => c.type === 'E-core');

  const procs = categoryLabels.map((cat, i) => ({
    pid: i + 1,
    pidLabel: `P${i + 1}`,
    category: cat,
    categoryName: categoryNames[i] ?? CATEGORY_NAMES[cat] ?? 'Medium',
    burstTime: CATEGORY_BURST[cat] ?? 50,
    arrivalTime: i,
  }));

  const shorts  = procs.filter(p => p.category === 0);
  const mediums = procs.filter(p => p.category === 1);
  const longs   = procs.filter(p => p.category === 2);

  const assignment: Map<number, typeof procs> = new Map(cores.map(c => [c.id, []]));

  if (mode === 'ADRR-v2') {
    shorts.forEach((p, i) => {
      const core = pCores.length ? pCores[i % pCores.length] : cores[0];
      assignment.get(core.id)!.push(p);
    });
    longs.forEach((p, i) => {
      const core = eCores.length ? eCores[i % eCores.length] : cores[cores.length - 1];
      assignment.get(core.id)!.push(p);
    });
    mediums.forEach(p => {
      const target = cores.reduce((a, b) =>
        assignment.get(a.id)!.length <= assignment.get(b.id)!.length ? a : b,
      );
      assignment.get(target.id)!.push(p);
    });
  } else {
    procs.forEach((p, i) => {
      assignment.get(cores[i % cores.length].id)!.push(p);
    });
  }

  const coreStates: CoreState[] = cores.map(core => {
    const raw = assignment.get(core.id) ?? [];
    // ADRR-v2: shortest-first so Short never waits behind Long.
    // Legacy-RR: FIFO arrival order — short jobs can block behind long ones.
    const assigned = mode === 'ADRR-v2'
      ? [...raw].sort((a, b) => a.burstTime - b.burstTime)
      : [...raw].sort((a, b) => a.arrivalTime - b.arrivalTime);

    const freqFactor = 3.0 / core.frequencyGhz;
    let time = 0;
    const timeline: TimelineSegment[] = [];
    const scheduledProcesses: ScheduledProcess[] = [];

    assigned.forEach(p => {
      const effectiveBurst = Math.max(1, Math.round(p.burstTime * freqFactor));
      const startTime      = Math.max(time, p.arrivalTime);
      const endTime        = startTime + effectiveBurst;

      timeline.push({ pid: p.pidLabel, category: p.category, categoryName: p.categoryName, coreId: core.id, start: startTime, end: endTime });
      scheduledProcesses.push({ ...p, coreId: core.id, startTime, endTime, state: 'READY', waitingTime: startTime - p.arrivalTime, turnaroundTime: endTime - p.arrivalTime });

      time = endTime;
    });

    const totalBusy = timeline.reduce((s, seg) => s + (seg.end - seg.start), 0);
    const totalTime  = timeline.length ? timeline[timeline.length - 1].end : 0;

    return {
      config: core,
      processes: scheduledProcesses,
      timeline,
      utilization: totalTime > 0 ? Math.min(100, Math.round((totalBusy / totalTime) * 100)) : 0,
      totalTime,
      totalBusy,
    };
  });

  const allProcesses      = coreStates.flatMap(cs => cs.processes);
  const totalTime         = Math.max(...coreStates.map(cs => cs.totalTime), 1);
  const avgWaitingTime    = allProcesses.length ? allProcesses.reduce((s, p) => s + p.waitingTime, 0) / allProcesses.length : 0;
  const avgTurnaroundTime = allProcesses.length ? allProcesses.reduce((s, p) => s + p.turnaroundTime, 0) / allProcesses.length : 0;

  const shortProcs     = allProcesses.filter(p => p.category === 0);
  const shortAvgWait   = shortProcs.length ? shortProcs.reduce((s, p) => s + p.waitingTime, 0) / shortProcs.length : avgWaitingTime;
  const responsiveness = Math.min(100, Math.max(0, Math.round(100 - (shortAvgWait / 150) * 100)));

  return {
    cores: coreStates,
    allProcesses,
    totalTime,
    kernelLogs: _generateLogs(coreStates, allProcesses, avgWaitingTime, responsiveness, mode),
    avgWaitingTime:    Math.round(avgWaitingTime * 10) / 10,
    avgTurnaroundTime: Math.round(avgTurnaroundTime * 10) / 10,
    responsiveness,
    mode,
  };
}

function _generateLogs(
  coreStates: CoreState[],
  processes: ScheduledProcess[],
  avgWait: number,
  responsiveness: number,
  mode: 'ADRR-v2' | 'Legacy-RR',
): string[] {
  const fmt = (ms: number) => `[${ms.toFixed(2).padStart(8, ' ')}ms]`;
  const logs: string[] = [];

  logs.push(`${fmt(0.00)} KERNEL  SentientOS v2 — kernel scheduler init`);
  logs.push(`${fmt(0.01)} CPU     ${coreStates.length} cores online`);

  const pCores = coreStates.filter(c => c.config.type === 'P-core');
  const eCores = coreStates.filter(c => c.config.type === 'E-core');
  pCores.forEach(c => logs.push(`${fmt(0.02)} CPU     ${c.config.label} (P-core @ ${c.config.frequencyGhz} GHz) — READY`));
  eCores.forEach(c => logs.push(`${fmt(0.02)} CPU     ${c.config.label} (E-core @ ${c.config.frequencyGhz} GHz) — READY`));

  logs.push(`${fmt(0.05)} ML      cpu_scheduler_full_pipeline.joblib predictions loaded`);

  const shorts  = processes.filter(p => p.category === 0).length;
  const mediums = processes.filter(p => p.category === 1).length;
  const longs   = processes.filter(p => p.category === 2).length;
  logs.push(`${fmt(0.06)} ML      Classified → Short=${shorts}  Medium=${mediums}  Long=${longs}`);

  if (mode === 'ADRR-v2') {
    logs.push(`${fmt(0.10)} SCHED   ADRRv2 category-affinity mode ACTIVE`);
    logs.push(`${fmt(0.10)} SCHED   Short→P-cores  |  Long→E-cores  |  Medium→load-balance`);
  } else {
    logs.push(`${fmt(0.10)} SCHED   Legacy Round Robin mode  (no affinity)`);
    logs.push(`${fmt(0.10)} SCHED   All processes distributed round-robin`);
  }

  const sorted = [...processes].sort((a, b) => a.startTime - b.startTime);
  sorted.slice(0, 20).forEach(p => {
    const core = coreStates.find(c => c.config.id === p.coreId)!;
    logs.push(`${fmt(p.startTime)} DISPATCH ${p.pidLabel} [${p.categoryName}] → ${core.config.label} (${core.config.type} ${core.config.frequencyGhz}GHz)  burst=${p.burstTime}ms`);
  });
  if (processes.length > 20) {
    logs.push(`${fmt(sorted[20]?.startTime ?? 0)} ...      (${processes.length - 20} more processes dispatched)`);
  }

  coreStates.forEach(cs => {
    logs.push(`${fmt(cs.totalTime)} CORE${cs.config.id}   ${cs.processes.length} processes done  util=${cs.utilization}%`);
  });

  logs.push(`${fmt(avgWait)} METRICS  Avg wait=${avgWait.toFixed(1)}ms  Responsiveness=${responsiveness}%`);
  logs.push(`${fmt(Math.max(...coreStates.map(c => c.totalTime)))} KERNEL  Workload complete`);

  return logs;
}

export interface WorkloadProfile {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  tagline: string;
  count: number;
  color: string;
}

export const WORKLOAD_PROFILES: Record<string, WorkloadProfile> = {
  Browser: {
    name: 'Browser', displayName: 'Web Browser', icon: '🌐',
    description: 'Rendering engine, JS execution, network I/O — 30 concurrent tab processes',
    tagline: '30 tabs · mixed I/O', count: 30, color: '#3B82F6',
  },
  IDE: {
    name: 'IDE', displayName: 'IDE / Code Editor', icon: '💻',
    description: 'Code completion, syntax analysis, file indexing, language servers',
    tagline: '40 processes · heavy analysis', count: 40, color: '#8B5CF6',
  },
  Compilation: {
    name: 'Compilation', displayName: 'C++ Compilation', icon: '⚙️',
    description: 'Parallel build: 60 translation units, linker, code-gen passes',
    tagline: '60 units · CPU-bound', count: 60, color: '#F59E0B',
  },
  File_Compression: {
    name: 'File_Compression', displayName: 'File Compression', icon: '📦',
    description: 'ZIP / zstd compression of a 5 GB media folder — high I/O throughput',
    tagline: '35 chunks · I/O heavy', count: 35, color: '#10B981',
  },
  Game_Engine: {
    name: 'Game_Engine', displayName: 'Game Engine', icon: '🎮',
    description: 'Physics simulation, render threads, AI pathfinding — 60fps target',
    tagline: '50 threads · real-time', count: 50, color: '#EF4444',
  },
};

export function generateWorkloadProcesses(workloadType: string, count?: number) {
  const r  = (min: number, max: number) => Math.random() * (max - min) + min;
  const ri = (min: number, max: number) => Math.floor(r(min, max + 1));

  type ProcParams = {
    instruction_count: number;
    cpu_cycles_per_instruction: number;
    cpu_frequency_ghz: number;
    num_cores_assigned: number;
    process_type: number;
    io_operations_count: number;
    cache_miss_rate: number;
    page_faults: number;
    context_switch_count: number;
    memory_required_mb: number;
    priority: number;
  };

  const profiles: Record<string, () => ProcParams> = {
    Browser: () => ({
      instruction_count:          Math.floor(r(1e5, 3e7)),
      cpu_cycles_per_instruction: r(1.0, 2.5),
      cpu_frequency_ghz:          r(3.5, 4.2),
      num_cores_assigned:         ri(1, 2),
      process_type:               Math.random() < 0.6 ? 1 : ri(0, 2),
      io_operations_count:        Math.floor(r(20, 3000)),
      cache_miss_rate:            r(0.02, 0.18),
      page_faults:                ri(2, 80),
      context_switch_count:       ri(1, 40),
      memory_required_mb:         Math.floor(r(32, 400)),
      priority:                   ri(5, 9),
    }),
    IDE: () => ({
      instruction_count:          Math.floor(r(5e5, 2e8)),
      cpu_cycles_per_instruction: r(1.5, 3.5),
      cpu_frequency_ghz:          r(3.0, 4.0),
      num_cores_assigned:         ri(1, 4),
      process_type:               Math.random() < 0.4 ? 1 : ri(0, 2),
      io_operations_count:        Math.floor(r(100, 8000)),
      cache_miss_rate:            r(0.05, 0.25),
      page_faults:                ri(10, 150),
      context_switch_count:       ri(5, 60),
      memory_required_mb:         Math.floor(r(128, 2000)),
      priority:                   ri(4, 8),
    }),
    Compilation: () => ({
      instruction_count:          Math.floor(r(5e7, 2e9)),
      cpu_cycles_per_instruction: r(2.5, 5.0),
      cpu_frequency_ghz:          r(2.8, 3.8),
      num_cores_assigned:         ri(1, 8),
      process_type:               0,
      io_operations_count:        Math.floor(r(50, 800)),
      cache_miss_rate:            r(0.15, 0.50),
      page_faults:                ri(50, 500),
      context_switch_count:       ri(20, 200),
      memory_required_mb:         Math.floor(r(256, 4096)),
      priority:                   ri(2, 5),
    }),
    File_Compression: () => ({
      instruction_count:          Math.floor(r(1e7, 8e8)),
      cpu_cycles_per_instruction: r(2.0, 4.0),
      cpu_frequency_ghz:          r(2.5, 3.5),
      num_cores_assigned:         ri(1, 4),
      process_type:               Math.random() < 0.7 ? 0 : 2,
      io_operations_count:        Math.floor(r(2000, 20000)),
      cache_miss_rate:            r(0.10, 0.35),
      page_faults:                ri(30, 300),
      context_switch_count:       ri(10, 100),
      memory_required_mb:         Math.floor(r(512, 4096)),
      priority:                   ri(3, 6),
    }),
    Game_Engine: () => ({
      instruction_count:          Math.floor(r(1e6, 5e8)),
      cpu_cycles_per_instruction: r(1.2, 3.0),
      cpu_frequency_ghz:          r(3.8, 4.5),
      num_cores_assigned:         ri(1, 2),
      process_type:               Math.random() < 0.5 ? 3 : 1,
      io_operations_count:        Math.floor(r(100, 5000)),
      cache_miss_rate:            r(0.05, 0.30),
      page_faults:                ri(5, 200),
      context_switch_count:       ri(2, 80),
      memory_required_mb:         Math.floor(r(128, 2048)),
      priority:                   ri(7, 10),
    }),
  };

  const gen = profiles[workloadType] ?? profiles.Browser;
  const n   = count ?? WORKLOAD_PROFILES[workloadType]?.count ?? 30;

  return Array.from({ length: n }, (_, i) => ({ pid: i + 1, arrival_time: i, ...gen() }));
}
