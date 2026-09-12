export type Priority = 'none' | 'low' | 'medium' | 'high';

export type RevisionPlanType = 'none' | '1x' | '2x' | '3x' | '4x' | '5x' | 'custom' | '1-3-7-30' | '1-7-14' | '2-4-8';

export type TopicStatus = 'new' | 'studied' | '1x' | '2x' | '3x' | '4x' | '5x' | 'completed';

export type RevisionStatus = 'pending' | 'completed' | 'overdue' | 'skipped';

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex or tailwind color class
  icon?: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  revisionPlan?: RevisionPlanType;
  createdAt?: string;
}

export interface CustomList {
  id: string;
  name: string;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  content: string;
  createdAt: string; // ISO string
  subjectId?: string;
  isPinned?: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  completed: boolean;
  completedAt?: string;
  completedDates?: string[]; // YYYY-MM-DD history of completion for calendar & streaks
  subtasks: Subtask[];
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  repeatCustomDays?: number; // for custom repeat, e.g. every X days
  subjectId?: string;
  isRevision?: boolean;
  revisionId?: string;
  revisionPlan?: RevisionPlanType;
  completedRevisions?: number[]; // [1, 2, 3] tracks ticked revisions
  topicId?: string;
  linkedTopicId?: string; // Link to converted/associated StudyTopic
  listId?: string; // Custom list ID
  createdAt: string;
}

export interface RevisionInstance {
  id: string;
  topicId: string;
  subjectId: string;
  revisionNumber: number; // 1, 2, 3, 4, 5
  scheduledDate: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  status: RevisionStatus;
  rescheduledFrom?: string;
  notes?: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  subjectId: string;
  description?: string;
  estimatedMinutes?: number;
  revisionPlan: RevisionPlanType;
  customIntervalDays?: number[]; // e.g. [1, 3, 7]
  createdAt: string;
  studiedAt?: string; // Date of first study
  completedAt?: string;
  status: TopicStatus;
  currentRevision: number; // 0 = new, 1 = completed 1st rev, etc.
  totalRevisions: number; // e.g. 3
  totalStudySeconds: number;
  linkedTaskId?: string; // Link back to original Task
}

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  mode: 'stopwatch' | 'pomodoro';
  status?: 'completed' | 'interrupted';
  pomodoroInfo?: {
    workDuration: number;
    breakDuration: number;
    isBreak: boolean;
  };
  notes?: string;
}

export interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTimestamp: number | null; // Date.now() when started/resumed
  accumulatedSeconds: number;
  subjectId: string;
  topicId?: string;
  mode: 'stopwatch' | 'pomodoro';
  pomodoroWorkDuration: number; // in seconds, default 25 * 60
  pomodoroBreakDuration: number; // in seconds, default 5 * 60
  pomodoroIsBreak: boolean;
  pomodoroCompletedCount: number;
  sessionStartTime?: string; // ISO string when first started
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  enableDailyTarget: boolean;
  dailyStudyGoalMinutes: number;
  enableSound: boolean;
  enableNotifications: boolean;
  defaultRevisionPlan: RevisionPlanType;
}

export interface ConsistencyScoreData {
  score: number; // 0 - 100
  overallScore: number;
  label: string; // e.g. "Excellent", "High Discipline", "Good", "Building Momentum"
  feedback: string;
  studyDaysCount: number;
  activeDaysCount: number;
  totalDaysEvaluated: number;
  studyDaysPercent: number;
  revisionScore: number;
  onTimeRevisionRate: number;
  targetScore: number;
  targetHitRate: number;
  summaryText: string;
}

export interface RevisionLoadInfo {
  isOverloaded: boolean;
  totalDueTodayCount: number;
  totalRevisionsToday: number;
  overdueCount: number;
  dueTodayOnlyCount: number;
  estimatedMinutes: number;
  estimatedMinutesToday: number;
}

export type MainTab = 'todo' | 'study' | 'analysis';

export type TodoFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'progress' | 'revision' | 'overdue';

export type TopicFilter = 'all' | 'progress' | '2x' | '3x' | '4x' | '5x' | 'completed';
