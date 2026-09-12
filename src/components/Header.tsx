import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Search } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { InstallAppButton } from './common/InstallAppButton';

export const Header: React.FC = () => {
  const { currentStreakDays, openModal } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06] transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative">
        {/* Left balance spacer */}
        <div className="min-w-[80px] flex items-center justify-start">
          <button
            id="header-search-btn"
            onClick={() => {
              triggerHaptic('light');
              openModal('search');
            }}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-black/5 active:scale-95 transition"
            title="Search tasks & topics (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Centered Minimal Apple Title */}
        <div className="flex items-center justify-center space-x-2 cursor-default select-none">
          <span className="text-[15px] font-semibold tracking-[-0.015em] text-zinc-900">
            StudyFlow
          </span>
          {currentStreakDays > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20"
              title={`${currentStreakDays} day study streak`}
            >
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{currentStreakDays}d</span>
            </span>
          )}
        </div>

        {/* Right balance spacer with Install App action */}
        <div className="min-w-[80px] flex items-center justify-end">
          <InstallAppButton variant="header" />
        </div>
      </div>
    </header>
  );
};
