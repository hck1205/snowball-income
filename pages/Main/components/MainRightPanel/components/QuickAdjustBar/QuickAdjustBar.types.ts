import type { YieldFormValues } from '@/shared/types';

/** 인라인으로 조정할 수 있는 세 가지. 나머지 설정은 계속 드로어가 소유한다. */
export type QuickAdjustFieldKey = 'monthlyContribution' | 'durationYears' | 'targetMonthlyDividend';

export type QuickAdjustField = {
  key: QuickAdjustFieldKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** 현재 값의 표시 문자열(중립 색·tabular). */
  format: (value: number) => string;
};

export type QuickAdjustBarProps = {
  values: Pick<YieldFormValues, QuickAdjustFieldKey>;
  /**
   * 폼의 **기존 `setField` 경로**를 그대로 받는다 — 자동저장·클라우드 동기화·계측
   * (`investment_setting_changed`)이 드로어에서 바꿀 때와 완전히 같아진다.
   * 인라인 조정만의 별도 이벤트를 만들면 퍼널이 두 갈래로 갈라진다.
   */
  onSetField: <K extends QuickAdjustFieldKey>(field: K, value: YieldFormValues[K]) => void;
};
