import { useEffect, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { useDrawerBackClose, useOverlayEscape } from '@/shared/hooks';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 이 페이지의 두 모달(항목 폼 · 삭제 확인)이 공유하는 **오버레이 계약**.
 *
 * 공용 `Modal` 은 껍데기(백드롭·패널·제목·액션·퇴장 aria)만 그린다 — 포털·Escape·포커스 트랩·
 * 포커스 복귀는 호출부 소유다(그 컴포넌트 JSDoc). 두 모달이 같은 계약을 두 벌로 적어 한쪽만
 * 낡는 것을 막으려고 페이지 로컬 훅 하나로 모았다. **공용 부품을 새로 만들지는 않는다**(§8).
 *
 * 🔴 지키는 것
 *  - `useOverlayEscape`·`useDrawerBackClose` 에는 **잔류값이 아니라 원래 열림 상태**를 넘긴다.
 *    퇴장 120ms 동안 스택에 남으면 그 사이의 Escape 가 이미 닫힌 층에 먹혀 두 겹이 함께 닫힌다.
 *  - `onClose` 는 **ref 로** 잡는다. 인라인 화살표를 받는 호출부에서 렌더마다 리스너를 다시 달면
 *    그 층이 스택 맨 위로 올라와 위층을 제친다.
 *  - 포커스 이펙트의 deps 는 **`[isOpen]` 뿐**이다(`onClose` 를 넣으면 렌더마다 포커스가 튄다).
 *  - 초기 포커스 ref 는 **이펙트 안에서** 읽는다 — 렌더 시점엔 아직 `null` 이다.
 *
 * ⚠ 스크롤 잠금은 여기서 하지 않는다. 공용 `Modal` 의 백드롭이 `position: fixed` 로 화면을 덮고,
 * 이 페이지에는 `body` 를 잠그는 드로어가 없어 두 축이 얽힐 일이 없다.
 */
export function useLedgerOverlay(
  isOpen: boolean,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>
): MutableRefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 렌더 시점에 `.current` 를 읽으면 첫 렌더에선 null 이다(자식 버튼이 아직 커밋 전).
  const initialFocusHolder = useRef(initialFocusRef);
  initialFocusHolder.current = initialFocusRef;

  useOverlayEscape(isOpen, onClose);
  useDrawerBackClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusables = container ? [...container.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
    (initialFocusHolder.current?.current ?? focusables[0] ?? container)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;
      const items = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // 닫을 때는 **열기 트리거로** 복원한다(TickerModal 이 세운 계약).
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
