// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { INVESTOR_SNAPSHOT } from '@/shared/constants/investors';
import { excludedDerivativeCount, guruCount, guruReportDates, topByHolders, topByValue } from '@/pages/HippoStats/utils';

/**
 * 대가들 보유 집계의 계약.
 *
 * 🔴 이 화면은 **매수·매도가 아니라 보유**를 말한다. 13F 에 사고팔았다는 정보가 없기 때문이다.
 *    집계가 조용히 다른 것을 세기 시작하면 화면의 이름이 거짓이 되는데, 그건 오류로 드러나지 않는다.
 */

describe('🔴 옵션은 보유로 세지 않는다', () => {
  it('⭐ 콜·풋이 순위에서 빠진다 — 풋은 반대 방향 베팅이라 "담고 있다"가 거짓이 된다', () => {
    /* 스냅샷에 실제로 파생이 들어 있어야 이 테스트가 의미를 갖는다. */
    const derivatives = INVESTOR_SNAPSHOT.investors.flatMap((investor) =>
      investor.topHoldings.filter((holding) => holding.kind !== 'share')
    );
    expect(derivatives.length, '파생이 0건이면 이 가드는 아무것도 증명하지 못한다').toBeGreaterThan(0);
    expect(excludedDerivativeCount()).toBe(derivatives.length);

    /* 파생으로만 등장하는 종목은 순위에 없어야 한다. */
    const shareIssuers = new Set(
      INVESTOR_SNAPSHOT.investors.flatMap((investor) =>
        investor.topHoldings.filter((holding) => holding.kind === 'share').map((holding) => holding.issuer)
      )
    );
    for (const row of [...topByHolders(), ...topByValue()]) {
      expect(shareIssuers.has(row.issuer), `${row.issuer} 가 주식 보유 없이 순위에 들었다`).toBe(true);
    }
  });
});

describe('순위 계약', () => {
  it('열 개를 넘지 않는다 — 파이 조각이 실처럼 얇아지면 이름이 안 붙는다', () => {
    expect(topByHolders().length).toBeLessThanOrEqual(10);
    expect(topByValue().length).toBeLessThanOrEqual(10);
  });

  it('⭐ 내림차순이다 — 조각 색이 진하기 단계로 순위를 말하므로 순서가 뒤집히면 색이 거짓말한다', () => {
    const holders = topByHolders().map((row) => row.holders);
    expect(holders).toEqual([...holders].sort((left, right) => right - left));

    const values = topByValue().map((row) => row.valueUsd);
    expect(values).toEqual([...values].sort((left, right) => right - left));
  });

  it('보유한 대가 수가 전체 인원을 넘지 않는다', () => {
    for (const row of topByHolders()) {
      expect(row.holders).toBeGreaterThan(0);
      expect(row.holders).toBeLessThanOrEqual(guruCount());
    }
  });
});

describe('🔴 보고 시점이 서로 다르다는 사실을 숨기지 않는다', () => {
  it('⭐ 화면이 보여 줄 보고 시점 목록이 비어 있지 않다', () => {
    const dates = guruReportDates();
    expect(dates.length).toBeGreaterThan(0);
    /* 13F 는 기관마다 제출 분기가 갈린다 — 하나로 뭉뚱그리면 서로 다른 시점의 보유가 한 그림에
       놓인다는 사실이 사라진다. 그래서 화면은 이 목록을 전부 적는다. */
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
