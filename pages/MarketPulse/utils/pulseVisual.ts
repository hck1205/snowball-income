import type { PulseIndicator, PulseZone } from '@/shared/lib/marketPulse';

/**
 * 구간 → 화면 표현.
 *
 * ## 🔴 색만으로 말하지 않는다
 *
 * 이 레포의 접근성 규칙(색 단독 채널 금지)이 여기서 특히 중요하다 — 구간은 이 화면의 **핵심
 * 정보**인데, 색만 다르면 색각 이상이 있는 사용자에게는 카드 여덟 장이 전부 같은 카드다.
 * 그래서 구간마다 **글자 라벨**이 함께 서고(`ZONE_LABEL`), 아래 `weight` 가 테두리 굵기까지 바꾼다.
 *
 * ## ⚠ 손익색을 쓰지 않는다
 *
 * `dataPositive`(상승 적색)·`dataNegative`(하락 청색)는 **가격의 방향**을 말하는 토큰이다.
 * 여기서 재는 것은 긴장도라 뜻이 다르다 — 같은 색을 쓰면 "VIX 가 빨간색 = 올랐다"로 읽힌다.
 * 중립 팔레트(accent·warning·danger)만 쓴다.
 */

export type ZoneVisual = {
  /** 토큰 이름. styled 가 `color[...]` 로 집어 쓴다. */
  tone: 'accent' | 'neutral' | 'warning' | 'danger' | 'muted';
  /** 테두리 강조 — 색 말고도 구간이 드러나게 한다. */
  weight: 1 | 2;
};

export const ZONE_VISUAL: Record<PulseZone, ZoneVisual> = {
  calm: { tone: 'accent', weight: 1 },
  normal: { tone: 'neutral', weight: 1 },
  elevated: { tone: 'warning', weight: 2 },
  stressed: { tone: 'danger', weight: 2 },
  context: { tone: 'muted', weight: 1 },
  unknown: { tone: 'muted', weight: 1 }
};

/**
 * 값 표기. `precision` 과 `unit` 은 서버가 지표마다 정해 보낸다 —
 * 화면이 다시 정하면 같은 숫자가 두 자리에서 다른 소수점으로 보인다.
 */
export const formatPulseValue = (indicator: PulseIndicator): string => {
  const observation = indicator.observation;
  if (!observation) return '—';
  const digits = indicator.precision;
  const formatted = observation.value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  /* 부호를 붙인다 — 금리차는 음수(역전)가 곧 사건이라 `+`/`-` 가 눈에 띄어야 한다. */
  const signed = indicator.unit === '%p' && observation.value > 0 ? `+${formatted}` : formatted;
  return `${signed}${indicator.unit}`;
};

/** `2026-08-07` → `8월 7일`. 🔴 `new Date()` 로 파싱하지 않는다 — 시간대에 하루가 밀린다. */
export const formatPulseDate = (iso: string): string => {
  const [, month, day] = iso.split('-');
  if (!month || !day) return iso;
  return `${Number(month)}월 ${Number(day)}일`;
};

/** 축 순서 — 화면에서 묶음이 서는 차례. 긴장을 먼저 보여주고 배경을 뒤에 둔다. */
export const AXIS_ORDER = ['volatility', 'credit', 'sentiment', 'macro', 'valuation', 'breadth'] as const;
