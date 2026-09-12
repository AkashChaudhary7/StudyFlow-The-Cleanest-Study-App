import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckSquare, BookOpen, RotateCw, X, PenLine, Share2 } from 'lucide-react';

export const ActionSheetModal: React.FC = () => {
  const { activeModal, closeModal, openModal } = useApp();

  if (activeModal !== 'action_sheet') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={closeModal}></div>

      {/* Action Sheet Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Quick Actions
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 py-1">
          {/* 1. Add Task */}
          <button
            id="action-add-task"
            onClick={() => openModal('create_task')}
            className="w-full flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Task
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                To-do, assignment, or checklist item
              </div>
            </div>
          </button>

          {/* 2. Quick Note (Fleeting thoughts/study ideas) */}
          <button
            id="action-quick-note"
            onClick={() => openModal('quick_note')}
            className="w-full flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                <span>Quick Note</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Fleeting
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Jot down quick thoughts or study ideas
              </div>
            </div>
          </button>

          {/* 3. Add Study Topic */}
          <button
            id="action-add-topic"
            onClick={() => openModal('create_topic')}
            className="w-full flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Study Topic
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Learning concept with spaced revision plan
              </div>
            </div>
          </button>

          {/* 4. Add Revision */}
          <button
            id="action-add-revision"
            onClick={() => openModal('create_revision')}
            className="w-full flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Revision
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Schedule a custom review session for a topic
              </div>
            </div>
          </button>

          {/* 5. Share Weekly Summary Card */}
          <button
            id="action-share-summary"
            onClick={() => openModal('share_summary')}
            className="w-full flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                <span>Share Weekly Summary</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Generate aesthetic study progress & task card
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
