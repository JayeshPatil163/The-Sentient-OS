import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoreState, CATEGORY_COLORS } from '@/lib/multicore-scheduler';

interface MultiCoreGanttProps {
  cores: CoreState[];
  animationProgress: number;
  totalTime: number;
  coreMode: 'single' | 'multi';
}

const ROW_HEIGHT   = 36;
const LABEL_WIDTH  = 72;
const MIN_BAR_W    = 4;

export const MultiCoreGantt = ({ cores, animationProgress, totalTime, coreMode }: MultiCoreGanttProps) => {
  const visibleTime = (animationProgress / 100) * totalTime;
  const segLabel = (pid: string, duration: number) => duration < 12 ? '' : pid;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        {coreMode === 'single' ? 'Single-Core Schedule Timeline' : 'Multi-Core Gantt — Process Distribution'}
      </p>

      <div className="rounded-xl border border-white/5 bg-[#070B11] overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/5">
          {[
            { cat: 0, label: 'Short',  color: CATEGORY_COLORS[0] },
            { cat: 1, label: 'Medium', color: CATEGORY_COLORS[1] },
            { cat: 2, label: 'Long',   color: CATEGORY_COLORS[2] },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-2 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
          <span className="ml-auto text-xs text-slate-700 font-mono">
            {totalTime > 0 ? `${totalTime}ms total` : '—'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 480 }}>
            {cores.map(cs => (
              <div
                key={cs.config.id}
                className="flex items-center border-b border-white/3 last:border-0"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="shrink-0 flex flex-col justify-center px-3 border-r border-white/5" style={{ width: LABEL_WIDTH }}>
                  <span className="text-xs font-bold text-slate-300">{cs.config.label}</span>
                  <span className="text-xs font-mono" style={{ color: cs.config.glowColor, fontSize: 9 }}>
                    {cs.config.type}
                  </span>
                </div>

                <div className="relative flex-1 h-full" style={{ background: '#0A0F1A' }}>
                  {totalTime > 0 && cs.timeline.map((seg, i) => {
                    const leftPct    = (seg.start / totalTime) * 100;
                    const visible    = seg.start < visibleTime;
                    const clampedEnd = Math.min(seg.end, visibleTime);
                    const visibleW   = ((clampedEnd - seg.start) / totalTime) * 100;

                    if (!visible) return null;

                    const color    = CATEGORY_COLORS[seg.category] ?? '#64748B';
                    const duration = seg.end - seg.start;

                    return (
                      <motion.div
                        key={`${seg.pid}-${i}`}
                        className="absolute top-1 bottom-1 rounded flex items-center overflow-hidden"
                        style={{
                          left:       `${leftPct}%`,
                          width:      `${Math.max(visibleW, 0.3)}%`,
                          background: color + 'CC',
                          borderLeft: `2px solid ${color}`,
                          minWidth:   MIN_BAR_W,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        title={`${seg.pid} [${seg.categoryName}] ${seg.start}–${seg.end}ms`}
                      >
                        <span className="text-xs font-mono font-bold text-white/80 px-1 truncate" style={{ fontSize: 9 }}>
                          {segLabel(seg.pid, duration)}
                        </span>
                      </motion.div>
                    );
                  })}

                  {totalTime > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
                      style={{ left: `${(visibleTime / totalTime) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex border-t border-white/5 text-xs font-mono text-slate-700 px-1 py-1.5" style={{ paddingLeft: LABEL_WIDTH + 8 }}>
          {totalTime > 0 && [0, 0.25, 0.5, 0.75, 1].map(frac => (
            <span key={frac} className="flex-1 text-center" style={{ marginLeft: frac === 0 ? 0 : undefined }}>
              {Math.round(frac * totalTime)}ms
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
