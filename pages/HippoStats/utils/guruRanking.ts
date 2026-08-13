import { INVESTOR_SNAPSHOT } from '@/shared/constants/investors';
import { tickerForCusip } from '@/shared/constants/investors/cusipToTicker';

/**
 * 대가들 13F 보유를 종목별로 모은다.
 *
 * ## 🔴 여기는 "매수·매도"가 아니다
 *
 * 13F 는 **분기말 보유 목록**이다. 그 안에 사고팔았다는 정보는 없다 — 우리 스냅샷에는 직전
 * 분기와 비교할 값도 없어서(수집기가 한 분기만 받는다) 증감조차 유도할 수 없다.
 * 그래서 이 두 그림은 **"무엇을 들고 있나"** 만 말한다. 이름과 화면 문구가 그 선을 지킨다.
 *
 * ## ⚠ 파생은 뺀다 (2026-08-09 사용자 지시)
 *
 * `kind` 가 `call`·`put` 인 행은 옵션 포지션이라 **주식 보유와 성격이 다르다.** 콜 6건·풋 2건이
 * 섞여 있는데, 이를 주식과 같은 자리에 더하면 "이 대가가 이 종목을 들고 있다"가 거짓이 된다
 * (풋은 오히려 반대 방향 베팅이다). `share` 만 센다.
 *
 * ## ⚠ 보고 시점이 서로 다르다
 *
 * 13F 는 기관마다 제출 분기가 갈린다(이 스냅샷: 2025-09-30 · 2026-03-31 · 2026-06-30).
 * 한 그림에 모으면 **서로 다른 시점의 보유가 나란히 놓인다** — 화면이 그 사실을 반드시 말한다.
 */

export type GuruRank = {
  /** 화면 라벨. 종목명이 길어 파이에서는 이것만 쓴다. */
  issuer: string;
  /**
   * 이 종목의 티커. 🔴 13F 는 티커를 주지 않고 CUSIP 만 준다 — 변환표(`tickerForCusip`)를 거치며,
   * 표에 없으면 `null`(모른다). 비교 담기 목록(`topComparableGuruHoldings`)은 이 값이 있는 것만 고른다.
   */
  ticker: string | null;
  /** 이 종목을 들고 있는 대가 수. */
  holders: number;
  /** 합산 평가액(USD). */
  valueUsd: number;
};

const TOP_N = 10;

/** `share` 만 남긴 보유 행 — 파생(call·put)은 여기서 걸러진다. */
const shareRows = () =>
  INVESTOR_SNAPSHOT.investors.flatMap((investor) =>
    investor.topHoldings.filter((holding) => holding.kind === 'share').map((holding) => ({ investor, holding }))
  );

const aggregate = (): GuruRank[] => {
  // CUSIP 을 함께 들고 다니다 마지막에 티커로 옮긴다 — 같은 issuer 는 같은 종목이라 첫 CUSIP 으로 대표한다.
  const byIssuer = new Map<string, GuruRank & { cusip: string }>();

  for (const { holding } of shareRows()) {
    const current =
      byIssuer.get(holding.issuer) ??
      { issuer: holding.issuer, ticker: null, holders: 0, valueUsd: 0, cusip: holding.cusip };
    current.holders += 1;
    current.valueUsd += holding.valueUsd;
    byIssuer.set(holding.issuer, current);
  }

  return [...byIssuer.values()].map(({ cusip, ...rank }) => ({ ...rank, ticker: tickerForCusip(cusip) }));
};

/** 가장 많은 대가가 담은 종목. 동률이면 금액이 큰 쪽이 앞. */
export const topByHolders = (): GuruRank[] =>
  aggregate()
    .sort((left, right) => right.holders - left.holders || right.valueUsd - left.valueUsd)
    .slice(0, TOP_N);

/** 합산 평가액이 큰 종목. */
export const topByValue = (): GuruRank[] =>
  aggregate()
    .sort((left, right) => right.valueUsd - left.valueUsd)
    .slice(0, TOP_N);

/** 비교 담기 목록의 한 줄 — 티커를 알고 담을 수 있는 대가 보유 종목. */
export type GuruHolding = {
  ticker: string;
  issuer: string;
  holders: number;
};

/**
 * 대가들이 담은 종목 중 **티커를 아는** 것만, 담은 대가 수 내림차순으로(연결① 의 비교 담기 원천).
 *
 * 🔴 상위 도넛(`topByHolders`)은 애플·엔비디아 같은 **무배당 대형주**가 앞자리를 채워 비교 표에
 *    없는 경우가 많다. 이 목록은 그와 별개로 **담아도 빈 비교가 열리지 않는** 종목만 모은다 —
 *    변환표에 티커가 있는 것까지 여기서 거르고, 유니버스 소속 최종 판정은 화면
 *    (`useCompareSelection.isDisabled`)이 한 번 더 한다(변환표와 유니버스는 갱신 주기가 다르다).
 */
export const topComparableGuruHoldings = (limit = 12): GuruHolding[] =>
  aggregate()
    .filter((rank): rank is GuruRank & { ticker: string } => rank.ticker !== null)
    .map((rank) => ({ ticker: rank.ticker, issuer: rank.issuer, holders: rank.holders }))
    .sort((left, right) => right.holders - left.holders || left.ticker.localeCompare(right.ticker))
    .slice(0, limit);

/** 이 집계가 덮는 보고 시점들 — 서로 다르므로 화면이 전부 보여 준다. */
export const guruReportDates = (): string[] =>
  [...new Set(INVESTOR_SNAPSHOT.investors.map((investor) => investor.reportDate))].sort();

/** 집계에 든 대가 수 — "13명 중 N명이 담았다"의 분모다. */
export const guruCount = (): number => INVESTOR_SNAPSHOT.investors.length;

/** 파생을 빼면서 사라진 행 수. 화면이 "무엇을 뺐는지"를 숫자로 말할 수 있게 한다. */
export const excludedDerivativeCount = (): number =>
  INVESTOR_SNAPSHOT.investors.reduce(
    (sum, investor) => sum + investor.topHoldings.filter((holding) => holding.kind !== 'share').length,
    0
  );
