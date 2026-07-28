import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDrawerBackClose } from '@/shared/hooks';
import { BREAKPOINT } from '@/shared/styles';
import type { BreakpointKey } from '@/shared/styles';
import type { SideDrawerProps } from './SideDrawer.types';
import {
  SideDrawerBody,
  SideDrawerCloseButton,
  SideDrawerDim,
  SideDrawerHead,
  SideDrawerPanel,
  SideDrawerScrim,
  SideDrawerTitle
} from './SideDrawer.styled';

function matchesDim(dimBelow: BreakpointKey): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(`(max-width: ${BREAKPOINT[dimBelow]}px)`).matches;
}

/**
 * 지금 딤이 켜지는 폭인가. **스크롤 잠금의 유일한 게이트**다 — 딤이 없는 폭(넓은 화면)에서
 * 페이지 스크롤까지 잠그면 "설정을 만지며 결과를 확인"하는 동선이 끊긴다.
 * CSS 딤 경계(`media.down(dimBelow)`)와 같은 토큰을 읽어 두 축이 어긋나지 않게 한다.
 */
function useIsDimmed(dimBelow: BreakpointKey): boolean {
  const [isDimmed, setIsDimmed] = useState(() => matchesDim(dimBelow));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const query = window.matchMedia(`(max-width: ${BREAKPOINT[dimBelow]}px)`);
    const sync = () => setIsDimmed(query.matches);

    sync();
    // ⚠ `MediaQueryList.addEventListener` 는 구형 Safari(<14)에 없다 — 옵셔널 호출이라 조용히
    //   no-op 이 되고 **리사이즈 추종만** 사라진다(초기값은 위 `sync()` 가 정확히 잡는다).
    query.addEventListener?.('change', sync);

    return () => query.removeEventListener?.('change', sync);
  }, [dimBelow]);

  return isDimmed;
}

/**
 * 공용 사이드 드로어. 이 레포의 드로어 4벌이 각자 조금씩 갖고 있던 계약을 **하나로 모은 것**이다.
 *
 * - 패널은 **항상 마운트**되고 열림은 CSS 가 정한다 — 언마운트/`display:none` 은 안쪽 스크롤·입력을 날린다.
 * - `useDrawerBackClose` 를 **전 해상도**에 배선한다(뒤로가기 = 닫기, URL 불변).
 * - `Escape` 는 **이미 처리된 이벤트를 가로채지 않는다**(`defaultPrevented` 확인) — 안쪽 입력의
 *   "Escape = 값 지우기"가 먼저고, 지울 게 없을 때만 드로어가 닫힌다.
 * - 열릴 때 닫기 버튼으로 포커스, 닫힐 때 **열었던 요소로 복귀**.
 * - 딤·스크롤 잠금은 `dimBelow` **이하**에서만. 넓은 폭은 투명 스크림(클릭=닫기)만 남는다.
 *
 * ⚠ 포커스 이펙트는 **열림 전이에만** 돈다(`onClose` 는 ref 로 잡는다). deps 에 `onClose` 를 두면
 *   인라인 화살표 핸들러를 넘기는 호출부에서 렌더마다 이펙트가 재실행돼 **한 글자 칠 때마다 포커스가
 *   닫기 버튼으로 끌려간다**(qa BUG-1, 2026-07-27). 호출부의 메모이제이션에 의존하지 않고 여기서 끊는다.
 *
 * ⚠ `role="dialog"`/`aria-modal` 을 **선언하지 않고**, 포커스 트랩도 **만들지 않는다** —
 *   지키지 않을 계약을 선언하지 않는다는 관례다. 제목과는 `aria-labelledby` 로 잇는다.
 *
 * ⚠ 스크롤 잠금 대상은 **`body`** 다(모달은 `documentElement` 를 잠근다). 둘을 같은 대상으로 통일하면
 *   순차 닫힘에서 한쪽이 다른 쪽의 'hidden' 을 복원해 페이지가 영구 잠긴다.
 */
export default function SideDrawer({
  id,
  side = 'left',
  isOpen,
  title,
  closeLabel,
  onClose,
  width = 'min(92vw, 400px)',
  dimBelow = 'drawer',
  children
}: SideDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const isDimmed = useIsDimmed(dimBelow);

  // 뒤로가기 = 드로어 닫기(페이지 이탈 아님). 폭과 무관하게 항상 켠다 — 이 드로어는 전 폭 오버레이다.
  useDrawerBackClose(isOpen, onClose);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // 닫힌 뒤 포커스가 body 로 떨어지면 키보드 사용자는 위치를 잃는다 — 열었던 요소로 돌린다.
      const restore = restoreRef.current;
      if (restore && restore.isConnected) restore.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isDimmed) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isDimmed]);

  return (
    <>
      <SideDrawerDim $open={isOpen} $dimBelow={dimBelow} aria-hidden />
      <SideDrawerScrim $open={isOpen} aria-hidden onClick={onClose} />
      <SideDrawerPanel id={id} $open={isOpen} $side={side} $width={width} aria-labelledby={titleId}>
        <SideDrawerHead>
          <SideDrawerTitle id={titleId}>{title}</SideDrawerTitle>
          <SideDrawerCloseButton type="button" ref={closeRef} aria-label={closeLabel} onClick={onClose}>
            <X size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          </SideDrawerCloseButton>
        </SideDrawerHead>
        <SideDrawerBody>{children}</SideDrawerBody>
      </SideDrawerPanel>
    </>
  );
}
