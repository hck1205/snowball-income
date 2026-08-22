import type { ChangeEvent } from 'react';
import type { DisplayCurrencyView } from '@/jotai';
import type { YieldFormValues } from '@/shared/types';

export type InvestmentSettingsProps = {
  values: YieldFormValues;
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
  /**
   * 결과 **표시** 통화 상태(적용 통화 / 선호 / 환율 / 조회 상태).
   * 이 컴포넌트는 프레젠테이셔널이라 atom을 직접 구독하지 않는다 — 컨테이너(MainLeftPanel)가 내려준다.
   */
  display: DisplayCurrencyView;
  validationErrors: string[];
  /**
   * 오류가 난 **필드 이름**들. 🔴 화면에 그리지 않는다 — 계측이 "어느 입력에서 막히는가"에
   * 답하기 위한 값이다(사용자가 읽는 문장은 `validationErrors`).
   */
  validationFields: string[];
  onSetField: <K extends keyof YieldFormValues>(field: K, value: YieldFormValues[K]) => void;
  onToggleQuickEstimate: (checked: boolean) => void;
  onToggleSplitGraphs: (checked: boolean) => void;
  /** 선호 표시 통화를 바꾼다. 계산에는 영향이 없다(표시 전용). */
  onChangeCurrency: (currency: DisplayCurrencyView['preferred']) => void;
  onHelpResultMode: () => void;
  onHelpReinvestTiming: () => void;
  onHelpDpsGrowthMode: () => void;
};

export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
