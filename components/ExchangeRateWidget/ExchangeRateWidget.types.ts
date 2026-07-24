/**
 * 환율 계약은 위젯 전용이 아니라 **공용**이다 — 위젯과 결과 표시 통화(원↔달러 토글)가 같은 값을
 * 공유하므로 정의는 `@/shared/lib/fx` 에 있고 여기서는 기존 import 경로를 위해 재export만 한다.
 *
 * ⚠ 이 값은 **참고용**이라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 */
export type { ExchangeRateView, FxRate } from '@/shared/lib/fx';
