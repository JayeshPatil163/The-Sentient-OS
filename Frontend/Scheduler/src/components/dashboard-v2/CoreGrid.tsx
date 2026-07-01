import { motion, AnimatePresence } from 'framer-motion';
import { CoreState, ScheduledProcess, CATEGORY_COLORS } from '@/lib/multicore-scheduler';
import { CategoryBadge } from '@/components/CategoryBadge';

interface CoreGridProps {
  cores: CoreState[];
  currentProcessPerCore: Record<number, ScheduledProcess | null>;
  animationProgress: number;
  isIdle: boolean;
  coreMode: 'single' | 'multi';
}

const PLACEHOLDER_CORES = [0, 1, 2, 3];

export const CoreGrid = ({ cores, currentProcessPerCore, animationProgress, isIdle, coreMode }: CoreGridProps) => {
  const displayCores = isIdle ? null : cores;

  if (!displayCores) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
          CPU {coreMode === 'single' ? 'Core — Idle' : 'Cores — Idle'}
        </p>
        <div className={`grid gap-3 ${coreMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {(coreMode === 'single' ? [0] : PLACEHOLDER_CORES).map(id => (
            <div key={id} className="rounded-xl border border-white/5 bg-[#0D1526] p-4 opacity-40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-500">Core {id}</span>
                <span className="text-xs text-slate-700 bg-white/5 px-1.5 py-0.5 rounded">—</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full" />
              <p className="text-xs text-slate-700 mt-2">No workload</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        {coreMode === 'single' ? 'CPU Core — Single-Core Mode' : `CPU Cores — ${cores.length}-Core Configuration`}
      </p>
      <div className={`grid gap-3 ${coreMode === 'single' ? 'grid-cols-1' : (cores.length <= 4 ? 'grid-cols-2' : 'grid-cols-4')}`}>
        {displayCores.map(cs => {
          const current  = currentProcessPerCore[cs.config.id];
          const isActive = !!current;

          const elapsed      = (animationProgress / 100) * cs.totalTime;
          const busyUntilNow = cs.timeline
            .filter(seg => seg.start < elapsed)
            .reduce((s, seg) => s + Math.min(seg.end, elapsed) - seg.start, 0);
          const liveUtil = elapsed > 0 ? Math.min(100, Math.round((busyUntilNow / elapsed) * 100)) : 0;

          return (
            <motion.div
              key={cs.config.id}
              className="rounded-xl border bg-[#0D1526] p-4 transition-all duration-300 relative overflow-hidden"
              style={{
                borderColor: isActive ? cs.config.glowColor + '50' : 'rgba(255,255,255,0.05)',
                boxShadow:   isActive ? `0 0 24px ${cs.config.glowColor}20` : 'none',
              }}
              animate={isActive ? { scale: [1, 1.005, 1] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
            >
              {isActive && (
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${cs.config.glowColor}, transparent 70%)` }}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-200">{cs.config.label}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0 rounded font-mono"
                      style={{ background: cs.config.glowColor + '20', color: cs.config.glowColor }}
                    >
                      {cs.config.type}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">{cs.config.frequencyGhz} GHz</span>
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : 'bg-slate-700'}`}
                  style={{ background: isActive ? cs.config.glowColor : undefined }}
                />
              </div>

              <div className="min-h-[28px] mb-3">
                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.div key={current.pidLabel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{current.pidLabel}</span>
                      <CategoryBadge category={current.category} label={current.categoryName} showDot />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-slate-700">
                      Idle
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Util</span>
                  <span>{liveUtil}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: cs.config.glowColor }}
                    animate={{ width: `${liveUtil}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-700 mt-2 font-mono">{cs.processes.length} proc assigned</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
