import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/shared/utils';

/**
 * 오버레이가 **닫힌 뒤에도 잠깐 살아 있게** 해서 퇴장 애니메이션이 그려질 시간을 준다.
 *
 * 이 앱의 모달은 전부 호출부가 조건부로 마운트한다(`{isOpen && <Modal/>}`) — 그래서 닫기는
 * 언제나 **즉시 언마운트**였고 퇴장 모션이 0곳이었다. React 는 사라지는 트리를 붙잡아 주지
 * 않으므로, 붙잡는 일을 하는 훅이 하나 필요하다.
 *
 * ```tsx
 * const { value: help, phase } = useOverlayPresence(currentHelp, MODAL_EXIT_MS);
 * if (!help) return null;
 * return <ModalBackdrop $phase={phase}>…</ModalBackdrop>;
 * ```
 *
 * 열림은 **렌더 중에 그대로 통과**시킨다(잔류값을 기다리지 않는다) — 여는 쪽에 한 프레임이라도
 * 지연이 생기면 그건 그냥 느린 앱이다. 붙잡는 것은 닫힘뿐이다.
 *
 * 🔴 **열림 판정과 잔류 판정을 섞지 마라.** `useOverlayEscape`·`useDrawerBackClose` 에는
 *   여기서 돌려주는 잔류값이 아니라 **원래의 열림 상태**를 그대로 넘겨야 한다. 두 훅은 모듈
 *   스코프 스택으로 "지금 맨 위 층이 누구인가"를 정하는데, 퇴장 120ms 동안 스택에 남아 있으면
 *   그 사이에 눌린 Escape 가 이미 닫힌 층에게 먹혀 **두 겹이 한꺼번에 닫히는** 회귀가 된다
 *   (가드 `test/main/overlayEscapeNesting.test.tsx`).
 *
 * `prefers-reduced-motion` 에서는 잔류 시간이 0 이다 — 퇴장 모션이 없으니 붙잡을 이유도 없고,
 * 붙잡으면 "닫았는데 잠깐 안 없어지는" 지연으로만 느껴진다.
 */
export type OverlayPhase = 'enter' | 'exit';

export type OverlayPresence<T> = {
  /** 렌더할 값. 닫힌 뒤 `exitMs` 동안은 **마지막 열림 값**이 그대로 남는다. */
  value: T | null;
  /** 지금 그려야 할 단계. 스타일은 이 값만 보면 된다. */
  phase: OverlayPhase;
};

export function useOverlayPresence<T>(open: T | null | undefined, exitMs: number): OverlayPresence<T> {
  const [retained, setRetained] = useState<T | null>(open ?? null);
  /* 렌더 클로저가 아니라 ref 로 본다 — effect deps 에 `retained` 를 넣으면 자기 갱신에 다시 돈다. */
  const retainedRef = useRef<T | null>(retained);
  retainedRef.current = retained;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (open != null) {
      setRetained(open);
      return undefined;
    }

    // 이미 비어 있으면 붙잡을 것이 없다(닫힌 채로 리렌더되는 흔한 경우 — 타이머를 만들지 않는다).
    if (retainedRef.current == null) return undefined;

    const hold = prefersReducedMotion() ? 0 : exitMs;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setRetained(null);
    }, hold);

    return () => {
      if (timerRef.current === null) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [open, exitMs]);

  if (open != null) return { value: open, phase: 'enter' };
  return { value: retained, phase: 'exit' };
}
