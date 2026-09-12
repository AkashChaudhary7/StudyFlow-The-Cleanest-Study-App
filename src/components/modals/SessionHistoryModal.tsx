import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDuration,
  formatFriendlyDate,
  formatTimeRange,
  getTodayStr,
  addDays,
} from '../../utils/dateUtils';
import { X, Clock, Calendar, BookOpen, Trash2, Filter, ChevronRight } from 'lucide-react';

export const SessionHistoryModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    sessions,
    topics,
    subjects,
    deleteSession,
    setSelectedTopicId,
    openModal,
  } = useApp();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filtered and chronologically grouped sessions
  const groupedSessions = useMemo(() => {
    const filtered = sessions
      .filter(s => selectedSubjectFilter === 'all' || s.subjectId === selectedSubjectFilter)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const groups: { date: string; label: string; sessions: typeof sessions; totalSecs: number }[] = [];
    const dateMap = new Map<string, typeof sessions>();

    filtered.forEach(s => {
      const currentList = dateMap.get(s.date) || [];
      currentList.push(s);
      dateMap.set(s.date, currentList);
    });

    dateMap.forEach((sessionList, dateStr) => {
      const totalSecs = sessionList.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      groups.push({
        date: dateStr,
        label: formatFriendlyDate(dateStr),
        sessions: sessionList,
        totalSecs,
      });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, selectedSubjectFilter]);

  const allTotalSeconds = useMemo(() => {
    return sessions
      .filter(s => selectedSubjectFilter === 'all' || s.subjectId === selectedSubjectFilter)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [sessions, selectedSubjectFilter]);

  if (activeModal !== 'session_history') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal} />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Study Session History
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {sessions.length} total logged sessions ({formatDuration(allTotalSeconds)})
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 py-3 overflow-x-auto no-scrollbar shrink-0 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedSubjectFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            All Subjects
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectFilter(s.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedSubjectFilter === s.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Sessions Chronological List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-6 pr-1">
          {groupedSessions.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs">
              No study sessions logged yet.
            </div>
          ) : (
            groupedSessions.map(group => (
              <div key={group.date} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                  <span>{group.label}</span>
                  <span className="text-[11px] font-mono lowercase tracking-normal text-zinc-400">
                    {formatDuration(group.totalSecs, true)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.sessions.map(sess => {
                    const sub = subjects.find(s => s.id === sess.subjectId);
                    const top = topics.find(t => t.id === sess.topicId);

                    return (
                      <div
                        key={sess.id}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.color || '#3B82F6' }}
                            />
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                              {sub?.name || 'General'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-300 capitalize">
                              {sess.mode}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                              {top ? (
                                <button
                                  onClick={() => {
                                    setSelectedTopicId(top.id);
                                    openModal('topic_detail');
                                  }}
                                  className="hover:underline text-left"
                                >
                                  {top.title}
                                </button>
                              ) : (
                                <span>Self-directed study</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-0.5 flex items-center space-x-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                            <span>{formatTimeRange(sess.startTime, sess.endTime)}</span>
                            {sess.notes && (
                              <span className="truncate italic">"{sess.notes}"</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4 shrink-0">
                          <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                            {formatDuration(sess.durationSeconds, true)}
                          </span>

                          <button
                            onClick={() => deleteSession(sess.id)}
                            title="Delete session"
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
