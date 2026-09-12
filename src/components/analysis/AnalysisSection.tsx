import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDuration,
  formatFriendlyDate,
  getTodayStr,
  formatTimeRange,
} from '../../utils/dateUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Flame,
  Award,
  BarChart3,
  Layers,
  Share2,
  CalendarCheck,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';
import { TaskCalendarAnalysis } from './TaskCalendarAnalysis';

export const AnalysisSection: React.FC = () => {
  const {
    todayStudySeconds,
    currentStreakDays,
    subjects,
    topics,
    sessions,
    tasks,
    revisions,
    consistencyScoreData,
    dueTodayRevisions,
    overdueRevisions,
    deleteSession,
    openQuickActions,
    openModal,
  } = useApp();

  // Selective button state for separated views: 'calendar', 'task_calendar', 'consistency', or 'sessions'
  const [analysisView, setAnalysisView] = useState<'calendar' | 'task_calendar' | 'consistency' | 'sessions'>('calendar');

  const today = getTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  // Aggregate stats
  const computedStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalStudySeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const weekStudySeconds = sessions
      .filter(s => s.date >= oneWeekAgoStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    const monthStudySeconds = sessions
      .filter(s => s.date.startsWith(currentMonthPrefix))
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    const completedTopicsCount = topics.filter(t => t.status === 'completed').length;
    const totalRevisionsCount = revisions.filter(r => r.status === 'completed').length;

    return {
      totalStudySeconds,
      weekStudySeconds,
      monthStudySeconds,
      completedTopicsCount,
      totalRevisionsCount,
    };
  }, [sessions, topics, revisions]);

  // Calendar Heatmap data computation for Month
  const { monthGrid, monthName, year, monthTotalSeconds, monthActiveDays } = useMemo(() => {
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
      totalSecs?: number;
      level?: number;
      isToday?: boolean;
      isSelected?: boolean;
      empty?: boolean;
      key: string;
    }[] = [];

    // Empty lead cells
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ empty: true, key: `empty-${i}` });
    }

    let mTotalSecs = 0;
    let mActive = 0;

    // Days in month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.date === dateStr);
      const totalSecs = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      mTotalSecs += totalSecs;
      if (totalSecs > 0) mActive++;

      // Intensity level (0 to 4) with distinctive Apple-style color shades
      let level = 0;
      if (totalSecs > 0) level = 1; // 1 to 29m
      if (totalSecs >= 30 * 60) level = 2; // 30m to 59m
      if (totalSecs >= 60 * 60) level = 3; // 1h to 1h 59m
      if (totalSecs >= 120 * 60) level = 4; // 2h+

      grid.push({
        dateStr,
        dayNum: d,
        totalSecs,
        level,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
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
      monthTotalSeconds: mTotalSecs,
      monthActiveDays: mActive,
    };
  }, [viewDate, sessions, selectedDate, today]);

  // Selected Date Drill-Down details
  const selectedDateData = useMemo(() => {
    const daySessions = sessions.filter(s => s.date === selectedDate);
    const totalDaySeconds = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const completedDayTasks = tasks.filter(
      t => t.completed && t.completedAt && t.completedAt.split('T')[0] === selectedDate
    );

    const completedDayRevisions = revisions.filter(
      r => r.status === 'completed' && r.completedDate === selectedDate
    );

    const subBreakdown = subjects
      .map(sub => {
        const dur = daySessions
          .filter(s => s.subjectId === sub.id)
          .reduce((acc, s) => acc + s.durationSeconds, 0);
        return {
          subject: sub,
          durationSeconds: dur,
          percent: totalDaySeconds > 0 ? Math.round((dur / totalDaySeconds) * 100) : 0,
        };
      })
      .filter(b => b.durationSeconds > 0);

    return {
      daySessions,
      totalDaySeconds,
      completedDayTasks,
      completedDayRevisions,
      subjectBreakdown: subBreakdown,
    };
  }, [selectedDate, sessions, tasks, revisions, subjects]);

  const prevMonth = () => {
    triggerHaptic('light');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    triggerHaptic('light');
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-4 animate-in fade-in duration-300">
      {/* SELECTIVE BUTTONS BAR FOR SEPARATED VIEWS & SHARE CARD (ICONS ONLY) */}
      <div className="flex items-center justify-between gap-2">
        <div className="p-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center space-x-1 shadow-xs">
          <button
            onClick={() => {
              triggerHaptic('toggle');
              setAnalysisView('calendar');
            }}
            title="Study Calendar"
            aria-label="Study Calendar"
            className={`p-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center ${
              analysisView === 'calendar'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('toggle');
              setAnalysisView('task_calendar');
            }}
            title="Task Calendar"
            aria-label="Task Calendar"
            className={`p-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center ${
              analysisView === 'task_calendar'
                ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('toggle');
              setAnalysisView('consistency');
            }}
            title="Consistency & Streaks"
            aria-label="Consistency"
            className={`p-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center ${
              analysisView === 'consistency'
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('toggle');
              setAnalysisView('sessions');
            }}
            title="Study Log"
            aria-label="Study Log"
            className={`p-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center ${
              analysisView === 'sessions'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* Share Summary Card Button (Icon Only) */}
        <button
          onClick={() => {
            triggerHaptic('light');
            openModal('share_summary');
          }}
          className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold flex items-center justify-center transition active:scale-95 shadow-xs shrink-0"
          title="Generate shareable weekly progress card"
          aria-label="Share Card"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* VIEW 1: CALENDAR VIEW */}
      {analysisView === 'calendar' && (
        <div className="space-y-4">
          {/* UPGRADED PREMIUM CALENDAR HEATMAP */}
          <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-4">
            {/* Calendar Header with Month Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {monthName} {year}
                </h3>
              </div>

              {/* Navigation Chevrons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header (Mon to Sun) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-bold text-zinc-400">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Calendar Grid of Intensity Cells with Exact Time Readout */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthGrid.map(item => {
                if (item.empty) {
                  return <div key={item.key} className="aspect-square" />;
                }

                // 5 Distinct, rich Apple shades of emerald & teal
                let shadeClass = 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300';
                if (item.level === 1) {
                  shadeClass =
                    'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 font-semibold';
                } else if (item.level === 2) {
                  shadeClass =
                    'bg-emerald-500/40 text-emerald-900 dark:text-emerald-100 border border-emerald-500/35 font-bold';
                } else if (item.level === 3) {
                  shadeClass =
                    'bg-emerald-500/75 text-white border border-emerald-600/40 font-extrabold shadow-xs';
                } else if (item.level === 4) {
                  shadeClass =
                    'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black shadow-sm';
                }

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedDate(item.dateStr!);
                    }}
                    className={`aspect-square rounded-2xl p-1 sm:p-1.5 flex flex-col items-center justify-between text-xs transition-all relative ${shadeClass} ${
                      item.isSelected
                        ? 'ring-2 ring-zinc-900 dark:ring-white scale-105 z-10 shadow-md'
                        : 'hover:scale-102 hover:opacity-95'
                    }`}
                    title={`${item.dateStr}: ${formatDuration(item.totalSecs || 0)}`}
                  >
                    {/* Day Number */}
                    <span className="text-[11px] sm:text-xs leading-none font-medium">
                      {item.dayNum}
                    </span>

                    {/* Exact Total Time Displayed Inside Cell */}
                    {item.totalSecs! > 0 ? (
                      <span className="text-[9px] sm:text-[10px] tracking-tight leading-none font-mono font-bold truncate max-w-full">
                        {formatDuration(item.totalSecs!, true)}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                    )}

                    {/* Today Blue Dot Indicator */}
                    {item.isToday && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Color Intensity Scale Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-zinc-400">
              <span>Shades:</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px]">0m</span>
                <span className="w-3.5 h-3.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5" />
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20" title="1-29m" />
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/40" title="30-59m" />
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/75" title="1-2h" />
                <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600" title="2h+" />
                <span className="text-[10px]">2h+</span>
              </div>
            </div>
          </div>

          {/* TOTAL , ACTIVE DAYS , THIS WEEK , THIS MONTH STATS ARE BELOW IT AND BEAUTIFULLY ALIGNED */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3.5 rounded-3xl glass-card border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Total
              </span>
              <span className="font-mono font-black text-base text-zinc-900 dark:text-zinc-100 mt-1 block">
                {formatDuration(computedStats.totalStudySeconds, true)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">All-time study</span>
            </div>

            <div className="p-3.5 rounded-3xl glass-card border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Active Days
              </span>
              <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 mt-1 block">
                {monthActiveDays} days
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">This month</span>
            </div>

            <div className="p-3.5 rounded-3xl glass-card border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                This Week
              </span>
              <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400 mt-1 block">
                {formatDuration(computedStats.weekStudySeconds, true)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Past 7 days</span>
            </div>

            <div className="p-3.5 rounded-3xl glass-card border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                This Month
              </span>
              <span className="font-mono font-black text-base text-purple-600 dark:text-purple-400 mt-1 block">
                {formatDuration(computedStats.monthStudySeconds, true)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{monthName} total</span>
            </div>
          </div>

          {/* Selected Date Inspector Drill-Down (Apple Fitness Style) */}
          <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Details: {formatFriendlyDate(selectedDate)}
                </h3>
              </div>
              <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {formatDuration(selectedDateData.totalDaySeconds)}
              </div>
            </div>

            {/* Quick Day Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5">
                <div className="text-zinc-400 text-[10px]">Tasks Done</div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {selectedDateData.completedDayTasks.length}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5">
                <div className="text-zinc-400 text-[10px]">Revisions</div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {selectedDateData.completedDayRevisions.length}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5">
                <div className="text-zinc-400 text-[10px]">Sessions</div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {selectedDateData.daySessions.length}
                </div>
              </div>
            </div>

            {/* Chronological Sessions for Selected Date */}
            {selectedDateData.daySessions.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Study Log ({selectedDateData.daySessions.length})
                </span>
                <div className="space-y-1.5">
                  {selectedDateData.daySessions.map(sess => {
                    const sub = subjects.find(s => s.id === sess.subjectId);
                    const top = topics.find(t => t.id === sess.topicId);

                    return (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-3 rounded-2xl glass-item border border-black/5 dark:border-white/5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.color || '#007AFF' }}
                          />
                          <div className="truncate">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {sub?.name || 'Subject'}{' '}
                              {top && <span className="font-normal text-zinc-500">— {top.title}</span>}
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>{formatTimeRange(sess.startTime, sess.endTime)}</span>
                              {sess.notes && <span className="truncate italic">"{sess.notes}"</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                            {formatDuration(sess.durationSeconds)}
                          </span>
                          <button
                            onClick={() => {
                              triggerHaptic('heavy');
                              deleteSession(sess.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-500 transition"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-zinc-400 italic">
                No study sessions recorded on this day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CONSISTENCY AND STREAKS VIEW */}
      {analysisView === 'consistency' && (
        <div className="space-y-4">
          {/* Consistency Card */}
          <div className="p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Consistency
                </h3>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {consistencyScoreData.score}%
                </div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Score</span>
              </div>
            </div>

            {/* Streaks, Tasks Created, Tasks Done, Revisions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-black/5">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-black/[0.04] transition hover:bg-zinc-100/60">
                <div className="flex items-center space-x-1.5 text-zinc-500 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">Streak</span>
                </div>
                <span className="font-semibold text-sm text-zinc-900 tracking-tight block">
                  {currentStreakDays} {currentStreakDays === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 border border-black/[0.04] transition hover:bg-zinc-100/60">
                <div className="flex items-center space-x-1.5 text-zinc-500 mb-1">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">Created</span>
                </div>
                <span className="font-semibold text-sm text-zinc-900 tracking-tight block">
                  {tasks.length}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 border border-black/[0.04] transition hover:bg-zinc-100/60">
                <div className="flex items-center space-x-1.5 text-zinc-500 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">Completed</span>
                </div>
                <span className="font-semibold text-sm text-zinc-900 tracking-tight block">
                  {tasks.filter(t => t.completed).length}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 border border-black/[0.04] transition hover:bg-zinc-100/60">
                <div className="flex items-center space-x-1.5 text-zinc-500 mb-1">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">Revisions</span>
                </div>
                <span className="font-semibold text-sm text-zinc-900 tracking-tight block">
                  {computedStats.totalRevisionsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Distribution Card */}
          <div className="p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Breakdown
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {subjects.map(subject => {
                const subDuration = sessions
                  .filter(s => s.subjectId === subject.id)
                  .reduce((acc, s) => acc + s.durationSeconds, 0);
                const percent =
                  computedStats.totalStudySeconds > 0
                    ? Math.round((subDuration / computedStats.totalStudySeconds) * 100)
                    : 0;

                return (
                  <div key={subject.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {subject.name}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-500">
                        {formatDuration(subDuration, true)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DAILY STUDY SESSIONS LOG VIEW */}
      {analysisView === 'sessions' && (
        <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                History ({sessions.length})
              </h3>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 italic">
              No study sessions recorded yet. Start tracking study time to see your history!
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
              {sessions.map(session => {
                const sub = subjects.find(s => s.id === session.subjectId);
                const top = topics.find(t => t.id === session.topicId);

                return (
                  <div
                    key={session.id}
                    onContextMenu={e => {
                      e.preventDefault();
                      openQuickActions({
                        title: `${sub?.name || 'Study'} Session`,
                        subtitle: `${formatDuration(session.durationSeconds)} • ${formatFriendlyDate(session.date)}`,
                        details: top?.title ? `Topic: ${top.title}` : undefined,
                        actions: [
                          {
                            id: 'del-sess',
                            label: 'Delete Session Log',
                            icon: 'delete',
                            danger: true,
                            onSelect: () => deleteSession(session.id),
                          },
                        ],
                      });
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl glass-item border border-black/5 dark:border-white/5 text-xs shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub?.color || '#007AFF' }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub?.name || 'Subject'}{' '}
                          {top && <span className="font-normal text-zinc-500">— {top.title}</span>}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{formatFriendlyDate(session.date)}</span>
                          <span>•</span>
                          <span>{formatTimeRange(session.startTime, session.endTime)}</span>
                          {session.notes && <span className="truncate italic">"{session.notes}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {formatDuration(session.durationSeconds)}
                      </span>
                      <button
                        onClick={() => {
                          triggerHaptic('heavy');
                          deleteSession(session.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: TASK CALENDAR ANALYSIS (Progress-tracked tasks) */}
      {analysisView === 'task_calendar' && (
        <TaskCalendarAnalysis tasks={tasks} />
      )}
    </div>
  );
};
