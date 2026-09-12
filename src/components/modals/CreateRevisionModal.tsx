import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayStr, addDays } from '../../utils/dateUtils';
import { X, RotateCw, Calendar } from 'lucide-react';
import { RevisionInstance } from '../../types';

export const CreateRevisionModal: React.FC = () => {
  const { activeModal, closeModal, topics, subjects, addRevisionInstance, openModal } = useApp();

  const [topicId, setTopicId] = useState<string>(topics[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState<string>(getTodayStr());
  const [notes, setNotes] = useState('');

  if (activeModal !== 'create_revision') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return;

    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    addRevisionInstance({
      topicId: topic.id,
      subjectId: topic.subjectId,
      revisionNumber: (topic.currentRevision || 0) + 1,
      scheduledDate,
      status: 'pending',
      notes: notes.trim() || undefined,
    });

    closeModal();
  };

  const today = getTodayStr();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCw className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Schedule Revision
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-zinc-500 mb-3">
              No study topics exist yet. Create a study topic first to schedule revisions.
            </p>
            <button
              type="button"
              onClick={() => openModal('create_topic')}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold"
            >
              + Create Topic
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Select Study Topic
              </label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              >
                {topics.map(t => {
                  const sub = subjects.find(s => s.id === t.subjectId);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.title} ({sub?.name || 'Subject'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Revision Date
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setScheduledDate(today)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    scheduledDate === today
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledDate(addDays(today, 1))}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    scheduledDate === addDays(today, 1)
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledDate(addDays(today, 3))}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    scheduledDate === addDays(today, 3)
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  In 3 days
                </button>
              </div>

              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-medium pl-8 pr-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Revision Notes / Goals (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Practice hard problems, review formulas..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-sm"
              >
                Schedule Revision
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
