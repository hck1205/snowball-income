/**
 * 지수 계약은 스트립 전용이 아니라 **공용**이다 — 서버 핸들러·조회 atom·이 표시 부품이 같은 타입을 본다.
 * 정의는 `@/shared/lib/marketIndices` 에 있고 여기서는 재export 만 한다(`ExchangeRateWidget.types.ts` 패턴).
 *
 * ⚠ 참고 시세라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 */
import type { IndexChange, MarketIndexSymbol } from '@/shared/lib/marketIndices';

export type {
  IndexChange,
  MarketIndexDefinition,
  MarketIndexQuote,
  MarketIndexSymbol,
  MarketIndicesSnapshot,
  MarketIndicesView
} from '@/shared/lib/marketIndices';

/**
 * 셀 하나의 표시 모델 — 레지스트리 순서대로 만들어진다(`buildMarketIndexRows`).
 *
 * 값이 없는 지수도 **행이 사라지지 않는다**: 그리드 5칸의 정렬이 존재해서, 칸이 빠지면 다른 지수가 자리를
 * 옮겨 "이 지수는 원래 없다"로 읽힌다. 결손은 감추지 말고 말한다(무음 실패 금지).
 */
export type MarketIndexRow = {
  symbol: MarketIndexSymbol;
  /** 레지스트리 라벨. 컴포넌트가 자체 이름 맵을 갖지 않는 이유 — 단일 출처가 레지스트리다. */
  label: string;
  /** 이 지수만 못 받았으면 `null`(부분 실패). */
  price: number | null;
  /** 전일 종가가 없으면 `null` — 변동률을 0% 로 위장하지 않는다. */
  change: IndexChange | null;
};
