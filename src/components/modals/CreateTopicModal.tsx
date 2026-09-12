import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RevisionPlanType } from '../../types';
import { getTodayStr, addDays, formatFriendlyDate } from '../../utils/dateUtils';
import { DEFAULT_INTERVALS } from '../../services/revisionEngine';
import { X, Sparkles, BookOpen, Clock, Calendar } from 'lucide-react';

export const CreateTopicModal: React.FC = () => {
  const { activeModal, closeModal, addTopic, subjects, addSubject } = useApp();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlanType>('3x');
  const [customDays, setCustomDays] = useState<string>('1, 3, 7');

  // Inline subject creator
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#3B82F6');

  if (activeModal !== 'create_topic') return null;

  const handleCreateSubject = () => {
    if (!newSubName.trim()) return;
    const created = addSubject(newSubName.trim(), newSubColor);
    setSubjectId(created.id);
    setNewSubName('');
    setShowNewSubject(false);
  };

  const parseCustomDays = (): number[] => {
    return customDays
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  };

  const getPlannedIntervals = (): number[] => {
    switch (revisionPlan) {
      case 'none':
        return [];
      case '2x':
        return [1, 3];
      case '3x':
        return [1, 3, 7];
      case '4x':
        return [1, 3, 7, 14];
      case '5x':
        return [1, 3, 7, 14, 30];
      case 'custom':
        return parseCustomDays();
      default:
        return [1, 3, 7];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    const customIntervalDays = revisionPlan === 'custom' ? parseCustomDays() : undefined;

    addTopic({
      title: title.trim(),
      subjectId,
      description: description.trim() || undefined,
      estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : undefined,
      revisionPlan,
      customIntervalDays,
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setRevisionPlan('3x');
    closeModal();
  };

  const intervals = getPlannedIntervals();
  const today = getTodayStr();

  const presetPlans: { id: RevisionPlanType; label: string; desc: string }[] = [
    { id: 'none', label: 'No Revision', desc: 'Single-time study topic' },
    { id: '2x', label: '2× Revision', desc: 'Day +1, Day +3' },
    { id: '3x', label: '3× Revision', desc: 'Day +1, Day +3, Day +7 (Recommended)' },
    { id: '4x', label: '4× Revision', desc: 'Day +1, +3, +7, +14' },
    { id: '5x', label: '5× Revision', desc: 'Day +1, +3, +7, +14, +30 (Long-term)' },
    { id: 'custom', label: 'Custom', desc: 'Set your own interval schedule' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              New Study Topic
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
          {/* Topic Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Topic Name
            </label>
            <input
              id="topic-title-input"
              type="text"
              placeholder="e.g. Operating System — CPU Scheduling"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition"
              autoFocus
              required
            />
          </div>

          {/* Subject Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <button
                type="button"
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showNewSubject ? 'Select existing' : '+ Add new subject'}
              </button>
            </div>

            {showNewSubject ? (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <input
                  type="text"
                  placeholder="Subject name (e.g. Computer Science)"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'].map(color => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setNewSubColor(color)}
                        className={`w-5 h-5 rounded-full border-2 transition ${
                          newSubColor === color ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSubject}
                    className="px-3 py-1 text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="topic-subject-select"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Description / Key Topics
              </label>
              <input
                id="topic-desc-input"
                type="text"
                placeholder="Key concepts, page numbers, notes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Est. Time
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  id="topic-est-time-input"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="Minutes"
                  value={estimatedMinutes || ''}
                  onChange={e => setEstimatedMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs pl-7 pr-2 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          {/* Spaced Revision Plan Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Intelligent Spaced Revision Plan
              </label>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Ebbinghaus curve
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presetPlans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setRevisionPlan(plan.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    revisionPlan === plan.id
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-bold">{plan.label}</div>
                  <div className={`text-[10px] mt-0.5 leading-tight ${
                    revisionPlan === plan.id ? 'opacity-90' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {plan.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom interval inputs */}
            {revisionPlan === 'custom' && (
              <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Days after initial study (comma separated):
                </label>
                <input
                  type="text"
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  placeholder="e.g. 1, 3, 7, 14, 30"
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* Live Schedule Timeline Preview */}
          {intervals.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Scheduled Revision Timeline
                </span>
                <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
                  {intervals.length} planned stages
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
                  Study: Today
                </span>
                {intervals.map((days, idx) => {
                  const targetDate = addDays(today, days);
                  return (
                    <React.Fragment key={idx}>
                      <span className="text-zinc-400 dark:text-zinc-500">→</span>
                      <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300/40 dark:border-emerald-700/40">
                        {idx + 1}×: {formatFriendlyDate(targetDate)} (+{days}d)
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              id="save-topic-btn"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-sm"
            >
              Create Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
