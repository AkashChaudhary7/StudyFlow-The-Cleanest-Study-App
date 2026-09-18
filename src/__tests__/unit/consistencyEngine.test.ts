import { describe, it, expect } from 'vitest';
import { calculateConsistencyScore } from '../../services/consistencyEngine';
import { StudySession, RevisionInstance, UserPreferences } from '../../types';
import { getTodayStr, getDaysAgoStr, addDays } from '../../utils/dateUtils';

describe('consistencyEngine', () => {
  const defaultPrefs: UserPreferences = {
    theme: 'light',
    enableDailyTarget: true,
    dailyStudyGoalMinutes: 120, // 2 hours
    enableSound: true,
    enableNotifications: true,
    defaultRevisionPlan: '3x',
  };

  it('calculates score for new user with zero sessions', () => {
    const scoreData = calculateConsistencyScore([], [], defaultPrefs);

    expect(scoreData.score).toBeGreaterThanOrEqual(0);
    expect(scoreData.score).toBeLessThanOrEqual(100);
    expect(scoreData.studyDaysCount).toBe(0);
    expect(scoreData.totalDaysEvaluated).toBe(28);
    expect(scoreData.label).toBeDefined();
    expect(scoreData.feedback).toBeDefined();
  });

  it('awards high score to highly consistent user who studies daily and completes revisions', () => {
    const sessions: StudySession[] = [];
    const today = getTodayStr();

    // Create 28 days of 2-hour study sessions
    for (let i = 0; i < 28; i++) {
      sessions.push({
        id: `sess-${i}`,
        subjectId: 'sub-1',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: 120 * 60, // Met target
        date: getDaysAgoStr(i),
        mode: 'stopwatch',
      });
    }

    // Revisions completed on time
    const revisions: RevisionInstance[] = [
      {
        id: 'rev-1',
        subjectId: 'sub-1',
        topicId: 't-1',
        revisionNumber: 1,
        scheduledDate: getDaysAgoStr(5),
        completedDate: getDaysAgoStr(5),
        status: 'completed',
      },
      {
        id: 'rev-2',
        subjectId: 'sub-1',
        topicId: 't-1',
        revisionNumber: 2,
        scheduledDate: getDaysAgoStr(2),
        completedDate: getDaysAgoStr(2),
        status: 'completed',
      },
    ];

    const scoreData = calculateConsistencyScore(sessions, revisions, defaultPrefs);

    expect(scoreData.score).toBeGreaterThanOrEqual(95);
    expect(scoreData.studyDaysPercent).toBe(100);
    expect(scoreData.label).toBe('Excellent');
    expect(scoreData.studyDaysCount).toBe(28);
  });

  it('penalizes overdue uncompleted revisions', () => {
    const sessions: StudySession[] = [
      {
        id: 'sess-1',
        subjectId: 'sub-1',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: 120 * 60,
        date: getTodayStr(),
        mode: 'stopwatch',
      },
    ];

    // Overdue revisions that were never completed
    const overdueRevisions: RevisionInstance[] = [
      {
        id: 'rev-1',
        subjectId: 'sub-1',
        topicId: 't-1',
        revisionNumber: 1,
        scheduledDate: getDaysAgoStr(10),
        status: 'pending',
      },
      {
        id: 'rev-2',
        subjectId: 'sub-1',
        topicId: 't-1',
        revisionNumber: 2,
        scheduledDate: getDaysAgoStr(8),
        status: 'pending',
      },
    ];

    const scoreData = calculateConsistencyScore(sessions, overdueRevisions, defaultPrefs);
    expect(scoreData.revisionScore).toBe(0);
    expect(scoreData.score).toBeLessThan(50);
  });
});
