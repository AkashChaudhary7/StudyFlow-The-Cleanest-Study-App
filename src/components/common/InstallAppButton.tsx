import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, Check, X, Smartphone } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface InstallAppButtonProps {
  variant?: 'header' | 'settings' | 'banner';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already running in standalone installed mode, don't show prompt
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs">
          <div className="flex items-center space-x-2.5">
            <Check className="w-4 h-4" />
            <span className="font-semibold">Installed as App</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Active</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstalledSuccess(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General fallback modal for browsers that don't emit beforeinstallprompt
      setShowIOSModal(true);
    }
  };

  if (variant === 'settings') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all active:scale-98 text-xs font-semibold ${className}`}
        >
          <div className="flex items-center space-x-2.5">
            <Download className="w-4 h-4" />
            <span>Install App on Device</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 font-bold">
            Install
          </span>
        </button>

        {showIOSModal && <InstallGuideModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />}
      </>
    );
  }

  if (variant === 'banner') {
    if (!isInstallable && !isIOS) return null;

    return (
      <>
        <div className={`p-4 rounded-3xl glass-card border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Install StudyFlow
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Use offline, full-screen and fast launcher shortcuts
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 shrink-0"
          >
            Install
          </button>
        </div>

        {showIOSModal && <InstallGuideModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />}
      </>
    );
  }

  // Header variant (Default: sleek Apple pill)
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/20 text-[11px] font-semibold transition active:scale-95 shadow-2xs ${className}`}
        title="Install StudyFlow App"
        aria-label="Install App"
      >
        <Download className="w-3 h-3" />
        <span>Install</span>
      </button>

      {showIOSModal && <InstallGuideModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />}
    </>
  );
};

// Clean step-by-step installation guide modal for iOS Safari / Mobile
const InstallGuideModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.06] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Install App
            </h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-full hover:bg-black/5 text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-800">
              To install StudyFlow on your iPhone or iPad:
            </p>
            <div className="space-y-2.5 bg-zinc-50 p-3.5 rounded-2xl border border-black/[0.04]">
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-md bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </div>
                <span>
                  Tap the <strong className="inline-flex items-center gap-1 font-semibold text-zinc-900"><Share className="w-3.5 h-3.5 text-[#007AFF] inline" /> Share</strong> button in Safari toolbar.
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-md bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </div>
                <span>
                  Scroll down and tap <strong className="inline-flex items-center gap-1 font-semibold text-zinc-900"><PlusSquare className="w-3.5 h-3.5 text-[#007AFF] inline" /> Add to Home Screen</strong>.
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-md bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </div>
                <span>
                  Tap <strong className="font-semibold text-zinc-900">Add</strong> at top right to launch from home screen.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-800">
              To install StudyFlow on your browser or device:
            </p>
            <div className="space-y-2 bg-zinc-50 p-3.5 rounded-2xl border border-black/[0.04]">
              <p>
                1. Open your browser menu (⋮ or share menu).
              </p>
              <p>
                2. Select <strong className="text-zinc-900">"Install StudyFlow"</strong> or <strong className="text-zinc-900">"Add to Home screen"</strong>.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full py-2.5 rounded-2xl bg-zinc-900 text-white font-semibold text-xs shadow-xs hover:opacity-95 active:scale-98 transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
