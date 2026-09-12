import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RevisionPlanType, Priority } from '../../types';
import { getTodayStr, addDays } from '../../utils/dateUtils';
import { X, Calendar, RotateCw, Sparkles, Flag } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

export const CreateTaskModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    addTask,
    editTask,
    tasks,
    editingTaskId,
    addSubject,
    activeListId,
    setActiveListId,
    createTaskPreset,
    subjects,
  } = useApp();

  const [itemType, setItemType] = useState<'task' | 'subject'>('task');
  const [title, setTitle] = useState('');
  
  // Task specific fields (only asked if itemType === 'task')
  const [dueDate, setDueDate] = useState<string>(getTodayStr());
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'custom'>('none');
  const [repeatCustomDays, setRepeatCustomDays] = useState<number>(2);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlanType>('none');
  const [priority, setPriority] = useState<Priority>('none');

  const today = getTodayStr();
  const tomorrow = addDays(today, 1);

  const isOnlyTask = Boolean(createTaskPreset?.onlyTask);
  const presetSubject = createTaskPreset?.subjectId
    ? subjects.find(s => s.id === createTaskPreset.subjectId)
    : null;

  useEffect(() => {
    if (editingTaskId) {
      const task = tasks.find(t => t.id === editingTaskId);
      if (task) {
        setItemType('task');
        setTitle(task.title);
        setDueDate(task.dueDate || getTodayStr());
        setRecurring(task.recurring || 'none');
        setRepeatCustomDays(task.repeatCustomDays || 2);
        setRevisionPlan(task.revisionPlan || 'none');
        setPriority(task.priority || 'none');
      }
    } else {
      setItemType('task');
      setTitle('');
      setDueDate(createTaskPreset?.dueDate || getTodayStr());
      // Default to daily repeat if currently on the 'daily' list tab
      setRecurring(activeListId === 'daily' ? 'daily' : 'none');
      setRepeatCustomDays(2);
      setRevisionPlan('none');
      setPriority('none');
    }
  }, [editingTaskId, activeModal, tasks, activeListId, createTaskPreset]);

  if (activeModal !== 'create_task') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic('success');

    if (!isOnlyTask && itemType === 'subject') {
      // "when selected subject don't ask anything."
      const palette = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5856D6', '#30B0C7'];
      const randomColor = palette[Math.floor(Math.random() * palette.length)];
      const newSubject = addSubject(title.trim(), randomColor);
      setActiveListId(newSubject.id);
      closeModal();
      return;
    }

    // itemType === 'task'
    if (editingTaskId) {
      editTask(editingTaskId, {
        title: title.trim(),
        dueDate: dueDate || undefined,
        recurring: recurring !== 'none' ? recurring : undefined,
        repeatCustomDays: recurring === 'custom' ? Math.max(1, Number(repeatCustomDays) || 1) : undefined,
        revisionPlan: revisionPlan !== 'none' ? revisionPlan : undefined,
        priority,
      });
    } else {
      addTask({
        title: title.trim(),
        dueDate: dueDate || undefined,
        priority,
        completed: false,
        subjectId: createTaskPreset?.subjectId,
        listId: activeListId !== 'all' && activeListId !== 'daily' ? activeListId : undefined,
        recurring: recurring !== 'none' ? recurring : (activeListId === 'daily' ? 'daily' : undefined),
        repeatCustomDays: recurring === 'custom' ? Math.max(1, Number(repeatCustomDays) || 1) : undefined,
        revisionPlan: revisionPlan !== 'none' ? revisionPlan : undefined,
        completedRevisions: [],
        completedDates: [],
        subtasks: [],
      });
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {editingTaskId
              ? 'Edit Task'
              : isOnlyTask
              ? presetSubject
                ? `New Task in ${presetSubject.name}`
                : 'New Task'
              : 'Add to List'}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={!isOnlyTask && itemType === 'subject' ? 'Subject name...' : 'Task title...'}
              autoFocus
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
            />
          </div>

          {/* Type Selection: Task vs Subject (hidden if onlyTask or editing) */}
          {!editingTaskId && !isOnlyTask && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Type
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('toggle');
                    setItemType('task');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    itemType === 'task'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('toggle');
                    setItemType('subject');
                  }}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    itemType === 'subject'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Subject
                </button>
              </div>
            </div>
          )}

          {/* When clicked task then ask for task due , repeat , revision. That's it! */}
          {itemType === 'task' && (
            <div className="space-y-3 pt-1 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-150">
              {/* Task Due */}
              <div>
                <label className="flex items-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Task Due
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setDueDate(today);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                      dueDate === today
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setDueDate(tomorrow);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                      dueDate === tomorrow
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="py-1 px-1.5 rounded-xl text-[11px] font-medium bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-center focus:outline-none"
                  />
                </div>
              </div>

              {/* Repeat */}
              <div>
                <label className="flex items-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  <RotateCw className="w-3 h-3 mr-1" />
                  Repeat
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {(['none', 'daily', 'weekly', 'monthly', 'custom'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        triggerHaptic('toggle');
                        setRecurring(option);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                        recurring === option
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {option === 'none' ? 'None' : option === 'daily' ? 'Daily' : option === 'weekly' ? 'Week' : option === 'monthly' ? 'Month' : 'Custom'}
                    </button>
                  ))}
                </div>
                {recurring === 'custom' && (
                  <div className="flex items-center space-x-2 mt-2 px-1">
                    <span className="text-xs text-zinc-500">Every</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={repeatCustomDays}
                      onChange={e => setRepeatCustomDays(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs text-center rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200"
                    />
                    <span className="text-xs text-zinc-500">days</span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="flex items-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  <Flag className="w-3 h-3 mr-1" />
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setPriority('none');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                      priority === 'none'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setPriority('low');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 ${
                      priority === 'low'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Low</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setPriority('medium');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 ${
                      priority === 'medium'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('toggle');
                      setPriority('high');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 ${
                      priority === 'high'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>High</span>
                  </button>
                </div>
              </div>

              {/* Revision */}
              <div>
                <label className="flex items-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Revision
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {(['none', '1x', '2x', '3x', '4x', '5x'] as const).map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => {
                        triggerHaptic('toggle');
                        setRevisionPlan(plan);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-semibold uppercase transition ${
                        revisionPlan === plan
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {plan === 'none' ? 'None' : plan}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs transition disabled:opacity-40 shadow-sm active:scale-98"
            >
              {itemType === 'subject'
                ? 'Create Subject'
                : editingTaskId
                ? 'Save Task'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
