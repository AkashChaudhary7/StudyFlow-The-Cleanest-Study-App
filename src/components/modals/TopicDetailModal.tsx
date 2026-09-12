import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDuration,
  formatFriendlyDate,
  formatTimeRange,
  getTodayStr,
  isPastDate,
} from '../../utils/dateUtils';
import {
  X,
  Play,
  RotateCw,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  History,
  Check,
} from 'lucide-react';

export const TopicDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedTopicId,
    topics,
    subjects,
    revisions,
    sessions,
    startStudyForTopic,
    reviseTopicNow,
    completeRevision,
    deleteTopic,
    editTopic,
    openModal,
    setSelectedRevisionId,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (activeModal !== 'topic_detail' || !selectedTopicId) return null;

  const topic = topics.find(t => t.id === selectedTopicId);
  if (!topic) return null;

  const subject = subjects.find(s => s.id === topic.subjectId);
  const topicRevisions = revisions
    .filter(r => r.topicId === topic.id)
    .sort((a, b) => a.revisionNumber - b.revisionNumber);

  const topicSessions = sessions
    .filter(s => s.topicId === topic.id)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const pendingRevision = topicRevisions.find(
    r => r.status === 'pending' || r.status === 'overdue'
  );

  const isOverdue = pendingRevision && isPastDate(pendingRevision.scheduledDate);
  const total = topic.totalRevisions || 3;
  const current = topic.currentRevision || 0;
  const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 100;
  const isCompleted = current >= total && total > 0;

  const handleStartStudy = () => {
    startStudyForTopic(topic.id);
  };

  const handleReviseNow = () => {
    reviseTopicNow(topic.id);
  };

  const handleOpenReschedule = (revId: string) => {
    setSelectedRevisionId(revId);
    openModal('reschedule');
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${topic.title}" and its revision history?`)) {
      deleteTopic(topic.id);
      closeModal();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    editTopic(topic.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
    });
    setIsEditing(false);
  };

  const startEditMode = () => {
    setEditTitle(topic.title);
    setEditDesc(topic.description || '');
    setIsEditing(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1 pr-4 flex-1 min-w-0">
            {/* Subject pill */}
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${subject?.color || '#3B82F6'}18`,
                color: subject?.color || '#3B82F6',
              }}
            >
              {subject?.name || 'Subject'}
            </span>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full text-base font-bold px-2 py-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                  placeholder="Description..."
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {topic.title}
                </h2>
                {topic.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {topic.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {!isEditing && (
              <>
                <button
                  onClick={startEditMode}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Edit topic"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Delete topic"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Metadata Grid */}
        <div className="mt-4 space-y-3.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500">
                Study Time
              </div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                {formatDuration(topic.totalStudySeconds, true)}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500">
                Sessions
              </div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                {topicSessions.length} logged
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500">
                Last Studied
              </div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 truncate">
                {topic.studiedAt
                  ? formatFriendlyDate(topic.studiedAt)
                  : topicSessions[0]
                  ? formatFriendlyDate(topicSessions[0].date)
                  : 'Never'}
              </div>
            </div>
          </div>

          {/* Next Revision Due Banner */}
          {pendingRevision && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                isOverdue
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                  : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/40'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {isOverdue ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {pendingRevision.revisionNumber}× Revision Due
                  </div>
                  <div
                    className={`text-[11px] font-medium truncate ${
                      isOverdue
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isOverdue ? 'Overdue: ' : 'Due: '}
                    {formatFriendlyDate(pendingRevision.scheduledDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <button
                  onClick={() => handleOpenReschedule(pendingRevision.id)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => completeRevision(pendingRevision.id, topic.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg text-white shadow-xs ${
                    isOverdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Revise
                </button>
              </div>
            </div>
          )}

          {/* Revision Progress Stages */}
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-2">
              <span>Revision Plan ({topic.revisionPlan.toUpperCase()})</span>
              <span className="text-[11px] font-normal text-zinc-500">
                {isCompleted ? 'Completed' : `${current} / ${total} done`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: total }).map((_, idx) => {
                const stageNum = idx + 1;
                const isDone = stageNum <= current;
                const targetRev = topicRevisions.find(r => r.revisionNumber === stageNum);

                return (
                  <div
                    key={stageNum}
                    className={`p-2 rounded-xl text-center border transition ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : targetRev && isPastDate(targetRev.scheduledDate) && targetRev.status !== 'completed'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-white border-zinc-200 text-zinc-500'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-center space-x-1">
                      {isDone ? (
                        <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 inline-block" />
                      )}
                      <span>{stageNum}×</span>
                    </div>
                    <div className="text-[9px] mt-0.5 truncate opacity-75 font-medium">
                      {isDone
                        ? 'Done'
                        : targetRev
                        ? formatFriendlyDate(targetRev.scheduledDate)
                        : `Step ${stageNum}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological Sessions for this Topic */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 px-1">
              <span className="flex items-center space-x-1">
                <History className="w-3.5 h-3.5 text-zinc-400" />
                <span>Session History</span>
              </span>
              <span className="text-[11px] font-normal text-zinc-400">
                {topicSessions.length} sessions
              </span>
            </div>

            {topicSessions.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                No study sessions recorded for this topic yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {topicSessions.map(sess => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatFriendlyDate(sess.date)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {formatTimeRange(sess.startTime, sess.endTime)}
                        {sess.notes && ` • "${sess.notes}"`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {formatDuration(sess.durationSeconds, true)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <button
              id="topic-detail-start-study"
              onClick={handleStartStudy}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Study Timer</span>
            </button>

            {!isCompleted && (
              <button
                id="topic-detail-revise-now"
                onClick={handleReviseNow}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Revise Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
