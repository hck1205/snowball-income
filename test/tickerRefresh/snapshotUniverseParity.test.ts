// @vitest-environment node — 생성물 JSON 과 상수를 대조하는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * ## 이 테스트가 막는 사고 — **주인 없는 스냅샷 항목**
 *
 * 두 갱신 잡이 서로 **다른 목록**을 돈다:
 * - `refresh-tickers`(월 1회)는 `CURATED_DIVIDEND_UNIVERSE` 의 키를 돈다(`scripts/tickerRefresh/cli.ts`).
 * - `refresh-paydates`(매일 25건)는 **스냅샷 항목**의 키를 돈다(`scripts/tickerRefresh/payDatesQueue.ts`).
 *
 * 그래서 프리셋에서 빠진 티커의 스냅샷 항목을 지우지 않으면, 그 항목은 **가격은 영원히 안 바뀌는데
 * 지급일만 매일 갱신 후보로 남는** 상태가 된다. 화면에는 안 뜬다(앱은 유니버스 키만 읽는다) —
 * 그래서 아무도 모르는 채로, 하루 25건뿐인 Alpha Vantage 무료 할당량을 **아무도 안 보는 데이터에**
 * 쓴다. 2026-08-17 에 실제로 그 상태였다(INTC: 프리셋에서 빠진 뒤에도 `payoutMonthsSource: 'ex'` 로
 * 미정착 그룹에 남아 있었다).
 *
 * ⚠ **한쪽 방향만 검사한다.** 유니버스에 있는데 스냅샷에 없는 것은 정상이다 — 프리셋을 추가하면
 *   다음 월간 갱신 전까지 스냅샷에 없고(2026-08-17 기준 345종 중 171종이 그 상태), 그때는 큐레이션
 *   값이 그대로 쓰인다. 반대 방향만이 "주인이 사라진 데이터"다.
 */
describe('시장 데이터 스냅샷 — 큐레이션 유니버스와의 정합', () => {
  it('스냅샷의 모든 항목이 큐레이션 유니버스에 존재한다 (프리셋에서 뺀 티커는 스냅샷에서도 지운다)', () => {
    const universe = new Set(Object.keys(CURATED_DIVIDEND_UNIVERSE));
    const orphans = Object.keys(MARKET_DATA.entries).filter((ticker) => !universe.has(ticker));

    expect(
      orphans,
      '프리셋에 없는 티커의 스냅샷 항목이다. 앱은 이 값을 읽지 않는데 일간 지급일 잡은 계속 조회 후보로 삼는다 — ' +
        'shared/constants/marketData/marketData.generated.json 에서 해당 항목을 지워라.'
    ).toEqual([]);
  });

  it('스냅샷을 실제로 읽었다 (빈 스냅샷이면 위 케이스가 무의미하게 통과한다)', () => {
    expect(Object.keys(MARKET_DATA.entries).length).toBeGreaterThan(0);
  });
});
