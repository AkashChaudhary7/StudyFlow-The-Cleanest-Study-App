import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, CheckSquare, BookOpen, RotateCw, ChevronRight } from 'lucide-react';
import { formatFriendlyDate } from '../../utils/dateUtils';

export const SearchModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    tasks,
    topics,
    subjects,
    revisions,
    setSelectedTopicId,
    setEditingTaskId,
    openModal,
    toggleTaskCompleted,
  } = useApp();

  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const matchingTasks = useMemo(() => {
    if (!trimmed) return [];
    return tasks.filter(
      t =>
        t.title.toLowerCase().includes(trimmed) ||
        (t.notes && t.notes.toLowerCase().includes(trimmed))
    );
  }, [tasks, trimmed]);

  const matchingTopics = useMemo(() => {
    if (!trimmed) return [];
    return topics.filter(
      t =>
        t.title.toLowerCase().includes(trimmed) ||
        (t.description && t.description.toLowerCase().includes(trimmed))
    );
  }, [topics, trimmed]);

  const matchingSubjects = useMemo(() => {
    if (!trimmed) return [];
    return subjects.filter(s => s.name.toLowerCase().includes(trimmed));
  }, [subjects, trimmed]);

  if (activeModal !== 'search') return null;

  const handleOpenTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    openModal('topic_detail');
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    openModal('create_task');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10">
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, study topics, subjects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm font-medium bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeModal}
            className="ml-2 px-2 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!trimmed ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Type keywords to search across your study system
            </div>
          ) : matchingTasks.length === 0 &&
            matchingTopics.length === 0 &&
            matchingSubjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching results found for "{query}"
            </div>
          ) : (
            <>
              {/* Topics */}
              {matchingTopics.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Study Topics ({matchingTopics.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingTopics.map(topic => {
                      const sub = subjects.find(s => s.id === topic.subjectId);
                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleOpenTopic(topic.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                        >
                          <div>
                            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {topic.title}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {sub?.name} • {topic.currentRevision}/{topic.totalRevisions} revisions
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {matchingTasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Tasks ({matchingTasks.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                      >
                        <div
                          className="flex items-center space-x-2.5 flex-1 min-w-0"
                          onClick={() => handleEditTask(task.id)}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompleted(task.id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded text-zinc-900 focus:ring-0"
                          />
                          <div className="truncate">
                            <span
                              className={`text-xs font-medium text-zinc-900 dark:text-zinc-100 ${
                                task.completed ? 'line-through opacity-50' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.dueDate && (
                              <span className="text-[10px] text-zinc-500 ml-2">
                                {formatFriendlyDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects */}
              {matchingSubjects.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Subjects ({matchingSubjects.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchingSubjects.map(sub => (
                      <span
                        key={sub.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                        style={{
                          backgroundColor: `${sub.color}15`,
                          color: sub.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
