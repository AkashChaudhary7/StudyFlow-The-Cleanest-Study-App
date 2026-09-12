import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveTimerState,
  ConsistencyScoreData,
  CustomList,
  MainTab,
  RevisionInstance,
  RevisionPlanType,
  StudySession,
  StudyTopic,
  Subject,
  Subtask,
  Task,
  TodoFilter,
  TopicFilter,
  UserPreferences,
  QuickNote,
  Priority,
} from '../types';
import { playSuccessChime, playTimerCompleteChime, triggerHaptic } from '../utils/audio';
import {
  addDays,
  diffDays,
  formatDateStr,
  getTodayStr,
  isPastDate,
  isTodayDate,
} from '../utils/dateUtils';
import {
  createNextRevisionInstance,
  detectRevisionOverload,
  getStatusFromRevisionCount,
  getTotalRevisionsForPlan,
  RevisionLoadInfo,
  spreadRevisionsOver3Days,
} from '../services/revisionEngine';
import { calculateConsistencyScore } from '../services/consistencyEngine';
import { DEFAULT_SUBJECTS, storage } from '../services/storage';

interface AppContextType {
  currentTab: MainTab;
  setCurrentTab: (tab: MainTab) => void;
  
  // Data
  subjects: Subject[];
  tasks: Task[];
  topics: StudyTopic[];
  revisions: RevisionInstance[];
  sessions: StudySession[];
  preferences: UserPreferences;
  
  // Timer
  timerState: ActiveTimerState;
  elapsedTimerSeconds: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (notes?: string) => void;
  resetTimer: () => void;
  setTimerSubject: (subjectId: string) => void;
  setTimerTopic: (topicId?: string) => void;
  setTimerMode: (mode: 'stopwatch' | 'pomodoro') => void;
  setPomodoroPreset: (workMins: number, breakMins: number) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteTasks: (ids: string[]) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  reorderTasks: (newTasks: Task[]) => void;
  toggleTaskCompleted: (id: string) => void;
  toggleTaskRevisionStep: (taskId: string, stepNumber: number) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, subtask: { title: string; dueDate?: string; revisionPlan?: RevisionPlanType }) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  moveSubtaskUp: (taskId: string, subtaskId: string) => void;
  moveSubtaskDown: (taskId: string, subtaskId: string) => void;
  moveSubjectUp: (subjectId: string) => void;
  moveSubjectDown: (subjectId: string) => void;
  setDailyGoalMinutes: (minutes: number) => void;
  convertTaskToTopic: (
    taskId: string,
    options: {
      subjectId: string;
      title?: string;
      description?: string;
      estimatedMinutes?: number;
      revisionPlan: RevisionPlanType;
      customIntervalDays?: number[];
    }
  ) => StudyTopic;

  // Custom Lists
  customLists: CustomList[];
  activeListId: string;
  setActiveListId: (id: string) => void;
  addCustomList: (name: string) => CustomList;
  deleteCustomList: (id: string) => void;
  renameCustomList: (id: string, name: string) => void;
  duplicateCustomList: (id: string) => CustomList;
  copyListTasksToClipboard: (id: string) => boolean;
  moveCustomListUp: (listId: string) => void;
  moveCustomListDown: (listId: string) => void;
  
  // Study Topic Actions
  addTopic: (topicData: {
    title: string;
    subjectId: string;
    description?: string;
    estimatedMinutes?: number;
    revisionPlan: RevisionPlanType;
    customIntervalDays?: number[];
  }) => StudyTopic;
  editTopic: (id: string, updates: Partial<StudyTopic>) => void;
  deleteTopic: (id: string) => void;
  startStudyForTopic: (topicId: string) => void;
  
  // Revision Actions
  addRevisionInstance: (revisionData: Omit<RevisionInstance, 'id'>) => void;
  completeRevision: (revisionId: string, topicId?: string) => void;
  rescheduleRevision: (revisionId: string, newDate: string) => void;
  skipRevision: (revisionId: string) => void;
  reviseTopicNow: (topicId: string) => void;
  spreadTodayRevisions: () => void;
  
  // Subjects
  addSubject: (name: string, color: string) => Subject;
  editSubject: (id: string, name: string, color: string) => void;
  deleteSubject: (id: string) => void;

  // Manual Session
  addManualSession: (session: Omit<StudySession, 'id'>) => void;
  deleteSession: (id: string) => void;

  // Interruption Recovery
  recoverySessionInfo: {
    active: boolean;
    topicTitle?: string;
    subjectName?: string;
    elapsedSeconds: number;
  } | null;
  continueRecoverySession: () => void;
  endRecoverySession: (notes?: string) => void;
  discardRecoverySession: () => void;

  // Quick Notes
  quickNotes: QuickNote[];
  addQuickNote: (content: string, subjectId?: string) => QuickNote;
  editQuickNote: (id: string, updates: Partial<QuickNote>) => void;
  deleteQuickNote: (id: string) => void;
  togglePinQuickNote: (id: string) => void;
  convertQuickNoteToTask: (noteId: string, dueDate?: string, priority?: Priority) => Task;

  // Modals & Sheets
  activeModal:
    | 'none'
    | 'action_sheet'
    | 'create_task'
    | 'create_topic'
    | 'create_revision'
    | 'topic_detail'
    | 'reschedule'
    | 'search'
    | 'settings'
    | 'manual_session'
    | 'convert_to_topic'
    | 'recovery'
    | 'session_history'
    | 'quick_note'
    | 'share_summary'
    | 'data_backup';
  openModal: (modal: AppContextType['activeModal']) => void;
  closeModal: () => void;
  createTaskPreset: { onlyTask?: boolean; subjectId?: string; dueDate?: string } | null;
  openCreateTaskModal: (options?: { onlyTask?: boolean; subjectId?: string; dueDate?: string }) => void;
  
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;
  
  selectedRevisionId: string | null;
  setSelectedRevisionId: (id: string | null) => void;

  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;

  convertingTaskId: string | null;
  setConvertingTaskId: (id: string | null) => void;

  // Universal Long-Press Quick Action Sheet
  quickActionConfig: {
    title: string;
    subtitle?: string;
    details?: string;
    actions: {
      id: string;
      label: string;
      icon?: 'edit' | 'delete' | 'check' | 'plus' | 'star' | 'convert' | 'clock' | 'up' | 'down';
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    }[];
  } | null;
  openQuickActions: (config: NonNullable<AppContextType['quickActionConfig']>) => void;
  closeQuickActions: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filter States
  todoFilter: TodoFilter;
  setTodoFilter: (filter: TodoFilter) => void;
  topicFilter: TopicFilter;
  setTopicFilter: (filter: TopicFilter) => void;

  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetAllData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => { success: boolean; message: string };

  // Computed Properties
  todayStudySeconds: number;
  realtimeTodaySeconds: number;
  dailyTargetSeconds: number;
  isDailyTargetEnabled: boolean;
  dailyTargetProgressPercent: number;
  isDailyTargetReached: boolean;
  remainingTargetSeconds: number;
  todayCompletedTasksCount: number;
  todayCompletedRevisionsCount: number;
  dueTodayRevisions: RevisionInstance[];
  overdueRevisions: RevisionInstance[];
  upcomingRevisions: RevisionInstance[];
  currentStreakDays: number;
  consistencyScoreData: ConsistencyScoreData;
  revisionLoadInfo: RevisionLoadInfo;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<MainTab>('todo');

  // Core Data
  const [subjects, setSubjects] = useState<Subject[]>(() => storage.getSubjects());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [topics, setTopics] = useState<StudyTopic[]>(() => storage.getTopics());
  const [revisions, setRevisions] = useState<RevisionInstance[]>(() => storage.getRevisions());
  const [sessions, setSessions] = useState<StudySession[]>(() => storage.getSessions());
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.getPreferences());
  const [customLists, setCustomLists] = useState<CustomList[]>(() => storage.getCustomLists());
  const [activeListId, setActiveListId] = useState<string>('all');
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => storage.getQuickNotes());

  // Timer State
  const [timerState, setTimerState] = useState<ActiveTimerState>(() => storage.getActiveTimer());
  const [elapsedTimerSeconds, setElapsedTimerSeconds] = useState<number>(0);

  // Modals & Navigation
  const [activeModal, setActiveModal] = useState<AppContextType['activeModal']>('none');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [convertingTaskId, setConvertingTaskId] = useState<string | null>(null);
  const [createTaskPreset, setCreateTaskPreset] = useState<{
    onlyTask?: boolean;
    subjectId?: string;
    dueDate?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Interruption Recovery Detection on Mount
  const [recoverySessionInfo, setRecoverySessionInfo] = useState<{
    active: boolean;
    topicTitle?: string;
    subjectName?: string;
    elapsedSeconds: number;
  } | null>(null);

  useEffect(() => {
    // Check if an interrupted session exists in localStorage
    const saved = storage.getActiveTimer();
    if (saved && saved.isRunning && saved.startTimestamp) {
      const elapsed =
        saved.accumulatedSeconds +
        Math.floor((Date.now() - saved.startTimestamp) / 1000);
      if (elapsed >= 10) {
        const top = topics.find(t => t.id === saved.topicId);
        const sub = subjects.find(s => s.id === saved.subjectId);
        setRecoverySessionInfo({
          active: true,
          topicTitle: top?.title,
          subjectName: sub?.name,
          elapsedSeconds: elapsed,
        });
        setActiveModal('recovery');
      }
    }
  }, []);

  const continueRecoverySession = () => {
    setActiveModal('none');
    setRecoverySessionInfo(null);
    triggerHaptic();
  };

  const endRecoverySession = (notes?: string) => {
    stopTimer(notes || 'Restored from previous session');
    setActiveModal('none');
    setRecoverySessionInfo(null);
  };

  const discardRecoverySession = () => {
    resetTimer();
    setActiveModal('none');
    setRecoverySessionInfo(null);
  };

  // Filters
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('all');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');

  // Universal Quick Action Sheet State
  const [quickActionConfig, setQuickActionConfig] = useState<AppContextType['quickActionConfig']>(null);

  const openQuickActions = (config: NonNullable<AppContextType['quickActionConfig']>) => {
    triggerHaptic('medium');
    setQuickActionConfig(config);
  };

  const closeQuickActions = () => {
    setQuickActionConfig(null);
  };

  // Maintain consistent Apple Light UI regardless of system mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'only light';
  }, [preferences.theme]);

  // Auto-renewal of recurring tasks on day turnover
  useEffect(() => {
    const today = getTodayStr();
    setTasks(prev => {
      let changed = false;
      const updated = prev.map(task => {
        if (task.recurring && task.recurring !== 'none') {
          const lastCompletedDate =
            task.completedDates && task.completedDates.length > 0
              ? task.completedDates[task.completedDates.length - 1]
              : task.completedAt ? task.completedAt.split('T')[0] : null;

          if (task.completed && lastCompletedDate && lastCompletedDate < today) {
            changed = true;
            let nextDue = today;
            if (task.recurring === 'daily') {
              nextDue = today;
            } else if (task.recurring === 'weekly') {
              nextDue = addDays(lastCompletedDate, 7);
            } else if (task.recurring === 'monthly') {
              nextDue = addDays(lastCompletedDate, 30);
            } else if (task.recurring === 'custom') {
              nextDue = addDays(lastCompletedDate, task.repeatCustomDays || 1);
            }

            return {
              ...task,
              completed: false,
              completedAt: undefined,
              dueDate: nextDue,
            };
          }
        }
        return task;
      });

      if (changed) {
        storage.saveTasks(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  // Sync to local storage
  useEffect(() => {
    storage.saveSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.saveTopics(topics);
  }, [topics]);

  useEffect(() => {
    storage.saveRevisions(revisions);
  }, [revisions]);

  useEffect(() => {
    storage.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    storage.savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    storage.saveActiveTimer(timerState);
  }, [timerState]);

  // Timer Tick Engine (Accurate Date.now() timestamp calculation)
  useEffect(() => {
    const calculateSeconds = () => {
      if (timerState.isRunning && timerState.startTimestamp) {
        const diffSec = Math.floor((Date.now() - timerState.startTimestamp) / 1000);
        const currentElapsed = timerState.accumulatedSeconds + diffSec;
        setElapsedTimerSeconds(currentElapsed);

        // Pomodoro auto-switch detection
        if (timerState.mode === 'pomodoro') {
          const target = timerState.pomodoroIsBreak
            ? timerState.pomodoroBreakDuration
            : timerState.pomodoroWorkDuration;

          if (currentElapsed >= target) {
            // Completed pomodoro phase
            if (preferences.enableSound) playTimerCompleteChime();
            triggerHaptic();

            if (!timerState.pomodoroIsBreak) {
              // Work phase finished -> automatically save session log
              const today = getTodayStr();
              const newSession: StudySession = {
                id: `sess-${Date.now()}`,
                subjectId: timerState.subjectId,
                topicId: timerState.topicId,
                startTime: new Date(Date.now() - target * 1000).toISOString(),
                endTime: new Date().toISOString(),
                durationSeconds: target,
                date: today,
                mode: 'pomodoro',
                notes: 'Pomodoro focus interval',
              };
              setSessions(prev => [newSession, ...prev]);

              // Update topic total study seconds if attached
              if (timerState.topicId) {
                setTopics(prev =>
                  prev.map(t =>
                    t.id === timerState.topicId
                      ? { ...t, totalStudySeconds: t.totalStudySeconds + target }
                      : t
                  )
                );
              }

              // Switch to break
              setTimerState(prev => ({
                ...prev,
                startTimestamp: Date.now(),
                accumulatedSeconds: 0,
                pomodoroIsBreak: true,
                pomodoroCompletedCount: prev.pomodoroCompletedCount + 1,
              }));
            } else {
              // Break finished -> switch to work paused or running
              setTimerState(prev => ({
                ...prev,
                isRunning: false,
                isPaused: true,
                startTimestamp: null,
                accumulatedSeconds: 0,
                pomodoroIsBreak: false,
              }));
            }
          }
        }
      } else {
        setElapsedTimerSeconds(timerState.accumulatedSeconds);
      }
    };

    calculateSeconds();
    const interval = setInterval(calculateSeconds, 500);
    return () => clearInterval(interval);
  }, [timerState, preferences.enableSound]);

  // Request Notification permission if enabled
  useEffect(() => {
    if (preferences.enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [preferences.enableNotifications]);

  // Timer Handlers
  const startTimer = () => {
    triggerHaptic();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTimestamp: Date.now(),
    }));
  };

  const pauseTimer = () => {
    triggerHaptic();
    if (!timerState.isRunning || !timerState.startTimestamp) return;
    const currentDiff = Math.floor((Date.now() - timerState.startTimestamp) / 1000);
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
      startTimestamp: null,
      accumulatedSeconds: prev.accumulatedSeconds + currentDiff,
    }));
  };

  const resumeTimer = () => {
    triggerHaptic();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTimestamp: Date.now(),
    }));
  };

  const stopTimer = (notes?: string) => {
    triggerHaptic();
    const totalSecs = elapsedTimerSeconds;
    if (totalSecs >= 10) {
      // Save session
      const today = getTodayStr();
      const startTime = new Date(Date.now() - totalSecs * 1000).toISOString();
      const endTime = new Date().toISOString();

      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        subjectId: timerState.subjectId,
        topicId: timerState.topicId,
        startTime,
        endTime,
        durationSeconds: totalSecs,
        date: today,
        mode: timerState.mode,
        notes,
      };

      setSessions(prev => [newSession, ...prev]);

      // If topic linked, update topic study seconds and mark as studied if new
      if (timerState.topicId) {
        setTopics(prev =>
          prev.map(t => {
            if (t.id === timerState.topicId) {
              const updatedStudySecs = t.totalStudySeconds + totalSecs;
              // If status is 'new', transition to 'studied' and schedule revision 1
              if (t.status === 'new' && t.totalRevisions > 0) {
                const nextRev = createNextRevisionInstance(
                  { ...t, currentRevision: 0, status: 'studied' },
                  today
                );
                if (nextRev) {
                  setRevisions(r => [nextRev, ...r]);
                }
                return {
                  ...t,
                  studiedAt: today,
                  status: '1x',
                  currentRevision: 0,
                  totalStudySeconds: updatedStudySecs,
                };
              }
              return { ...t, totalStudySeconds: updatedStudySecs };
            }
            return t;
          })
        );
      }

      if (preferences.enableSound) playSuccessChime();
    }

    // Reset timer
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      startTimestamp: null,
      accumulatedSeconds: 0,
      pomodoroIsBreak: false,
    }));
    setElapsedTimerSeconds(0);
  };

  const resetTimer = () => {
    triggerHaptic();
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      startTimestamp: null,
      accumulatedSeconds: 0,
      pomodoroIsBreak: false,
    }));
    setElapsedTimerSeconds(0);
  };

  const setTimerSubject = (subjectId: string) => {
    setTimerState(prev => ({ ...prev, subjectId, topicId: undefined }));
  };

  const setTimerTopic = (topicId?: string) => {
    if (topicId) {
      const top = topics.find(t => t.id === topicId);
      if (top) {
        setTimerState(prev => ({ ...prev, topicId, subjectId: top.subjectId }));
        return;
      }
    }
    setTimerState(prev => ({ ...prev, topicId: undefined }));
  };

  const setTimerMode = (mode: 'stopwatch' | 'pomodoro') => {
    setTimerState(prev => ({
      ...prev,
      mode,
      accumulatedSeconds: 0,
      startTimestamp: null,
      isRunning: false,
      isPaused: false,
      pomodoroIsBreak: false,
    }));
    setElapsedTimerSeconds(0);
  };

  const setPomodoroPreset = (workMins: number, breakMins: number) => {
    setTimerState(prev => ({
      ...prev,
      pomodoroWorkDuration: workMins * 60,
      pomodoroBreakDuration: breakMins * 60,
      accumulatedSeconds: 0,
      startTimestamp: null,
      isRunning: false,
      isPaused: false,
      pomodoroIsBreak: false,
    }));
    setElapsedTimerSeconds(0);
  };

  // Task Actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    triggerHaptic();
    return newTask;
  };

  const editTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    triggerHaptic('light');
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const deleteTasks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    triggerHaptic('medium');
    const setIds = new Set(ids);
    setTasks(prev => prev.filter(t => !setIds.has(t.id)));
  };

  const bulkUpdateTasks = (ids: string[], updates: Partial<Task>) => {
    if (!ids || ids.length === 0) return;
    triggerHaptic('success');
    const setIds = new Set(ids);
    setTasks(prev => prev.map(t => (setIds.has(t.id) ? { ...t, ...updates } : t)));
  };

  const reorderTasks = (newTasks: Task[]) => {
    triggerHaptic('light');
    setTasks(newTasks);
    storage.saveTasks(newTasks);
  };

  const moveTaskUp = (taskId: string) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      storage.saveTasks(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveTaskDown = (taskId: string) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      storage.saveTasks(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveSubtaskUp = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId || !t.subtasks) return t;
        const idx = t.subtasks.findIndex(st => st.id === subtaskId);
        if (idx <= 0) return t;
        const sub = [...t.subtasks];
        const temp = sub[idx - 1];
        sub[idx - 1] = sub[idx];
        sub[idx] = temp;
        return { ...t, subtasks: sub };
      });
      storage.saveTasks(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveSubtaskDown = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId || !t.subtasks) return t;
        const idx = t.subtasks.findIndex(st => st.id === subtaskId);
        if (idx === -1 || idx >= t.subtasks.length - 1) return t;
        const sub = [...t.subtasks];
        const temp = sub[idx + 1];
        sub[idx + 1] = sub[idx];
        sub[idx] = temp;
        return { ...t, subtasks: sub };
      });
      storage.saveTasks(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveSubjectUp = (subjectId: string) => {
    setSubjects(prev => {
      const idx = prev.findIndex(s => s.id === subjectId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      storage.saveSubjects(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveSubjectDown = (subjectId: string) => {
    setSubjects(prev => {
      const idx = prev.findIndex(s => s.id === subjectId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      storage.saveSubjects(next);
      triggerHaptic('light');
      return next;
    });
  };

  const setDailyGoalMinutes = (minutes: number) => {
    triggerHaptic('light');
    const clamped = Math.max(15, minutes);
    updatePreferences({ dailyStudyGoalMinutes: clamped });
  };

  const toggleTaskCompleted = (id: string) => {
    const today = getTodayStr();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            triggerHaptic('success');
            if (preferences.enableSound) playSuccessChime();
          } else {
            triggerHaptic('toggle');
          }

          let nextDates = t.completedDates || [];
          if (nextCompleted) {
            if (!nextDates.includes(today)) {
              nextDates = [...nextDates, today];
            }
          } else {
            nextDates = nextDates.filter(d => d !== today);
          }

          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
            completedDates: nextDates,
          };
        }
        return t;
      })
    );
  };

  const toggleTaskRevisionStep = (taskId: string, stepNumber: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const current = t.completedRevisions || [];
          const exists = current.includes(stepNumber);
          const next = exists
            ? current.filter(s => s !== stepNumber)
            : [...current, stepNumber].sort((a, b) => a - b);
          triggerHaptic(exists ? 'toggle' : 'success');
          if (!exists && preferences.enableSound) playSuccessChime();
          return {
            ...t,
            completedRevisions: next,
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map(st => {
            if (st.id === subtaskId) {
              const nextVal = !st.completed;
              triggerHaptic(nextVal ? 'success' : 'toggle');
              return { ...st, completed: nextVal };
            }
            return st;
          });
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: allCompleted ? true : t.completed,
          };
        }
        return t;
      })
    );
  };

  const addSubtask = (
    taskId: string,
    subtaskData: { title: string; dueDate?: string; revisionPlan?: RevisionPlanType }
  ) => {
    triggerHaptic();
    const newSubtask: Subtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: subtaskData.title.trim(),
      completed: false,
      dueDate: subtaskData.dueDate,
      revisionPlan: subtaskData.revisionPlan,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: [...(t.subtasks || []), newSubtask],
          };
        }
        return t;
      })
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    triggerHaptic();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.filter(st => st.id !== subtaskId),
          };
        }
        return t;
      })
    );
  };

  // Convert Task to Study Topic (preserves task link, avoids duplicates)
  const convertTaskToTopic = (
    taskId: string,
    options: {
      subjectId: string;
      title?: string;
      description?: string;
      estimatedMinutes?: number;
      revisionPlan: RevisionPlanType;
      customIntervalDays?: number[];
    }
  ): StudyTopic => {
    const task = tasks.find(t => t.id === taskId);
    const title = options.title?.trim() || task?.title || 'New Study Topic';
    const subjectId = options.subjectId || task?.subjectId || subjects[0]?.id || 'sub-cs';
    const description = options.description?.trim() || task?.notes || '';
    const totalRevs = getTotalRevisionsForPlan(options.revisionPlan, options.customIntervalDays);

    const newTopic: StudyTopic = {
      id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      subjectId,
      description: description || undefined,
      estimatedMinutes: options.estimatedMinutes || 60,
      revisionPlan: options.revisionPlan,
      customIntervalDays: options.customIntervalDays,
      createdAt: new Date().toISOString(),
      status: 'new',
      currentRevision: 0,
      totalRevisions: totalRevs,
      totalStudySeconds: 0,
      linkedTaskId: taskId,
    };

    setTopics(prev => [newTopic, ...prev]);

    // Update original task with link to this topic (preserving original task)
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              linkedTopicId: newTopic.id,
              subjectId: subjectId,
            }
          : t
      )
    );

    triggerHaptic();
    if (preferences.enableSound) playSuccessChime();
    return newTopic;
  };

  // Custom Lists Actions
  const addCustomList = (name: string): CustomList => {
    const newList: CustomList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customLists, newList];
    setCustomLists(updated);
    storage.saveCustomLists(updated);
    setActiveListId(newList.id);
    triggerHaptic();
    return newList;
  };

  const deleteCustomList = (id: string) => {
    const updated = customLists.filter(l => l.id !== id);
    setCustomLists(updated);
    storage.saveCustomLists(updated);
    if (activeListId === id) {
      setActiveListId('all');
    }
  };

  const renameCustomList = (id: string, name: string) => {
    const updated = customLists.map(l => (l.id === id ? { ...l, name: name.trim() } : l));
    setCustomLists(updated);
    storage.saveCustomLists(updated);
  };

  const duplicateCustomList = (id: string): CustomList => {
    const original = customLists.find(l => l.id === id);
    const newName = original ? `${original.name} (Copy)` : 'New List Copy';
    const newList: CustomList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName,
      createdAt: new Date().toISOString(),
    };
    const updated = [...customLists, newList];
    setCustomLists(updated);
    storage.saveCustomLists(updated);

    // Duplicate all tasks belonging to this list
    const listTasks = tasks.filter(t => t.listId === id);
    if (listTasks.length > 0) {
      const duplicatedTasks: Task[] = listTasks.map(t => ({
        ...t,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        listId: newList.id,
        createdAt: new Date().toISOString(),
        completed: false,
        completedAt: undefined,
        completedRevisions: [],
        completedDates: [],
        subtasks: (t.subtasks || []).map(st => ({
          ...st,
          id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          completed: false,
        })),
      }));
      setTasks(prev => [...duplicatedTasks, ...prev]);
    }

    setActiveListId(newList.id);
    triggerHaptic('success');
    return newList;
  };

  const copyListTasksToClipboard = (id: string): boolean => {
    const list = customLists.find(l => l.id === id);
    const listName = id === 'all' ? 'All Tasks' : (list ? list.name : 'Tasks');
    const filteredTasks = id === 'all' ? tasks : tasks.filter(t => t.listId === id);

    if (filteredTasks.length === 0) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`${listName}:\n(No tasks in this list)`);
      }
      return true;
    }

    const taskLines = filteredTasks.map(t => {
      const status = t.completed ? '[x]' : '[ ]';
      const due = t.dueDate ? ` (Due: ${t.dueDate})` : '';
      const priority = t.priority && t.priority !== 'none' ? ` [${t.priority.toUpperCase()}]` : '';
      const repeat = t.recurring && t.recurring !== 'none' ? ` [Repeat: ${t.recurring}]` : '';
      return `${status} ${t.title}${due}${priority}${repeat}`;
    });

    const text = `${listName}\n` + taskLines.join('\n');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      triggerHaptic('success');
      return true;
    } catch {
      return false;
    }
  };

  const moveCustomListUp = (listId: string) => {
    setCustomLists(prev => {
      const idx = prev.findIndex(l => l.id === listId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      storage.saveCustomLists(next);
      triggerHaptic('light');
      return next;
    });
  };

  const moveCustomListDown = (listId: string) => {
    setCustomLists(prev => {
      const idx = prev.findIndex(l => l.id === listId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      storage.saveCustomLists(next);
      triggerHaptic('light');
      return next;
    });
  };

  // Study Topic Actions
  const addTopic = (topicData: {
    title: string;
    subjectId: string;
    description?: string;
    estimatedMinutes?: number;
    revisionPlan: RevisionPlanType;
    customIntervalDays?: number[];
  }): StudyTopic => {
    const totalRevs = getTotalRevisionsForPlan(
      topicData.revisionPlan,
      topicData.customIntervalDays
    );

    const newTopic: StudyTopic = {
      id: `top-${Date.now()}`,
      title: topicData.title.trim(),
      subjectId: topicData.subjectId,
      description: topicData.description?.trim(),
      estimatedMinutes: topicData.estimatedMinutes,
      revisionPlan: topicData.revisionPlan,
      customIntervalDays: topicData.customIntervalDays,
      createdAt: new Date().toISOString(),
      status: 'new',
      currentRevision: 0,
      totalRevisions: totalRevs,
      totalStudySeconds: 0,
    };

    setTopics(prev => [newTopic, ...prev]);
    triggerHaptic();
    return newTopic;
  };

  const editTopic = (id: string, updates: Partial<StudyTopic>) => {
    setTopics(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
    setRevisions(prev => prev.filter(r => r.topicId !== id));
    setTasks(prev => prev.filter(t => t.topicId !== id));
  };

  const startStudyForTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setTimerState(prev => ({
      ...prev,
      topicId: topic.id,
      subjectId: topic.subjectId,
    }));
    setCurrentTab('study');
    closeModal();
  };

  // Revision Actions
  const addRevisionInstance = (revisionData: Omit<RevisionInstance, 'id'>) => {
    const newRev: RevisionInstance = {
      ...revisionData,
      id: `rev-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setRevisions(prev => [newRev, ...prev]);
  };

  const spreadTodayRevisions = () => {
    setRevisions(prev => spreadRevisionsOver3Days(prev, getTodayStr()));
    triggerHaptic();
    if (preferences.enableSound) playSuccessChime();
  };

  const completeRevision = (revisionId: string, directTopicId?: string) => {
    triggerHaptic();
    if (preferences.enableSound) playSuccessChime();

    const targetRev = revisions.find(r => r.id === revisionId);
    const targetTopicId = directTopicId || targetRev?.topicId;
    if (!targetTopicId) return;

    const topic = topics.find(t => t.id === targetTopicId);
    if (!topic) return;

    const today = getTodayStr();

    // 1. Mark current revision complete
    setRevisions(prev =>
      prev.map(r =>
        r.id === revisionId
          ? {
              ...r,
              status: 'completed',
              completedDate: today,
            }
          : r
      )
    );

    // 2. Advance topic revision count and schedule next
    const nextRevisionNum = topic.currentRevision + 1;
    const isFinished = nextRevisionNum >= topic.totalRevisions;

    if (isFinished) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });

      // If this topic was linked to an original task, mark that task as completed!
      if (topic.linkedTaskId) {
        setTasks(prev =>
          prev.map(t =>
            t.id === topic.linkedTaskId
              ? { ...t, completed: true, completedAt: new Date().toISOString() }
              : t
          )
        );
      }
    }

    const updatedTopic: StudyTopic = {
      ...topic,
      currentRevision: nextRevisionNum,
      status: getStatusFromRevisionCount(nextRevisionNum, topic.totalRevisions),
      completedAt: isFinished ? today : undefined,
    };

    setTopics(prev => prev.map(t => (t.id === topic.id ? updatedTopic : t)));

    // 3. Schedule next revision instance if not finished
    if (!isFinished) {
      const nextInstance = createNextRevisionInstance(updatedTopic, today);
      if (nextInstance) {
        setRevisions(prev => [nextInstance, ...prev]);
      }
    }
  };

  const rescheduleRevision = (revisionId: string, newDate: string) => {
    triggerHaptic();
    setRevisions(prev =>
      prev.map(r => {
        if (r.id === revisionId) {
          return {
            ...r,
            scheduledDate: newDate,
            rescheduledFrom: r.rescheduledFrom || r.scheduledDate,
            status: isPastDate(newDate) ? 'overdue' : 'pending',
          };
        }
        return r;
      })
    );
  };

  const skipRevision = (revisionId: string) => {
    triggerHaptic();
    setRevisions(prev =>
      prev.map(r => (r.id === revisionId ? { ...r, status: 'skipped' } : r))
    );
  };

  const reviseTopicNow = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    // Find pending/overdue revision for this topic
    const activeRev = revisions.find(
      r => r.topicId === topicId && (r.status === 'pending' || r.status === 'overdue')
    );

    if (activeRev) {
      completeRevision(activeRev.id, topicId);
    } else if (topic.status === 'new') {
      // First study of the topic
      const today = getTodayStr();
      const nextRev = createNextRevisionInstance(
        { ...topic, currentRevision: 0, status: 'studied' },
        today
      );
      if (nextRev) {
        setRevisions(prev => [nextInstanceSafe(nextRev), ...prev]);
      }
      setTopics(prev =>
        prev.map(t =>
          t.id === topicId
            ? {
                ...t,
                studiedAt: today,
                status: '1x',
                currentRevision: 0,
              }
            : t
        )
      );
      if (preferences.enableSound) playSuccessChime();
    }
  };

  function nextInstanceSafe(rev: RevisionInstance) {
    return rev;
  }

  // Subjects
  const addSubject = (name: string, color: string): Subject => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    setSubjects(prev => [...prev, newSubject]);
    return newSubject;
  };

  const editSubject = (id: string, name: string, color: string) => {
    setSubjects(prev =>
      prev.map(s => (s.id === id ? { ...s, name: name.trim(), color } : s))
    );
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    // Clean up subjectId on tasks so they don't have broken references
    setTasks(prev =>
      prev.map(t => (t.subjectId === id ? { ...t, subjectId: undefined } : t))
    );
    // Clean up subjectId on topics
    setTopics(prev =>
      prev.map(tp => (tp.subjectId === id ? { ...tp, subjectId: '' } : tp))
    );
    if (activeListId === id) {
      setActiveListId('all');
    }
    triggerHaptic('success');
  };

  // Sessions
  const addManualSession = (sessionData: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
    };
    setSessions(prev => [newSession, ...prev]);
    if (sessionData.topicId) {
      setTopics(prev =>
        prev.map(t =>
          t.id === sessionData.topicId
            ? { ...t, totalStudySeconds: t.totalStudySeconds + sessionData.durationSeconds }
            : t
        )
      );
    }
    triggerHaptic();
  };

  const deleteSession = (id: string) => {
    const sess = sessions.find(s => s.id === id);
    if (sess && sess.topicId) {
      setTopics(prev =>
        prev.map(t =>
          t.id === sess.topicId
            ? { ...t, totalStudySeconds: Math.max(0, t.totalStudySeconds - sess.durationSeconds) }
            : t
        )
      );
    }
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Modal helpers
  const openModal = (modal: AppContextType['activeModal']) => {
    setActiveModal(modal);
  };

  const openCreateTaskModal = (options?: { onlyTask?: boolean; subjectId?: string; dueDate?: string }) => {
    setCreateTaskPreset(options || null);
    setActiveModal('create_task');
  };

  const closeModal = () => {
    setActiveModal('none');
    setEditingTaskId(null);
    setCreateTaskPreset(null);
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Quick Notes Actions
  const addQuickNote = (content: string, subjectId?: string): QuickNote => {
    const newNote: QuickNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      subjectId: subjectId || undefined,
      isPinned: false,
    };
    setQuickNotes(prev => {
      const updated = [newNote, ...prev];
      storage.saveQuickNotes(updated);
      return updated;
    });
    triggerHaptic('success');
    return newNote;
  };

  const editQuickNote = (id: string, updates: Partial<QuickNote>) => {
    setQuickNotes(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, ...updates } : n));
      storage.saveQuickNotes(updated);
      return updated;
    });
    triggerHaptic('light');
  };

  const deleteQuickNote = (id: string) => {
    setQuickNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      storage.saveQuickNotes(updated);
      return updated;
    });
    triggerHaptic('heavy');
  };

  const togglePinQuickNote = (id: string) => {
    setQuickNotes(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
      storage.saveQuickNotes(updated);
      return updated;
    });
    triggerHaptic('light');
  };

  const convertQuickNoteToTask = (noteId: string, dueDate?: string, priority: Priority = 'none'): Task => {
    const note = quickNotes.find(n => n.id === noteId);
    if (!note) throw new Error('Note not found');
    const createdTask = addTask({
      title: note.content.slice(0, 100).replace(/\n/g, ' '),
      notes: note.content.length > 100 ? note.content : undefined,
      dueDate: dueDate || getTodayStr(),
      priority,
      completed: false,
      subtasks: [],
      subjectId: note.subjectId,
    });
    deleteQuickNote(noteId);
    triggerHaptic('success');
    return createdTask;
  };

  const resetAllData = () => {
    storage.resetAllData();
    setSubjects(storage.getSubjects());
    setTasks(storage.getTasks());
    setTopics(storage.getTopics());
    setRevisions(storage.getRevisions());
    setSessions(storage.getSessions());
    setPreferences(storage.getPreferences());
    setCustomLists(storage.getCustomLists());
    setQuickNotes(storage.getQuickNotes());
    setActiveListId('all');
    setTimerState(storage.getActiveTimer());
    setElapsedTimerSeconds(0);
    closeModal();
  };

  const exportDataJson = (): string => {
    return storage.exportAllData();
  };

  const importDataJson = (jsonStr: string): { success: boolean; message: string } => {
    const res = storage.importAllData(jsonStr);
    if (res.success) {
      setSubjects(storage.getSubjects());
      setTasks(storage.getTasks());
      setTopics(storage.getTopics());
      setRevisions(storage.getRevisions());
      setSessions(storage.getSessions());
      setPreferences(storage.getPreferences());
      setCustomLists(storage.getCustomLists());
      setQuickNotes(storage.getQuickNotes());
      setActiveListId('all');
      setTimerState(storage.getActiveTimer());
      setElapsedTimerSeconds(0);
      triggerHaptic('success');
      if (preferences.enableSound) playSuccessChime();
    }
    return res;
  };

  // COMPUTED PROPERTIES
  const todayStr = getTodayStr();

  const todayStudySeconds = useMemo(() => {
    return sessions
      .filter(s => s.date === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [sessions, todayStr]);

  const todayCompletedTasksCount = useMemo(() => {
    return tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(todayStr)).length;
  }, [tasks, todayStr]);

  const todayCompletedRevisionsCount = useMemo(() => {
    return revisions.filter(r => r.status === 'completed' && r.completedDate === todayStr).length;
  }, [revisions, todayStr]);

  const { overdueRevisions, dueTodayRevisions, upcomingRevisions } = useMemo(() => {
    const overdue: RevisionInstance[] = [];
    const dueToday: RevisionInstance[] = [];
    const upcoming: RevisionInstance[] = [];

    revisions.forEach(r => {
      if (r.status === 'completed' || r.status === 'skipped') return;
      if (isPastDate(r.scheduledDate)) {
        overdue.push(r);
      } else if (isTodayDate(r.scheduledDate)) {
        dueToday.push(r);
      } else {
        upcoming.push(r);
      }
    });

    return {
      overdueRevisions: overdue.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
      dueTodayRevisions: dueToday,
      upcomingRevisions: upcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    };
  }, [revisions]);

  const currentStreakDays = useMemo(() => {
    const studyDates = new Set(sessions.filter(s => s.durationSeconds >= 60).map(s => s.date));
    let streak = 0;
    let checkDate = todayStr;

    // If no study today yet, check if yesterday had study to maintain streak
    if (!studyDates.has(checkDate)) {
      checkDate = addDays(todayStr, -1);
    }

    while (studyDates.has(checkDate)) {
      streak += 1;
      checkDate = addDays(checkDate, -1);
    }

    return streak;
  }, [sessions, todayStr]);

  // Daily Study Target Computations
  const isDailyTargetEnabled = preferences.enableDailyTarget !== false;
  const dailyTargetSeconds = (preferences.dailyStudyGoalMinutes || 180) * 60;
  const realtimeTodaySeconds = todayStudySeconds + (timerState.isRunning ? elapsedTimerSeconds : 0);
  const dailyTargetProgressPercent = Math.min(
    100,
    dailyTargetSeconds > 0 ? Math.round((realtimeTodaySeconds / dailyTargetSeconds) * 100) : 100
  );
  const isDailyTargetReached = isDailyTargetEnabled && realtimeTodaySeconds >= dailyTargetSeconds;
  const remainingTargetSeconds = Math.max(0, dailyTargetSeconds - realtimeTodaySeconds);

  // Consistency Score
  const consistencyScoreData = useMemo(() => {
    return calculateConsistencyScore(sessions, revisions, preferences);
  }, [sessions, revisions, preferences]);

  // Smart Rescheduling / Revision Load Detection
  const revisionLoadInfo = useMemo(() => {
    return detectRevisionOverload(revisions, topics, todayStr);
  }, [revisions, topics, todayStr]);

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        subjects,
        tasks,
        topics,
        revisions,
        sessions,
        preferences,
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
        addTask,
        editTask,
        deleteTask,
        deleteTasks,
        bulkUpdateTasks,
        reorderTasks,
        toggleTaskCompleted,
        toggleTaskRevisionStep,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        moveTaskUp,
        moveTaskDown,
        moveSubtaskUp,
        moveSubtaskDown,
        moveSubjectUp,
        moveSubjectDown,
        setDailyGoalMinutes,
        convertTaskToTopic,
        addTopic,
        editTopic,
        deleteTopic,
        startStudyForTopic,
        addRevisionInstance,
        completeRevision,
        rescheduleRevision,
        skipRevision,
        reviseTopicNow,
        spreadTodayRevisions,
        addSubject,
        editSubject,
        deleteSubject,
        addManualSession,
        deleteSession,
        recoverySessionInfo,
        continueRecoverySession,
        endRecoverySession,
        discardRecoverySession,
        activeModal,
        openModal,
        closeModal,
        createTaskPreset,
        openCreateTaskModal,
        selectedTopicId,
        setSelectedTopicId,
        selectedRevisionId,
        setSelectedRevisionId,
        editingTaskId,
        setEditingTaskId,
        convertingTaskId,
        setConvertingTaskId,
        quickActionConfig,
        openQuickActions,
        closeQuickActions,
        searchQuery,
        setSearchQuery,
        todoFilter,
        setTodoFilter,
        topicFilter,
        setTopicFilter,
        customLists,
        activeListId,
        setActiveListId,
        addCustomList,
        deleteCustomList,
        renameCustomList,
        duplicateCustomList,
        copyListTasksToClipboard,
        moveCustomListUp,
        moveCustomListDown,
        quickNotes,
        addQuickNote,
        editQuickNote,
        deleteQuickNote,
        togglePinQuickNote,
        convertQuickNoteToTask,
        updatePreferences,
        resetAllData,
        exportDataJson,
        importDataJson,
        todayStudySeconds,
        realtimeTodaySeconds,
        dailyTargetSeconds,
        isDailyTargetEnabled,
        dailyTargetProgressPercent,
        isDailyTargetReached,
        remainingTargetSeconds,
        todayCompletedTasksCount,
        todayCompletedRevisionsCount,
        dueTodayRevisions,
        overdueRevisions,
        upcomingRevisions,
        currentStreakDays,
        consistencyScoreData,
        revisionLoadInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
