import type { QuickAdjustField, QuickAdjustFieldKey } from './QuickAdjustBar.types';

/** 만원 단위 한국어 금액. 1억 이상은 억/만원으로 끊는다(입력 값이라 표시 통화 환산은 하지 않는다). */
export const formatKrwCompact = (value: number): string => {
  if (value <= 0) return '없음';

  const eok = Math.floor(value / 100_000_000);
  const manwon = Math.floor((value % 100_000_000) / 10_000);

  if (eok > 0) return manwon > 0 ? `${eok}억 ${manwon.toLocaleString('ko-KR')}만원` : `${eok}억원`;
  if (manwon > 0) return `${manwon.toLocaleString('ko-KR')}만원`;
  return `${value.toLocaleString('ko-KR')}원`;
};

export const formatYears = (value: number): string => `${value}년`;

/**
 * 슬라이더 트랙의 기본 범위. **저장된 값이 이 범위를 넘어도 슬라이더가 거짓말하지 않도록**
 * `resolveQuickAdjustFields` 가 현재 값까지 포함하도록 상한을 넓힌다
 * (넘는 값을 잘라 보여 주면 사용자가 만지지도 않은 설정이 조용히 줄어든 것처럼 보인다).
 */
const BASE_FIELDS: readonly Omit<QuickAdjustField, 'format'>[] = [
  { key: 'monthlyContribution', label: '월 적립', min: 0, max: 5_000_000, step: 100_000 },
  { key: 'durationYears', label: '투자 기간', min: 1, max: 40, step: 1 },
  { key: 'targetMonthlyDividend', label: '목표 월배당', min: 0, max: 10_000_000, step: 100_000 }
];

const FORMAT_BY_KEY: Record<QuickAdjustFieldKey, (value: number) => string> = {
  monthlyContribution: formatKrwCompact,
  durationYears: formatYears,
  targetMonthlyDividend: formatKrwCompact
};

/** 현재 값을 반영해 상한을 넓힌 필드 목록(순수). 값이 범위 안이면 기본 범위 그대로다. */
export const resolveQuickAdjustFields = (
  values: Record<QuickAdjustFieldKey, number>
): QuickAdjustField[] =>
  BASE_FIELDS.map((field) => {
    const current = values[field.key];
    const safeCurrent = Number.isFinite(current) ? current : field.min;
    return {
      ...field,
      max: Math.max(field.max, Math.ceil(safeCurrent / field.step) * field.step),
      format: FORMAT_BY_KEY[field.key]
    };
  });

/** 트랙 채움 비율(%) — CSS 변수로 넘겨 진행 부분을 칠한다. */
export const toTrackProgressPercent = (value: number, min: number, max: number): number => {
  const span = max - min;
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, ((value - min) / span) * 100));
};
