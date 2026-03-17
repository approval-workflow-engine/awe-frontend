import { useEffect, useRef, useCallback } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      stop();
      return;
    }

    timerRef.current = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return stop;
  }, [intervalMs, enabled, stop]);

  return { stop };
}
