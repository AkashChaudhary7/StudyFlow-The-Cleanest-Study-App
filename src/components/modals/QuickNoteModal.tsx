import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Pin,
  Trash2,
  Copy,
  ArrowRightCircle,
  Plus,
  Search,
  Check,
  Tag,
  PenLine,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';
import { formatFriendlyDate } from '../../utils/dateUtils';

export const QuickNoteModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    quickNotes,
    addQuickNote,
    deleteQuickNote,
    togglePinQuickNote,
    convertQuickNoteToTask,
    subjects,
  } = useApp();

  const [activeView, setActiveView] = useState<'create' | 'list'>('create');
  const [content, setContent] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeModal === 'quick_note') {
      setContent('');
      setSelectedSubjectId('');
      setSearchQuery('');
      setActiveView(quickNotes.length > 0 && activeView === 'list' ? 'list' : 'create');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [activeModal]);

  if (activeModal !== 'quick_note') return null;

  const handleSave = (createTaskAfter = false) => {
    if (!content.trim()) return;
    const note = addQuickNote(content, selectedSubjectId || undefined);
    if (createTaskAfter) {
      convertQuickNoteToTask(note.id);
      closeModal();
      return;
    }
    setContent('');
    setSelectedSubjectId('');
    setActiveView('list');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter and sort notes (pinned first, then latest)
  const filteredNotes = quickNotes
    .filter(note =>
      searchQuery
        ? note.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={closeModal} />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Quick Note
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  {quickNotes.length} saved
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Fleeting scratchpad for sudden study insights
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-full text-xs font-medium">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveView('create');
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className={`px-3 py-1 rounded-full transition ${
                  activeView === 'create'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Write
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveView('list');
                }}
                className={`px-3 py-1 rounded-full transition flex items-center gap-1.5 ${
                  activeView === 'list'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>Saved</span>
                {quickNotes.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {quickNotes.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={closeModal}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Write Fleeting Note */}
        {activeView === 'create' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
                placeholder="Jot down a fleeting idea, formula to memorize, paper link, or study thought..."
                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition"
              />
              <div className="flex justify-between items-center px-1 pt-1 text-[11px] text-zinc-400">
                <span>Press ⌘+Enter to save</span>
                <span>{content.length} characters</span>
              </div>
            </div>

            {/* Optional Subject Pill Selection */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Link Subject (Optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedSubjectId('');
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    selectedSubjectId === ''
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                      : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  General
                </button>
                {subjects.map(subj => {
                  const isSelected = selectedSubjectId === subj.id;
                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedSubjectId(isSelected ? '' : subj.id);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center space-x-1.5 transition ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                          : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: subj.color }}
                      />
                      <span>{subj.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!content.trim()}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                title="Save this thought and convert it straight into a task"
              >
                <ArrowRightCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Save as Task</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={!content.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Save Quick Note</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Quick Notes List */}
        {activeView === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search filter bar */}
            <div className="p-3 sm:px-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter fleeting thoughts..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-300 transition"
                />
              </div>
            </div>

            {/* Notes List */}
            <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-zinc-400">
                  <PenLine className="w-8 h-8 mx-auto stroke-1 opacity-60 text-amber-500" />
                  <p className="text-xs font-medium">
                    {searchQuery ? 'No notes matched your search' : 'No fleeting notes yet'}
                  </p>
                  <button
                    onClick={() => {
                      setActiveView('create');
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    + Write your first note
                  </button>
                </div>
              ) : (
                filteredNotes.map(note => {
                  const subject = subjects.find(s => s.id === note.subjectId);
                  return (
                    <div
                      key={note.id}
                      className={`group relative p-3.5 rounded-2xl border transition-all ${
                        note.isPinned
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                          : 'bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700/60'
                      }`}
                    >
                      {/* Top row: meta & pin */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                        <div className="flex items-center space-x-2">
                          {note.isPinned && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>Pinned</span>
                            </span>
                          )}
                          <span>{formatFriendlyDate(note.createdAt.split('T')[0])}</span>
                          {subject && (
                            <span className="flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-300">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                              <span>{subject.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Note Actions */}
                        <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleCopy(note.content, note.id)}
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                            title="Copy text"
                          >
                            {copiedId === note.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => togglePinQuickNote(note.id)}
                            className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                              note.isPinned
                                ? 'text-amber-500 fill-current'
                                : 'text-zinc-400 hover:text-amber-500'
                            }`}
                            title={note.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              convertQuickNoteToTask(note.id);
                              triggerHaptic('success');
                            }}
                            className="p-1 rounded-lg hover:bg-blue-500/10 text-zinc-400 hover:text-blue-600 transition"
                            title="Convert to full Task"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteQuickNote(note.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
