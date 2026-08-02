/**
 * 전략·대가 포트폴리오 프리셋 13종의 **단일 출처**.
 *
 * 원래 이 데이터는
 * `pages/Main/components/MainRightPanel/components/PortfolioPresetBoard/PortfolioPresetBoard.constants.ts`
 * 안에 살았다. 2026-08-01 랜딩(`pages/Landing`)이 같은 13종을 둘러보기 지면으로 쓰게 되면서
 * **페이지가 다른 페이지를 import 하는 구조 규칙 위반**이 되어 여기로 옮겼다. 화면은 하나도 바뀌지
 * 않는다 — `PortfolioPresetBoard` 는 이 폴더에서 그대로 읽는다.
 *
 * ⚠ **최상위 배럴(`shared/constants/index.ts`)에는 연결하지 않는다.** `PRESET_ICON_BY_ID` 가
 * lucide 를 끌고 오므로, 앱 전역에서 import 되는 배럴에 얹으면 아이콘 13개가 무조건 엔트리에 실린다
 * (`shared/constants/tickers`·`community`·`routes` 와 같은 격리). 소비는 **폴더 경로로만**:
 * `import { PORTFOLIO_PRESET_GROUPS } from '@/shared/constants/portfolioPresets'`.
 *
 * 🔴 **랜딩이 렌더해도 되는 필드는 `title`·`hook`·`allocations` 뿐이다.**
 * `expectedMonthlyDividend`·`monthlyInvestment`·`targetInvestment`·`investmentPeriod` 는 엔진 계산이
 * 아니라 손으로 적은 큐레이션 문구라, 로그인 없이 크롤러가 읽는 지면에 쓰면 **근거 없는 수익 약속**이
 * 된다(docs/landing-page-spec.md §4 S6 데이터 규율). 시뮬레이터 프리셋 카드의 기존 노출은 별건이다.
 */
export {
  PORTFOLIO_PRESET_GROUPS,
  PORTFOLIO_PRESET_PLACEHOLDERS,
  PORTFOLIO_PRESET_VISIBLE_PER_GROUP,
  PRESET_ICON_BY_ID,
  PRESET_ICON_FALLBACK,
  PRESET_ICON_STROKE
} from './portfolioPresets.constants';
export type {
  PortfolioPresetGroup,
  PortfolioPresetGroupId,
  PortfolioPresetPlaceholder
} from './portfolioPresets.constants';
export { buildPresetMetrics, groupPortfolioPresets } from './portfolioPresets.utils';
export type { PortfolioPresetGroupSection } from './portfolioPresets.utils';
