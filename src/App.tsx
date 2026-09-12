import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TodoSection } from './components/todo/TodoSection';
import { StudySection } from './components/study/StudySection';
import { AnalysisSection } from './components/analysis/AnalysisSection';
import { ActionSheetModal } from './components/modals/ActionSheetModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { CreateTopicModal } from './components/modals/CreateTopicModal';
import { CreateRevisionModal } from './components/modals/CreateRevisionModal';
import { TopicDetailModal } from './components/modals/TopicDetailModal';
import { RescheduleModal } from './components/modals/RescheduleModal';
import { SearchModal } from './components/modals/SearchModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ManualSessionModal } from './components/modals/ManualSessionModal';
import { ConvertToTopicModal } from './components/modals/ConvertToTopicModal';
import { RecoverySessionModal } from './components/modals/RecoverySessionModal';
import { SessionHistoryModal } from './components/modals/SessionHistoryModal';
import { QuickNoteModal } from './components/modals/QuickNoteModal';
import { ShareSummaryModal } from './components/modals/ShareSummaryModal';
import { GlobalQuickActionSheet } from './components/common/GlobalQuickActionSheet';
import { usePWAInstall } from './hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab, setTimerMode } = useApp();
  const { isOnline } = usePWAInstall();

  // Handle URL shortcut parameters on launch (from App Launcher / Home Screen Shortcuts)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const modeParam = params.get('mode');

      if (tabParam === 'todo' || tabParam === 'study' || tabParam === 'analysis') {
        setCurrentTab(tabParam);
      }
      if (modeParam === 'pomodoro' || modeParam === 'stopwatch') {
        setTimerMode(modeParam);
      }
    } catch {
      // ignore
    }
  }, [setCurrentTab, setTimerMode]);

  return (
    <div className="relative min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#007AFF]/15 overflow-x-hidden">
      {/* Ambient background light orbs for authentic Apple glassmorphism */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-blue-400/8 via-indigo-300/6 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-28 w-80 h-80 bg-gradient-to-br from-sky-400/6 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-2/3 -right-28 w-80 h-80 bg-gradient-to-bl from-emerald-400/6 to-transparent blur-3xl rounded-full" />
      </div>

      <Header />

      {/* Offline Status Badge */}
      {!isOnline && (
        <div className="sticky top-14 z-20 w-full bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode • Changes are saved locally</span>
        </div>
      )}

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full transition-[backdrop-filter]"
          >
            {currentTab === 'todo' && <TodoSection />}
            {currentTab === 'study' && <StudySection />}
            {currentTab === 'analysis' && <AnalysisSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation />

      {/* Global Modals & Dialogs */}
      <ActionSheetModal />
      <CreateTaskModal />
      <CreateTopicModal />
      <CreateRevisionModal />
      <TopicDetailModal />
      <RescheduleModal />
      <SearchModal />
      <SettingsModal />
      <ManualSessionModal />
      <ConvertToTopicModal />
      <RecoverySessionModal />
      <SessionHistoryModal />
      <QuickNoteModal />
      <ShareSummaryModal />
      <GlobalQuickActionSheet />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

