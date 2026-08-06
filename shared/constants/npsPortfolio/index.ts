import snapshot from './npsPortfolio.generated.json';
import type { NpsPortfolioSnapshot } from './npsPortfolio.types';

export * from './npsPortfolio.types';

/**
 * 국민연금 미국 주식 보유 스냅샷 — **커밋된 생성물**을 읽는 유일한 문.
 *
 * 갱신: `npm run nps:portfolio` (SEC EDGAR 13F-HR 두 분기 → 비교 → 스냅샷).
 * 자료의 한계는 `npsPortfolio.types.ts` 머리말이 못 박아 두었다 — 화면은 그것을 말해야 한다.
 */
export const NPS_PORTFOLIO = snapshot as NpsPortfolioSnapshot;

/**
 * 분기 사이 신고 총액의 변화율(%). 비교 대상이 없으면 `null`.
 *
 * ⚠ 이 값을 "국민연금이 미국 주식을 줄였다"로 읽으면 안 된다. 신고 금액은 **주가 × 수량**이라
 *   시장이 빠지면 한 주도 팔지 않아도 줄어든다. 화면이 그 전제를 함께 적어야 한다.
 */
export const npsTotalChangePercent = (input: NpsPortfolioSnapshot = NPS_PORTFOLIO): number | null => {
  const before = input.previousTotalValueUsd;
  if (before === null || before <= 0) return null;
  return ((input.totalValueUsd - before) / before) * 100;
};

/**
 * 같은 분기에 **신규와 청산 양쪽에 이름이 걸친** 발행사.
 *
 * 🔴 이것은 오류가 아니라 자료의 성질이다 — 합병·본사 이전으로 CUSIP 이 바뀌면 한 회사가
 * "청산 + 신규"로 보인다(실측: 2026-03-31 분기의 AMCOR PLC). 화면이 그 이름 옆에 단서를 달 수 있게
 * 여기서 미리 찾아 둔다. 이름 비교는 **표시용 힌트에만** 쓴다 — 데이터를 합치는 데 쓰면
 * 코카콜라 FEMSA 를 코카콜라로 잡던 오매칭을 되풀이한다.
 */
export const npsReclassifiedIssuers = (input: NpsPortfolioSnapshot = NPS_PORTFOLIO): ReadonlySet<string> => {
  const closedNames = new Set(input.closed.map((move) => move.issuer));
  return new Set(input.opened.filter((move) => closedNames.has(move.issuer)).map((move) => move.issuer));
};
