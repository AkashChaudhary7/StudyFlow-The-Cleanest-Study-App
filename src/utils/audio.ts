/**
 * Audio chime and haptic feedback utilities using Web Audio API
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Audio context might be restricted before user gesture
  }
}

export function playTimerCompleteChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, index) => {
      const now = ctx.currentTime + index * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  } catch {
    // Ignore audio error
  }
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'toggle' | 'selection';

export function triggerHaptic(type: HapticType = 'light') {
  // 1. Browser Vibration API
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light' || type === 'selection') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(22);
      } else if (type === 'heavy') {
        navigator.vibrate(35);
      } else if (type === 'success') {
        navigator.vibrate([15, 50, 20]);
      } else if (type === 'toggle') {
        navigator.vibrate(15);
      }
    } catch {
      // Ignore vibration error
    }
  }

  // 2. Micro tactile click audio fallback for devices without vibration or iOS Safari
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      // Very short, subtle mechanical tap
      osc.type = 'triangle';
      const freq = type === 'medium' || type === 'heavy' ? 240 : 380;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    }
  } catch {
    // Ignore audio context issues
  }
}
