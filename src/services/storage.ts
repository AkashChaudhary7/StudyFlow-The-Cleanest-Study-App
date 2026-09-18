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

// In-memory fallback store for SSR, Node, Vitest, or restricted iframe/private mode environments
const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Fallback on restricted storage
  }
  return memoryStore.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback on restricted storage
  }
  memoryStore.set(key, value);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // Fallback
  }
  memoryStore.delete(key);
}

function clearAllStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  } catch {
    // Fallback
  }
  memoryStore.clear();
}

// Automatic one-time purge of legacy mock data (Computer Science, Mathematics, sample topics)
try {
  const purgeKey = 'studyflow_mock_purged_v3';
  if (!getStorageItem(purgeKey)) {
    setStorageItem(purgeKey, 'true');
    const existingSubs = getStorageItem(STORAGE_KEYS.SUBJECTS);
    if (existingSubs && (existingSubs.includes('sub-cs') || existingSubs.includes('Computer Science'))) {
      removeStorageItem(STORAGE_KEYS.SUBJECTS);
      removeStorageItem(STORAGE_KEYS.TOPICS);
      removeStorageItem(STORAGE_KEYS.REVISIONS);
      removeStorageItem(STORAGE_KEYS.TASKS);
      removeStorageItem(STORAGE_KEYS.SESSIONS);
      removeStorageItem(STORAGE_KEYS.QUICK_NOTES);
      removeStorageItem(STORAGE_KEYS.CUSTOM_LISTS);
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
  clearStorage(): void {
    clearAllStorage();
  },

  getSubjects(): Subject[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.SUBJECTS);
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
    setStorageItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getTopics(): StudyTopic[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.TOPICS);
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
    setStorageItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  },

  getRevisions(): RevisionInstance[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.REVISIONS);
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
    setStorageItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revisions));
  },

  getTasks(): Task[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.TASKS);
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
    setStorageItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getSessions(): StudySession[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.SESSIONS);
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
    setStorageItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getActiveTimer(): ActiveTimerState {
    try {
      const raw = getStorageItem(STORAGE_KEYS.ACTIVE_TIMER);
      if (!raw) return INITIAL_TIMER_STATE;
      return JSON.parse(raw);
    } catch {
      return INITIAL_TIMER_STATE;
    }
  },

  saveActiveTimer(timer: ActiveTimerState): void {
    setStorageItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(timer));
  },

  getPreferences(): UserPreferences {
    try {
      const raw = getStorageItem(STORAGE_KEYS.PREFERENCES);
      if (!raw) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: UserPreferences): void {
    setStorageItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  getCustomLists(): CustomList[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.CUSTOM_LISTS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCustomLists(lists: CustomList[]): void {
    setStorageItem(STORAGE_KEYS.CUSTOM_LISTS, JSON.stringify(lists));
  },

  getQuickNotes(): QuickNote[] {
    try {
      const raw = getStorageItem(STORAGE_KEYS.QUICK_NOTES);
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
    setStorageItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(notes));
  },

  resetAllData(): void {
    clearAllStorage();
    const init = generateInitialData();
    storage.saveSubjects(init.subjects);
    storage.saveTopics(init.topics);
    storage.saveRevisions(init.revisions);
    storage.saveTasks(init.tasks);
    storage.saveSessions(init.sessions);
    storage.savePreferences(init.preferences);
    storage.saveCustomLists(init.customLists);
    storage.saveQuickNotes(init.quickNotes);
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
