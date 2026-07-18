import { memo } from 'react';
import { MARKET_DATA_AS_OF } from '@/shared/constants';
import type { MarketDataAsOfProps } from './MarketDataAsOf.types';
import { MarketDataDate, MarketDataFootnote } from './MarketDataAsOf.styled';

/**
 * 프리셋/티커의 시세·배당률이 **실시간이 아니라 스냅샷**이라는 사실을 조용히 알려준다.
 * 스냅샷이 비어 있는 빌드(`asOf === null`)에서는 아무것도 렌더하지 않는다 — 없는 기준일을 지어내지 않는다.
 */
function MarketDataAsOfComponent({ asOf = MARKET_DATA_AS_OF }: MarketDataAsOfProps) {
  if (!asOf) return null;

  return (
    <MarketDataFootnote>
      티커 데이터 기준일: <MarketDataDate dateTime={asOf}>{asOf}</MarketDataDate> · 프리셋 값은 실시간 시세가 아니라 저장된
      스냅샷입니다.
    </MarketDataFootnote>
  );
}

const MarketDataAsOf = memo(MarketDataAsOfComponent);

export default MarketDataAsOf;
