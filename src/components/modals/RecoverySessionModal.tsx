import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDuration, formatDigitalTime } from '../../utils/dateUtils';
import { Play, Square, Trash2, Clock, AlertCircle } from 'lucide-react';

export const RecoverySessionModal: React.FC = () => {
  const {
    activeModal,
    recoverySessionInfo,
    continueRecoverySession,
    endRecoverySession,
    discardRecoverySession,
    elapsedTimerSeconds,
    timerState,
    subjects,
    topics,
  } = useApp();

  const [notes, setNotes] = useState('');

  if (activeModal !== 'recovery' || !recoverySessionInfo) return null;

  const topic = topics.find(t => t.id === timerState.topicId);
  const subject = subjects.find(s => s.id === timerState.subjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 text-center">
        {/* Pulsing indicator */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Study Session in Progress
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          An ongoing study session was detected
        </p>

        {/* Topic & Subject Card */}
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left">
          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: subject?.color || '#3B82F6' }}
            />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {subject?.name || 'Study Session'}
            </span>
          </div>

          <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {topic?.title || 'General Focus Session'}
          </div>

          <div className="mt-2 flex items-baseline justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Elapsed Time</span>
            <span className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
              {formatDuration(elapsedTimerSeconds || recoverySessionInfo.elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Optional quick notes on session end */}
        <div className="mt-3 text-left">
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add brief session notes (optional)..."
            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={continueRecoverySession}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Continue Session</span>
          </button>

          <button
            type="button"
            onClick={() => endRecoverySession(notes.trim() || undefined)}
            className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End & Save Session</span>
          </button>

          <button
            type="button"
            onClick={discardRecoverySession}
            className="w-full py-2 px-4 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition flex items-center justify-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
