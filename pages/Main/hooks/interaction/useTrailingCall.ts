import { useCallback, useEffect, useRef } from 'react';

/** 마지막 호출 뒤 이만큼 조용하면 보낸다. 슬라이더를 한 번 끌었다 놓는 동작이 한 묶음이 되는 길이. */
export const TRAILING_CALL_DELAY_MS = 600;

type Pending<Args extends unknown[]> = { timer: ReturnType<typeof setTimeout>; args: Args };

/** 묶는 키를 첫 인자로 함께 받는다 — 기록에 그 키(종목 id 등)가 필요한 경우가 대부분이다. */
type TrailingFn<Args extends unknown[]> = (key: string, ...args: Args) => void;

/**
 * 같은 키로 연달아 불리면 **마지막 인자로 한 번만** `fn` 을 부른다(키별 trailing debounce).
 *
 * ## 왜 (2026-11-08)
 * 비중 슬라이더는 끄는 동안 `onChange` 가 픽셀마다 불리고, 그때마다 `allocation_changed` 를 보냈다.
 * 28일 동안 `set_weight` 1,094건이 6명에게서 나왔다(전체 이벤트의 약 40%). 그래서 "몇 번 조정했나"를
 * 읽을 수 없었다. 화면 갱신은 매번 해야 하지만 **기록은 사람이 손을 멈춘 값 하나**면 된다.
 *
 * - 키(종목 id)별로 따로 센다 — A 를 끌다 곧장 B 를 끌어도 A 의 마지막 값이 사라지지 않는다.
 * - 언마운트 때 남은 것은 **바로 보낸다**(버리지 않는다) — 끌고 곧장 화면을 떠나도 기록이 남는다.
 * - `pointerup` 이 아니라 시간으로 묶는 이유: 키보드(←/→)·터치·마우스를 한 규칙으로 덮는다.
 */
export const useTrailingCall = <Args extends unknown[]>(
  fn: TrailingFn<Args>,
  delayMs: number = TRAILING_CALL_DELAY_MS
) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const pendingRef = useRef(new Map<string, Pending<Args>>());

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      pending.forEach(({ timer, args }, key) => {
        clearTimeout(timer);
        fnRef.current(key, ...args);
      });
      pending.clear();
    };
  }, []);

  return useCallback(
    (key: string, ...args: Args) => {
      const pending = pendingRef.current;
      const previous = pending.get(key);
      if (previous) clearTimeout(previous.timer);

      const timer = setTimeout(() => {
        pending.delete(key);
        fnRef.current(key, ...args);
      }, delayMs);
      pending.set(key, { timer, args });
    },
    [delayMs]
  );
};
