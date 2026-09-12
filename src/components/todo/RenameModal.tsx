import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface RenameModalProps {
  isOpen: boolean;
  title: string;
  initialValue: string;
  onSave: (newName: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  title,
  initialValue,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      triggerHaptic('success');
      onSave(value.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Enter name..."
            />
          </div>

          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-40 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
