/**
 * 설정 드로어를 여는 자리. 세 곳 전부 같은 핸들러와 같은 접근성 계약을 쓴다.
 *
 * - `header` — sticky 헤더 컨트롤 줄. **상시** 진입점(스크롤 어디서든 닿는다).
 * - `hero`   — 페이지 히어로 액션. 첫 도착·빈 상태에서 가장 크게 보이는 자리.
 * - `inline` — 결과 요약 카드의 조건 스트립 우측. 숫자의 전제를 의심할 때.
 */
export type SettingsEntryVariant = 'header' | 'hero' | 'inline';

export type SettingsEntryButtonProps = {
  variant: SettingsEntryVariant;
  /** 드로어 패널의 id — `aria-controls` 로 짝을 맺는다(공통 조상 `useId` 산출물). */
  drawerId: string;
  isOpen: boolean;
  onOpen: () => void;
  /** 가이드 투어 앵커(`data-tour`). 헤더 버튼 한 곳만 갖는다. */
  dataTour?: string;
};
