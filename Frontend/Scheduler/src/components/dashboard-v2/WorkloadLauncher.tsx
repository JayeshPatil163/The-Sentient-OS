import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { WORKLOAD_PROFILES, WorkloadProfile } from '@/lib/multicore-scheduler';

interface WorkloadLauncherProps {
  activeWorkload: string | null;
  isRunning: boolean;
  onLaunch: (workloadType: string) => void;
}

const ORDERED_KEYS = ['Browser', 'IDE', 'Compilation', 'File_Compression', 'Game_Engine'];

export const WorkloadLauncher = ({ activeWorkload, isRunning, onLaunch }: WorkloadLauncherProps) => {
  return (
    <div className="space-y-3">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">System Workloads</p>
        <p className="text-xs text-slate-600">Select a real-world workload to simulate</p>
      </div>

      {ORDERED_KEYS.map(key => {
        const profile: WorkloadProfile = WORKLOAD_PROFILES[key];
        const isActive = activeWorkload === key;
        const isThisRunning = isActive && isRunning;

        return (
          <motion.div
            key={key}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => !isRunning && onLaunch(key)}
            className={`relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-200
              ${isActive ? 'border-opacity-60 bg-[#0F1C2E]' : 'border-white/6 bg-[#0D1526] hover:border-white/10 hover:bg-[#101828]'}`}
            style={{
              borderColor: isActive ? profile.color + '50' : undefined,
              boxShadow: isActive ? `0 0 20px ${profile.color}18` : undefined,
            }}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: profile.color }} />
            )}

            <div className="p-4 pl-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{profile.icon}</span>
                    <span className="text-sm font-semibold text-slate-200">{profile.displayName}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{profile.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: profile.color + '18', color: profile.color }}
                    >
                      {profile.tagline}
                    </span>
                  </div>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); !isRunning && onLaunch(key); }}
                  disabled={isRunning}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${isThisRunning ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}
                    ${isRunning && !isThisRunning ? 'opacity-30' : ''}`}
                >
                  {isThisRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
