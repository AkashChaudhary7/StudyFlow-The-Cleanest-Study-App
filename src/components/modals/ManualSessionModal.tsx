import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayStr } from '../../utils/dateUtils';
import { X, Clock, Calendar, BookOpen } from 'lucide-react';

export const ManualSessionModal: React.FC = () => {
  const { activeModal, closeModal, subjects, topics, addManualSession } = useApp();

  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [topicId, setTopicId] = useState<string>('');
  const [durationMins, setDurationMins] = useState<number>(45);
  const [date, setDate] = useState<string>(getTodayStr());
  const [notes, setNotes] = useState('');

  if (activeModal !== 'manual_session') return null;

  const filteredTopics = topics.filter(t => t.subjectId === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMins <= 0 || !subjectId) return;

    const startTime = `${date}T10:00:00.000Z`;
    const endTime = `${date}T10:${String(durationMins).padStart(2, '0')}:00.000Z`;

    addManualSession({
      subjectId,
      topicId: topicId || undefined,
      startTime,
      endTime,
      durationSeconds: durationMins * 60,
      date,
      mode: 'stopwatch',
      notes: notes.trim() || undefined,
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Log Study Session
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={e => {
                setSubjectId(e.target.value);
                setTopicId('');
              }}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              required
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Study Topic (Optional)
            </label>
            <select
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">General study (No specific topic)</option>
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMins}
                onChange={e => setDurationMins(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="What did you work on?"
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
              Log Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
