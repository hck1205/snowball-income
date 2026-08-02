import { MARKET_INDICES, computeIndexChange, type MarketIndicesSnapshot } from '@/shared/lib/marketIndices';
import { MARKET_INDEX_COPY } from '@/shared/constants/marketIndex';
import type { MarketIndexRow } from './MarketIndexStrip.types';

/**
 * 지수 현재가 표기 — **소수 2자리 고정, 통화기호 없음**.
 *
 * ⚠ `MarketIndexQuote.currency`(USD/KRW/JPY)를 화면에 쓰지 마라. 지수는 금액이 아니라 **포인트**다 —
 * "$7,419.65" 는 거짓이다. currency 는 upstream 이 준 메타일 뿐이고 이 스트립은 쓰지 않는다.
 * 단위는 스크린리더에만 붙인다(`MARKET_INDEX_COPY.unit`).
 */
export const formatIndexValue = (price: number): string =>
  price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * 스냅샷을 **레지스트리 순서** 셀 모델로 편다. 값이 없는 지수도 행을 남긴다(결손을 감추지 않는다).
 *
 * 결손 판정은 `findMissingSymbols`(= requested − indices)가 아니라 **"이 심볼의 시세가 왔는가"** 로 한다.
 * 두 방식은 정상 응답에서 결과가 같지만, 레지스트리에 지수를 추가하고 서버가 아직 옛 버전이면
 * (그 심볼이 `requested` 에도 없다) 전자는 결손으로 세지 못해 **빈 칸**이 남는다. 후자는 그 경우도
 * "불러오지 못함"으로 정직하게 말한다.
 *
 * 전달값이 `null`(loading/error)이면 라벨만 있는 행 5개 — 로딩 화면이 무엇을 기다리는지 미리 보여주고,
 * 값이 도착해도 레이아웃이 그대로다.
 */
export const buildMarketIndexRows = (snapshot: MarketIndicesSnapshot | null): MarketIndexRow[] =>
  MARKET_INDICES.map((definition) => {
    const quote = snapshot?.indices.find((item) => item.symbol === definition.symbol);
    return {
      symbol: definition.symbol,
      label: definition.label,
      price: quote ? quote.price : null,
      change: quote ? computeIndexChange(quote.price, quote.previousClose) : null,
      // 레지스트리가 항목별로 정한다 — 없으면 지수 기본 단위(' 포인트').
      unit: definition.unit ?? MARKET_INDEX_COPY.unit
    };
  });
