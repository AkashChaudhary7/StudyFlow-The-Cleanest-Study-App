import { describe, it, expect, beforeEach } from 'vitest';
import { storage, DEFAULT_PREFERENCES, INITIAL_TIMER_STATE } from '../../services/storage';
import { Subject, StudyTopic, Task, RevisionInstance, StudySession } from '../../types';
import { getTodayStr, addDays } from '../../utils/dateUtils';
import { createNextRevisionInstance, getStatusFromRevisionCount } from '../../services/revisionEngine';

describe('System Integrity & Data Consistency', () => {
  beforeEach(() => {
    storage.clearStorage();
  });

  it('maintains relational consistency across subjects, topics, revisions, and tasks', () => {
    const today = getTodayStr();

    // Setup Subject
    const subject: Subject = {
      id: 'sub-neuro',
      name: 'Neuroscience',
      color: '#8B5CF6',
      createdAt: today,
    };
    storage.saveSubjects([subject]);

    // Setup Topic belonging to Subject
    const topic: StudyTopic = {
      id: 'topic-synapse',
      subjectId: subject.id,
      title: 'Synaptic Plasticity & LTP',
      createdAt: today,
      studiedAt: today,
      currentRevision: 0,
      totalRevisions: 3,
      revisionPlan: '3x',
      status: 'studied',
      totalStudySeconds: 0,
    };
    storage.saveTopics([topic]);

    // Setup Task linked to Subject & Topic
    const task: Task = {
      id: 'task-draw-diagram',
      subjectId: subject.id,
      topicId: topic.id,
      title: 'Draw LTP receptor diagram',
      completed: false,
      createdAt: today,
      dueDate: today,
      priority: 'high',
      subtasks: [],
    };
    storage.saveTasks([task]);

    // Generate revision for the topic
    const revision = createNextRevisionInstance(topic, today);
    expect(revision).not.toBeNull();
    storage.saveRevisions([revision!]);

    // Verify all saved entities
    expect(storage.getSubjects()).toHaveLength(1);
    expect(storage.getTopics()).toHaveLength(1);
    expect(storage.getTasks()).toHaveLength(1);
    expect(storage.getRevisions()).toHaveLength(1);

    // Complete first revision
    const completedRevision: RevisionInstance = {
      ...revision!,
      status: 'completed',
      completedDate: today,
    };
    storage.saveRevisions([completedRevision]);

    // Advance topic revision count
    const updatedTopic: StudyTopic = {
      ...topic,
      currentRevision: 1,
      status: getStatusFromRevisionCount(1, 3),
    };
    storage.saveTopics([updatedTopic]);

    expect(storage.getTopics()[0].status).toBe('1x');
    expect(storage.getRevisions()[0].status).toBe('completed');

    // Export and verify backup payload contains everything
    const backupJson = storage.exportAllData();
    const parsed = JSON.parse(backupJson);
    expect(parsed.subjects[0].id).toBe('sub-neuro');
    expect(parsed.topics[0].id).toBe('topic-synapse');
    expect(parsed.tasks[0].id).toBe('task-draw-diagram');
    expect(parsed.revisions[0].status).toBe('completed');
  });

  it('validates default preference fallbacks', () => {
    const prefs = storage.getPreferences();
    expect(prefs.theme).toBe('light');
    expect(prefs.dailyStudyGoalMinutes).toBe(180);
    expect(prefs.defaultRevisionPlan).toBe('3x');
  });
});
