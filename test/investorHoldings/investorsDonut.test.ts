// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { DONUT_CIRCUMFERENCE, buildDonutSlices, monogram, personColorVar } from '@/pages/Investors/utils';
import type { InvestorHoldingRow } from '@/pages/Investors/utils';

const SERIES = ['var(--a)', 'var(--b)', 'var(--c)'];
const REST = 'var(--rest)';

const row = (
  cusip: string,
  weightPercent: number | null,
  ticker: string | null = null,
  kind: InvestorHoldingRow['kind'] = 'share'
): InvestorHoldingRow => ({
  cusip,
  issuer: `${cusip} INC`,
  weightPercent,
  ticker,
  koreanName: null,
  dividendYieldPercent: null,
  kind,
  valueUsd: (weightPercent ?? 0) * 1_000_000
});

const slice = (holdings: readonly InvestorHoldingRow[], maxSlices = 6) =>
  buildDonutSlices(holdings, { seriesVars: SERIES, maxSlices, restLabel: '그 밖', restColorVar: REST });

describe('도넛 조각', () => {
  /**
   * 🔴 이 화면에서 가장 하기 쉬운 거짓말이다. 우리가 가진 것은 상위 N종뿐인데 그 N종을 100% 로
   * 다시 나누면 "버핏의 22%가 애플"이 "45%"가 된다. 비중은 **신고분 전체 기준 그대로** 남는다.
   */
  it('상위 N종을 100%로 재정규화하지 않는다 — 남는 몫은 "그 밖"으로 남긴다', () => {
    const slices = slice([row('A', 22), row('B', 11)]);

    expect(slices.map((item) => item.percent)).toEqual([22, 11, 67]);
    expect(slices.at(-1)?.label).toBe('그 밖');
    expect(slices.at(-1)?.colorVar).toBe(REST);
  });

  it('조각의 dash 합은 둘레(100)와 같다 — 원에 틈이나 겹침이 없다', () => {
    const slices = slice([row('A', 40), row('B', 25), row('C', 5)]);

    const total = slices.reduce((sum, item) => sum + item.dash, 0);
    expect(total).toBeCloseTo(DONUT_CIRCUMFERENCE, 6);
    // offset 은 앞 조각들의 누적이다 — 어긋나면 조각이 서로를 덮는다.
    expect(slices.map((item) => item.offset)).toEqual([0, 40, 65, 70]);
  });

  /**
   * 🔴 비중을 **모르는** 종목과 비중이 **0인** 종목은 다르다. 모르는 것을 0 으로 그리면
   * "안 들고 있다"로 읽히고, 임의 값을 주면 날조다. 조각을 만들지 않고 나머지에 흡수시킨다.
   */
  it('비중을 모르는 종목은 조각으로 만들지 않는다 (0으로 그리지 않는다)', () => {
    const slices = slice([row('A', 30), row('B', null), row('C', 0)]);

    expect(slices.map((item) => item.key)).toEqual(['A', '__rest__']);
    expect(slices.at(-1)?.percent).toBe(70);
  });

  it('합이 이미 100이면 "그 밖" 조각을 만들지 않는다 (0% 조각 금지)', () => {
    const slices = slice([row('A', 60), row('B', 40)]);

    expect(slices.map((item) => item.key)).toEqual(['A', 'B']);
  });

  it('maxSlices 를 넘는 종목은 나머지로 합친다', () => {
    const slices = slice([row('A', 10), row('B', 10), row('C', 10)], 2);

    expect(slices.map((item) => item.key)).toEqual(['A', 'B', '__rest__']);
    expect(slices.at(-1)?.percent).toBe(80);
  });

  it('팔레트가 모자라면 순환한다 (색이 비지 않는다)', () => {
    const slices = slice([row('A', 10), row('B', 10), row('C', 10), row('D', 10)]);

    expect(slices.slice(0, 4).map((item) => item.colorVar)).toEqual([
      'var(--a)',
      'var(--b)',
      'var(--c)',
      'var(--a)'
    ]);
  });

  it('보유가 없으면 조각도 없다 — 빈 원을 그리지 않는다', () => {
    // 나머지 하나만 남는 형태라 호출부가 "비중 자료 없음"으로 갈아탄다.
    expect(slice([]).map((item) => item.key)).toEqual(['__rest__']);
  });

  it('라벨은 티커가 있으면 티커, 없으면 공시 이름이다', () => {
    const slices = slice([row('A', 10, 'AAPL'), row('B', 10)]);

    expect(slices.map((item) => item.label)).toEqual(['AAPL', 'B INC', '그 밖']);
  });
});

describe('아바타', () => {
  it('낱말 첫 글자를 최대 두 개 뽑는다', () => {
    expect(monogram('워런 버핏')).toBe('워버');
    expect(monogram('레이 달리오')).toBe('레달');
    // 세 낱말이어도 둘까지만 — 원 안에 세 글자는 들어가지 않는다.
    expect(monogram('세스 클라먼 주니어')).toBe('세클');
    expect(monogram('버핏')).toBe('버');
  });

  /** 카드 순서가 바뀌어도 같은 사람은 같은 색이어야 "그 사람"으로 기억된다. */
  it('인물 색은 이름에서 결정된다 — 순서가 바뀌어도 흔들리지 않는다', () => {
    expect(personColorVar('워런 버핏', SERIES)).toBe(personColorVar('워런 버핏', SERIES));
    expect(SERIES).toContain(personColorVar('레이 달리오', SERIES));
  });

  it('팔레트가 비어도 죽지 않는다', () => {
    expect(personColorVar('아무개', [])).toBe('');
  });
});
