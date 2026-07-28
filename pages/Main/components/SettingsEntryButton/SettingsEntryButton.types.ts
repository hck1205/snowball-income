/**
 * 설정 드로어를 여는 자리. 두 곳 다 같은 핸들러와 같은 접근성 계약을 쓴다.
 *
 * - `hero`   — 페이지 히어로 액션. 첫 도착에서 가장 크게 보이고, **sticky 라 스크롤 어디서든 닿는다**
 *              (`SimulatorHero` 의 SettingsDock). 이 앱의 **상시** 설정 진입점이다.
 * - `inline` — 결과 요약 카드의 조건 스트립 우측. 숫자의 전제를 의심할 때.
 *
 * 🔴 구 `header` 변형(sticky 헤더 컨트롤 줄의 "설정 열기")은 **2026-07-29 사용자 결정으로 삭제**됐다 —
 * 히어로 버튼과 역할이 겹쳤다. 되살리지 말 것(헤더는 폭 예산이 가장 빡빡한 자리다).
 */
export type SettingsEntryVariant = 'hero' | 'inline';

export type SettingsEntryButtonProps = {
  variant: SettingsEntryVariant;
  /** 드로어 패널의 id — `aria-controls` 로 짝을 맺는다(공통 조상 `useId` 산출물). */
  drawerId: string;
  isOpen: boolean;
  onOpen: () => void;
  /** 가이드 투어 앵커(`data-tour`). 히어로 버튼 한 곳만 갖는다(상시 진입점이라 투어가 항상 찾는다). */
  dataTour?: string;
};
