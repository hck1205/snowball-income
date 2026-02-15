import { useEffect, useRef } from 'react';

type UseLongPressParams<T> = {
  delayMs: number;
  onLongPress: (value: T) => void;
};

export const useLongPress = <T,>({ delayMs, onLongPress }: UseLongPressParams<T>) => {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const clearLongPressTimer = () => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current === null) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    },
    []
  );

  const handlePressStart = (value: T) => {
    clearLongPressTimer();
    triggeredRef.current = false;
    timerRef.current = window.setTimeout(() => {
      triggeredRef.current = true;
      onLongPress(value);
    }, delayMs);
  };

  const handlePressEnd = () => {
    clearLongPressTimer();
  };

  const consumeTriggered = (): boolean => {
    if (!triggeredRef.current) return false;
    triggeredRef.current = false;
    return true;
  };

  return {
    handlePressStart,
    handlePressEnd,
    consumeTriggered
  };
};
