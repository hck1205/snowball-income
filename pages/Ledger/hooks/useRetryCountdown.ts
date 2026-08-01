import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 429(요청 제한) 재시도 카운트다운.
 *
 * 🔴 **타이머는 페이지 전체에 하나뿐이다.** 행마다 `setInterval` 을 만들면 20행에서 20개가 돈다.
 * 여기서는 남은 초를 담은 맵 하나를 1초 간격으로 줄이고, 0이 된 항목은 맵에서 뺀다(그러면
 * 그 행의 재시도 버튼이 다시 활성이 된다).
 *
 * 남은 항목이 없으면 인터벌 자체를 정리한다 — 아무도 기다리지 않는데 초당 리렌더를 만들지 않는다.
 */
export type RetryCountdown = {
  /** 행 id → 남은 초. 없으면 즉시 재시도할 수 있다. */
  seconds: ReadonlyMap<string, number>;
  /** 그 행의 대기를 시작한다(이미 대기 중이면 더 긴 쪽을 남긴다 — 백오프가 줄어들지 않게). */
  start: (id: string, seconds: number) => void;
  clear: (id: string) => void;
  clearAll: () => void;
};

export function useRetryCountdown(): RetryCountdown {
  const [seconds, setSeconds] = useState<ReadonlyMap<string, number>>(() => new Map());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (seconds.size === 0) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    if (timerRef.current !== null) return undefined;

    timerRef.current = window.setInterval(() => {
      setSeconds((previous) => {
        const next = new Map<string, number>();
        for (const [id, remaining] of previous) {
          if (remaining > 1) next.set(id, remaining - 1);
        }
        return next;
      });
    }, 1000);

    return undefined;
  }, [seconds]);

  // 언마운트에서 확실히 끊는다(위 이펙트는 `seconds` 가 비어야 정리한다).
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    },
    []
  );

  const start = useCallback((id: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setSeconds((previous) => {
      const next = new Map(previous);
      next.set(id, Math.max(next.get(id) ?? 0, Math.ceil(value)));
      return next;
    });
  }, []);

  const clear = useCallback((id: string) => {
    setSeconds((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Map(previous);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSeconds((previous) => (previous.size === 0 ? previous : new Map()));
  }, []);

  return { seconds, start, clear, clearAll };
}
