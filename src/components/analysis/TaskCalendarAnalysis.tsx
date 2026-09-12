import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { getTodayStr, addDays } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/audio';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Flame,
  CalendarCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TaskCalendarAnalysisProps {
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
}

export const TaskCalendarAnalysis: React.FC<TaskCalendarAnalysisProps> = ({
  tasks,
  onToggleTask,
}) => {
  const today = getTodayStr();

  // Find tasks that are tracked (recurring or revisionPlan or all active tasks)
  const trackedTasks = useMemo(() => {
    const list = tasks.filter(
      t => (t.recurring && t.recurring !== 'none') || (t.revisionPlan && t.revisionPlan !== 'none')
    );
    // If no recurring/revision tasks yet, fallback to any tasks so the user can still analyze
    return list.length > 0 ? list : tasks;
  }, [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    trackedTasks[0]?.id || tasks[0]?.id || ''
  );

  // If selected task is deleted or invalid, fallback to first
  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || trackedTasks[0] || tasks[0];
  }, [tasks, selectedTaskId, trackedTasks]);

  // Calendar month state
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const prevMonth = () => {
    triggerHaptic('light');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    triggerHaptic('light');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Completed dates for active task
  const taskCompletedDates = useMemo(() => {
    if (!activeTask) return new Set<string>();
    const dates = new Set<string>(activeTask.completedDates || []);
    if (activeTask.completed && activeTask.completedAt) {
      dates.add(activeTask.completedAt.split('T')[0]);
    }
    return dates;
  }, [activeTask]);

  // Compute Calendar Grid for viewDate
  const { monthGrid, monthName, year, monthCompletedCount, totalDaysInMonth } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();

    const firstDayOfMonth = new Date(y, m, 1);
    const lastDayOfMonth = new Date(y, m + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday as 0: (day + 6) % 7
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const grid: {
      dateStr?: string;
      dayNum?: number;
      isCompleted?: boolean;
      isToday?: boolean;
      isPast?: boolean;
      empty?: boolean;
      key: string;
    }[] = [];

    // Empty lead cells
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ empty: true, key: `empty-${i}` });
    }

    let completedThisMonth = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isCompleted = taskCompletedDates.has(dateStr);
      if (isCompleted) completedThisMonth++;

      grid.push({
        dateStr,
        dayNum: d,
        isCompleted,
        isToday: dateStr === today,
        isPast: dateStr < today,
        key: dateStr,
      });
    }

    const monthNamesList = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      monthGrid: grid,
      monthName: monthNamesList[m],
      year: y,
      monthCompletedCount: completedThisMonth,
      totalDaysInMonth: totalDays,
    };
  }, [viewDate, taskCompletedDates, today]);

  // Calculate stats: Total, This Month, and Streak
  const stats = useMemo(() => {
    const totalCompletions = taskCompletedDates.size;

    // Calculate Streak
    // Check consecutive days ending today or yesterday
    let streak = 0;
    let checkDate = today;

    if (!taskCompletedDates.has(checkDate)) {
      // Check if yesterday was completed
      checkDate = addDays(today, -1);
    }

    while (taskCompletedDates.has(checkDate)) {
      streak++;
      checkDate = addDays(checkDate, -1);
    }

    return {
      total: totalCompletions,
      thisMonth: monthCompletedCount,
      streak,
    };
  }, [taskCompletedDates, monthCompletedCount, today]);

  if (!activeTask) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center space-y-3 border border-black/5 dark:border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          No Tracked Tasks Found
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Create a task with Daily, Week, Month, or Custom repeat to track its completion calendar and streaks here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* TASK SELECTOR PILLS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Select Tracked Task
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">
            {trackedTasks.length} {trackedTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {trackedTasks.map(t => {
            const isSelected = t.id === activeTask.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedTaskId(t.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className="truncate max-w-[140px]">{t.title}</span>
                {t.recurring && t.recurring !== 'none' && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                        : 'bg-black/5 dark:bg-white/10 text-zinc-400'
                    }`}
                  >
                    {t.recurring}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CALENDAR VIEW FOR THE SELECTED TASK */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-4">
        {/* Header: Task details & Month Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {activeTask.title}
            </h3>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition active:scale-95"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewDate(new Date());
              }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition active:scale-95"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, idx) => (
            <div
              key={idx}
              className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid: Simply Highlight that day when daily repeated task is marked completed */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthGrid.map(cell => {
            if (cell.empty) {
              return <div key={cell.key} className="aspect-square" />;
            }

            return (
              <div
                key={cell.key}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 ${
                  cell.isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm scale-100 font-bold'
                    : cell.isToday
                    ? 'bg-black/5 dark:bg-white/10 ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 font-bold'
                    : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-xs">{cell.dayNum}</span>

                {cell.isCompleted && (
                  <CheckCircle2 className="w-3 h-3 text-white/90 absolute bottom-1 stroke-[2.5]" />
                )}
              </div>
            );
          })}
        </div>

        {/* BELOW THAT CALENDAR VIEW: DETAILS LIKE TOTAL, THIS MONTH, AND STREAK */}
        <div className="pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-3 gap-2">
          {/* Total */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-center space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Total
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
              {stats.total}
            </div>
            <span className="text-[10px] text-zinc-500 block">days done</span>
          </div>

          {/* This Month */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-center space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              This Month
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {stats.thisMonth}
            </div>
            <span className="text-[10px] text-zinc-500 block">in {monthName}</span>
          </div>

          {/* Streak */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-center space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block flex items-center justify-center space-x-1">
              <Flame className="w-3 h-3 text-amber-500 inline" />
              <span>Streak</span>
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
              {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
            </div>
            <span className="text-[10px] text-zinc-500 block">consecutive</span>
          </div>
        </div>
      </div>
    </div>
  );
};
