import type { DisplayCurrencyView } from '@/jotai';
import { formatUSD } from '@/shared/utils';

/**
 * 원화 금액 입력 필드에 붙일 **달러 환산 보조 표기**.
 *
 * ## 왜 입력값을 달러로 바꾸지 않는가
 * 이 필드들은 표시가 아니라 **입력**이다. 값을 달러로 바꿔 받으면 저장은 원화라서 타이핑할 때마다
 * 환율을 왕복하게 되고, 토글을 껐다 켜면 `1,500,000 → 1,499,478` 처럼 끝자리가 흔들린다.
 * 표시 토글이 **저장된 값을 바꾸는 것**은 사용자 자산(저장 슬롯·공유 링크)에 대한 배신이다.
 * 그래서 입력·저장·계산은 원화로 고정하고, 달러는 읽기 전용 참고로만 병기한다.
 *
 * ## 안 보여주는 경우
 * - 적용 통화가 달러가 아님 → 원화 모드에 노이즈를 두지 않는다(캡션 정책과 동일).
 * - 환율 없음(`rate == null`) → 여기서 나누면 `$NaN` 이다. 상태 계층의 effective/preferred 분리가
 *   1차 방어선이고, 이 가드가 2차다(포맷터 `createResultAmountFormatter` 와 같은 규약).
 * - 값이 0 이하이거나 유한하지 않음 → `≈ $0` 은 알려주는 게 없다.
 */
export const buildAmountHint = (krwValue: number, display: DisplayCurrencyView): string | undefined => {
  if (display.currency !== 'USD' || !display.rate) return undefined;
  if (!Number.isFinite(krwValue) || krwValue <= 0) return undefined;
  return `≈ ${formatUSD(krwValue / display.rate)}`;
};
