import { StudySession, RevisionInstance, UserPreferences, ConsistencyScoreData } from '../types';
import { getTodayStr, addDays, getDaysAgoStr, isPastDate } from '../utils/dateUtils';

/**
 * Calculates a transparent, measurable Consistency Score
 * based on actual user behaviour over the past 28 days.
 * 
 * Weights:
 * - Regular Study (45%)
 * - Spaced Revision On-Time Rate (35%)
 * - Daily Target Completion (20%)
 */
export function calculateConsistencyScore(
  sessions: StudySession[],
  revisions: RevisionInstance[],
  preferences: UserPreferences
): ConsistencyScoreData {
  const today = getTodayStr();
  const evaluationWindowDays = 28;

  // 1. Study Days Calculation (45% weight)
  const dailyStudySecondsMap: Record<string, number> = {};
  sessions.forEach(s => {
    dailyStudySecondsMap[s.date] = (dailyStudySecondsMap[s.date] || 0) + s.durationSeconds;
  });

  let studyDaysCount = 0;
  let targetMetDaysCount = 0;
  let activeStudyDaysCount = 0;

  const targetSeconds = (preferences.dailyStudyGoalMinutes || 120) * 60;

  for (let i = 0; i < evaluationWindowDays; i++) {
    const dateStr = getDaysAgoStr(i);
    const daySecs = dailyStudySecondsMap[dateStr] || 0;

    // A meaningful study day is at least 5 minutes or any recorded session
    if (daySecs >= 300) {
      studyDaysCount++;
      activeStudyDaysCount++;
      if (daySecs >= targetSeconds) {
        targetMetDaysCount++;
      }
    }
  }

  const studyDaysPercent = Math.round((studyDaysCount / evaluationWindowDays) * 100);

  // Target consistency: on days user studied, how often was target reached
  const targetScore =
    activeStudyDaysCount > 0
      ? Math.round((targetMetDaysCount / activeStudyDaysCount) * 100)
      : 80;

  // 2. Revision On-Time Completion Calculation (35% weight)
  const windowStartDate = getDaysAgoStr(evaluationWindowDays);
  const relevantRevisions = revisions.filter(
    r => r.scheduledDate >= windowStartDate && r.scheduledDate <= today
  );

  let onTimeCompletedRevisions = 0;
  let evaluatedRevisions = relevantRevisions.length;

  relevantRevisions.forEach(r => {
    if (r.status === 'completed') {
      if (!r.completedDate || r.completedDate <= r.scheduledDate || r.completedDate <= addDays(r.scheduledDate, 1)) {
        onTimeCompletedRevisions++;
      } else {
        onTimeCompletedRevisions += 0.5;
      }
    } else if (r.status === 'pending') {
      if (!isPastDate(r.scheduledDate)) {
        onTimeCompletedRevisions++;
      }
    }
  });

  const revisionScore =
    evaluatedRevisions > 0
      ? Math.round((onTimeCompletedRevisions / evaluatedRevisions) * 100)
      : 90;

  // 3. Overall Weighted Score
  const rawScore =
    studyDaysPercent * 0.45 + revisionScore * 0.35 + targetScore * 0.20;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Label & Feedback Tip
  let label = 'Building Momentum';
  let feedback = 'Keep up regular daily sessions to solidify long-term memory retention.';

  if (overallScore >= 90) {
    label = 'Excellent';
    feedback = 'Outstanding discipline! Spaced revisions and daily goals are on track.';
  } else if (overallScore >= 75) {
    label = 'High Discipline';
    feedback = 'Great study consistency. Complete pending revisions on time to hit 90%+.';
  } else if (overallScore >= 60) {
    label = 'Good Progress';
    feedback = 'Solid rhythm. Aim for consistent 30+ min study sessions daily.';
  }

  const summaryText = `Studied on ${studyDaysCount} of the last ${evaluationWindowDays} days.`;

  return {
    score: overallScore,
    overallScore,
    label,
    feedback,
    studyDaysCount,
    activeDaysCount: studyDaysCount,
    totalDaysEvaluated: evaluationWindowDays,
    studyDaysPercent,
    revisionScore,
    onTimeRevisionRate: revisionScore,
    targetScore,
    targetHitRate: targetScore,
    summaryText,
  };
}
