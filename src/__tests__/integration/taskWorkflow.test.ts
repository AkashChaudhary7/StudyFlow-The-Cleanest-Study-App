import { describe, it, expect } from 'vitest';
import { Task, StudyTopic, Subtask } from '../../types';
import { createNextRevisionInstance } from '../../services/revisionEngine';
import { addDays, getTodayStr } from '../../utils/dateUtils';

describe('Task and Subtask Workflow Integration', () => {
  it('executes full task lifecycle from creation to subtasks and completion', () => {
    const today = getTodayStr();

    // 1. Task Creation
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Master Quantum Harmonic Oscillator',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: today,
      priority: 'high',
      revisionPlan: '3x',
      subtasks: [],
      completedRevisions: [],
    };

    expect(newTask.id).toBeDefined();
    expect(newTask.completed).toBe(false);
    expect(newTask.priority).toBe('high');

    // 2. Adding Subtasks
    const subtask1: Subtask = {
      id: 'sub-1',
      title: 'Derive wave equations',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const subtask2: Subtask = {
      id: 'sub-2',
      title: 'Solve energy eigenstates',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    let updatedTask: Task = {
      ...newTask,
      subtasks: [subtask1, subtask2],
    };

    expect(updatedTask.subtasks?.length).toBe(2);

    // 3. Progress Tracking
    let completedCount = updatedTask.subtasks!.filter(s => s.completed).length;
    let progressPercent = Math.round((completedCount / updatedTask.subtasks!.length) * 100);
    expect(progressPercent).toBe(0);

    // Toggle subtask 1
    updatedTask = {
      ...updatedTask,
      subtasks: updatedTask.subtasks!.map(s => (s.id === 'sub-1' ? { ...s, completed: true } : s)),
    };
    completedCount = updatedTask.subtasks!.filter(s => s.completed).length;
    progressPercent = Math.round((completedCount / updatedTask.subtasks!.length) * 100);
    expect(progressPercent).toBe(50);

    // Toggle subtask 2
    updatedTask = {
      ...updatedTask,
      subtasks: updatedTask.subtasks!.map(s => (s.id === 'sub-2' ? { ...s, completed: true } : s)),
      completed: true,
    };
    completedCount = updatedTask.subtasks!.filter(s => s.completed).length;
    progressPercent = Math.round((completedCount / updatedTask.subtasks!.length) * 100);
    expect(progressPercent).toBe(100);
    expect(updatedTask.completed).toBe(true);

    // 4. Conversion to StudyTopic
    const convertedTopic: StudyTopic = {
      id: `topic-${Date.now()}`,
      subjectId: 'sub-physics',
      title: updatedTask.title,
      description: updatedTask.notes,
      estimatedMinutes: 45,
      createdAt: today,
      studiedAt: today,
      currentRevision: 0,
      totalRevisions: 3,
      revisionPlan: '3x',
      status: 'studied',
      totalStudySeconds: 0,
    };

    expect(convertedTopic.title).toBe('Master Quantum Harmonic Oscillator');
    expect(convertedTopic.currentRevision).toBe(0);
    expect(convertedTopic.totalRevisions).toBe(3);

    // 5. Next revision scheduled
    const firstRevision = createNextRevisionInstance(convertedTopic, today);
    expect(firstRevision).not.toBeNull();
    expect(firstRevision?.revisionNumber).toBe(1);
    expect(firstRevision?.scheduledDate).toBe(addDays(today, 1));
  });
});
