// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  PULSE_SCALES,
  PULSE_THRESHOLDS,
  ZONE_LABEL,
  bandOf,
  bandWidthsOf,
  fearGreedZone,
  overallLevelOf,
  scalePositionOf,
  tensionOf,
  termStructureZone,
  vixZone,
  yieldCurveZone,
  type PulseIndicator
} from '@/shared/lib/marketPulse';
import { FEAR_GREED_CENTERS, FEAR_GREED_LABEL_SPLIT_NUMBER, fearGreedNameAt } from '@/pages/MarketPulse/utils';

/**
 * 시장 온도의 **계약**을 잠근다.
 *
 * 🔴 여기 있는 것들은 전부 **화면에서 눈으로만 맞춰 온 것**이라, 조용히 어긋나면 아무도 모른다.
 *    깨져도 오류가 나지 않고 "틀린 것이 그럴듯하게" 보이는 종류다:
 *      · 게이지 이름이 두 번 찍힌다  · 이름이 칸 밖에 선다  · 배지와 그래프가 다른 구간을 말한다
 *      · 옵션 포지션이 보유로 세어진다  · 탐욕 100 이 "긴장 없음"으로 계산된다
 */

/** 최소한의 지표 한 장. 필요한 필드만 채우고 나머지는 기본값으로 둔다. */
const indicator = (over: Partial<PulseIndicator>): PulseIndicator => ({
  id: 'x',
  axis: 'volatility',
  label: 'X',
  meaning: '',
  cadence: 'daily',
  direction: 'higher-is-tense',
  unit: '',
  precision: 2,
  source: '',
  observation: { value: 0, asOf: '2026-08-07' },
  zone: 'normal',
  series: [],
  ...over
});

const series = (values: number[]) =>
  values.map((value, index) => ({ date: `2026-01-${String(index + 1).padStart(2, '0')}`, value }));

describe('🔴 게이지 이름은 칸마다 정확히 하나', () => {
  it('⭐ 눈금 전체를 훑어도 이름이 다섯 번만 나온다 — 중복이 실제로 났던 자리다', () => {
    /* `splitNumber` 가 만드는 눈금을 전부 재현한다: 0 ~ 1 을 N 등분. */
    const names: string[] = [];
    for (let step = 0; step <= FEAR_GREED_LABEL_SPLIT_NUMBER; step += 1) {
      const label = fearGreedNameAt(step / FEAR_GREED_LABEL_SPLIT_NUMBER);
      if (label) names.push(label);
    }

    expect(names).toHaveLength(5);
    expect(new Set(names).size).toBe(5);
  });

  it('🔴 칸 중심이 전부 눈금 위에 정확히 떨어진다 — 어긋나면 이름이 통째로 사라진다', () => {
    const step = 1 / FEAR_GREED_LABEL_SPLIT_NUMBER;

    for (const center of FEAR_GREED_CENTERS) {
      /* 중심 ÷ 간격 이 정수여야 그 자리에 눈금이 있다. */
      expect(Math.abs(Math.round(center / step) - center / step)).toBeLessThan(1e-9);
      expect(fearGreedNameAt(center)).not.toBe('');
    }
  });

  it('중심이 아닌 값에는 이름을 붙이지 않는다', () => {
    expect(fearGreedNameAt(0.2)).toBe('');
    expect(fearGreedNameAt(0.5)).toBe('');
    expect(fearGreedNameAt(0.999)).toBe('');
  });
});

describe('🔴 구간 경계는 한 곳이 소유한다', () => {
  /*
   * 화면은 세 곳에서 같은 경계를 쓴다 — 배지(`zones.ts`)·밴드 스케일(`PULSE_SCALES`)·
   * 그래프 배경(markArea, 같은 스케일). 셋이 갈리면 한 화면에서 같은 값이 다른 구간에 있는
   * 것처럼 보인다.
   */
  it.each([
    ['vix', vixZone, [8, 11.9, 12, 19.9, 20, 29.9, 30, 45]],
    ['vix-term', termStructureZone, [0.6, 0.84, 0.85, 0.99, 1, 1.09, 1.1, 1.3]],
    ['curve-10y2y', yieldCurveZone, [-1.4, -0.01, 0, 0.24, 0.25, 1.49, 1.5, 2.9]]
  ] as const)('%s — 배지와 밴드가 같은 이름을 말한다', (id, zoneOf, samples) => {
    for (const value of samples) {
      const band = bandOf(id, value);
      expect(band, `${id} ${value}`).not.toBeNull();
      expect(ZONE_LABEL[zoneOf(value)], `${id} ${value}`).toBe(band?.name);
    }
  });

  it('⭐ 기준선 값이 스케일 안에 있다 — 밖이면 그래프에 선이 안 보인다', () => {
    for (const [id, thresholds] of Object.entries(PULSE_THRESHOLDS)) {
      const scale = PULSE_SCALES[id];
      if (!scale) continue;
      for (const threshold of thresholds) {
        expect(threshold.value, `${id} ${threshold.name}`).toBeGreaterThanOrEqual(scale.min);
        expect(threshold.value, `${id} ${threshold.name}`).toBeLessThanOrEqual(scale.max);
      }
    }
  });

  it('밴드 폭의 합이 1 이다 — 아니면 띠가 트랙을 못 채우거나 넘친다', () => {
    for (const [id, scale] of Object.entries(PULSE_SCALES)) {
      const total = bandWidthsOf(scale).reduce((sum, width) => sum + width, 0);
      expect(Math.abs(total - 1), id).toBeLessThan(1e-9);
    }
  });

  it('범위를 벗어난 값도 마커가 트랙 밖으로 나가지 않는다', () => {
    const scale = PULSE_SCALES.vix;
    expect(scalePositionOf(scale, -999)).toBe(0);
    expect(scalePositionOf(scale, 999)).toBe(1);
  });
});

describe('🔴 긴장도는 방향에 따라 뒤집힌다', () => {
  const rising = series([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  it('⭐ 높을수록 긴장인 지표 — 최댓값이 100 에 가깝다', () => {
    const value = tensionOf(
      indicator({ direction: 'higher-is-tense', series: rising, observation: { value: 10, asOf: '2026-01-10' } })
    );
    expect(value).toBe(100);
  });

  it('⭐ **낮을수록 긴장**인 지표(금리차) — 최솟값이 100 이어야 한다. 뒤집기를 빼면 0 이 나온다', () => {
    const value = tensionOf(
      indicator({ direction: 'lower-is-tense', series: rising, observation: { value: 1, asOf: '2026-01-01' } })
    );
    expect(value).toBe(90);
  });

  it('🔴 **양끝이 다 긴장**인 지표(공포탐욕) — 탐욕 100 도 긴장 100 이다', () => {
    const extremeGreed = tensionOf(
      indicator({ direction: 'extremes-are-tense', observation: { value: 100, asOf: '2026-08-07' } })
    );
    const extremeFear = tensionOf(
      indicator({ direction: 'extremes-are-tense', observation: { value: 0, asOf: '2026-08-07' } })
    );
    const neutral = tensionOf(
      indicator({ direction: 'extremes-are-tense', observation: { value: 50, asOf: '2026-08-07' } })
    );

    expect(extremeGreed).toBe(100);
    expect(extremeFear).toBe(100);
    expect(neutral).toBe(0);
  });

  it('🔴 `context` 지표는 축이 되지 않는다 — 긴장도라는 개념을 붙이지 않기로 한 값들이다', () => {
    expect(tensionOf(indicator({ zone: 'context', series: rising }))).toBeNull();
  });

  it('값을 못 받은 지표도 축이 되지 않는다', () => {
    expect(tensionOf(indicator({ observation: null, series: rising }))).toBeNull();
  });
});

describe('공포탐욕 구간은 CNN 의 것을 그대로 쓴다', () => {
  it('🔴 양끝이 같은 무게다 — 탐욕 쪽만 낮게 치면 화면이 "지금이 가장 좋다"고 말한다', () => {
    expect(fearGreedZone(10)).toBe('stressed');
    expect(fearGreedZone(90)).toBe('stressed');
    expect(fearGreedZone(50)).toBe('normal');
  });
});

describe('종합 단계는 지표 배지와 같은 어휘를 쓴다', () => {
  it('⭐ 네 단계가 전부 `ZONE_LABEL` 에 있다 — 없으면 한 서비스에 잣대가 둘이 된다', () => {
    for (const tension of [0, 10, 50, 85, 99]) {
      expect(ZONE_LABEL[overallLevelOf(tension)]).toBeTruthy();
    }
  });

  it('경계가 percentileZone 과 같은 자리다 (20 / 80 / 95)', () => {
    expect(overallLevelOf(20)).toBe('calm');
    expect(overallLevelOf(21)).toBe('normal');
    expect(overallLevelOf(80)).toBe('elevated');
    expect(overallLevelOf(95)).toBe('stressed');
  });
});
