import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { TRAILING_CALL_DELAY_MS, useTrailingCall } from '@/pages/Main/hooks/interaction';

/**
 * 비중 슬라이더 기록 묶기(2026-11-08).
 *
 * 끄는 동안 픽셀마다 `allocation_changed` 가 나가 28일 1,094건/6명이 쌓였다. 잠그는 것:
 * ① 연달아 불러도 **멈춘 값 하나**만 나간다 ② 종목별로 따로 묶인다 ③ 끌고 바로 떠나도 버려지지 않는다.
 */
describe('useTrailingCall', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('🔴 슬라이더를 끄는 동안의 호출 여럿이 멈춘 값 하나로 나간다', () => {
    const send = vi.fn();
    const { result } = renderHook(() => useTrailingCall(send));

    act(() => {
      for (let weight = 10; weight <= 40; weight += 1) {
        result.current('schd', weight);
        vi.advanceTimersByTime(16); // 한 프레임 간격으로 끈다
      }
    });
    expect(send).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(TRAILING_CALL_DELAY_MS));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('schd', 40);
  });

  it('종목마다 따로 묶는다 — A 를 끌다 곧장 B 를 끌어도 A 의 마지막 값이 남는다', () => {
    const send = vi.fn();
    const { result } = renderHook(() => useTrailingCall(send));

    act(() => {
      result.current('schd', 30);
      result.current('jepi', 70);
      vi.advanceTimersByTime(TRAILING_CALL_DELAY_MS);
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith('schd', 30);
    expect(send).toHaveBeenCalledWith('jepi', 70);
  });

  it('충분히 쉬었다 다시 끌면 두 번으로 센다', () => {
    const send = vi.fn();
    const { result } = renderHook(() => useTrailingCall(send));

    act(() => {
      result.current('schd', 30);
      vi.advanceTimersByTime(TRAILING_CALL_DELAY_MS);
      result.current('schd', 50);
      vi.advanceTimersByTime(TRAILING_CALL_DELAY_MS);
    });

    expect(send.mock.calls).toEqual([['schd', 30], ['schd', 50]]);
  });

  it('🔴 끌고 곧장 화면을 떠나도(언마운트) 마지막 값을 버리지 않는다', () => {
    const send = vi.fn();
    const { result, unmount } = renderHook(() => useTrailingCall(send));

    act(() => result.current('schd', 55));
    unmount();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('schd', 55);

    vi.advanceTimersByTime(TRAILING_CALL_DELAY_MS);
    expect(send).toHaveBeenCalledTimes(1); // 타이머가 한 번 더 보내지 않는다
  });
});
