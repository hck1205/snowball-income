import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { PageFooterSlotProviderProps } from './PageFooterSlot.types';

/**
 * 푸터가 **착지할 자리**를 셸이 열어 주는 장치.
 *
 * ## 🔴 왜 이런 게 필요한가 (2026-08-03, 두 결함이 같은 원인이었다)
 * 1. **`contentinfo` 랜드마크가 죽어 있었다.** `<footer>` 는 main/section/article 의 자손이면
 *    랜드마크가 **되지 않는다**(HTML 명세). 그런데 8개 화면이 푸터를 본문 끝에서 렌더해
 *    전부 `<main>` 안에 있었다 — 실측: `footer.closest('main') !== null`.
 *    (시뮬레이터 `Main.view.tsx` 만 예외였고, 그 파일 주석이 이미 이유를 적어 두고 있었다.)
 * 2. **전폭 띠가 될 수 없었다.** 셸의 `<main>` 이 `max-width: 1200px` 라 그 안의 푸터는
 *    폭 1160 짜리 카드로만 설 수 있었다(사용자 지시는 "하단에 full width로 다 채워라").
 *
 * 둘 다 "푸터가 `<main>` 밖에 서야 한다"는 한 문장으로 풀린다.
 *
 * ## 🔴 왜 슬롯(포털)인가 — props 로 올리지 않은 이유
 * 각주는 **뷰의 상태에서 만들어진다.** `TickerComparePage` 는 `model.asOf` 가 있을 때만 한 줄을
 * 더하고, `PortfolioPage` 는 목표 카드가 떠 있을 때만 계열 주의를 붙이고,
 * `DividendCalendarPage` 는 각주에 `role="note"` JSX 노드를 넣는다.
 * 이걸 셸의 prop 으로 올리면 **컨테이너가 뷰의 내부 상태를 알아야 한다** — 방향이 거꾸로다.
 * 그래서 호출부(`<PageFooter notes={...} />`)는 **있던 자리 그대로 두고**, DOM 위치만 옮긴다.
 *
 * ## ⚠ 슬롯이 없으면 제자리에 그린다
 * 시뮬레이터(자체 셸)·커뮤니티·테스트는 이 Provider 없이 뷰를 마운트한다. 그때는 포털 없이
 * 원래 자리에 렌더된다 — **기능이 사라지지 않는다.** 그래서 기존 테스트 수십 개가 그대로 산다.
 *
 * ## ⚠ useLayoutEffect 인 이유
 * 슬롯 `div` 는 children **뒤**에 있어야 하므로(랜드마크·시각 순서), 첫 렌더 시점에는 아직 DOM 에
 * 없다. `useEffect` 로 붙이면 페인트 **후**에 푸터가 옮겨져 한 프레임 깜빡인다.
 * `useLayoutEffect` 는 페인트 전에 돌아 그 깜빡임이 없다.
 */
const PageFooterSlotContext = createContext<HTMLElement | null>(null);

/** 푸터가 착지할 자리를 아는 훅. `null` 이면 "슬롯 없음" → 제자리 렌더. */
export const usePageFooterSlot = (): HTMLElement | null => useContext(PageFooterSlotContext);

/**
 * children 을 그대로 그리고, **그 뒤에** 푸터 착지점을 연다.
 *
 * 🔴 슬롯을 children 앞에 두지 마라 — 푸터가 본문 위로 올라간다.
 * 🔴 `display: contents` 다. 이 div 는 **포털의 주소일 뿐 레이아웃에 참여하면 안 된다** —
 * 상자를 가지면 푸터가 그 상자의 자식이 되어 `AppHeader` 와 형제가 아니게 된다(사용자 지시:
 * "header와 같은 level에 위치해 있어야 한다"). contents 로 지우면 푸터 자신이 `ShellRoot` 의
 * flex 아이템이 되어 헤더·본문과 정확히 같은 층에 선다.
 * ⚠ 폭·여백은 여기서 주지 마라 — 전폭 띠라는 목적이 깨진다. 그건 푸터가 스스로 정한다.
 */
export default function PageFooterSlotProvider({ children }: PageFooterSlotProviderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setSlot(ref.current);
  }, []);

  return (
    <PageFooterSlotContext.Provider value={slot}>
      {children}
      <div ref={ref} style={{ display: 'contents' }} />
    </PageFooterSlotContext.Provider>
  );
}
