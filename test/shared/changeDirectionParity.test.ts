import { describe, expect, it } from 'vitest';
import { computeFxChange } from '@/shared/lib/fx';
import { computeIndexChange } from '@/shared/lib/marketIndices';
import { formatChangePercent } from '@/shared/utils';

/**
 * 🔴 **두 표면의 표기가 조용히 어긋나지 않는지** 교차 검증한다.
 *
 * `computeFxChange`(환율 위젯)와 `computeIndexChange`(지수 스트립)는 **같은 규칙**이다:
 *   - `Math.abs(percent) < 0.005`(= `10 ** -2 / 2`) 이면 `flat`
 *   - `percent` 에는 **반올림하지 않은 원값**을 담고, 부호는 표시할 때 `direction` 에서만 뽑는다
 * 서버 핸들러가 import 하는 `shared/lib/marketIndices` 의 순수성을 지키려고 두 벌로 **의도적 중복**을
 * 유지하므로(각 파일 상단 주석), 규칙이 갈리는 순간을 잡아 줄 장치가 필요하다 — **이 파일이 그 장치다.**
 * 같은 입력이면 `direction` 도 같고, 공용 포맷터(`formatChangePercent`)를 통과한 문자열도 같아야 한다.
 */

/** 실제 환율·지수대에서 나올 법한 (현재가, 전일 종가) 쌍. 상승·하락·보합·미세변동을 고루 덮는다. */
const REALISTIC_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [1478.76, 1474.04], // FX +0.32%
  [1471.39, 1474.04], // FX -0.18%
  [1474.04, 1474.04], // 완전 동일
  [1474.09, 1474.04], // +0.0034% (표시 정밀도에서 0)
  [1474.0, 1474.04], // -0.0027% (표시 정밀도에서 0)
  [7419.65, 7408.54], // S&P +0.15%
  [24953.08, 25136.58], // 나스닥 -0.73%
  [6755.75, 7097.12], // 코스피 -4.81%
  [764.86, 790.31], // 코스닥 -3.22%
  [64931.19, 64608.15], // 니케이 +0.50%
  [100.006, 100], // +0.006% → 0.01% (보합 아님)
  [99.994, 100], // -0.006% → -0.01% (보합 아님)
  [100.001, 100], // +0.001% → 보합
  [99.999, 100], // -0.001% → 보합
  [25001.25, 25000], // 정확히 +0.005% (보합 경계 동률 — 반올림 규칙이 갈리던 지점)
  [24998.75, 25000], // 정확히 -0.005% (같은 크기의 반대 방향)
  [2, 1], // +100%
  [0.5, 1] // -50%
];

describe('전일 대비 변동률 — 환율/지수 두 계산의 표기 일치', () => {
  it.each(REALISTIC_PAIRS)('(%s, %s) 에서 두 함수의 결과가 같다', (current, previous) => {
    const fx = computeFxChange(current, previous);
    const index = computeIndexChange(current, previous);

    expect(fx).not.toBeNull();
    expect(index).not.toBeNull();
    expect(index?.direction).toBe(fx?.direction);
    // 규칙이 같으므로 원값도 같고, 포맷터를 통과한 결과도 같다.
    expect(index?.percent).toBe(fx?.percent);
    expect(formatChangePercent(index!)).toBe(formatChangePercent(fx!));
  });

  it('두 함수가 "전일값 없음"을 판정하는 기준이 같다 (유한 양수만 유효)', () => {
    const invalid = [undefined, 0, -10, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    for (const previous of invalid) {
      expect(computeFxChange(100, previous), `previousClose=${String(previous)}`).toBeNull();
      expect(computeIndexChange(100, previous), `previousClose=${String(previous)}`).toBeNull();
    }
    // 현재가 쪽도 같은 기준.
    for (const current of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(computeFxChange(current, 100), `current=${String(current)}`).toBeNull();
      expect(computeIndexChange(current, 100), `current=${String(current)}`).toBeNull();
    }
  });

  it('보합은 어느 쪽이든 부호 없는 "0.00%" 다 (-0.00% 라는 거짓말이 없다)', () => {
    for (const [current, previous] of REALISTIC_PAIRS) {
      const fx = computeFxChange(current, previous);
      const index = computeIndexChange(current, previous);
      if (fx?.direction === 'flat') expect(formatChangePercent(fx)).toBe('0.00%');
      if (index?.direction === 'flat') expect(formatChangePercent(index)).toBe('0.00%');
    }
    // 원값이 음수인데 보합인 경우에도 부호가 남지 않는다(부호는 direction 에서만 뽑기 때문).
    expect(formatChangePercent(computeIndexChange(99.999, 100)!)).toBe('0.00%');
    expect(formatChangePercent(computeFxChange(99.999, 100)!)).toBe('0.00%');
  });

  /**
   * 🔴 **보합 경계 동률(`±0.005%`)** — 한때 여기서 두 구현이 갈렸다.
   * `computeFxChange` 는 `Math.round`(동률을 +∞ 쪽으로 올리는 half-up)로 보합을 판정해
   * `+0.005%` 는 `+0.01%`(up), `-0.005%` 는 보합(`0.00%`)이 됐다 — **같은 크기인데 부호에 따라 다른 판정**.
   * 이제 두 함수 모두 `Math.abs(percent) < 0.005`(엄격)라 양쪽 동률이 대칭으로 "보합 아님"이다.
   * 도달 가능한 실값이다(소수 2자리 시세: `prev=25000, price=24998.75` 가 정확히 -0.005%).
   */
  it('정확히 ±0.005% 동률에서도 두 함수가 같고, 상승/하락이 대칭이다', () => {
    // 하락 동률: 두 함수 모두 원값 -0.005 · down · "-0.01%".
    expect(computeFxChange(24998.75, 25000)).toEqual({ percent: -0.005, direction: 'down' });
    expect(computeIndexChange(24998.75, 25000)).toEqual({ percent: -0.005, direction: 'down' });
    expect(formatChangePercent(computeFxChange(24998.75, 25000)!)).toBe('-0.01%');
    expect(formatChangePercent(computeIndexChange(24998.75, 25000)!)).toBe('-0.01%');

    // 상승 동률: 부호만 뒤집힌 거울상 — 두 함수 모두 원값 +0.005 · up · "+0.01%".
    expect(computeFxChange(25001.25, 25000)).toEqual({ percent: 0.005, direction: 'up' });
    expect(computeIndexChange(25001.25, 25000)).toEqual({ percent: 0.005, direction: 'up' });
    expect(formatChangePercent(computeFxChange(25001.25, 25000)!)).toBe('+0.01%');
    expect(formatChangePercent(computeIndexChange(25001.25, 25000)!)).toBe('+0.01%');
  });
});
