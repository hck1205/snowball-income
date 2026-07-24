import { formatAsOfDate, formatKrwRate } from '@/components/ExchangeRateWidget';
import { DISPLAY_CURRENCY_COPY } from '@/shared/constants';
import type { CurrencyCaptionInput } from './CurrencyToggleField.types';

/**
 * 표시 통화 캡션 — "무엇으로 보이고 있고, 왜 그런가"를 한 줄로 말한다.
 *
 * 상태표(환율 상태 × 선호):
 * - `loading`            → 로딩 안내(토글 비활성)
 * - `error` + 선호 원화   → 달러를 지금 못 쓴다
 * - `error` + 선호 달러   → 원화로 **폴백 중**이다(선호는 지우지 않는다)
 * - `success`/`stale` + 적용 원화 → **빈 문자열**(기본 모드에 노이즈를 두지 않는다)
 * - `success` + 적용 달러 → 환산 근거(환율 · 기준일)
 * - `stale`   + 적용 달러 → 환산 근거 + 갱신 실패 표식
 */
export const buildCurrencyCaption = ({ currency, status, preferred, rate, asOf }: CurrencyCaptionInput): string => {
  if (status === 'loading') return DISPLAY_CURRENCY_COPY.reasonLoading;
  if (status === 'error' || rate === null) {
    return preferred === 'USD' ? DISPLAY_CURRENCY_COPY.reasonFallback : DISPLAY_CURRENCY_COPY.reasonUnavailable;
  }
  if (currency !== 'USD') return '';

  const template = status === 'stale' ? DISPLAY_CURRENCY_COPY.basisUsdStale : DISPLAY_CURRENCY_COPY.basisUsd;
  /* 표기는 환율 위젯과 동일 — 원 단위 콤마 정수 / `YYYY-MM-DD`(파싱 실패 시 원문 그대로). */
  const asOfText = asOf ? formatAsOfDate(asOf) || asOf : '';

  return template.replace('{rate}', formatKrwRate(rate)).replace('{asOf}', asOfText);
};
