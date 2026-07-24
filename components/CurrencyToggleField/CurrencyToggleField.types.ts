import type { DisplayCurrencyView } from '@/jotai';

export type CurrencyToggleFieldProps = {
  /** 표시 통화 상태 묶음(적용 통화 / 선호 / 환율 / 조회 상태). */
  display: DisplayCurrencyView;
  /** 선호 통화를 바꾼다. 환율이 없으면 적용은 원화로 남는다(상태 계층이 보장). */
  onChangeCurrency: (currency: DisplayCurrencyView['preferred']) => void;
};

/** 캡션 계산에 필요한 최소 입력 — 순수 함수로 뽑아 상태표를 그대로 테스트한다. */
export type CurrencyCaptionInput = Pick<DisplayCurrencyView, 'currency' | 'status' | 'preferred' | 'rate' | 'asOf'>;
