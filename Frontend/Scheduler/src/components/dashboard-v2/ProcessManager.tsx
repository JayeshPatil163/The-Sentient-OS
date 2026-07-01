import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduledProcess, CATEGORY_COLORS, CoreState } from '@/lib/multicore-scheduler';
import { CategoryBadge } from '@/components/CategoryBadge';

type Tab = 'RUNNING' | 'READY' | 'DONE';

interface ProcessManagerProps {
  processes: ScheduledProcess[];
  cores: CoreState[];
  isIdle: boolean;
}

const TAB_COLORS: Record<Tab, string> = {
  RUNNING: '#3B82F6',
  READY:   '#F59E0B',
  DONE:    '#10B981',
};

export const ProcessManager = ({ processes, cores, isIdle }: ProcessManagerProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('RUNNING');

  const running = processes.filter(p => p.state === 'RUNNING');
  const ready   = processes.filter(p => p.state === 'READY');
  const done    = processes.filter(p => p.state === 'DONE');

  const counts: Record<Tab, number> = { RUNNING: running.length, READY: ready.length, DONE: done.length };
  const visible = activeTab === 'RUNNING' ? running : activeTab === 'READY' ? ready : done;

  const getCoreLabel = (coreId: number) => {
    const core = cores.find(c => c.config.id === coreId);
    return core ? `${core.config.label} (${core.config.type})` : `Core ${coreId}`;
  };

  if (isIdle) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0D1526] h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-xl">🖥️</span>
        </div>
        <p className="text-sm font-semibold text-slate-400">Process Manager</p>
        <p className="text-xs text-slate-600 mt-1">No active workload</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#0D1526] flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-white/5 shrink-0">
        {(['RUNNING', 'READY', 'DONE'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative
              ${activeTab === tab ? 'text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}
          >
            {tab}
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-mono"
              style={{
                background: activeTab === tab ? TAB_COLORS[tab] + '25' : 'transparent',
                color:      activeTab === tab ? TAB_COLORS[tab] : '#475569',
              }}
            >
              {counts[tab]}
            </span>
            {activeTab === tab && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: TAB_COLORS[tab] }} />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-white/5 shrink-0">
        <span>PID</span>
        <span>Category</span>
        <span>Core</span>
        <span className="text-right">Burst</span>
        <span className="text-right">Pri</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {visible.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-700">No {activeTab.toLowerCase()} processes</div>
          ) : (
            visible.slice(0, 80).map(p => (
              <motion.div
                key={`${p.pid}-${activeTab}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-5 items-center px-3 py-2 text-xs border-b border-white/3 hover:bg-white/3 transition-colors"
              >
                <span className="font-mono font-bold text-slate-300">{p.pidLabel}</span>
                <span><CategoryBadge category={p.category} label={p.categoryName} showDot /></span>
                <span className="text-slate-500 truncate text-xs">{getCoreLabel(p.coreId).split(' ')[0]} {getCoreLabel(p.coreId).split(' ')[1]}</span>
                <span className="text-right font-mono text-slate-400">{p.burstTime}ms</span>
                <span className="text-right font-mono text-slate-500">—</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
