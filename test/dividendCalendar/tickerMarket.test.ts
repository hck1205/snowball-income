import { describe, expect, it } from 'vitest';
import { countByMarket, filterByMarket, tickerMarketOf } from '@/pages/DividendCalendar/utils';

/**
 * 종목 선택 드로어의 시장 탭이 서 있는 계약(2026-08-07 사용자 지시).
 *
 * 🔴 판정은 **접미사**로만 한다. "점이 있으면 한국"으로 줄여 쓰면 미국의 클래스 주식(BRK.B)이
 * 조용히 한국 탭으로 새어 든다 — 지금 유니버스에 없을 뿐이라 렌더로는 영영 안 잡힌다.
 */
describe('종목의 시장 판정', () => {
  it('.KS · .KQ 로 끝나면 한국이다', () => {
    expect(tickerMarketOf('458730.KS')).toBe('kr');
    expect(tickerMarketOf('402970.KQ')).toBe('kr');
  });

  it('그 밖은 미국이다', () => {
    expect(tickerMarketOf('SCHD')).toBe('us');
    expect(tickerMarketOf('KO')).toBe('us');
  });

  it('🔴 점이 있다고 한국이 아니다 — 미국 클래스 주식이 새어 들면 안 된다', () => {
    expect(tickerMarketOf('BRK.B')).toBe('us');
  });

  it('대소문자를 가리지 않는다(공유 링크로 들어온 값까지 믿을 수는 없다)', () => {
    expect(tickerMarketOf('458730.ks')).toBe('kr');
  });
});

describe('시장으로 목록 가르기', () => {
  const options = [
    { ticker: 'SCHD' },
    { ticker: '458730.KS' },
    { ticker: 'KO' },
    { ticker: '402970.KQ' }
  ];

  it('그 시장의 종목만 남기고 원래 순서를 지킨다', () => {
    expect(filterByMarket(options, 'us').map((o) => o.ticker)).toEqual(['SCHD', 'KO']);
    expect(filterByMarket(options, 'kr').map((o) => o.ticker)).toEqual(['458730.KS', '402970.KQ']);
  });

  it('탭 라벨의 개수는 두 시장을 합쳐 전체가 된다', () => {
    expect(countByMarket(options, 'us') + countByMarket(options, 'kr')).toBe(options.length);
  });
});
