import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface KernelLogProps {
  logs: string[];
  visibleCount: number;
  isRunning: boolean;
}

function colorLine(line: string): { tag: string; rest: string; color: string } {
  if (line.includes('KERNEL'))  return { tag: 'KERNEL',   rest: line.replace(/.*KERNEL\s+/, ''),   color: '#A78BFA' };
  if (line.includes('DISPATCH'))return { tag: 'DISPATCH', rest: line.replace(/.*DISPATCH\s+/, ''), color: '#34D399' };
  if (line.includes('SCHED'))   return { tag: 'SCHED',    rest: line.replace(/.*SCHED\s+/, ''),    color: '#60A5FA' };
  if (line.includes('CPU'))     return { tag: 'CPU',      rest: line.replace(/.*CPU\s+/, ''),      color: '#F59E0B' };
  if (line.includes('ML'))      return { tag: 'ML',       rest: line.replace(/.*ML\s+/, ''),       color: '#F472B6' };
  if (line.includes('METRICS')) return { tag: 'METRICS',  rest: line.replace(/.*METRICS\s+/, ''),  color: '#34D399' };
  if (line.includes('CORE'))    return { tag: 'CORE',     rest: line.replace(/.*CORE\d+\s+/, ''),  color: '#94A3B8' };
  return { tag: '···', rest: line, color: '#64748B' };
}

export const KernelLog = ({ logs, visibleCount, isRunning }: KernelLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible   = logs.slice(0, visibleCount);
  const tsRe      = /^\[.*?\]\s*/;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Kernel Log</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 space-y-0.5" style={{ background: '#070B11' }}>
        {visible.length === 0 ? (
          <div className="text-slate-700 mt-4 text-center text-xs">— awaiting workload —</div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((line, i) => {
              const ts  = line.match(tsRe)?.[0] ?? '';
              const rest = line.slice(ts.length);
              const { tag, rest: msg, color } = colorLine(rest);
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }} className="flex gap-2 items-baseline">
                  <span className="shrink-0 text-slate-700">{ts.trim()}</span>
                  <span className="shrink-0 w-16 text-right" style={{ color }}>{tag}</span>
                  <span className="text-slate-400 break-all">{msg.trim()}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isRunning && <div className="flex items-center gap-1 text-emerald-400 mt-1"><span>▊</span></div>}
      </div>
    </div>
  );
};
