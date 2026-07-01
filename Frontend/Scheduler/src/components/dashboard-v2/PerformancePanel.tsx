import { motion } from 'framer-motion';
import { MultiCoreResult } from '@/lib/multicore-scheduler';
import { Zap, Clock, TrendingUp, Cpu } from 'lucide-react';

interface PerformancePanelProps {
  adrrResult:    MultiCoreResult;
  legacyResult:  MultiCoreResult;
  workloadName:  string;
  coreCount:     number;
  coreMode:      'single' | 'multi';
}

const ResponsivenessGauge = ({ value, color }: { value: number; color: string }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
};

const MetricRow = ({
  icon, label, value, unit, highlight,
}: {
  icon: React.ReactNode; label: string; value: string | number; unit?: string; highlight?: boolean;
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
    <div className="text-slate-600 shrink-0">{icon}</div>
    <span className="text-xs text-slate-500 flex-1">{label}</span>
    <span className={`text-sm font-bold font-mono ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>
      {value}{unit && <span className="text-xs font-normal text-slate-600 ml-0.5">{unit}</span>}
    </span>
  </div>
);

const AlgoCard = ({
  result, title, isWinner,
}: {
  result: MultiCoreResult; title: string; isWinner: boolean;
}) => {
  const color = isWinner ? '#10B981' : '#F59E0B';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 rounded-xl border bg-[#0D1526] overflow-hidden"
      style={{
        borderColor: isWinner ? '#10B98140' : 'rgba(255,255,255,0.06)',
        boxShadow:   isWinner ? '0 0 32px #10B98118' : 'none',
      }}
    >
      <div
        className="px-5 py-4 border-b border-white/5 flex items-center justify-between"
        style={{ background: color + '0A' }}
      >
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
          <p className="text-sm font-bold text-slate-200">{result.mode}</p>
        </div>
        {isWinner && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
            <Zap className="w-3 h-3" /> Winner
          </span>
        )}
      </div>

      <div className="flex flex-col items-center py-5 border-b border-white/5">
        <p className="text-xs text-slate-600 mb-3 uppercase tracking-wider">System Responsiveness</p>
        <ResponsivenessGauge value={result.responsiveness} color={color} />
      </div>

      <div className="px-5 py-2">
        <MetricRow icon={<Clock className="w-3.5 h-3.5" />} label="Avg Waiting Time"     value={result.avgWaitingTime}    unit="ms" />
        <MetricRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Avg Turnaround"  value={result.avgTurnaroundTime} unit="ms" />
        <MetricRow icon={<Cpu className="w-3.5 h-3.5" />} label="Processes Scheduled"    value={result.allProcesses.length} />
        <MetricRow
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Short Jobs Prioritized"
          value={result.allProcesses.filter(p => p.category === 0).length}
          highlight={isWinner}
        />
      </div>

      <div className="px-5 pb-4">
        <p className="text-xs text-slate-600 mb-2">Category distribution</p>
        {[
          { cat: 0, label: 'Short',  color: '#10B981', count: result.allProcesses.filter(p => p.category === 0).length },
          { cat: 1, label: 'Medium', color: '#F59E0B', count: result.allProcesses.filter(p => p.category === 1).length },
          { cat: 2, label: 'Long',   color: '#EF4444', count: result.allProcesses.filter(p => p.category === 2).length },
        ].map(({ label, color: c, count }) => {
          const total = result.allProcesses.length;
          const pct   = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-600 w-12">{label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: c }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
              <span className="text-xs font-mono text-slate-500 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export const PerformancePanel = ({
  adrrResult, legacyResult, workloadName, coreCount, coreMode,
}: PerformancePanelProps) => {
  const adrrWins = adrrResult.responsiveness >= legacyResult.responsiveness;
  const gain     = Math.abs(adrrResult.responsiveness - legacyResult.responsiveness);
  const waitGain = Math.abs(legacyResult.avgWaitingTime - adrrResult.avgWaitingTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6 space-y-4"
    >
      <div className="rounded-xl border border-white/6 bg-[#0D1526] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Performance Analysis</p>
          <p className="text-lg font-bold text-slate-100 mt-0.5">
            {workloadName.replace('_', ' ')} · {coreCount}-Core CPU
          </p>
        </div>
        {adrrWins && gain > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Responsiveness improvement</p>
            <p className="text-2xl font-black text-emerald-400">+{gain}%</p>
            {waitGain > 0 && (
              <p className="text-xs text-slate-500">−{waitGain.toFixed(1)}ms avg wait</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <AlgoCard result={adrrResult}   title="New Model + Category Affinity" isWinner={adrrWins}  />
        <AlgoCard result={legacyResult} title="Legacy Round Robin (No Affinity)" isWinner={!adrrWins} />
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div>
            {coreMode === 'single' ? (
              <>
                <p className="text-sm font-semibold text-violet-300">Why ADRR v2 wins on a single core</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  ADRR v2 uses the ML classification to sort the queue by burst time — running all{' '}
                  <span className="text-emerald-400 font-medium">Short (10ms)</span> processes first, then{' '}
                  <span className="text-amber-400 font-medium">Medium (50ms)</span>, then{' '}
                  <span className="text-red-400 font-medium">Long (150ms)</span>.
                  Legacy RR uses blind FIFO arrival order — a Short job arriving after a Long job waits{' '}
                  the full 150ms before it can even start. That's the starvation ADRR v2 eliminates.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-violet-300">Why ADRR v2 wins on multi-core</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The ML model classifies each process before it's scheduled. Short processes are pinned to{' '}
                  <span className="text-blue-400 font-medium">high-frequency P-cores</span>{' '}
                  for instant completion, while Long processes are offloaded to{' '}
                  <span className="text-amber-400 font-medium">E-cores</span>{' '}
                  so they don't block interactive work. Within each core, jobs are sorted shortest-first.
                  Legacy RR has no such knowledge — it sends every process round-robin, causing short
                  jobs to wait behind long ones on fast cores.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
