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
  /**
   * 라벨을 접고 톱니 아이콘만 남긴다 (`hero` 변형 전용, 2026-08-17 사용자 지시).
   *
   * 쓰는 곳은 **스크롤로 헤더 아래에 고정된 상태** 하나다(`useStickyHeroAction` 의 `pinned`).
   * 붙는 자리는 시나리오 탭 바와 같은 띠라 폭이 귀하고, 그 맥락에서는 톱니만으로도 뜻이 통한다.
   * 🔴 접근성 이름은 `aria-label` 로 **그대로 유지**된다 — 라벨을 지우고 이름까지 잃으면 스크린리더에
   *    "버튼"만 남는다. 그래서 이름 문자열은 라벨과 같은 `SIMULATOR_COPY.settingsTitle` 하나를 쓴다.
   */
  iconOnly?: boolean;
};
