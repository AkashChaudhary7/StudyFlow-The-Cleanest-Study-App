import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayStr, addDays, formatFriendlyDate } from '../../utils/dateUtils';
import { X, Calendar, Clock } from 'lucide-react';

export const RescheduleModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedRevisionId,
    revisions,
    topics,
    subjects,
    rescheduleRevision,
  } = useApp();

  const [customDate, setCustomDate] = useState<string>(getTodayStr());

  if (activeModal !== 'reschedule' || !selectedRevisionId) return null;

  const rev = revisions.find(r => r.id === selectedRevisionId);
  if (!rev) return null;

  const topic = topics.find(t => t.id === rev.topicId);
  const subject = subjects.find(s => s.id === rev.subjectId);

  const today = getTodayStr();
  const tomorrow = addDays(today, 1);
  const in3Days = addDays(today, 3);
  const nextWeek = addDays(today, 7);
  const in2Weeks = addDays(today, 14);

  const handleApplyReschedule = (newDate: string) => {
    rescheduleRevision(rev.id, newDate);
    closeModal();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;
    handleApplyReschedule(customDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Reschedule Revision
            </h2>
            <p className="text-xs text-zinc-500 truncate max-w-[200px]">
              {topic?.title || 'Study Topic'}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-medium text-zinc-500 mb-1">
            Current due: {formatFriendlyDate(rev.scheduledDate)}
          </div>

          <button
            onClick={() => handleApplyReschedule(tomorrow)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left transition"
          >
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Tomorrow
            </span>
            <span className="text-xs text-zinc-500">
              {formatFriendlyDate(tomorrow)} (+1d)
            </span>
          </button>

          <button
            onClick={() => handleApplyReschedule(in3Days)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left transition"
          >
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              In 3 days
            </span>
            <span className="text-xs text-zinc-500">
              {formatFriendlyDate(in3Days)} (+3d)
            </span>
          </button>

          <button
            onClick={() => handleApplyReschedule(nextWeek)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left transition"
          >
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Next week
            </span>
            <span className="text-xs text-zinc-500">
              {formatFriendlyDate(nextWeek)} (+7d)
            </span>
          </button>

          <button
            onClick={() => handleApplyReschedule(in2Weeks)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left transition"
          >
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              In 2 weeks
            </span>
            <span className="text-xs text-zinc-500">
              {formatFriendlyDate(in2Weeks)} (+14d)
            </span>
          </button>

          {/* Custom Date Form */}
          <form onSubmit={handleCustomSubmit} className="pt-2">
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Custom Date
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
