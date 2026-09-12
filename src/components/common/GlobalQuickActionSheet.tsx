import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Edit3,
  Trash2,
  Check,
  Plus,
  RotateCw,
  GraduationCap,
  Clock,
  X,
  Sparkles,
  PenLine,
  Share2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

export const GlobalQuickActionSheet: React.FC = () => {
  const { quickActionConfig, closeQuickActions } = useApp();

  if (!quickActionConfig) return null;

  const renderActionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'edit':
        return <Edit3 className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'check':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'plus':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'up':
        return <ArrowUp className="w-4 h-4 text-blue-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-blue-500" />;
      case 'convert':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'clock':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'star':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'note':
        return <PenLine className="w-4 h-4 text-amber-500" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-indigo-500" />;
      default:
        return <RotateCw className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          triggerHaptic('light');
          closeQuickActions();
        }}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Floating Popup Card Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
          <div className="space-y-0.5 pr-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">
              {quickActionConfig.title}
            </h3>
            {quickActionConfig.subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {quickActionConfig.subtitle}
              </p>
            )}
            {quickActionConfig.details && (
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {quickActionConfig.details}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              closeQuickActions();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions List */}
        <div className="p-2 space-y-1">
          {quickActionConfig.actions.map(action => (
            <button
              key={action.id}
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled) return;
                triggerHaptic(action.danger ? 'heavy' : 'success');
                action.onSelect();
                closeQuickActions();
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                action.disabled
                  ? 'opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : action.danger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-[0.98]'
                  : 'text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]'
              }`}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 shrink-0">
                {renderActionIcon(action.icon)}
              </div>
              <span className="flex-1 text-left">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="p-2 pt-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              closeQuickActions();
            }}
            className="w-full py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10 transition active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
