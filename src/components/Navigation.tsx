import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Timer, BarChart3, Plus } from 'lucide-react';
import { MainTab } from '../types';
import { triggerHaptic } from '../utils/audio';

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab, openModal, timerState, dueTodayRevisions, overdueRevisions } = useApp();

  const totalUrgentRevisions = dueTodayRevisions.length + overdueRevisions.length;

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'todo', label: 'Tasks', icon: CheckSquare },
    { id: 'study', label: 'Study', icon: Timer },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[95vw]">
      <nav className="glass-dock rounded-full px-2 py-1.5 flex items-center gap-1 transition-all duration-300">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                triggerHaptic('light');
                setCurrentTab(item.id);
              }}
              className={`relative flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-105' : ''}`} />
                
                {/* Badge on Tasks tab if revisions due */}
                {item.id === 'todo' && totalUrgentRevisions > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {totalUrgentRevisions > 9 ? '9+' : totalUrgentRevisions}
                  </span>
                )}

                {/* Pulsing indicator on Study tab if timer is running */}
                {item.id === 'study' && timerState.isRunning && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              <span className="font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Vertical subtle divider */}
        <div className="w-[1px] h-6 bg-zinc-300/60 mx-1" aria-hidden="true" />

        {/* Unified Quick Add Button */}
        <button
          id="fab-add-button"
          onClick={() => {
            triggerHaptic('medium');
            openModal('action_sheet');
          }}
          className="w-9 h-9 rounded-full bg-zinc-900 text-white shadow-sm hover:scale-105 active:scale-90 transition-all flex items-center justify-center group shrink-0"
          title="Add Task, Topic, or Revision"
          aria-label="Add"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" />
        </button>
      </nav>
    </div>
  );
};

