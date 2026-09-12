import React, { useCallback, useRef } from 'react';
import { triggerHaptic } from '../utils/audio';

interface UseLongPressOptions {
  threshold?: number; // duration in ms
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export const useLongPress = (
  callback: (e: React.SyntheticEvent) => void,
  options: UseLongPressOptions = {}
) => {
  const { threshold = 480, onStart, onFinish, onCancel } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const startCoords = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (event: React.SyntheticEvent) => {
      // Record start position if touch
      if ('touches' in event) {
        const touch = (event as unknown as React.TouchEvent).touches[0];
        startCoords.current = { x: touch.clientX, y: touch.clientY };
      } else if ('clientX' in event) {
        const mouse = event as unknown as React.MouseEvent;
        startCoords.current = { x: mouse.clientX, y: mouse.clientY };
      }

      onStart?.();
      isLongPressActive.current = false;

      timerRef.current = setTimeout(() => {
        isLongPressActive.current = true;
        triggerHaptic('medium');
        callback(event);
        onFinish?.();
      }, threshold);
    },
    [callback, threshold, onStart, onFinish]
  );

  const cancel = useCallback(
    () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!isLongPressActive.current) {
        onCancel?.();
      }
      isLongPressActive.current = false;
      startCoords.current = null;
    },
    [onCancel]
  );

  const handleMove = useCallback(
    (event: React.SyntheticEvent) => {
      if (!startCoords.current) return;
      let currentX = 0;
      let currentY = 0;

      if ('touches' in event) {
        const touch = (event as unknown as React.TouchEvent).touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;
      } else if ('clientX' in event) {
        const mouse = event as unknown as React.MouseEvent;
        currentX = mouse.clientX;
        currentY = mouse.clientY;
      }

      // If user moved more than 10px, cancel long-press (they are scrolling)
      const diffX = Math.abs(currentX - startCoords.current.x);
      const diffY = Math.abs(currentY - startCoords.current.y);
      if (diffX > 10 || diffY > 10) {
        cancel();
      }
    },
    [cancel]
  );

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: handleMove,
  };
};
