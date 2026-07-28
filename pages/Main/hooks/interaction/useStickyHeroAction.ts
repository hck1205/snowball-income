import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_HEADER_HEIGHT_VAR } from '@/shared/styles';

/** 헤더 아래 여백(px). 헤더 hairline 에 버튼이 딱 붙지 않게 한 칸 띄운다. */
const PIN_GAP = 8;
/** `--sb-app-header-h` 를 아직 못 읽었을 때의 헤더 높이 폴백(2줄 헤더 데스크톱 자연 높이). */
const HEADER_HEIGHT_FALLBACK = 88;

export type StickyHeroActionBox = {
  /** 붙었을 때 버튼이 설 뷰포트 x 좌표(= 흐름상 자리의 좌측). */
  left: number;
  /** 붙었을 때의 버튼 폭. 모바일 전폭 버튼도 그대로 유지된다. */
  width: number;
  /** 자리(placeholder)가 유지해야 할 높이. */
  height: number;
  /** 붙는 y 좌표(헤더 아래). */
  top: number;
};

const readHeaderHeight = (): number => {
  if (typeof document === 'undefined') return HEADER_HEIGHT_FALLBACK;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(APP_HEADER_HEIGHT_VAR);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : HEADER_HEIGHT_FALLBACK;
};

/**
 * 히어로 제목 줄의 액션 버튼을 **스크롤하면 헤더 아래에 고정**시킨다.
 *
 * 🔴 왜 `position: sticky` 가 아닌가 — `sticky` 는 **자기 컨테이닝 블록(부모의 콘텐츠 박스) 안에서만**
 * 움직인다. 이 버튼의 부모는 히어로 제목 줄(높이 ≈40px)이라 이동 범위가 40px 뿐이고, 스크롤을
 * 조금만 내려도 히어로와 함께 화면 밖으로 나간다. 버튼을 페이지 컬럼 직계 자식으로 끌어올리면
 * sticky 가 되지만 그러면 **히어로 제목 우측이라는 자리를 잃는다**(사용자가 그 자리를 원했다).
 * 그래서 자리는 그대로 두고 **같은 버튼 하나**를 `position: fixed` 로 승격시킨다(복제본 없음 —
 * DOM 에 버튼이 둘이면 포커스 순서와 접근성 트리가 지저분해진다).
 *
 * **레이아웃 시프트 0의 조건**: 버튼이 흐름에서 빠지는 순간 그 자리가 접히면 히어로 높이가 변해
 * 스크롤이 튄다(특히 모바일은 버튼이 제목 아래 전폭이라 52px 이 사라진다). 그래서 슬롯이
 * **붙기 직전의 크기를 그대로 유지**한다 — 크기는 흐름 상태에서 계속 재고 있으므로 폰트 로드·리사이즈·
 * 통화 전환으로 버튼 폭이 바뀌어도 따라간다.
 *
 * 실제 좌표(`left`/`width`)도 흐름상의 자리에서 읽는다. `100vw` 기반 CSS 계산은 스크롤바 폭(~15px)만큼
 * 어긋나 데스크톱에서 버튼이 콘텐츠 우측 끝선과 안 맞는다.
 */
export function useStickyHeroAction() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [box, setBox] = useState<StickyHeroActionBox | null>(null);

  const sync = useCallback(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    const top = readHeaderHeight() + PIN_GAP;
    setBox((prev) => {
      const next = { left: rect.left, width: rect.width, height: rect.height, top };
      if (prev && prev.left === next.left && prev.width === next.width && prev.height === next.height && prev.top === next.top) {
        return prev;
      }
      return next;
    });
    // 흐름상의 자리가 헤더 아래로 올라가면 붙는다. 붙은 뒤에도 자리는 흐름에 남아 있으므로
    // 같은 비교가 계속 성립하고, 스크롤을 되올리면 자연스럽게 풀린다(히스테리시스 불필요).
    setPinned(rect.top < top);
  }, []);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return undefined;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    };

    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // 버튼 폭(라벨·폰트 로드)과 헤더 높이 변화도 따라간다.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(slot);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [sync]);

  return { slotRef, pinned, box };
}
