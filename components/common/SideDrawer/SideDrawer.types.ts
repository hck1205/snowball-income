import type { ReactNode } from 'react';
import type { BreakpointKey } from '@/shared/styles';

export type SideDrawerSide = 'left' | 'right';

/**
 * 딤·스크롤락이 켜지는 폭. 브레이크포인트 키면 그 **이하**에서만, `'always'` 면 전 폭에서 켠다.
 *
 * 두 값이 함께 필요한 이유는 드로어의 성격이 둘이기 때문이다 — **설정 드로어**는 넓은 화면에서
 * "만지면서 결과를 본다"(딤·락 OFF, 확정 결정 2026-07-28)이고, **목록 피커**는 폭과 무관하게
 * "고르고 돌아온다"는 한 갈래 동선이라 전 폭에서 모달로 뜬다.
 */
export type SideDrawerDimScope = BreakpointKey | 'always';

/**
 * 본문의 세로 배치.
 *
 * - `'scroll'`(기본): 자식이 자연 높이를 갖고 **본문 전체가 스크롤**한다. 설정 폼처럼 위에서
 *   아래로 읽는 내용에 맞다. 컨테이너 쿼리(`ConfigInputGrid` 의 1열 붕괴)가 여기 달려 있다.
 * - `'fill'`: 자식이 **남은 높이를 나눠 갖는다**(검색행은 제 높이, 목록이 나머지를 먹고 그 안에서
 *   스크롤). 목록 피커가 이 모드를 쓴다 — `flex: 1 1 auto` 자식을 기대하는 배치다.
 */
export type SideDrawerBodyLayout = 'scroll' | 'fill';

export type SideDrawerProps = {
  /** 여는 버튼의 `aria-controls` 와 짝을 맺는 id (공통 조상에서 `useId` 로 만들어 양쪽에 내린다). */
  id: string;
  /** 패널이 붙는 화면 가장자리. 기본 `'left'`. */
  side?: SideDrawerSide;
  isOpen: boolean;
  /** 시각 제목(`h2`) 겸 `aria-labelledby` 대상. */
  title: string;
  /** 닫기 버튼의 `aria-label`. */
  closeLabel: string;
  onClose: () => void;
  /** 패널 폭. 기본 `'min(92vw, 400px)'`. */
  width?: string;
  /**
   * 이 브레이크포인트 **이하**에서만 백드롭을 딤하고 body 스크롤을 잠근다. 기본 `'drawer'`(≤960).
   * 그보다 넓은 폭에서는 **투명 스크림**(클릭=닫기)만 남아, 설정을 만지면서 결과를 계속 읽고
   * 스크롤할 수 있다 — "조정 ↔ 확인" 루프를 끊지 않는 것이 이 prop 의 존재 이유다.
   *
   * `'always'` 는 전 폭 딤·락(목록 피커). 딤과 락은 **한 축**이다 — 시각 딤 없이 스크롤만 잠그면
   * "왜 안 굴러가지"가 되고, 딤 위에서 배경이 굴러가면 딤이 거짓말이 된다.
   */
  dimBelow?: SideDrawerDimScope;
  /** 본문 세로 배치. 기본 `'scroll'`. 목록 피커는 `'fill'`. */
  bodyLayout?: SideDrawerBodyLayout;
  /**
   * **다른 드로어 위에 겹치는 층**인가(2026-08-11: 설정 드로어 → 티커 생성 드로어).
   *
   * 딤·스크림·패널을 한 단 위(`zIndex.drawerStacked*`)로 올린다 — 기본값으로는 두 드로어가 같은
   * 층이라 아래 패널이 위 드로어의 딤 위로 올라온다("덮었는데 덮이지 않은" 화면).
   *
   * ⚠ 이 값은 **한 겹까지**다. 세 겹이 필요해지면 숫자를 늘리기 전에 동선을 다시 본다.
   * ⚠ 겹친 드로어는 보통 `dimBelow='always'` 와 함께 쓴다 — 아래 층을 가린 채 "고르고 돌아오는"
   *   한 갈래 동선이기 때문이다.
   */
  stacked?: boolean;
  children: ReactNode;
};
