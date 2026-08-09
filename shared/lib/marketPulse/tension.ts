import type { PulseIndicator } from './marketPulse.types';
import { percentileOf } from './parse';

/**
 * 지표 하나를 **0~100 긴장도**로 옮긴다 — 레이더처럼 여러 지표를 한 그림에 겹칠 때 쓴다.
 *
 * ## 🔴 왜 원값을 그대로 못 쓰나
 *
 * VIX 는 15 언저리, 금리차는 0.4, 공포탐욕지수는 64 다. 단위도 자릿수도 다른 값을 한 축에
 * 올리면 **큰 숫자를 가진 지표만 보인다.** 그래서 전부 같은 잣대(0~100)로 옮긴다.
 *
 * ## 무엇을 재나
 *
 * **자기 과거 대비 위치**다. "지난 1년 중 지금이 어디쯤인가"는 계산된 사실이지 지어낸 값이 아니다.
 * 다만 방향에 따라 셈이 다르다:
 *
 *  · `higher-is-tense` — 백분위 그대로(높을수록 긴장).
 *  · `lower-is-tense`  — 백분위를 뒤집는다(금리차는 낮을수록 긴장).
 *  · `extremes-are-tense` — 백분위가 아니라 **가운데(50)에서 얼마나 멀어졌나**를 본다.
 *    공포탐욕지수가 그렇다 — 0도 100도 눈에 띄는 상태이고 50이 평시다. 백분위로 재면
 *    "탐욕 100"이 가장 긴장이 낮은 값으로 나온다(원래 스케일이 0~100 고정이라 그렇다).
 *
 * 🔴 `context` 지표(금리 수준·지수 수준)는 **`null`** 이다. 긴장도라는 개념 자체를 붙이지 않기로
 *    한 값들이라(marketPulse.types.ts `PulseZone` 주석), 억지로 축에 올리면 없는 판정이 생긴다.
 */
export const tensionOf = (indicator: PulseIndicator): number | null => {
  const observation = indicator.observation;
  if (!observation || indicator.zone === 'context') return null;

  if (indicator.direction === 'extremes-are-tense') {
    /* 원래 스케일이 0~100 고정인 지표에만 쓴다 — 가운데에서 먼 만큼이 긴장이다. */
    return Math.min(100, Math.abs(observation.value - 50) * 2);
  }

  const percentile = percentileOf(indicator.series, observation.value);
  if (percentile === null) return null;

  return indicator.direction === 'lower-is-tense' ? 100 - percentile : percentile;
};

/** 레이더 한 축. 값을 못 구한 지표는 애초에 축이 되지 않는다. */
export type TensionAxis = {
  id: string;
  label: string;
  /** 0~100. 클수록 그 지표 기준으로 시장이 긴장해 있다. */
  value: number;
};

/**
 * 긴장도를 구할 수 있는 지표만 축으로 만든다.
 *
 * ⚠ 축 수가 3개 미만이면 레이더가 도형이 되지 않는다 — 호출부가 그때는 그리지 않는다.
 */
export const tensionAxesOf = (indicators: PulseIndicator[]): TensionAxis[] =>
  indicators.flatMap((indicator) => {
    const value = tensionOf(indicator);
    return value === null ? [] : [{ id: indicator.id, label: indicator.label, value }];
  });

/** 상위 20% 구간(=`주의` 이상)에 있는 축의 수. 화면이 한 줄 요약을 만들 때 쓴다. */
export const elevatedCountOf = (axes: TensionAxis[]): number =>
  axes.filter((axis) => axis.value >= 80).length;

/**
 * 축들을 하나로 묶은 **종합 긴장도**(0~100)와 그 단계.
 *
 * ## 🔴 계산식을 숨기지 않는다
 *
 * 여러 지표를 하나의 숫자로 합치는 순간, 그것은 관측이 아니라 **우리가 만든 값**이 된다.
 * 그래서 셈이 단순해야 하고 화면이 그 셈을 그대로 밝혀야 한다 — 여기서는 **축 긴장도의 평균**이다.
 * 가중치를 두지 않는 이유도 같다: 어떤 지표에 얼마의 무게를 줄지에 근거가 없고, 근거 없는
 * 가중치는 화면에 "우리가 중요하다고 본 것"을 몰래 심는다.
 *
 * ## 단계가 왜 넷인가
 *
 * 지표 배지가 쓰는 어휘(`ZONE_LABEL`: 안정·보통·주의·경계)를 **그대로** 쓴다. 종합에만 다른
 * 척도를 만들면 한 서비스 안에 두 잣대가 생겨, 카드의 '주의'와 통계의 '높음'이 같은 뜻인지
 * 알 수 없게 된다. 경계값도 `percentileZone` 과 같은 자리(20 / 80 / 95)에 둔다.
 *
 * ⚠ 이것은 **시장의 긴장도**이지 매매 신호가 아니다. '경계'는 "시장이 불안하다"이지
 *   "팔아야 한다"가 아니다.
 */
export const overallTensionOf = (axes: TensionAxis[]): number | null => {
  if (axes.length === 0) return null;
  return axes.reduce((sum, axis) => sum + axis.value, 0) / axes.length;
};

/** 종합 긴장도 → 지표 배지와 **같은 어휘**의 단계. */
export const overallLevelOf = (tension: number): 'calm' | 'normal' | 'elevated' | 'stressed' => {
  if (tension >= 95) return 'stressed';
  if (tension >= 80) return 'elevated';
  if (tension <= 20) return 'calm';
  return 'normal';
};
