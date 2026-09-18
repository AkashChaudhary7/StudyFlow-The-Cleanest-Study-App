import { describe, it, expect } from 'vitest';
import { StudySession, ActiveTimerState } from '../../types';
import { getTodayStr, getDaysAgoStr } from '../../utils/dateUtils';
import { calculateConsistencyScore } from '../../services/consistencyEngine';

describe('Study Session and Timer Flow Integration', () => {
  it('manages timer states and accurately accumulates session duration', () => {
    let timerState: ActiveTimerState = {
      isRunning: false,
      isPaused: false,
      startTimestamp: null,
      accumulatedSeconds: 0,
      subjectId: 'sub-math',
      mode: 'stopwatch',
      pomodoroWorkDuration: 25 * 60,
      pomodoroBreakDuration: 5 * 60,
      pomodoroIsBreak: false,
      pomodoroCompletedCount: 0,
    };

    // 1. Start timer
    const now = Date.now();
    timerState = {
      ...timerState,
      isRunning: true,
      isPaused: false,
      startTimestamp: now - 3600 * 1000, // Simulated 1 hour ago
    };
    expect(timerState.isRunning).toBe(true);

    // 2. Calculate elapsed
    const elapsed = Math.floor((Date.now() - timerState.startTimestamp!) / 1000);
    expect(elapsed).toBeGreaterThanOrEqual(3600);

    // 3. Pause timer
    timerState = {
      ...timerState,
      isRunning: true,
      isPaused: true,
      accumulatedSeconds: elapsed,
      startTimestamp: null,
    };
    expect(timerState.isPaused).toBe(true);
    expect(timerState.accumulatedSeconds).toBeGreaterThanOrEqual(3600);

    // 4. Record session
    const recordedSession: StudySession = {
      id: `sess-${Date.now()}`,
      subjectId: timerState.subjectId,
      startTime: new Date(now - 3600 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: timerState.accumulatedSeconds,
      date: getTodayStr(),
      notes: 'Completed Calculus integration problem sets',
      mode: 'stopwatch',
    };

    expect(recordedSession.durationSeconds).toBeGreaterThanOrEqual(3600);
    expect(recordedSession.date).toBe(getTodayStr());

    // 5. Verify consistency score updates with new session
    const consistency = calculateConsistencyScore([recordedSession], [], {
      theme: 'light',
      enableDailyTarget: true,
      dailyStudyGoalMinutes: 60,
      enableSound: true,
      enableNotifications: true,
      defaultRevisionPlan: '3x',
    });

    expect(consistency.studyDaysCount).toBe(1);
    expect(consistency.targetScore).toBe(100);
  });
});
