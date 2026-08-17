import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_HEADER_HEIGHT_VAR } from '@/shared/styles';

/** 헤더 아래 여백(px). 헤더 hairline 에 버튼이 딱 붙지 않게 한 칸 띄운다. */
const PIN_GAP = 8;
/** `--sb-app-header-h` 를 아직 못 읽었을 때의 헤더 높이 폴백(2줄 헤더 데스크톱 자연 높이). */
const HEADER_HEIGHT_FALLBACK = 88;

export type StickyHeroActionBox = {
  /**
   * 붙었을 때 버튼의 **우측 끝**이 설 자리 — 뷰포트 오른쪽 끝에서 흐름상 자리의 우측까지의 거리.
   *
   * 🔴 좌측(`left`)이 아니라 우측으로 고정하는 이유: 붙는 순간 버튼이 **아이콘만 남아 좁아진다**
   * (2026-08-17 사용자 지시). 좌측을 고정하면 그 폭 차이만큼 버튼이 콘텐츠 우측 끝선에서 안쪽으로
   * 밀려 들어와, 같은 줄에 붙는 시나리오 탭 바의 끝선과 어긋난다. 우측을 고정하면 폭이 어떻게
   * 바뀌어도 끝선이 맞는다.
   * ⚠ 기준은 `documentElement.clientWidth` 다 — `innerWidth` 는 스크롤바(~15px)를 포함해서
   *   `position: fixed` 의 기준(초기 컨테이닝 블록)과 어긋난다. 그만큼 버튼이 화면 밖으로 밀린다.
   */
  right: number;
  /** 흐름상 자리의 폭. 자리(placeholder)가 그대로 붙들어 레이아웃 시프트를 막는다. */
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
 * 실제 좌표(`right`/`top`)도 흐름상의 자리에서 읽는다. `100vw` 기반 CSS 계산은 스크롤바 폭(~15px)만큼
 * 어긋나 데스크톱에서 버튼이 콘텐츠 우측 끝선과 안 맞는다.
 *
 * ⚠ 붙은 버튼은 **아이콘만 남는다**(2026-08-17 사용자 지시) — 그래서 고정 좌표가 좌측이 아니라
 *   **우측**이다(`right` 필드 주석). 폭이 줄어도 콘텐츠 우측 끝선에 그대로 맞는다.
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
    /* 스크롤바를 제외한 뷰포트 폭 = `position: fixed` 의 기준(초기 컨테이닝 블록). 위 `right` 주석 참고. */
    const viewportWidth = document.documentElement.clientWidth;
    /*
     * 🔴 우측 정렬 기준은 **슬롯이 아니라 페이지 컬럼**이다(`data-page-column`, `Main.view.tsx`).
     *
     * 붙는 순간 이 버튼은 히어로 카드를 떠나 시나리오 탭 바와 같은 띠에 선다. 그래서 히어로 **안쪽**
     * 패딩 끝(슬롯의 우측)에 맞추면 탭 바의 끝선과 어긋난다 — 실측 @1280: 슬롯 1172 · 컬럼 1213 로
     * 41px 차이였고, 화면에서는 아이콘만 애매하게 안쪽으로 들어와 보였다.
     * ⚠ 표식이 없으면 슬롯 기준으로 떨어진다(끝선이 41px 안쪽이 될 뿐, 깨지지는 않는다).
     *
     * 🔴 **컬럼의 좌우 여백(gutter)을 빼야 한다.** `getBoundingClientRect` 는 border-box 라 컬럼의
     *    `padding-right` 을 포함하는데, 탭 바는 그 컬럼의 **콘텐츠 박스**에 맞춰 서 있다. 빼지 않으면
     *    아이콘이 바보다 그 여백만큼 밖으로 나간다(실측 @1280: 아이콘 1233 대 바 1213 — 20px 초과).
     */
    const column = slot.closest('[data-page-column]');
    const alignRight = column
      ? column.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(column).paddingRight || '0')
      : slot.getBoundingClientRect().right;
    setBox((prev) => {
      const next = { right: viewportWidth - alignRight, width: rect.width, height: rect.height, top };
      if (
        prev &&
        prev.right === next.right &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.top === next.top
      ) {
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
    let settleFrame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    };

    /*
     * 폭이 바뀌면 **헤더 높이도 바뀐다**(1024 경계에서 한 줄 ↔ 두 줄, 65px ↔ 105px). 그런데 그 높이를
     * 발행하는 것은 `AppHeader` 의 ResizeObserver 이고, 브라우저는 한 프레임 안에서 rAF 콜백을 먼저,
     * ResizeObserver 콜백을 그 뒤에 돌린다 — 그래서 `resize` 직후 한 프레임만 보면 **낡은 헤더 높이**를
     * 읽는다(실측: 390 → 1280 으로 되돌릴 때 버튼이 모바일 높이 기준인 119px 에 그대로 남았다).
     * 다음 프레임에 한 번 더 맞춘다. 스크롤에는 걸지 않는다 — 그쪽은 헤더 높이가 안 변한다.
     */
    const scheduleAfterResize = () => {
      schedule();
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      settleFrame = window.requestAnimationFrame(() => {
        settleFrame = window.requestAnimationFrame(() => {
          settleFrame = 0;
          sync();
        });
      });
    };

    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', scheduleAfterResize);

    // 버튼 폭(라벨·폰트 로드)과 헤더 높이 변화도 따라간다.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(slot);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', scheduleAfterResize);
      observer?.disconnect();
    };
  }, [sync]);

  return { slotRef, pinned, box };
}
