import {
  ActiveTimerState,
  CustomList,
  RevisionInstance,
  StudySession,
  StudyTopic,
  Subject,
  Task,
  UserPreferences,
  QuickNote,
} from '../types';
import { addDays, getTodayStr } from '../utils/dateUtils';

const STORAGE_KEYS = {
  SUBJECTS: 'studyflow_subjects_v1',
  TASKS: 'studyflow_tasks_v1',
  TOPICS: 'studyflow_topics_v1',
  REVISIONS: 'studyflow_revisions_v1',
  SESSIONS: 'studyflow_sessions_v1',
  ACTIVE_TIMER: 'studyflow_active_timer_v1',
  PREFERENCES: 'studyflow_preferences_v1',
  CUSTOM_LISTS: 'studyflow_custom_lists_v1',
  QUICK_NOTES: 'studyflow_quick_notes_v1',
};

export const DEFAULT_SUBJECTS: Subject[] = [];

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  enableDailyTarget: true,
  dailyStudyGoalMinutes: 180, // 3 hours
  enableSound: true,
  enableNotifications: true,
  defaultRevisionPlan: '3x',
};

export const INITIAL_TIMER_STATE: ActiveTimerState = {
  isRunning: false,
  isPaused: false,
  startTimestamp: null,
  accumulatedSeconds: 0,
  subjectId: '',
  topicId: undefined,
  mode: 'stopwatch',
  pomodoroWorkDuration: 25 * 60,
  pomodoroBreakDuration: 5 * 60,
  pomodoroIsBreak: false,
  pomodoroCompletedCount: 0,
};

// Automatic one-time purge of legacy mock data (Computer Science, Mathematics, sample topics)
try {
  const purgeKey = 'studyflow_mock_purged_v3';
  if (typeof window !== 'undefined' && !localStorage.getItem(purgeKey)) {
    localStorage.setItem(purgeKey, 'true');
    const existingSubs = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (existingSubs && (existingSubs.includes('sub-cs') || existingSubs.includes('Computer Science'))) {
      localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
      localStorage.removeItem(STORAGE_KEYS.TOPICS);
      localStorage.removeItem(STORAGE_KEYS.REVISIONS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.QUICK_NOTES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LISTS);
    }
  }
} catch {
  // ignore storage errors
}

function generateInitialData() {
  return {
    subjects: [] as Subject[],
    topics: [] as StudyTopic[],
    revisions: [] as RevisionInstance[],
    tasks: [] as Task[],
    sessions: [] as StudySession[],
    preferences: DEFAULT_PREFERENCES,
    customLists: [] as CustomList[],
    quickNotes: [] as QuickNote[],
  };
}

// Storage operations with fallback and auto-initialization
export const storage = {
  getSubjects(): Subject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (!raw) {
        const init = generateInitialData();
        storage.saveSubjects(init.subjects);
        return init.subjects;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SUBJECTS;
    }
  },

  saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getTopics(): StudyTopic[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (!raw) {
        const init = generateInitialData();
        storage.saveTopics(init.topics);
        return init.topics;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTopics(topics: StudyTopic[]): void {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  },

  getRevisions(): RevisionInstance[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REVISIONS);
      if (!raw) {
        const init = generateInitialData();
        storage.saveRevisions(init.revisions);
        return init.revisions;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRevisions(revisions: RevisionInstance[]): void {
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revisions));
  },

  getTasks(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        const init = generateInitialData();
        storage.saveTasks(init.tasks);
        return init.tasks;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getSessions(): StudySession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) {
        const init = generateInitialData();
        storage.saveSessions(init.sessions);
        return init.sessions;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSessions(sessions: StudySession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getActiveTimer(): ActiveTimerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
      if (!raw) return INITIAL_TIMER_STATE;
      return JSON.parse(raw);
    } catch {
      return INITIAL_TIMER_STATE;
    }
  },

  saveActiveTimer(timer: ActiveTimerState): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(timer));
  },

  getPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!raw) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: UserPreferences): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  getCustomLists(): CustomList[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCustomLists(lists: CustomList[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTS, JSON.stringify(lists));
  },

  getQuickNotes(): QuickNote[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (!raw) {
        const init = generateInitialData();
        storage.saveQuickNotes(init.quickNotes);
        return init.quickNotes;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveQuickNotes(notes: QuickNote[]): void {
    localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(notes));
  },

  resetAllData(): void {
    localStorage.clear();
    const init = generateInitialData();
    storage.saveSubjects(init.subjects);
    storage.saveTopics(init.topics);
    storage.saveRevisions(init.revisions);
    storage.saveTasks(init.tasks);
    storage.saveSessions(init.sessions);
    storage.savePreferences(init.preferences);
    storage.saveActiveTimer(INITIAL_TIMER_STATE);
  },

  exportAllData(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects: storage.getSubjects(),
      topics: storage.getTopics(),
      revisions: storage.getRevisions(),
      tasks: storage.getTasks(),
      sessions: storage.getSessions(),
      customLists: storage.getCustomLists(),
      quickNotes: storage.getQuickNotes(),
      preferences: storage.getPreferences(),
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(rawJson: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(rawJson);
      if (Array.isArray(data.subjects)) storage.saveSubjects(data.subjects);
      if (Array.isArray(data.topics)) storage.saveTopics(data.topics);
      if (Array.isArray(data.revisions)) storage.saveRevisions(data.revisions);
      if (Array.isArray(data.tasks)) storage.saveTasks(data.tasks);
      if (Array.isArray(data.sessions)) storage.saveSessions(data.sessions);
      if (Array.isArray(data.customLists)) storage.saveCustomLists(data.customLists);
      if (Array.isArray(data.quickNotes)) storage.saveQuickNotes(data.quickNotes);
      if (data.preferences && typeof data.preferences === 'object') storage.savePreferences(data.preferences);
      return { success: true, message: 'Data imported successfully!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Invalid JSON format' };
    }
  },
};
