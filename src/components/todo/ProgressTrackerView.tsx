import React from 'react';
import { Task, RevisionPlanType } from '../../types';
import { Check, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

export interface ProgressTrackerViewProps {
  listId: string;
  listName: string;
  tasks: Task[];
  onToggleStep: (taskId: string, stepNumber: number) => void;
  onDuplicateList?: (listId: string) => void;
  onCopyList?: (listId: string) => void;
  onRenameList?: (listId: string) => void;
  onDeleteList?: (listId: string) => void;
  isCustomList?: boolean;
}

export const ProgressTrackerView: React.FC<ProgressTrackerViewProps> = ({
  tasks,
  onToggleStep,
}) => {
  // Helper to determine total revision steps for a task
  const getRevisionSteps = (plan?: RevisionPlanType): number => {
    if (!plan || plan === 'none') return 0;
    if (plan === '1x') return 1;
    if (plan === '2x') return 2;
    if (plan === '3x') return 3;
    if (plan === '4x') return 4;
    if (plan === '5x') return 5;
    if (plan === '1-7-14' || plan === '2-4-8') return 3;
    if (plan === '1-3-7-30') return 4;
    return 3;
  };

  // Filter tasks in this list that have revision tracking enabled
  const trackedTasks = tasks.filter(t => {
    const steps = getRevisionSteps(t.revisionPlan);
    return steps > 0;
  });

  if (trackedTasks.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-xs text-zinc-400">
        No revision tasks in this list. Add a task with 1x, 2x, or 3x revision to track progress here.
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-200">
      {/* PROGRESS TRACKER VIEW LIST */}
      <div className="rounded-2xl glass-card border border-black/5 dark:border-white/10 p-2.5 space-y-1.5">
        {trackedTasks.map(task => {
          const stepsCount = getRevisionSteps(task.revisionPlan);
          const completedSteps = task.completedRevisions || [];

          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition duration-150 gap-2"
            >
              {/* Task Name (No date) */}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                  {task.title}
                </span>
              </div>

              <div className="text-zinc-400 text-xs select-none shrink-0">---</div>

              {/* Revision Steps (1x, 2x, 3x, ...) Tickable Buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                {Array.from({ length: stepsCount }, (_, idx) => idx + 1).map(step => {
                  const isDone = completedSteps.includes(step);

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        triggerHaptic(isDone ? 'toggle' : 'success');
                        onToggleStep(task.id, step);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/15'
                      }`}
                      title={`Toggle ${step}x revision for ${task.title}`}
                    >
                      {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      <span>{step}x</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
