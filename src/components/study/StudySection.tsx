import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDigitalTime,
  formatDuration,
} from '../../utils/dateUtils';
import {
  Play,
  Pause,
  Square,
  BookOpen,
  Sparkles,
  Coffee,
  Plus,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Trash2,
  Check,
  X,
  Clock,
  Flame,
  SlidersHorizontal,
  Target,
  Timer,
} from 'lucide-react';
import { RevisionPlanType, StudyTopic } from '../../types';
import { triggerHaptic } from '../../utils/audio';

export const StudySection: React.FC = () => {
  const {
    timerState,
    elapsedTimerSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setTimerSubject,
    setTimerTopic,
    setTimerMode,
    setPomodoroPreset,
    subjects,
    topics,
    addSubject,
    addTopic,
    deleteTopic,
    deleteSubject,
    openQuickActions,
    openModal,
    setSelectedTopicId,
    todayStudySeconds,
    dailyTargetSeconds,
    dailyTargetProgressPercent,
    preferences,
    setDailyGoalMinutes,
  } = useApp();

  // Two separated views under Study: 'track_time' or 'pomodoro'
  const [studyView, setStudyView] = useState<'track_time' | 'pomodoro'>(
    timerState.mode === 'pomodoro' ? 'pomodoro' : 'track_time'
  );

  const [sessionNotes, setSessionNotes] = useState('');
  const [showStopDialog, setShowStopDialog] = useState(false);

  // Goal setter popover state
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Quick subject picker inside hero component
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  // Subject accordion collapsed states
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  // Inline topic creation inside a subject
  const [addingTopicSubjectId, setAddingTopicSubjectId] = useState<string | null>(null);
  const [inlineTopicTitle, setInlineTopicTitle] = useState('');
  const [inlineRevisionPlan, setInlineRevisionPlan] = useState<RevisionPlanType>('3x');

  // Inline subject creation
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#007AFF');

  const currentSubject = subjects.find(s => s.id === timerState.subjectId) || subjects[0];
  const currentTopic = topics.find(t => t.id === timerState.topicId);

  // Target calculation for pomodoro
  const pomodoroTarget = timerState.pomodoroIsBreak
    ? timerState.pomodoroBreakDuration
    : timerState.pomodoroWorkDuration;

  const pomodoroDisplaySeconds =
    timerState.mode === 'pomodoro'
      ? Math.max(0, pomodoroTarget - elapsedTimerSeconds)
      : elapsedTimerSeconds;

  // Circular progress for Pomodoro
  const pomodoroPercent = Math.min(
    100,
    Math.round((elapsedTimerSeconds / Math.max(1, pomodoroTarget)) * 100)
  );

  const handleStopClick = () => {
    if (elapsedTimerSeconds < 10) {
      resetTimer();
    } else {
      setShowStopDialog(true);
    }
  };

  const handleConfirmStop = () => {
    stopTimer(sessionNotes.trim() || undefined);
    setSessionNotes('');
    setShowStopDialog(false);
  };

  const toggleSubjectCollapse = (subId: string) => {
    triggerHaptic('light');
    setCollapsedSubjects(prev => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const handleSelectTopicToStudy = (topic: StudyTopic) => {
    setTimerSubject(topic.subjectId);
    setTimerTopic(topic.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateInlineTopic = (subjectId: string) => {
    if (!inlineTopicTitle.trim()) return;
    const created = addTopic({
      title: inlineTopicTitle.trim(),
      subjectId,
      revisionPlan: inlineRevisionPlan,
    });
    setInlineTopicTitle('');
    setAddingTopicSubjectId(null);
    handleSelectTopicToStudy(created);
  };

  const handleCreateInlineSubject = () => {
    if (!newSubjectName.trim()) return;
    const created = addSubject(newSubjectName.trim(), newSubjectColor);
    setTimerSubject(created.id);
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const appleColors = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5856D6'];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-5 animate-in fade-in duration-300">
      {/* 1. Apple-Style Segmented View Switcher: Separated Track Time vs Pomodoro */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center space-x-1 shadow-xs">
          <button
            onClick={() => {
              triggerHaptic('toggle');
              setStudyView('track_time');
              if (timerState.mode !== 'stopwatch' && !timerState.isRunning) {
                setTimerMode('stopwatch');
              }
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center space-x-2 ${
              studyView === 'track_time'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm scale-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Track Time</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('toggle');
              setStudyView('pomodoro');
              if (timerState.mode !== 'pomodoro' && !timerState.isRunning) {
                setTimerMode('pomodoro');
              }
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center space-x-2 ${
              studyView === 'pomodoro'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm scale-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Pomodoro</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SEPARATED TRACK TIME (STOPWATCH MODE) */}
      {studyView === 'track_time' && (
        <div className="space-y-4">
          {/* SEPARATED ABOVE: Tracked Today card with Small Icon to Set Goal Time */}
          <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block">
                    Tracked Today
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                      {formatDuration(todayStudySeconds)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      • {dailyTargetProgressPercent}% of {formatDuration(dailyTargetSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Small icon to set goal time */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsEditingGoal(!isEditingGoal);
                }}
                className={`p-2.5 rounded-2xl transition-all ${
                  isEditingGoal
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-black/5 dark:bg-white/5 hover:bg-black/10'
                }`}
                title="Set Daily Target"
                aria-label="Set Goal Time"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Goal Progress Bar */}
            <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(100, dailyTargetProgressPercent)}%` }}
              />
            </div>

            {/* Interactive Custom Hour and Minute Option */}
            {isEditingGoal && (
              <div className="pt-2.5 border-t border-black/5 dark:border-white/5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Daily Target:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {Math.floor((preferences.dailyStudyGoalMinutes || 180) / 60)}h {(preferences.dailyStudyGoalMinutes || 180) % 60}m
                  </span>
                </div>

                <div className="flex items-center justify-center space-x-3 py-1">
                  {/* Hours Stepper */}
                  <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        const cur = preferences.dailyStudyGoalMinutes || 180;
                        const curH = Math.floor(cur / 60);
                        const curM = cur % 60;
                        const newH = Math.max(0, curH - 1);
                        setDailyGoalMinutes(Math.max(15, newH * 60 + curM));
                      }}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                      title="Minus 1 hour"
                    >
                      -
                    </button>
                    <div className="px-2 text-center min-w-[32px]">
                      <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-zinc-100 block leading-tight">
                        {Math.floor((preferences.dailyStudyGoalMinutes || 180) / 60)}
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase font-semibold block leading-tight">
                        hrs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        const cur = preferences.dailyStudyGoalMinutes || 180;
                        const curH = Math.floor(cur / 60);
                        const curM = cur % 60;
                        const newH = Math.min(24, curH + 1);
                        setDailyGoalMinutes(newH * 60 + curM);
                      }}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                      title="Plus 1 hour"
                    >
                      +
                    </button>
                  </div>

                  {/* Minutes Stepper */}
                  <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        const cur = preferences.dailyStudyGoalMinutes || 180;
                        let curH = Math.floor(cur / 60);
                        let curM = cur % 60;
                        curM -= 15;
                        if (curM < 0) {
                          if (curH > 0) {
                            curH -= 1;
                            curM = 45;
                          } else {
                            curM = 0;
                          }
                        }
                        setDailyGoalMinutes(Math.max(15, curH * 60 + curM));
                      }}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                      title="Minus 15 mins"
                    >
                      -
                    </button>
                    <div className="px-2 text-center min-w-[36px]">
                      <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-zinc-100 block leading-tight">
                        {(preferences.dailyStudyGoalMinutes || 180) % 60}
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase font-semibold block leading-tight">
                        min
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        const cur = preferences.dailyStudyGoalMinutes || 180;
                        let curH = Math.floor(cur / 60);
                        let curM = cur % 60;
                        curM += 15;
                        if (curM >= 60) {
                          curH += Math.floor(curM / 60);
                          curM = curM % 60;
                        }
                        setDailyGoalMinutes(curH * 60 + curM);
                      }}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                      title="Plus 15 mins"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Continuous Stopwatch - Sleek & Compact */}
          <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 relative overflow-hidden space-y-3.5">
            {/* Ambient Glow */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: currentSubject?.color || '#007AFF' }}
            />

            {/* SUBJECT SHOWN ABOVE TIME AND IN CENTRE */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsSubjectPickerOpen(!isSubjectPickerOpen);
                  }}
                  className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-all active:scale-95 shadow-xs cursor-pointer border border-black/5 dark:border-white/10 text-xs"
                  title="Click to switch subject"
                >
                  <span
                    className="w-2 h-2 rounded-full shadow-xs shrink-0"
                    style={{ backgroundColor: currentSubject?.color || '#007AFF' }}
                  />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 max-w-[220px] truncate">
                    {currentTopic?.title ? `${currentSubject?.name}: ${currentTopic.title}` : (currentSubject?.name || 'Reasoning & Logic')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* Inline Subject Switcher Dropdown */}
                {isSubjectPickerOpen && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-60 p-2 rounded-2xl glass-card bg-white/95 dark:bg-zinc-900/95 shadow-xl border border-black/10 dark:border-white/10 z-30 space-y-1 animate-in fade-in">
                    <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider px-2 py-1">
                      Switch Subject
                    </div>
                    {subjects.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setTimerSubject(sub.id);
                          setTimerTopic(undefined);
                          setIsSubjectPickerOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition ${
                          currentSubject?.id === sub.id
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                        <span className="truncate flex-1">{sub.name}</span>
                        {currentSubject?.id === sub.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Apple Digital Display Centered directly below Subject */}
            <div className="text-center py-1">
              <div className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 drop-shadow-xs select-none">
                {formatDigitalTime(elapsedTimerSeconds)}
              </div>
            </div>

            {/* Control Buttons with Haptics */}
            <div className="flex items-center justify-center space-x-3 pb-1">
              {!timerState.isRunning ? (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    if (timerState.mode !== 'stopwatch') setTimerMode('stopwatch');
                    startTimer();
                  }}
                  className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all"
                  title="Start Stopwatch"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    pauseTimer();
                  }}
                  className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-amber-500/25 transition-all"
                  title="Pause"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              )}

              {/* Stop / Finish button */}
              {elapsedTimerSeconds > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    handleStopClick();
                  }}
                  className="w-11 h-11 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-rose-500/20 transition-all"
                  title="Stop and save session"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              )}

              {/* Reset button */}
              {elapsedTimerSeconds > 0 && !timerState.isRunning && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    resetTimer();
                  }}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SEPARATED POMODORO TIMER MODE */}
      {studyView === 'pomodoro' && (
        <div className="p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 relative overflow-hidden space-y-5">
          {/* Ambient Glow */}
          <div
            className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700 ${
              timerState.pomodoroIsBreak ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />

          {/* Header row with minimal icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Pomodoro
              </h2>
            </div>

            {/* Focus vs Break Status Pill */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                timerState.pomodoroIsBreak
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              }`}
            >
              <span>{timerState.pomodoroIsBreak ? 'Rest' : 'Focus'}</span>
            </div>
          </div>

          {/* Circular Progress Ring with Digital Countdown */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Background Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-black/5 dark:text-white/10"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`transition-all duration-500 ${
                    timerState.pomodoroIsBreak ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                  strokeWidth="6"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * pomodoroPercent) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              {/* Inner Countdown */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 select-none">
                  {formatDigitalTime(pomodoroDisplaySeconds)}
                </div>
              </div>
            </div>

            {/* Presets row: 25/5, 50/10 */}
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setPomodoroPreset(25, 5);
                }}
                disabled={timerState.isRunning}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  timerState.pomodoroWorkDuration === 25 * 60
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                25 / 5 min
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setPomodoroPreset(50, 10);
                }}
                disabled={timerState.isRunning}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  timerState.pomodoroWorkDuration === 50 * 60
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                50 / 10 min
              </button>
            </div>
          </div>

          {/* Pomodoro Action Buttons */}
          <div className="flex items-center justify-center space-x-3 pb-1">
            {!timerState.isRunning ? (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  if (timerState.mode !== 'pomodoro') setTimerMode('pomodoro');
                  startTimer();
                }}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-rose-500/25 transition-all"
                title="Start Pomodoro"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  pauseTimer();
                }}
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-amber-500/25 transition-all"
                title="Pause"
              >
                <Pause className="w-6 h-6 fill-current" />
              </button>
            )}

            {/* Stop button */}
            {elapsedTimerSeconds > 0 && (
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  handleStopClick();
                }}
                className="w-11 h-11 rounded-full bg-zinc-800 text-white hover:bg-zinc-900 active:scale-95 flex items-center justify-center shadow-md transition-all"
                title="Complete session"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Reset button */}
            {elapsedTimerSeconds > 0 && !timerState.isRunning && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  resetTimer();
                }}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all"
                title="Reset Pomodoro"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. STUDY SUBJECTS & TOPICS SECTION */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card shadow-sm border border-black/5 dark:border-white/10 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Subjects
            </h3>
          </div>

          {/* Add Subject button */}
          <button
            onClick={() => setIsAddingSubject(true)}
            className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Inline Subject Creation Form */}
        {isAddingSubject && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                New Study Subject
              </span>
              <button onClick={() => setIsAddingSubject(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                placeholder="Subject name (e.g., Organic Chemistry, System Design)..."
                autoFocus
                className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateInlineSubject}
                disabled={!newSubjectName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>

            {/* Color choices */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-zinc-500">Color:</span>
              {appleColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setNewSubjectColor(color);
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    newSubjectColor === color ? 'scale-125 ring-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Subjects Accordion List */}
        <div className="space-y-2.5">
          {subjects.map(subject => {
            const isCollapsed = !!collapsedSubjects[subject.id];
            const subjectTopics = topics.filter(t => t.subjectId === subject.id);
            const isSelectedSubject = timerState.subjectId === subject.id;
            const isAddingTopic = addingTopicSubjectId === subject.id;

            return (
              <div
                key={subject.id}
                className="rounded-2xl border border-black/5 dark:border-white/5 glass-item overflow-hidden transition-all"
              >
                {/* Subject Accordion Header */}
                <div
                  onContextMenu={e => {
                    e.preventDefault();
                    openQuickActions({
                      title: subject.name,
                      subtitle: `${subjectTopics.length} topics enrolled`,
                      actions: [
                        {
                          id: 'add-top',
                          label: 'Add Topic under Subject',
                          icon: 'plus',
                          onSelect: () => setAddingTopicSubjectId(subject.id),
                        },
                        {
                          id: 'del-sub',
                          label: 'Delete Subject',
                          icon: 'delete',
                          danger: true,
                          onSelect: () => deleteSubject(subject.id),
                        },
                      ],
                    });
                  }}
                  className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <div
                    onClick={() => toggleSubjectCollapse(subject.id)}
                    className="flex items-center space-x-2.5 cursor-pointer flex-1 select-none"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {subject.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-zinc-400 font-mono">
                      {subjectTopics.length} topics
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Add Topic Inline under this subject */}
                    <button
                      onClick={() => setAddingTopicSubjectId(subject.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-500/10 text-[11px] font-semibold flex items-center space-x-1"
                      title="Add topic under this subject"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Topic</span>
                    </button>

                    <button
                      onClick={() => toggleSubjectCollapse(subject.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Topic Creator for this Subject */}
                {isAddingTopic && (
                  <div className="p-3 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 space-y-2 animate-in fade-in">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inlineTopicTitle}
                        onChange={e => setInlineTopicTitle(e.target.value)}
                        placeholder="Topic title (e.g. Chapter 4: Photosynthesis)..."
                        autoFocus
                        className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex-1 focus:outline-none"
                      />
                      <button
                        onClick={() => handleCreateInlineTopic(subject.id)}
                        disabled={!inlineTopicTitle.trim()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                      >
                        Add & Study
                      </button>
                      <button
                        onClick={() => setAddingTopicSubjectId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Revision Plan:</span>
                      {(['none', '2x', '3x', '5x'] as RevisionPlanType[]).map(plan => (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setInlineRevisionPlan(plan);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize ${
                            inlineRevisionPlan === plan
                              ? 'bg-blue-600 text-white'
                              : 'bg-black/5 dark:bg-white/10 text-zinc-500'
                          }`}
                        >
                          {plan}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics under this Subject */}
                {!isCollapsed && (
                  <div className="p-2.5 pt-0 space-y-1.5 border-t border-black/5 dark:border-white/5">
                    {subjectTopics.length === 0 ? (
                      <div className="py-2 text-center text-xs text-zinc-400 italic">
                        No topics added under {subject.name} yet.
                      </div>
                    ) : (
                      subjectTopics.map(topic => {
                        const isCurrentActive = timerState.topicId === topic.id;

                        return (
                          <div
                            key={topic.id}
                            onContextMenu={e => {
                              e.preventDefault();
                              openQuickActions({
                                title: topic.title,
                                subtitle: `${subject.name} • Total studied: ${formatDuration(topic.totalStudySeconds)}`,
                                details: topic.revisionPlan !== 'none' ? `Revision Plan: ${topic.revisionPlan}` : undefined,
                                actions: [
                                  {
                                    id: 'study-top',
                                    label: 'Study This Topic Now',
                                    icon: 'clock',
                                    onSelect: () => handleSelectTopicToStudy(topic),
                                  },
                                  {
                                    id: 'topic-details',
                                    label: 'Topic Details & Revision Timeline',
                                    icon: 'edit',
                                    onSelect: () => {
                                      setSelectedTopicId(topic.id);
                                      openModal('topic_detail');
                                    },
                                  },
                                  {
                                    id: 'delete-top',
                                    label: 'Delete Topic',
                                    icon: 'delete',
                                    danger: true,
                                    onSelect: () => deleteTopic(topic.id),
                                  },
                                ],
                              });
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-all ${
                              isCurrentActive
                                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-900 dark:text-blue-100 font-bold'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1 truncate">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate">{topic.title}</span>
                                {topic.revisionPlan !== 'none' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold">
                                    {topic.revisionPlan}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                                Total Studied: {formatDuration(topic.totalStudySeconds)}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => handleSelectTopicToStudy(topic)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                                  isCurrentActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-black/5 dark:bg-white/10 hover:bg-blue-600 hover:text-white text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {isCurrentActive ? 'Active' : 'Study'}
                              </button>

                              <button
                                onClick={() => {
                                  deleteTopic(topic.id);
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-500 transition"
                                title="Delete topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stop Session Dialog */}
      {showStopDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Save Study Session
            </h3>
            <p className="text-xs text-zinc-500">
              Duration: <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatDuration(elapsedTimerSeconds)}</span>
            </p>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                Session Reflection / Notes
              </label>
              <textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="What did you accomplish during this session?"
                rows={3}
                className="w-full text-xs p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowStopDialog(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
