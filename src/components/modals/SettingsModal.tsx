import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Bell,
  Trash2,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import { InstallAppButton } from '../common/InstallAppButton';

export const SettingsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    preferences,
    updatePreferences,
    subjects,
    addSubject,
    deleteSubject,
    resetAllData,
  } = useApp();

  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#3B82F6');

  if (activeModal !== 'settings') return null;

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    addSubject(newSubName.trim(), newSubColor);
    setNewSubName('');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all data back to original sample state? Custom items will be reset.'
      )
    ) {
      resetAllData();
    }
  };

  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#EF4444', // Red
    '#6366F1', // Indigo
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/[0.06] p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Settings & Preferences
          </h2>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* Appearance / Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'light', 'dark'] as const).map(themeOption => (
                <button
                  key={themeOption}
                  onClick={() => updatePreferences({ theme: themeOption })}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                    preferences.theme === themeOption
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  {themeOption === 'light' && <Sun className="w-3.5 h-3.5" />}
                  {themeOption === 'dark' && <Moon className="w-3.5 h-3.5" />}
                  {themeOption === 'system' && <Monitor className="w-3.5 h-3.5" />}
                  <span className="capitalize">{themeOption}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Goal */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              Daily Study Goal (Minutes)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="30"
                max="480"
                step="30"
                value={preferences.dailyStudyGoalMinutes}
                onChange={e =>
                  updatePreferences({ dailyStudyGoalMinutes: parseInt(e.target.value, 10) })
                }
                className="flex-1 accent-zinc-900"
              />
              <span className="text-xs font-bold text-zinc-900 min-w-[60px] text-right">
                {Math.floor(preferences.dailyStudyGoalMinutes / 60)}h{' '}
                {preferences.dailyStudyGoalMinutes % 60 > 0
                  ? `${preferences.dailyStudyGoalMinutes % 60}m`
                  : ''}
              </span>
            </div>
          </div>

          {/* Sound & Notifications */}
          <div className="space-y-3 pt-2 border-t border-black/[0.05]">
            <label className="block text-xs font-semibold text-zinc-700">
              Audio & Notifications
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-black/[0.04]">
              <div className="flex items-center space-x-2.5">
                {preferences.enableSound ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                )}
                <div>
                  <div className="text-xs font-medium text-zinc-900">
                    Completion Sound Chimes
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Play gentle tone when completing tasks and timer sessions
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableSound}
                onChange={e => updatePreferences({ enableSound: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-black/[0.04]">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs font-medium text-zinc-900">
                    Revision & Task Notifications
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Local device alerts when spaced revisions are due
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableNotifications}
                onChange={e => updatePreferences({ enableNotifications: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-0"
              />
            </div>
          </div>

          {/* Manage Subjects */}
          <div className="space-y-2 pt-2 border-t border-black/[0.05]">
            <label className="block text-xs font-semibold text-zinc-700">
              Subjects ({subjects.length})
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {subjects.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-black/[0.04] text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-medium text-zinc-900">
                      {sub.name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSubject(sub.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 transition"
                    title={`Delete ${sub.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subject inline */}
            <form onSubmit={handleAddSubject} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="New subject name..."
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900"
              />
              <div className="flex items-center space-x-1">
                {colorPalette.slice(0, 4).map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewSubColor(c)}
                    className={`w-5 h-5 rounded-full border ${
                      newSubColor === c ? 'border-zinc-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold active:scale-95 transition"
              >
                Add
              </button>
            </form>
          </div>

          {/* Install App on Device */}
          <div className="pt-2">
            <InstallAppButton variant="settings" />
          </div>

          {/* Reset / Clear Data */}
          <div className="pt-3 border-t border-black/[0.05]">
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sample Data & Progress</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
