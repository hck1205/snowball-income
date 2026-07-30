// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { computeFxChange, parseFxRate } from '@/shared/lib/fx';
import { formatChangePercent } from '@/shared/utils';

/**
 * 전일 대비 변동률의 **순수 계산**과, 그 입력을 실어 나르는 `/api/fx` 파싱 계약.
 *
 * 핵심 불변식 셋:
 *   1. 전일 종가가 없으면 **변동률을 생략**한다(0% 로 위장하거나 다른 출처로 채우지 않는다).
 *   2. `previousClose` 부재는 **정상**이다 — 엣지 캐시에 이 필드가 없던 구버전 응답이 최대 24시간 남아 있다.
 *   3. `percent` 는 **반올림하지 않은 원값**이고, 부호는 표시할 때 `direction` 에서만 뽑는다
 *      (`formatChangePercent`). 그래서 보합 판정은 `±0.005%` 경계에서 **부호 대칭**이다 —
 *      같은 크기의 상승과 하락이 다른 판정을 받으면 그 자체가 결함이다.
 */

/** 환율로 쓸 수 없는 숫자들(유한한 양수만 유효). */
const UNUSABLE_NUMBERS: Array<[string, number]> = [
  ['0', 0],
  ['음수', -1],
  ['NaN', Number.NaN]
];

describe('computeFxChange', () => {
  it('전일보다 오르면 up + 양수 변동률(원값)', () => {
    // 1474.04 -> 1478.76 = +0.3202...% — percent 는 반올림하지 않은 원값이고, 표시에서 +0.32% 가 된다.
    const change = computeFxChange(1478.76, 1474.04);

    expect(change?.direction).toBe('up');
    expect(change?.percent).toBeCloseTo(0.3202, 4);
    expect(formatChangePercent(change!)).toBe('+0.32%');
  });

  it('전일보다 내리면 down + 음수 변동률(원값)', () => {
    // 1474.04 -> 1471.39 = -0.1797...% — 표시에서 -0.18%.
    const change = computeFxChange(1471.39, 1474.04);

    expect(change?.direction).toBe('down');
    expect(change?.percent).toBeCloseTo(-0.1798, 4);
    expect(formatChangePercent(change!)).toBe('-0.18%');
  });

  it('전일과 같으면 flat + 0', () => {
    expect(computeFxChange(1474.04, 1474.04)).toEqual({ percent: 0, direction: 'flat' });
  });

  it('표시 정밀도(소수 2자리)에서 0 이면 실제 값이 0 이 아니어도 flat 이다', () => {
    // +0.0034% — 반올림하면 0.00 이라 up 으로 표기하면 거짓말이 된다.
    const change = computeFxChange(1474.09, 1474.04);

    expect(change?.direction).toBe('flat');
    expect(change?.percent).toBeCloseTo(0.0034, 4); // 원값은 살아 있다(0 으로 뭉개지 않는다)
    expect(formatChangePercent(change!)).toBe('0.00%');
  });

  it('하락 쪽 미세 변동도 flat 이고 표시에 부호가 남지 않는다', () => {
    // 원값은 음수(-0.0027%)로 남지만, 부호를 direction 에서만 뽑으므로 "-0.00%" 가 찍히지 않는다.
    const change = computeFxChange(1474.0, 1474.04);

    expect(change?.direction).toBe('flat');
    expect(change?.percent).toBeCloseTo(-0.0027, 4);
    expect(formatChangePercent(change!)).toBe('0.00%');
  });

  /**
   * 🔴 **부호 대칭** — 같은 크기의 상승과 하락은 반드시 같은 판정·같은 표시 크기를 받는다.
   * 과거 이 함수는 `Math.round`(동률을 +∞ 쪽으로 올림)로 보합을 판정해 정확히 `+0.005%` 는 `+0.01%`,
   * `-0.005%` 는 보합(`0.00%`)이 되는 비대칭이 있었다. 엡실론 비교(`|percent| < 0.005`)로 바꿔 해소했고,
   * 이 케이스가 재발을 막는다. (25000 기준 ±1.25 = 정확히 ±0.005%, ±2.5 = ±0.01%, ±0.25 = ±0.001%)
   */
  const SYMMETRIC_DELTAS: Array<[string, number, 'flat' | 'moved']> = [
    ['경계 미만(±0.001%)', 0.25, 'flat'],
    ['경계 정확히(±0.005%)', 1.25, 'moved'],
    ['경계 초과(±0.01%)', 2.5, 'moved']
  ];

  it.each(SYMMETRIC_DELTAS)('%s 에서 상승과 하락이 대칭이다', (_label, delta, expectation) => {
    const base = 25000;
    const up = computeFxChange(base + delta, base);
    const down = computeFxChange(base - delta, base);

    // 크기가 같으니 절대값도 같다(부동소수점 오차 범위 내).
    expect(Math.abs(up!.percent)).toBeCloseTo(Math.abs(down!.percent), 12);

    if (expectation === 'flat') {
      expect(up?.direction).toBe('flat');
      expect(down?.direction).toBe('flat');
      expect(formatChangePercent(up!)).toBe('0.00%');
      expect(formatChangePercent(down!)).toBe('0.00%');
      return;
    }

    expect(up?.direction).toBe('up');
    expect(down?.direction).toBe('down');
    // 표시도 부호만 다르고 숫자는 같다.
    expect(formatChangePercent(up!).replace('+', '')).toBe(formatChangePercent(down!).replace('-', ''));
  });

  it('정확히 ±0.005% 는 양쪽 다 보합이 아니다 (half-up 비대칭 회귀 방지)', () => {
    expect(computeFxChange(25001.25, 25000)).toEqual({ percent: 0.005, direction: 'up' });
    expect(computeFxChange(24998.75, 25000)).toEqual({ percent: -0.005, direction: 'down' });
    expect(formatChangePercent(computeFxChange(25001.25, 25000)!)).toBe('+0.01%');
    expect(formatChangePercent(computeFxChange(24998.75, 25000)!)).toBe('-0.01%');
  });

  it('전일 종가가 없으면 null — 변동률을 생략한다', () => {
    expect(computeFxChange(1469.98, undefined)).toBeNull();
  });

  it.each(UNUSABLE_NUMBERS.concat([['Infinity', Number.POSITIVE_INFINITY]]))(
    '전일 종가가 %s 면 null',
    (_label, previousClose) => {
      expect(computeFxChange(1469.98, previousClose)).toBeNull();
    }
  );

  it.each(UNUSABLE_NUMBERS)('당일 환율이 %s 면 null(방어)', (_label, rate) => {
    expect(computeFxChange(rate, 1474.04)).toBeNull();
  });
});

describe('parseFxRate — previousClose', () => {
  const SUCCESS_BODY = {
    rate: 1469.98,
    base: 'USD',
    quote: 'KRW',
    asOf: '2026-07-27T00:00:00.000Z',
    previousClose: 1474.04
  };

  it('previousClose 가 있으면 그대로 싣는다', () => {
    expect(parseFxRate(SUCCESS_BODY)).toEqual(SUCCESS_BODY);
  });

  it('하위 호환: previousClose 가 없는 구버전 캐시 응답도 정상 파싱된다', () => {
    const parsed = parseFxRate({ rate: 1469.98, asOf: '2026-07-27T00:00:00.000Z' });

    expect(parsed).toEqual({ rate: 1469.98, base: 'USD', quote: 'KRW', asOf: '2026-07-27T00:00:00.000Z' });
    expect(parsed).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(parsed as object, 'previousClose')).toBe(false);
  });

  const INVALID_PREVIOUS_CLOSE: Array<[string, unknown]> = [
    ['0', 0],
    ['음수', -5],
    ['NaN', Number.NaN],
    ['문자열', '1474.04'],
    ['null', null]
  ];

  it.each(INVALID_PREVIOUS_CLOSE)('previousClose 가 %s 면 그 키만 떨어지고 환율은 살아남는다', (_label, previousClose) => {
    const parsed = parseFxRate({ ...SUCCESS_BODY, previousClose });

    expect(parsed?.rate).toBe(1469.98);
    expect(parsed?.previousClose).toBeUndefined();
  });

  it('파싱 결과를 computeFxChange 에 그대로 넘길 수 있다(계약 왕복)', () => {
    const parsed = parseFxRate(SUCCESS_BODY);
    const change = computeFxChange(parsed?.rate ?? 0, parsed?.previousClose);

    expect(change?.direction).toBe('down');
    expect(change?.percent).toBeCloseTo(-0.2754, 4); // 원값 (-0.2754...%)
    expect(formatChangePercent(change!)).toBe('-0.28%');
  });
});
