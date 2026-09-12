import { RevisionInstance, RevisionPlanType, StudyTopic, TopicStatus } from '../types';
import { addDays, getTodayStr, isPastDate } from '../utils/dateUtils';

// Standard spaced repetition intervals
export const DEFAULT_INTERVALS: Record<number, number> = {
  1: 1,  // Day +1
  2: 3,  // Day +3
  3: 7,  // Day +7
  4: 14, // Day +14
  5: 30, // Day +30
};

export function getIntervalForRevision(
  revisionNumber: number,
  customIntervals?: number[]
): number {
  if (customIntervals && customIntervals[revisionNumber - 1] !== undefined) {
    return customIntervals[revisionNumber - 1];
  }
  return DEFAULT_INTERVALS[revisionNumber] || (revisionNumber * 7);
}

export function getTotalRevisionsForPlan(
  plan: RevisionPlanType,
  customIntervals?: number[]
): number {
  switch (plan) {
    case 'none':
      return 0;
    case '2x':
      return 2;
    case '3x':
      return 3;
    case '4x':
      return 4;
    case '5x':
      return 5;
    case 'custom':
      return customIntervals?.length || 3;
    default:
      return 3;
  }
}

/**
 * Generate the next RevisionInstance for a study topic
 */
export function createNextRevisionInstance(
  topic: StudyTopic,
  baseDate: string = getTodayStr()
): RevisionInstance | null {
  const nextRevNumber = topic.currentRevision + 1;
  if (nextRevNumber > topic.totalRevisions) {
    return null; // Completed all revisions
  }

  const intervalDays = getIntervalForRevision(nextRevNumber, topic.customIntervalDays);
  const scheduledDate = addDays(baseDate, intervalDays);

  return {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    topicId: topic.id,
    subjectId: topic.subjectId,
    revisionNumber: nextRevNumber,
    scheduledDate,
    status: 'pending',
  };
}

/**
 * Update topic status string from currentRevision and totalRevisions
 */
export function getStatusFromRevisionCount(
  currentRevision: number,
  totalRevisions: number
): TopicStatus {
  if (totalRevisions === 0) return 'completed';
  if (currentRevision >= totalRevisions) return 'completed';
  if (currentRevision === 0) return 'studied';
  if (currentRevision === 1) return '1x';
  if (currentRevision === 2) return '2x';
  if (currentRevision === 3) return '3x';
  if (currentRevision === 4) return '4x';
  if (currentRevision === 5) return '5x';
  return 'studied';
}

/**
 * Check if a revision instance is overdue
 */
export function isRevisionOverdue(rev: RevisionInstance): boolean {
  if (rev.status === 'completed' || rev.status === 'skipped') return false;
  return isPastDate(rev.scheduledDate);
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

/**
 * Detects if the current day has a heavy revision load (> 3 revisions or > 90 mins estimated)
 */
export function detectRevisionOverload(
  revisions: RevisionInstance[],
  topics: StudyTopic[],
  dateStr: string = getTodayStr()
): RevisionLoadInfo {
  const activeRevs = revisions.filter(
    r => r.status === 'pending' && (r.scheduledDate === dateStr || isPastDate(r.scheduledDate))
  );

  const overdue = activeRevs.filter(r => isPastDate(r.scheduledDate));
  const dueTodayOnly = activeRevs.filter(r => r.scheduledDate === dateStr);

  let totalEstimatedMins = 0;
  activeRevs.forEach(rev => {
    const topic = topics.find(t => t.id === rev.topicId);
    // Estimated revision time is ~25-35% of original topic study time (default 20 mins)
    const revEst = topic?.estimatedMinutes ? Math.round(topic.estimatedMinutes * 0.35) : 20;
    totalEstimatedMins += Math.max(15, revEst);
  });

  const isOverloaded = activeRevs.length >= 4 || totalEstimatedMins >= 90;

  return {
    isOverloaded,
    totalDueTodayCount: activeRevs.length,
    totalRevisionsToday: activeRevs.length,
    overdueCount: overdue.length,
    dueTodayOnlyCount: dueTodayOnly.length,
    estimatedMinutes: totalEstimatedMins,
    estimatedMinutesToday: totalEstimatedMins,
  };
}

/**
 * Intelligently spreads today's pending revisions across 3 days.
 * CRITICAL RULE: Overdue revisions REMAIN scheduled for today (never pushed into future arbitrarily).
 * Only non-overdue items for today are balanced across Day +0, Day +1, and Day +2.
 */
export function spreadRevisionsOver3Days(
  revisions: RevisionInstance[],
  todayStr: string = getTodayStr()
): RevisionInstance[] {
  const day1 = todayStr;
  const day2 = addDays(todayStr, 1);
  const day3 = addDays(todayStr, 2);

  // Separate overdue items from today's regular items
  const todayRegularPending = revisions.filter(
    r => r.status === 'pending' && r.scheduledDate === todayStr
  );

  if (todayRegularPending.length <= 1) {
    return revisions;
  }

  // We assign a third of today's regular items to day1, a third to day2, a third to day3
  const updatedMap = new Map<string, string>(); // revId -> newDate

  todayRegularPending.forEach((rev, index) => {
    const targetDayIndex = index % 3;
    let targetDate = day1;
    if (targetDayIndex === 1) targetDate = day2;
    if (targetDayIndex === 2) targetDate = day3;

    if (targetDate !== rev.scheduledDate) {
      updatedMap.set(rev.id, targetDate);
    }
  });

  return revisions.map(r => {
    if (updatedMap.has(r.id)) {
      const newDate = updatedMap.get(r.id)!;
      return {
        ...r,
        scheduledDate: newDate,
        rescheduledFrom: r.rescheduledFrom || r.scheduledDate,
      };
    }
    return r;
  });
}

