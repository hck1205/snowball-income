import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { scenarioPrefillAtom } from '@/jotai';
import { useGoalReachCelebration } from '@/components/ResultSummaryCard';
import { useFirstResultReveal } from '@/pages/Main/components/MainResultGrid';

/**
 * **와우 순간은 한 번만 온다.**
 *
 * 두 연출(W1 목표 도달 · W3 첫 결과 등장)의 유일한 실패 모드는 "리렌더마다 재생"이다.
 * 결과 화면은 슬라이더를 한 칸 움직일 때마다 다시 그려진다 — 잠그지 않으면 100번째 조정에서
 * 축하는 소음이 되고, 새로고침마다 도는 등장 연출은 **금지된 페이지 로드 오케스트레이션**이 된다.
 *
 * 🔴 이 계약은 **CSS 로는 볼 수 없다.** jsdom 은 `@media` 를 평가하지 않아 애니메이션 선언이
 *   통째로 사라져도 렌더 테스트가 초록이다. 그래서 발동 조건을 소유한 **훅의 반환값**을 잰다 —
 *   여기가 "언제 재생하는가"의 단일 진실이다.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('W1 목표 도달 — 세션당 한 번', () => {
  it('처음부터 달성된 화면(복원·새로고침)에서는 축하하지 않는다', () => {
    const { result } = renderHook(() => useGoalReachCelebration(true));

    expect(result.current).toBe(false);
  });

  it('미달성 → 달성으로 넘어가면 딱 한 번 참이 된다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ reached }) => useGoalReachCelebration(reached), {
      initialProps: { reached: false }
    });

    expect(result.current).toBe(false);

    rerender({ reached: true });
    expect(result.current).toBe(true);

    // 연출이 끝나면 표식이 내려간다 — 선언이 DOM 에 남아 재생 여지를 만들지 않는다.
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(false);
  });

  it('달성 상태로 몇 번을 다시 그려도 되살아나지 않는다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ reached }) => useGoalReachCelebration(reached), {
      initialProps: { reached: false }
    });

    rerender({ reached: true });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    for (let i = 0; i < 5; i += 1) {
      rerender({ reached: true });
      expect(result.current).toBe(false);
    }
  });

  it('달성 → 미달성 → 다시 달성(목표를 고쳐 왕복)에도 두 번째는 없다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ reached }) => useGoalReachCelebration(reached), {
      initialProps: { reached: false }
    });

    rerender({ reached: true });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    rerender({ reached: false });
    rerender({ reached: true });
    expect(result.current).toBe(false);
  });
});

const withStore = (prefilled: boolean) => {
  const store = createStore();
  if (prefilled) store.set(scenarioPrefillAtom, { presetId: 'prefill-schd', status: 'applied' });
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  /** 사용자가 무엇이든 바꾸면 영속 계층이 프리필 표식을 내린다 — 그 승격을 흉내낸다. */
  const promote = () => store.set(scenarioPrefillAtom, null);
  return { wrapper, promote };
};

describe('W3 첫 결과 등장 — 사용자가 만든 한 번만', () => {
  it('첫 렌더부터 결과가 있으면(복원·새로고침·공유 링크) 연출하지 않는다', () => {
    const { result } = renderHook(() => useFirstResultReveal(true), { wrapper: withStore(false).wrapper });

    expect(result.current).toBe(false);
  });

  it('빈 화면 → 사용자가 프리셋을 고르면 한 번 참이 된다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ hasResults }) => useFirstResultReveal(hasResults), {
      initialProps: { hasResults: false },
      wrapper: withStore(false).wrapper
    });

    rerender({ hasResults: true });
    expect(result.current).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe(false);
  });

  it('🔴 첫 방문 프리필로 채워진 결과에는 연출하지 않는다 (사용자가 한 일이 아니다)', () => {
    const { result, rerender } = renderHook(({ hasResults }) => useFirstResultReveal(hasResults), {
      initialProps: { hasResults: false },
      wrapper: withStore(true).wrapper
    });

    rerender({ hasResults: true });

    expect(result.current).toBe(false);
  });

  /*
   * 🔴 **억제 조건이 풀리는 것은 전이가 아니다.** 프리필 표식(`scenarioPrefillAtom`)은 사용자가 무엇이든
   *   고치는 순간 내려간다 — 그 렌더에서 결과는 **하나도 변하지 않았는데** `!isPrefilling` 만 참이 된다.
   *   발동 조건을 "결과가 있는가"(상태)로 적으면 정확히 여기서 오발한다(2026-07-31 실브라우저 실측).
   *
   *   위 "건너뛰기지 잠금이 아니다" 케이스는 이 회귀를 **못 잡는다** — 거기서는 프리필 해제 뒤에
   *   결과를 지웠다 되살리므로 오발한 연출과 정상 연출이 같은 `true` 로 겹친다(실측: 오발 뮤턴트에서
   *   9케이스 전원 초록). 결과를 그대로 둔 채 표식만 내리는 이 케이스가 유일한 감도 지점이다.
   */
  it('🔴 결과는 그대로인데 프리필 표식만 내려간 렌더에서는 연출하지 않는다 (억제 해제 ≠ 전이)', () => {
    const store = withStore(true);

    const { result, rerender } = renderHook(({ hasResults }) => useFirstResultReveal(hasResults), {
      initialProps: { hasResults: false },
      wrapper: store.wrapper
    });

    // ① 프리필이 결과를 채운다 → 연출 없음
    rerender({ hasResults: true });
    expect(result.current).toBe(false);

    // ② 사용자가 값 하나를 고친다 → 프리필 표식만 내려간다(결과는 그대로 있다)
    act(() => store.promote());
    rerender({ hasResults: true });

    expect(result.current).toBe(false);
  });

  it('🔴 프리필은 건너뛰기지 잠금이 아니다 — 그 뒤 사용자가 직접 고르면 그때 연출한다', () => {
    const store = withStore(true);

    const { result, rerender } = renderHook(({ hasResults }) => useFirstResultReveal(hasResults), {
      initialProps: { hasResults: false },
      wrapper: store.wrapper
    });

    // ① 프리필이 채운다 → 연출 없음
    rerender({ hasResults: true });
    expect(result.current).toBe(false);

    // ② 사용자가 종목을 전부 지운다(편집이므로 프리필 표식이 내려간다) → 빈 화면
    act(() => store.promote());
    rerender({ hasResults: false });

    // ③ 사용자가 직접 프리셋을 고른다 → 이번엔 사용자가 만든 첫 결과다
    rerender({ hasResults: true });
    expect(result.current).toBe(true);
  });

  it('결과가 사라졌다 다시 나타나도 두 번째 연출은 없다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ hasResults }) => useFirstResultReveal(hasResults), {
      initialProps: { hasResults: false },
      wrapper: withStore(false).wrapper
    });

    rerender({ hasResults: true });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    rerender({ hasResults: false });
    rerender({ hasResults: true });
    expect(result.current).toBe(false);
  });
});
