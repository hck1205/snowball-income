// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  NPS_PORTFOLIO,
  npsReclassifiedIssuers,
  npsTotalChangePercent
} from '@/shared/constants/npsPortfolio';
import type { NpsPortfolioSnapshot } from '@/shared/constants/npsPortfolio';
import {
  buildNpsViewModel,
  changeDirection,
  formatChangePercent,
  formatIssuer,
  formatUsdShort,
  formatWeight
} from '@/pages/Nps/utils';

/**
 * 국민연금 13F 화면의 계산 계약.
 *
 * ## 🔴 이 화면이 틀리는 방식
 * ① 비중을 **기금 전체 비중**으로 읽게 만든다 → "국민연금 자산의 6.8%가 엔비디아"라는 거짓.
 *    이건 계산이 아니라 문구의 문제라 카피가 막고, 여기서는 값이 `null` 일 때 0% 로 위장하지
 *    않는 것만 잠근다.
 * ② 신규 편입 종목의 변화율을 **0%** 로 그린다 → "안 움직였다"로 읽힌다. 실제로는 비교 대상이 없다.
 * ③ CUSIP 이 바뀐 재편입을 "청산 + 신규"로만 보여 준다 → 사용자가 자료를 의심한다.
 */

describe('금액·비율 표시', () => {
  /**
   * 🔴 **한국어 자릿수(만·억·조)로 적는다**(2026-08-05). 종전에는 "132십억 달러"였는데 한국어에
   * 없는 단위라, 읽는 사람이 1,320억으로 다시 환산해야 했다. 이 테스트가 그 회귀를 막는다.
   */
  it('달러를 한국어 자릿수(만·억·조)로 줄인다', () => {
    expect(formatUsdShort(8_940_000_000)).toBe('89억 달러');
    expect(formatUsdShort(131_700_000_000)).toBe('1,317억 달러');
    expect(formatUsdShort(36_000_000)).toBe('3,600만 달러');
    expect(formatUsdShort(4_200)).toBe('4,200달러');
  });

  /** 조 단위 — 억이 0 이면 "1조 달러"로 끝낸다("1조 0억"은 사람이 쓰지 않는 말이다). */
  it('조 단위는 억을 뒤에 붙이되, 0 이면 붙이지 않는다', () => {
    expect(formatUsdShort(1_320_000_000_000)).toBe('1조 3,200억 달러');
    expect(formatUsdShort(2_000_000_000_000)).toBe('2조 달러');
  });

  /** 🔴 부호를 **글자로** 먼저 말한다 — 색이 사라져도 방향이 남아야 한다. */
  it('변화율의 부호가 글자로 남는다', () => {
    expect(formatChangePercent(4.3)).toBe('+4.3%');
    expect(formatChangePercent(-21.3)).toBe('−21.3%');
  });

  /** 아주 작은 변화는 0 으로 접는다 — "+0.0%"는 부호가 있는 척하는 값이다. */
  it('거의 0 인 변화는 부호 없이 0 으로 접는다', () => {
    expect(formatChangePercent(0.01)).toBe('0.0%');
    expect(changeDirection(0.01)).toBe('flat');
    expect(changeDirection(1)).toBe('up');
    expect(changeDirection(-1)).toBe('down');
  });

  /** 🔴 비교 대상이 없으면 0% 가 아니라 값이 **없는** 것이다. */
  it('값이 없으면 지어내지 않는다', () => {
    expect(formatChangePercent(null)).toBe('—');
    expect(formatChangePercent(Number.NaN)).toBe('—');
    expect(formatWeight(null)).toBe('—');
    expect(changeDirection(null)).toBe('flat');
  });

  it('비중은 소수 둘째 자리까지 남긴다 — 상위 종목의 차이가 그 자리에서 갈린다', () => {
    expect(formatWeight(6.79)).toBe('6.79%');
    expect(formatWeight(0.004)).toBe('0.00%');
  });
});

describe('발행사 이름 다듬기', () => {
  /**
   * 13F 는 전부 대문자로 온다. 함부로 소문자로 내리지 않는다 — `NVIDIA` 처럼 대문자가 이름의
   * 일부인 경우가 있어서, **법인격 접미사만** 자른다.
   */
  it('법인격 접미사만 자르고 이름은 건드리지 않는다', () => {
    expect(formatIssuer('NVIDIA CORPORATION')).toBe('NVIDIA');
    expect(formatIssuer('MICROSOFT CORP')).toBe('MICROSOFT');
    expect(formatIssuer('AMAZON COM INC')).toBe('AMAZON');
    expect(formatIssuer('ROYALTY PHARMA PLC')).toBe('ROYALTY PHARMA');
  });

  it('자를 것이 없으면 원문 그대로다', () => {
    expect(formatIssuer('ALPHABET INC CL A')).toBe('ALPHABET INC CL A');
  });

  /** 잘라 내고 빈 문자열이 되면 원문을 돌려준다 — 이름 없는 줄을 만들지 않는다. */
  it('전부 잘려 비면 원문을 지킨다', () => {
    expect(formatIssuer('INC')).toBe('INC');
  });
});

describe('분기 비교', () => {
  const base: NpsPortfolioSnapshot = {
    ...NPS_PORTFOLIO,
    totalValueUsd: 110,
    previousTotalValueUsd: 100
  };

  it('총액 변화율을 낸다', () => {
    expect(npsTotalChangePercent(base)).toBeCloseTo(10, 6);
  });

  it('비교 대상이 없으면 null 이다', () => {
    expect(npsTotalChangePercent({ ...base, previousTotalValueUsd: null })).toBeNull();
    expect(npsTotalChangePercent({ ...base, previousTotalValueUsd: 0 })).toBeNull();
  });

  /**
   * 🔴 합병·본사 이전으로 CUSIP 이 바뀌면 한 회사가 "청산 + 신규"로 보인다
   * (실측: 2026-03-31 분기의 AMCOR PLC). 오류가 아니라 자료의 성질이라, 화면이 단서를 달 수
   * 있게 이름이 겹치는 것을 찾아 준다.
   */
  it('신규·청산 양쪽에 걸친 이름을 찾아 준다', () => {
    const found = npsReclassifiedIssuers({
      ...base,
      opened: [
        { cusip: 'A1', issuer: 'AMCOR PLC', valueUsd: 20 },
        { cusip: 'A2', issuer: 'OKTA INC', valueUsd: 3 }
      ],
      closed: [
        { cusip: 'B1', issuer: 'AMCOR PLC', valueUsd: 29 },
        { cusip: 'B2', issuer: 'DOCUSIGN INC', valueUsd: 4 }
      ]
    });

    expect([...found]).toEqual(['AMCOR PLC']);
  });

  it('겹치는 이름이 없으면 빈 집합이다', () => {
    expect(npsReclassifiedIssuers({ ...base, opened: [], closed: [] }).size).toBe(0);
  });
});

describe('커밋된 스냅샷의 무결성', () => {
  const snapshot = NPS_PORTFOLIO;

  it('보유 목록이 비어 있지 않다 — 빈 스냅샷이 배포되면 화면이 통째로 거짓이 된다', () => {
    expect(snapshot.topHoldings.length).toBeGreaterThan(0);
    expect(snapshot.totalHoldingCount).toBeGreaterThanOrEqual(snapshot.topHoldings.length);
    expect(snapshot.totalValueUsd).toBeGreaterThan(0);
  });

  it('보고 기준일이 제출일보다 앞선다 — 13F 는 분기말 기준이고 제출은 그 뒤다', () => {
    expect(snapshot.reportDate < snapshot.filingDate).toBe(true);
  });

  it('직전 분기가 있다면 최신보다 앞선다', () => {
    if (snapshot.previousReportDate) {
      expect(snapshot.previousReportDate < snapshot.reportDate).toBe(true);
    }
  });

  /** 🔴 신규 편입은 변화율이 **없다**. 0 으로 채워져 있으면 "안 움직였다"로 읽힌다. */
  it('신규 편입 종목에는 변화율이 없다', () => {
    for (const holding of snapshot.topHoldings) {
      if (holding.isNew) expect(holding.changePercent).toBeNull();
    }
  });

  it('보유 목록이 금액 내림차순이다', () => {
    const values = snapshot.topHoldings.map((holding) => holding.valueUsd);
    expect([...values].sort((left, right) => right - left)).toEqual(values);
  });

  it('뷰모델이 표 길이를 넘기지 않는다', () => {
    expect(buildNpsViewModel(snapshot).holdings.length).toBeLessThanOrEqual(30);
  });
});
