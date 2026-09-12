import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RevisionPlanType } from '../../types';
import { X, BookOpen, Clock, RotateCw, Play, Check } from 'lucide-react';

export const ConvertToTopicModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    tasks,
    subjects,
    convertingTaskId,
    convertTaskToTopic,
    startStudyForTopic,
  } = useApp();

  const task = tasks.find(t => t.id === convertingTaskId);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlanType>('3x');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || '');
      setSubjectId(task.subjectId || subjects[0]?.id || 'sub-cs');
      setEstimatedMinutes(60);
      setRevisionPlan('3x');
    }
  }, [task, subjects]);

  if (activeModal !== 'convert_to_topic' || !task) return null;

  const handleConvert = (startImmediately: boolean = false) => {
    if (!title.trim() || !subjectId) return;

    const newTopic = convertTaskToTopic(task.id, {
      subjectId,
      title: title.trim(),
      description: description.trim() || undefined,
      estimatedMinutes,
      revisionPlan,
    });

    closeModal();

    if (startImmediately) {
      startStudyForTopic(newTopic.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal} />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Convert to Study Topic
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Link this task directly to your revision engine
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

        <form
          onSubmit={e => {
            e.preventDefault();
            handleConvert(false);
          }}
          className="mt-4 space-y-4"
        >
          {/* Topic Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. DBMS Normalization"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Subject *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map(sub => (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => setSubjectId(sub.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                    subjectId === sub.id
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="truncate">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Study Time */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Estimated Study Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '30m', mins: 30 },
                { label: '1h', mins: 60 },
                { label: '1.5h', mins: 90 },
                { label: '2h', mins: 120 },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.mins}
                  onClick={() => setEstimatedMinutes(opt.mins)}
                  className={`py-2 text-xs font-medium rounded-xl border transition ${
                    estimatedMinutes === opt.mins
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revision Plan */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Spaced Revision Plan
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['2x', '3x', '4x', '5x'] as RevisionPlanType[]).map(plan => (
                <button
                  type="button"
                  key={plan}
                  onClick={() => setRevisionPlan(plan)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    revisionPlan === plan
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {revisionPlan === '2x' && 'Reviews at Day +1 and Day +7'}
              {revisionPlan === '3x' && 'Reviews at Day +1, Day +3, and Day +7'}
              {revisionPlan === '4x' && 'Reviews at Day +1, Day +3, Day +7, and Day +14'}
              {revisionPlan === '5x' && 'Reviews at Day +1, +3, +7, +14, and +30'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Optional Notes / Syllabus Reference
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key concepts, subtopics or chapters..."
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={() => handleConvert(false)}
              className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Topic</span>
            </button>

            <button
              type="button"
              onClick={() => handleConvert(true)}
              className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Study Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
