import { describe, it, expect, beforeEach } from 'vitest';
import { storage, DEFAULT_PREFERENCES, INITIAL_TIMER_STATE } from '../../services/storage';
import { Subject, Task, StudyTopic } from '../../types';

describe('storage', () => {
  beforeEach(() => {
    storage.clearStorage();
  });

  it('saves and retrieves subjects correctly', () => {
    const mockSubjects: Subject[] = [
      { id: 'sub-1', name: 'Physics', color: '#3B82F6', createdAt: '2025-01-01' },
    ];
    storage.saveSubjects(mockSubjects);
    const retrieved = storage.getSubjects();
    expect(retrieved).toEqual(mockSubjects);
  });

  it('saves and retrieves tasks correctly', () => {
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Complete problem set',
        completed: false,
        createdAt: '2025-01-01',
        priority: 'high',
        subtasks: [],
      },
    ];
    storage.saveTasks(mockTasks);
    const retrieved = storage.getTasks();
    expect(retrieved).toEqual(mockTasks);
  });

  it('handles corrupted JSON gracefully with default fallback', () => {
    storage.importAllData('INVALID_JSON{{{');
    const subjects = storage.getSubjects();
    expect(Array.isArray(subjects)).toBe(true);

    const prefs = storage.getPreferences();
    expect(prefs).toBeDefined();
  });

  it('exports and imports backup data correctly', () => {
    const mockSubjects: Subject[] = [
      { id: 'sub-test', name: 'Chemistry', color: '#10B981', createdAt: '2025-01-01' },
    ];
    const mockTasks: Task[] = [
      { id: 't-1', title: 'Lab report', completed: true, createdAt: '2025-01-01', priority: 'medium', subtasks: [] },
    ];
    storage.saveSubjects(mockSubjects);
    storage.saveTasks(mockTasks);

    const exported = storage.exportAllData();
    expect(typeof exported).toBe('string');
    expect(exported).toContain('Chemistry');
    expect(exported).toContain('Lab report');

    // Wipe storage
    storage.clearStorage();

    // Import
    const importResult = storage.importAllData(exported);
    expect(importResult.success).toBe(true);

    expect(storage.getSubjects()).toEqual(mockSubjects);
    expect(storage.getTasks()).toEqual(mockTasks);
  });

  it('rejects invalid JSON import gracefully', () => {
    const result = storage.importAllData('{bad json');
    expect(result.success).toBe(false);
  });

  it('resets all data cleanly without throwing', () => {
    storage.resetAllData();
    expect(storage.getSubjects()).toEqual([]);
    expect(storage.getTasks()).toEqual([]);
    expect(storage.getTopics()).toEqual([]);
    expect(storage.getRevisions()).toEqual([]);
    expect(storage.getSessions()).toEqual([]);
    expect(storage.getCustomLists()).toEqual([]);
    expect(storage.getQuickNotes()).toEqual([]);
  });
});
