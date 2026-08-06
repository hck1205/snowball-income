// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  CONGRESS_TRADES,
  isOpenEnded,
  netDirection,
  tradeCount
} from '@/shared/constants/congressTrades';
import {
  buildCongressViewModel,
  formatDistrict,
  formatTradeDate,
  formatUsdCompact,
  formatUsdRange
} from '@/pages/Congress/utils';

/**
 * 미 하원 거래 공시 화면의 계산 계약.
 *
 * ## 🔴 이 테스트가 진짜로 막는 것
 * 이 자료의 금액은 **구간**이다(`$1,001 - $15,000`). 편의를 위해 가운뎃값 하나로 접고 싶은
 * 유혹이 계속 생기는데, 그 순간 화면의 숫자는 **어떤 공시에도 없는 값**이 된다. 여기서 그
 * 규율을 값으로 못 박는다 — 포맷터는 "A ~ B" 또는 "A 이상" 두 형태만 낼 수 있다.
 */

describe('금액 구간 표시 — 가운뎃값을 만들지 않는다', () => {
  it('상한이 있으면 범위로 말한다', () => {
    expect(formatUsdRange(1_001, 15_000)).toBe('1K달러 ~ 15K달러');
    /* 1,000만 달러를 넘으면 소수를 버린다 — 그 자리에서 0.1M(=10만 달러)은 표의 폭만큼 값이 없다. */
    expect(formatUsdRange(11_691_126, 39_940_000)).toBe('12M달러 ~ 40M달러');
    expect(formatUsdRange(1_500_000, 9_900_000)).toBe('1.5M달러 ~ 9.9M달러');
  });

  /**
   * 🔴 `maxUsd === null` 은 최상단 구간(5,000만 달러 초과)이 섞였다는 뜻이지 **0 이 아니다.**
   * 0 으로 읽으면 가장 큰 거래가 가장 작아 보인다 — 정반대의 거짓이다.
   */
  it('상한이 없으면 “이상”으로 말한다', () => {
    expect(formatUsdRange(50_000_001, null)).toBe('50M달러 이상');
  });

  it('상·하한이 같으면 한 값으로만 말한다', () => {
    expect(formatUsdRange(15_000, 15_000)).toBe('15K달러');
  });

  it('자릿수를 줄여도 단위를 잃지 않는다', () => {
    expect(formatUsdCompact(999)).toBe('999달러');
    expect(formatUsdCompact(1_500)).toBe('2K달러');
    expect(formatUsdCompact(1_500_000)).toBe('1.5M달러');
    expect(formatUsdCompact(12_000_000)).toBe('12M달러');
  });

  it('말이 안 되는 값은 지어내지 않는다', () => {
    expect(formatUsdCompact(Number.NaN)).toBe('—');
    expect(formatUsdCompact(-1)).toBe('—');
  });
});

describe('지역구 표기', () => {
  it('주 약칭과 지역구 번호를 푼다', () => {
    expect(formatDistrict('MI09')).toBe('MI 9구');
    expect(formatDistrict('TX32')).toBe('TX 32구');
  });

  /** `00` 은 주 전체가 한 선거구인 경우다(알래스카 등) — "0구"라고 쓰면 틀린 말이 된다. */
  it('전역 선거구를 “0구”라고 부르지 않는다', () => {
    expect(formatDistrict('AK00')).toBe('AK 전역');
  });

  it('형식이 아니면 원문을 그대로 둔다', () => {
    expect(formatDistrict('SENATE')).toBe('SENATE');
  });
});

describe('거래일 표기', () => {
  it('월·일만 남긴다 — 연도는 표 위 집계 구간이 이미 말한다', () => {
    expect(formatTradeDate('2026-07-24')).toBe('7월 24일');
    expect(formatTradeDate('2026-01-05')).toBe('1월 5일');
  });

  it('형식이 아니면 원문을 그대로 둔다', () => {
    expect(formatTradeDate('unknown')).toBe('unknown');
  });
});

describe('방향 판정', () => {
  it('매수·매도 건수를 더한다 — 교환은 방향이 없어 어느 쪽에도 세지 않는다', () => {
    expect(tradeCount({ buys: 67, sells: 59 })).toBe(126);
  });

  /** 같으면 `null` 이다 — "중립"이라는 세 번째 상태를 억지로 한쪽에 붙이지 않는다. */
  it('같으면 어느 쪽도 아니다', () => {
    expect(netDirection({ buys: 5, sells: 5 })).toBeNull();
    expect(netDirection({ buys: 6, sells: 5 })).toBe('buy');
    expect(netDirection({ buys: 5, sells: 6 })).toBe('sell');
  });

  it('상한 없는 구간을 알아본다', () => {
    expect(isOpenEnded({ minUsd: 1, maxUsd: null })).toBe(true);
    expect(isOpenEnded({ minUsd: 1, maxUsd: 2 })).toBe(false);
  });
});

describe('커밋된 스냅샷의 무결성', () => {
  const snapshot = CONGRESS_TRADES;

  it('집계가 비어 있지 않다 — 빈 스냅샷이 배포되면 화면이 통째로 거짓이 된다', () => {
    expect(snapshot.topTickers.length).toBeGreaterThan(0);
    expect(snapshot.topMembers.length).toBeGreaterThan(0);
    expect(snapshot.recent.length).toBeGreaterThan(0);
    expect(snapshot.coverage.equityTransactions).toBeGreaterThan(0);
  });

  /** 🔴 스캔 제출로 빠진 건수를 숨기면 "전부 읽었다"로 읽힌다 — 화면이 그 수를 말할 수 있어야 한다. */
  it('읽은 공시 수가 전체 이하이고, 빠진 수가 드러나 있다', () => {
    expect(snapshot.coverage.filingsRead).toBeLessThanOrEqual(snapshot.coverage.filingsTotal);
    expect(snapshot.coverage.filingsScanned).toBeGreaterThanOrEqual(0);
  });

  it('집계 구간이 뒤집혀 있지 않다', () => {
    expect(snapshot.window.start <= snapshot.window.end).toBe(true);
  });

  /** 미래 날짜는 신고자 오타다(실측: 2026-12-26). 수집기가 걸러야 하고, 여기서 그 계약을 잠근다. */
  it('최근 거래에 수집일보다 나중 날짜가 없다', () => {
    for (const trade of snapshot.recent) {
      expect(trade.date <= snapshot.generatedAt, `${trade.date} 가 수집일보다 나중이다`).toBe(true);
    }
  });

  /** 종목 이름 자리에 남의 체결 내역 줄글이 들어왔던 실측 사고를 잠근다. */
  it('종목 이름에 체결 내역 줄글이 섞이지 않는다', () => {
    for (const row of snapshot.topTickers) {
      expect(row.name.length).toBeLessThanOrEqual(80);
      expect(row.name).not.toMatch(/@|shares/);
    }
  });

  it('뷰모델이 표 길이를 넘기지 않는다', () => {
    const viewModel = buildCongressViewModel(snapshot);
    expect(viewModel.tickers.length).toBeLessThanOrEqual(20);
    expect(viewModel.members.length).toBeLessThanOrEqual(15);
    expect(viewModel.recent.length).toBeLessThanOrEqual(30);
  });
});
