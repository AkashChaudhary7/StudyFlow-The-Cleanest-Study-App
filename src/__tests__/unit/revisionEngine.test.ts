import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INTERVALS,
  getIntervalForRevision,
  getTotalRevisionsForPlan,
  createNextRevisionInstance,
  getStatusFromRevisionCount,
  isRevisionOverdue,
  detectRevisionOverload,
  spreadRevisionsOver3Days,
} from '../../services/revisionEngine';
import { RevisionInstance, StudyTopic } from '../../types';
import { addDays, getTodayStr } from '../../utils/dateUtils';

describe('revisionEngine', () => {
  describe('getIntervalForRevision', () => {
    it('returns default spaced intervals (1, 3, 7, 14, 30)', () => {
      expect(getIntervalForRevision(1)).toBe(1);
      expect(getIntervalForRevision(2)).toBe(3);
      expect(getIntervalForRevision(3)).toBe(7);
      expect(getIntervalForRevision(4)).toBe(14);
      expect(getIntervalForRevision(5)).toBe(30);
    });

    it('uses custom intervals when provided', () => {
      const custom = [2, 5, 10, 20];
      expect(getIntervalForRevision(1, custom)).toBe(2);
      expect(getIntervalForRevision(2, custom)).toBe(5);
      expect(getIntervalForRevision(3, custom)).toBe(10);
      expect(getIntervalForRevision(4, custom)).toBe(20);
    });

    it('falls back to multiplying by 7 if revNumber exceeds standard range', () => {
      expect(getIntervalForRevision(6)).toBe(42);
    });
  });

  describe('getTotalRevisionsForPlan', () => {
    it('correctly maps plan types to revision counts', () => {
      expect(getTotalRevisionsForPlan('none')).toBe(0);
      expect(getTotalRevisionsForPlan('2x')).toBe(2);
      expect(getTotalRevisionsForPlan('3x')).toBe(3);
      expect(getTotalRevisionsForPlan('4x')).toBe(4);
      expect(getTotalRevisionsForPlan('5x')).toBe(5);
      expect(getTotalRevisionsForPlan('custom', [1, 3])).toBe(2);
    });
  });

  describe('createNextRevisionInstance', () => {
    const mockTopic: StudyTopic = {
      id: 'topic-1',
      subjectId: 'sub-1',
      title: 'Thermodynamics',
      createdAt: '2025-01-01',
      studiedAt: '2025-01-01',
      currentRevision: 0,
      totalRevisions: 3,
      revisionPlan: '3x',
      status: 'studied',
      totalStudySeconds: 0,
    };

    it('generates the first revision scheduled on baseDate + interval', () => {
      const today = getTodayStr();
      const rev = createNextRevisionInstance(mockTopic, today);

      expect(rev).not.toBeNull();
      expect(rev?.revisionNumber).toBe(1);
      expect(rev?.scheduledDate).toBe(addDays(today, 1));
      expect(rev?.topicId).toBe('topic-1');
      expect(rev?.status).toBe('pending');
    });

    it('returns null if all revisions are completed', () => {
      const completedTopic: StudyTopic = {
        ...mockTopic,
        currentRevision: 3,
        totalRevisions: 3,
      };
      const rev = createNextRevisionInstance(completedTopic);
      expect(rev).toBeNull();
    });
  });

  describe('getStatusFromRevisionCount', () => {
    it('returns proper topic status', () => {
      expect(getStatusFromRevisionCount(0, 3)).toBe('studied');
      expect(getStatusFromRevisionCount(1, 3)).toBe('1x');
      expect(getStatusFromRevisionCount(2, 3)).toBe('2x');
      expect(getStatusFromRevisionCount(3, 3)).toBe('completed');
      expect(getStatusFromRevisionCount(4, 3)).toBe('completed');
      expect(getStatusFromRevisionCount(0, 0)).toBe('completed');
    });
  });

  describe('isRevisionOverdue', () => {
    it('identifies overdue revisions correctly', () => {
      const today = getTodayStr();
      const overdueRev: RevisionInstance = {
        id: 'rev-1',
        subjectId: 'top-1',
        topicId: 'top-1',
        revisionNumber: 1,
        scheduledDate: addDays(today, -2),
        status: 'pending',
      };
      const futureRev: RevisionInstance = {
        id: 'rev-2',
        subjectId: 'top-1',
        topicId: 'top-1',
        revisionNumber: 1,
        scheduledDate: addDays(today, 2),
        status: 'pending',
      };
      const completedPastRev: RevisionInstance = {
        id: 'rev-3',
        subjectId: 'top-1',
        topicId: 'top-1',
        revisionNumber: 1,
        scheduledDate: addDays(today, -2),
        status: 'completed',
      };

      expect(isRevisionOverdue(overdueRev)).toBe(true);
      expect(isRevisionOverdue(futureRev)).toBe(false);
      expect(isRevisionOverdue(completedPastRev)).toBe(false);
    });
  });

  describe('detectRevisionOverload & spreadRevisionsOver3Days', () => {
    const today = getTodayStr();
    const topics: StudyTopic[] = [
      { id: 'top-1', subjectId: 's1', title: 'A', createdAt: today, currentRevision: 0, totalRevisions: 3, revisionPlan: '3x', status: 'studied', estimatedMinutes: 60, totalStudySeconds: 0 },
      { id: 'top-2', subjectId: 's1', title: 'B', createdAt: today, currentRevision: 0, totalRevisions: 3, revisionPlan: '3x', status: 'studied', estimatedMinutes: 60, totalStudySeconds: 0 },
      { id: 'top-3', subjectId: 's1', title: 'C', createdAt: today, currentRevision: 0, totalRevisions: 3, revisionPlan: '3x', status: 'studied', estimatedMinutes: 60, totalStudySeconds: 0 },
      { id: 'top-4', subjectId: 's1', title: 'D', createdAt: today, currentRevision: 0, totalRevisions: 3, revisionPlan: '3x', status: 'studied', estimatedMinutes: 60, totalStudySeconds: 0 },
    ];

    it('detects overload when >= 4 active revisions are due', () => {
      const revisions: RevisionInstance[] = [
        { id: 'r1', subjectId: 's1', topicId: 'top-1', revisionNumber: 1, scheduledDate: today, status: 'pending' },
        { id: 'r2', subjectId: 's1', topicId: 'top-2', revisionNumber: 1, scheduledDate: today, status: 'pending' },
        { id: 'r3', subjectId: 's1', topicId: 'top-3', revisionNumber: 1, scheduledDate: today, status: 'pending' },
        { id: 'r4', subjectId: 's1', topicId: 'top-4', revisionNumber: 1, scheduledDate: today, status: 'pending' },
      ];

      const load = detectRevisionOverload(revisions, topics, today);
      expect(load.isOverloaded).toBe(true);
      expect(load.totalDueTodayCount).toBe(4);
    });

    it('spreads revisions across 3 days, keeping overdue items on today', () => {
      const overdueDate = addDays(today, -2);
      const revisions: RevisionInstance[] = [
        { id: 'r-overdue', subjectId: 's1', topicId: 'top-1', revisionNumber: 1, scheduledDate: overdueDate, status: 'pending' },
        { id: 'r1', subjectId: 's1', topicId: 'top-2', revisionNumber: 1, scheduledDate: today, status: 'pending' },
        { id: 'r2', subjectId: 's1', topicId: 'top-3', revisionNumber: 1, scheduledDate: today, status: 'pending' },
        { id: 'r3', subjectId: 's1', topicId: 'top-4', revisionNumber: 1, scheduledDate: today, status: 'pending' },
      ];

      const rebalanced = spreadRevisionsOver3Days(revisions, today);

      // Overdue item MUST NOT be moved to the future
      const overdueItem = rebalanced.find(r => r.id === 'r-overdue');
      expect(overdueItem?.scheduledDate).toBe(overdueDate);

      // Today's regular items should be spread
      const r1 = rebalanced.find(r => r.id === 'r1');
      const r2 = rebalanced.find(r => r.id === 'r2');
      const r3 = rebalanced.find(r => r.id === 'r3');

      expect(r1?.scheduledDate).toBe(today);
      expect(r2?.scheduledDate).toBe(addDays(today, 1));
      expect(r3?.scheduledDate).toBe(addDays(today, 2));
    });
  });
});
