/**
 * 가이드 투어(스포트라이트 코치마크)의 대상과 문구.
 *
 * 투어는 **앱 상태를 절대 바꾸지 않는다.** 티커를 자동 생성하거나 드로어를 대신 열지 않고,
 * "지금 화면에 보이는 것"만 가리킨다. 그래서 각 단계의 표시 여부는 DOM 가시성으로만 결정된다
 * (`TourGuide.utils.ts`의 `resolveVisibleSteps`).
 */

/** 투어가 가리키는 DOM 대상. 화면 쪽에서는 `data-tour="<값>"` 속성으로 표시한다. */
export const TOUR_TARGET = {
  openSettings: 'open-settings',
  tickerCreate: 'ticker-create',
  portfolioPresets: 'portfolio-presets',
  portfolioComposition: 'portfolio-composition',
  investmentSettings: 'investment-settings',
  simulationResult: 'simulation-result',
  quickActions: 'quick-actions',
  scenarioTabs: 'scenario-tabs'
} as const;

export type TourTarget = (typeof TOUR_TARGET)[keyof typeof TOUR_TARGET];

/** 말풍선의 선호 배치. 공간이 부족하면 반대편으로 뒤집힌다. */
export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TourStep = {
  id: string;
  target: TourTarget;
  title: string;
  body: string;
  placement: TourPlacement;
};

/** 투어를 이미 봤는지 기록하는 키. 다음 투어 개편은 `:v2`로 올려 새로 띄운다. */
export const TOUR_STORAGE_KEY = 'snowball:tutorial:v1';

/**
 * 선언 순서 = 사용자가 실제로 밟는 순서(종목 → 포트폴리오 → 설정 → 결과 → 저장 → 비교).
 *
 * 서로 배타적인 단계가 섞여 있는 것은 의도적이다. 화면 상태에 따라 한쪽만 DOM에 존재한다:
 *  - `openSettings`      : 설정 진입 버튼. 드로어가 **전 해상도 상시**가 되면서 이 버튼도 항상 보인다
 *                          (구 "데스크톱에선 `display:none`" 서술은 더 이상 사실이 아니다).
 *  - `tickerCreate` / `investmentSettings` / `quickActions` : 설정 드로어 **안**. 드로어가 닫혀 있으면
 *                          `visibility:hidden` → 자동으로 건너뛴다(대신 `openSettings`가 그 자리를 설명한다).
 *  - `portfolioPresets`  : 빈 상태에서만 렌더된다.
 *  - `portfolioComposition` / `simulationResult` : 결과가 있을 때만 렌더된다.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'open-settings',
    target: TOUR_TARGET.openSettings,
    title: '설정은 이 버튼 안에 있어요',
    body: '종목 추가·투자 조건·공유가 모두 이 버튼 뒤에 있습니다. 투어를 마친 뒤 눌러서 열어보세요.',
    placement: 'bottom'
  },
  {
    id: 'ticker-create',
    target: TOUR_TARGET.tickerCreate,
    title: '먼저 종목을 추가하세요',
    body: '투자할 종목(티커)을 추가합니다. 프리셋에서 고르거나 배당률·성장률을 직접 입력할 수 있습니다. 만들어진 티커를 누르면 포트폴리오에 담깁니다.',
    placement: 'right'
  },
  {
    id: 'portfolio-presets',
    target: TOUR_TARGET.portfolioPresets,
    title: '추천 포트폴리오로 시작해도 좋아요',
    body: '무엇부터 할지 모르겠다면 추천 포트폴리오를 하나 고르세요. 종목과 비중, 투자 설정이 한 번에 채워집니다. 채워진 값은 언제든 투자 설정에서 바꿀 수 있습니다.',
    placement: 'left'
  },
  {
    id: 'portfolio-composition',
    target: TOUR_TARGET.portfolioComposition,
    title: '포트폴리오 비중 조절',
    body: '여러 종목을 담고 비중을 조절하면 합계가 100%로 자동 조정됩니다. 특정 종목의 비율을 고정하면 나머지끼리만 자동으로 나눠 가집니다.',
    placement: 'left'
  },
  {
    id: 'investment-settings',
    target: TOUR_TARGET.investmentSettings,
    title: '투자 설정을 넣으세요',
    body: '초기 투자금·월 투자금·투자 기간·세율을 입력합니다. 배당 재투자를 켜면 받은 배당으로 주식을 다시 사서 복리가 붙습니다.',
    placement: 'right'
  },
  {
    id: 'simulation-result',
    target: TOUR_TARGET.simulationResult,
    title: '결과 읽는 법',
    body: '기간이 끝났을 때의 최종 자산과 월 배당을 확인합니다. 맨 아래 "전량 매도한다면" 카드는 실제로 팔았을 때 내야 하는 양도세까지 빼서 보여줍니다.',
    placement: 'left'
  },
  {
    id: 'quick-actions',
    target: TOUR_TARGET.quickActions,
    title: '저장하고 공유하기',
    body: '만든 시나리오를 링크로 공유할 수 있습니다. 링크를 받은 사람은 같은 조건으로 결과를 다시 볼 수 있습니다.',
    placement: 'right'
  },
  {
    id: 'scenario-tabs',
    target: TOUR_TARGET.scenarioTabs,
    title: '여러 전략을 나란히 비교',
    body: '탭을 추가하면 다른 전략을 따로 만들어 비교할 수 있습니다. 탭을 더블클릭하면 이름 변경과 삭제, 드래그하면 순서 변경입니다.',
    placement: 'bottom'
  }
] as const;
