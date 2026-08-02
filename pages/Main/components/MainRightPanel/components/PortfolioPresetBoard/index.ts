export { default } from './PortfolioPresetBoard';
export type * from './PortfolioPresetBoard.types';
/*
 * 프리셋 **데이터**의 집은 이제 `@/shared/constants/portfolioPresets` 다(2026-08-01 랜딩 트랙에서 이전).
 * 여기서 계속 re-export 하는 이유는 하나 — 이 배럴을 거쳐 프리셋을 읽던 기존 호출부(`MainRightPanel`
 * 계열)를 한 번에 갈아엎지 않기 위해서다. **새 소비처는 shared 폴더를 직접 import 하라.**
 */
export type { PortfolioPresetPlaceholder } from '@/shared/constants/portfolioPresets';
export {
  PORTFOLIO_PRESET_GROUPS,
  PORTFOLIO_PRESET_PLACEHOLDERS,
  PORTFOLIO_PRESET_VISIBLE_PER_GROUP,
  buildPresetMetrics,
  groupPortfolioPresets
} from '@/shared/constants/portfolioPresets';
