import { MARKET_DATA } from '@/shared/constants/marketData';
import type { PayoutRhythmRow } from './PayoutRhythm.types';

/**
 * 12칸 리듬의 **데이터 계층**.
 *
 * 🔴 지급 월을 카피나 코드에 적지 않는다 — `marketData` 스냅샷에서 **런타임에** 읽는다.
 * 그 값은 월 1회 크론이 갱신하므로, 여기에 상수로 박으면 다음 갱신에 조용히 거짓이 된다
 * (decisions.md 티커 SEO 의 "숫자를 문자열에 박지 마라"와 같은 근거).
 *
 * ⚠ 테스트도 같은 이유로 **특정 월을 고정하지 마라.** 단정할 수 있는 것은 형태뿐이다 —
 * 칸이 12개이고, 채워진 칸 수가 `months.length` 와 같다는 것.
 */

/** 1~12 의 정수만, 중복 제거, 오름차순. 생성물에서 오는 값이라 방어적으로 정규화한다. */
const normalizeMonths = (months: readonly number[] | undefined): number[] =>
  [...new Set((months ?? []).filter((month) => Number.isInteger(month) && month >= 1 && month <= 12))].sort(
    (left, right) => left - right
  );

export const RHYTHM_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const buildPayoutRhythmRows = (symbols: readonly string[]): PayoutRhythmRow[] =>
  symbols.map((symbol) => {
    const months = normalizeMonths(MARKET_DATA.entries[symbol]?.payoutMonths);
    return { symbol, months, isUnknown: months.length === 0 };
  });
