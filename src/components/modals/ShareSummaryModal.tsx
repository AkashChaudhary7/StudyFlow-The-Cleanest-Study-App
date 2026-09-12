import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Award,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';
import { formatDuration, getTodayStr, addDays } from '../../utils/dateUtils';

type ThemeMode = 'dark' | 'light' | 'indigo';
type AspectMode = 'square' | 'story';

export const ShareSummaryModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    sessions,
    tasks,
    topics,
    revisions,
    subjects,
    currentStreakDays,
    consistencyScoreData,
    preferences,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [aspect, setAspect] = useState<AspectMode>('square');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const today = getTodayStr();

  // Compute 7-day stats
  const weekData = React.useMemo(() => {
    const days: { dateStr: string; label: string; dayName: string; seconds: number; tasksCount: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const dateObj = new Date(dStr + 'T12:00:00');
      const dName = dayNames[dateObj.getDay()];
      
      const daySecs = sessions
        .filter(s => s.date === dStr)
        .reduce((acc, s) => acc + s.durationSeconds, 0);

      const dayTasks = tasks.filter(
        t => t.completed && t.completedAt && t.completedAt.startsWith(dStr)
      ).length;

      days.push({
        dateStr: dStr,
        label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        dayName: dName,
        seconds: daySecs,
        tasksCount: dayTasks,
      });
    }

    const totalSeconds = days.reduce((acc, d) => acc + d.seconds, 0);
    const completedTasksCount = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = t.completedAt.split('T')[0];
      return days.some(d => d.dateStr === completedDate);
    }).length;

    const completedRevisionsCount = revisions.filter(r => {
      if (r.status !== 'completed' || !r.completedDate) return false;
      return days.some(d => d.dateStr === r.completedDate);
    }).length;

    // Subject breakdown
    const subjectMinutesMap = new Map<string, number>();
    sessions.forEach(s => {
      if (days.some(d => d.dateStr === s.date)) {
        const prev = subjectMinutesMap.get(s.subjectId) || 0;
        subjectMinutesMap.set(s.subjectId, prev + s.durationSeconds / 60);
      }
    });

    const topSubjects = Array.from(subjectMinutesMap.entries())
      .map(([subId, mins]) => ({
        subject: subjects.find(s => s.id === subId) || { name: 'Other', color: '#6B7280' },
        minutes: Math.round(mins),
      }))
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    const startDate = days[0].dateStr;
    const endDate = days[days.length - 1].dateStr;

    return {
      days,
      totalSeconds,
      completedTasksCount,
      completedRevisionsCount,
      topSubjects,
      startDate,
      endDate,
    };
  }, [sessions, tasks, revisions, subjects, today]);

  // Render canvas card with ultra-high-definition retina styling
  useEffect(() => {
    if (activeModal !== 'share_summary') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: High-res 1200x1200 (Square) or 1080x1920 (Story)
    const width = 1080;
    const height = aspect === 'story' ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // 1. Theme palette setup
    const isDark = theme === 'dark';
    const isIndigo = theme === 'indigo';

    const bgFill = isDark
      ? '#0E1015'
      : isIndigo
      ? '#0F172A'
      : '#F8F9FA';

    const cardBg = isDark
      ? '#181A20'
      : isIndigo
      ? '#1E293B'
      : '#FFFFFF';

    const cardBorder = isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : isIndigo
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.06)';

    const textPrimary = isDark || isIndigo ? '#FFFFFF' : '#111827';
    const textSecondary = isDark || isIndigo ? '#9CA3AF' : '#6B7280';
    const accentBlue = '#3B82F6';
    const accentEmerald = '#10B981';
    const accentAmber = '#F59E0B';

    // Clear Canvas
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, width, height);

    // Decorative subtle ambient radial glows
    const gradient = ctx.createRadialGradient(
      width * 0.8,
      height * 0.15,
      50,
      width * 0.8,
      height * 0.15,
      width * 0.7
    );
    if (isDark || isIndigo) {
      gradient.addColorStop(0, isIndigo ? 'rgba(59, 130, 246, 0.22)' : 'rgba(99, 102, 241, 0.15)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Rounded rectangle helper
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fillColor: string,
      strokeColor?: string
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    // Card frame margin
    const margin = 60;
    const cardW = width - margin * 2;
    const cardH = height - margin * 2;
    const cardX = margin;
    const cardY = margin;

    // Outer Card Container
    drawRoundRect(cardX, cardY, cardW, cardH, 44, cardBg, cardBorder);

    // Padding inside card
    const pad = 64;
    let currentY = cardY + pad;

    // --- 1. HEADER SECTION ---
    // Monogram Icon
    drawRoundRect(cardX + pad, currentY, 68, 68, 20, isDark || isIndigo ? '#3B82F6' : '#2563EB');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SF', cardX + pad + 34, currentY + 34);

    // Brand Name & Subtitle
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('StudyFlow', cardX + pad + 86, currentY + 4);

    ctx.fillStyle = textSecondary;
    ctx.font = '500 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('Weekly Focus & Mastery', cardX + pad + 86, currentY + 42);

    // Date Range Pill on the right
    const dateRangeStr = `${weekData.startDate} — ${weekData.endDate}`;
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(dateRangeStr).width;
    const pillW = textWidth + 36;
    const pillH = 44;
    const pillX = cardX + cardW - pad - pillW;
    const pillY = currentY + 12;

    drawRoundRect(
      pillX,
      pillY,
      pillW,
      pillH,
      22,
      isDark || isIndigo ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      cardBorder
    );

    ctx.fillStyle = textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateRangeStr, pillX + pillW / 2, pillY + pillH / 2);

    currentY += 120;

    // --- 2. HERO HIGHLIGHTS GRID (4 METRICS) ---
    const metricW = (cardW - pad * 2 - 24 * 3) / 4;
    const metricH = 140;

    const metrics = [
      {
        label: 'STUDY TIME',
        value: formatDuration(weekData.totalSeconds),
        sub: 'Past 7 days',
        color: accentBlue,
      },
      {
        label: 'TASKS DONE',
        value: `${weekData.completedTasksCount}`,
        sub: 'Completed',
        color: accentEmerald,
      },
      {
        label: 'STREAK',
        value: `${currentStreakDays} Days`,
        sub: 'Active habit',
        color: accentAmber,
      },
      {
        label: 'DISCIPLINE',
        value: `${consistencyScoreData.score}%`,
        sub: consistencyScoreData.label,
        color: '#8B5CF6',
      },
    ];

    metrics.forEach((m, idx) => {
      const mX = cardX + pad + idx * (metricW + 24);
      drawRoundRect(
        mX,
        currentY,
        metricW,
        metricH,
        24,
        isDark || isIndigo ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        cardBorder
      );

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Label
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(m.label, mX + 22, currentY + 22);

      // Value
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(m.value, mX + 22, currentY + 48);

      // Subtitle with colored dot
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(mX + 26, currentY + 104, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = textSecondary;
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(m.sub, mX + 38, currentY + 95);
    });

    currentY += metricH + 48;

    // --- 3. 7-DAY ACTIVITY BAR CHART ---
    const chartH = aspect === 'story' ? 440 : 280;
    drawRoundRect(
      cardX + pad,
      currentY,
      cardW - pad * 2,
      chartH,
      30,
      isDark || isIndigo ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      cardBorder
    );

    // Chart Header
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Daily Study Rhythm', cardX + pad + 28, currentY + 26);

    ctx.fillStyle = textSecondary;
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Minutes focused per day', cardX + pad + 28, currentY + 56);

    // Chart Area
    const chartContentY = currentY + 90;
    const chartContentH = chartH - 140;
    const barAreaW = cardW - pad * 2 - 56;
    const colW = barAreaW / 7;

    const maxSeconds = Math.max(...weekData.days.map(d => d.seconds), 60 * 60 * 3); // At least 3h scale

    weekData.days.forEach((day, idx) => {
      const colX = cardX + pad + 28 + idx * colW;
      const barW = Math.min(colW * 0.48, 54);
      const barX = colX + (colW - barW) / 2;

      // Height
      const barRatio = Math.min(1, day.seconds / maxSeconds);
      const barHeight = Math.max(12, barRatio * chartContentH);
      const barY = chartContentY + chartContentH - barHeight;

      const isTodayBar = day.dateStr === today;

      // Bar gradient fill
      const barGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      if (isTodayBar) {
        barGrad.addColorStop(0, '#60A5FA');
        barGrad.addColorStop(1, '#2563EB');
      } else if (day.seconds > 0) {
        barGrad.addColorStop(0, isDark || isIndigo ? 'rgba(255,255,255,0.35)' : '#94A3B8');
        barGrad.addColorStop(1, isDark || isIndigo ? 'rgba(255,255,255,0.15)' : '#CBD5E1');
      } else {
        barGrad.addColorStop(0, isDark || isIndigo ? 'rgba(255,255,255,0.06)' : '#E2E8F0');
        barGrad.addColorStop(1, isDark || isIndigo ? 'rgba(255,255,255,0.02)' : '#F1F5F9');
      }

      drawRoundRect(barX, barY, barW, barHeight, 14, barGrad as any);

      // Duration label above bar if > 0
      if (day.seconds > 0) {
        ctx.fillStyle = isTodayBar ? accentBlue : textSecondary;
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const hr = (day.seconds / 3600).toFixed(1);
        ctx.fillText(`${hr}h`, barX + barW / 2, barY - 6);
      }

      // Day of week label below bar
      ctx.fillStyle = isTodayBar ? textPrimary : textSecondary;
      ctx.font = isTodayBar ? 'bold 16px system-ui, -apple-system, sans-serif' : '500 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(day.dayName, barX + barW / 2, chartContentY + chartContentH + 12);
    });

    currentY += chartH + 40;

    // --- 4. SUBJECT DISTRIBUTION & REVISIONS ---
    if (aspect === 'story' || cardY + cardH - currentY >= 140) {
      const bottomW = cardW - pad * 2;
      const bottomH = Math.min(140, cardY + cardH - currentY - 60);

      drawRoundRect(
        cardX + pad,
        currentY,
        bottomW,
        bottomH,
        24,
        isDark || isIndigo ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        cardBorder
      );

      // Subject tags
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Top Focus Subjects', cardX + pad + 24, currentY + bottomH / 2);

      let subX = cardX + pad + 260;
      weekData.topSubjects.forEach(s => {
        // Tag badge
        const tagText = `${s.subject.name} • ${Math.round(s.minutes / 60)}h`;
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        const tWidth = ctx.measureText(tagText).width;
        const bW = tWidth + 38;
        const bH = 38;
        const bY = currentY + (bottomH - bH) / 2;

        drawRoundRect(
          subX,
          bY,
          bW,
          bH,
          19,
          isDark || isIndigo ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
          cardBorder
        );

        // Dot
        ctx.fillStyle = s.subject.color || '#3B82F6';
        ctx.beginPath();
        ctx.arc(subX + 18, bY + bH / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = textPrimary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, subX + 30, bY + bH / 2);

        subX += bW + 14;
      });
    }

    // --- 5. MINIMALIST WATERMARK FOOTER ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = textSecondary;
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('StudyFlow • Spaced Repetition & Intentional Focus', width / 2, cardY + cardH - 24);

    // Create preview data URL
    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [activeModal, theme, aspect, weekData, currentStreakDays, consistencyScoreData]);

  if (activeModal !== 'share_summary') return null;

  // Actions
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    triggerHaptic('success');
    const a = document.createElement('a');
    a.download = `studyflow-week-${today}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setIsGenerating(true);
      canvas.toBlob(async blob => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setIsCopied(true);
          triggerHaptic('success');
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          // Fallback: copy text summary
          const textSummary = `StudyFlow Weekly Summary:\nTotal Study Time: ${formatDuration(weekData.totalSeconds)}\nCompleted Tasks: ${weekData.completedTasksCount}\nActive Streak: ${currentStreakDays} Days\nConsistency Score: ${consistencyScoreData.score}%`;
          await navigator.clipboard.writeText(textSummary);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } finally {
          setIsGenerating(false);
        }
      });
    } catch {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async blob => {
        if (!blob) return;
        const file = new File([blob], `studyflow-week-${today}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Weekly Study Progress — StudyFlow',
            text: `Studied ${formatDuration(weekData.totalSeconds)} across 7 days with ${weekData.completedTasksCount} tasks completed on StudyFlow!`,
            files: [file],
          });
          triggerHaptic('success');
        } else {
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={closeModal} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="p-4 sm:px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Share Weekly Progress
              </h3>
              <p className="text-[11px] text-zinc-400">
                Aesthetic summary card of your study hours and tasks
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {/* Style Controls (Theme & Aspect Ratio) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
            {/* Theme Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                Theme:
              </span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTheme('dark');
                }}
                className={`px-3 py-1 rounded-xl font-medium transition ${
                  theme === 'dark'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
                }`}
              >
                Obsidian
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTheme('light');
                }}
                className={`px-3 py-1 rounded-xl font-medium transition ${
                  theme === 'light'
                    ? 'bg-white text-zinc-900 border border-zinc-200 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
                }`}
              >
                Porcelain
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTheme('indigo');
                }}
                className={`px-3 py-1 rounded-xl font-medium transition ${
                  theme === 'indigo'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
                }`}
              >
                Midnight
              </button>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                Ratio:
              </span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAspect('square');
                }}
                className={`px-3 py-1 rounded-xl font-medium transition ${
                  aspect === 'square'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
                }`}
              >
                Square (1:1)
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAspect('story');
                }}
                className={`px-3 py-1 rounded-xl font-medium transition ${
                  aspect === 'story'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
                }`}
              >
                Story (9:16)
              </button>
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="flex justify-center items-center py-2">
            <div className="relative rounded-2xl shadow-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-[460px] flex items-center justify-center bg-zinc-950">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Weekly Progress Summary Card"
                  className="max-h-[460px] w-auto object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          {/* Hidden high-res canvas used for rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>High-res 1080p image ready to share</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition active:scale-95 shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
