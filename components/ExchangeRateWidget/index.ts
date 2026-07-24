export { default } from './ExchangeRateWidget';
/*
 * 환율 **표시 포맷**은 위젯 밖(`CurrencyToggleField` 캡션의 "1달러 = 1,478원 (2026-07-23 기준)")에서도 쓴다.
 * 두 화면이 같은 표기를 쓰도록 여기서만 내보낸다 — 복제하면 조용히 어긋난다.
 */
export { formatAsOfDate, formatKrwRate } from './ExchangeRateWidget.utils';
export type * from './ExchangeRateWidget.types';
