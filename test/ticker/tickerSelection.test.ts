import { describe, expect, it } from 'vitest';
import {
  MAX_COMPARE_TICKERS,
  addTickerWithEviction,
  buildCompareHref,
  canOpenCompare,
  isComparableTicker,
  removeTicker
} from '@/pages/Ticker/utils';

/**
 * 유입 화면 → 종목 비교로 넘기는 선택 규칙.
 *
 * 여기서 지키려는 것은 하나다: **고른 것이 그대로 열린다.** 비교 화면은 유니버스에 없는 티커를
 * 조용히 버리므로(`normalizeCompareSelection`), 보내는 쪽이 같은 기준으로 거르지 않으면
 * "넷 골랐는데 둘만 열리는" 화면이 된다 — 사용자에게는 기능이 고장 난 것으로 보인다.
 */

describe('isComparableTicker', () => {
  it('비교 유니버스에 있는 종목을 담을 수 있다고 판정한다', () => {
    expect(isComparableTicker('SCHD')).toBe(true);
    expect(isComparableTicker('JEPI')).toBe(true);
  });

  it('소문자·공백으로 들어와도 같은 답을 낸다 — 표의 원문 표기를 그대로 넘겨도 되게 한다', () => {
    expect(isComparableTicker(' schd ')).toBe(true);
  });

  it('유니버스에 없는 종목은 담을 수 없다고 판정한다', () => {
    // 의원거래·13F 자료에는 배당 자료가 없는 종목이 섞여 들어온다.
    expect(isComparableTicker('ZZZZ')).toBe(false);
    expect(isComparableTicker('')).toBe(false);
  });
});

describe('addTickerWithEviction', () => {
  it('고른 순서를 유지하며 뒤에 붙인다', () => {
    expect(addTickerWithEviction(['SCHD'], 'JEPI')).toEqual(['SCHD', 'JEPI']);
  });

  it('소문자로 들어와도 대문자로 담는다 — 중복 판정과 URL 이 한 표기를 쓰게 한다', () => {
    expect(addTickerWithEviction([], 'schd')).toEqual(['SCHD']);
  });

  it('이미 담긴 종목은 순서를 바꾸지 않는다', () => {
    // 스크롤하다 같은 행을 두 번 눌렀다고 방금 고른 다른 종목이 밀려나면 안 된다.
    expect(addTickerWithEviction(['SCHD', 'JEPI'], 'SCHD')).toEqual(['SCHD', 'JEPI']);
  });

  it('상한을 넘으면 가장 오래된 것을 버린다 — 막지 않는다', () => {
    const full = ['SCHD', 'JEPI', 'O', 'VYM'];
    expect(full).toHaveLength(MAX_COMPARE_TICKERS);

    const next = addTickerWithEviction(full, 'QYLD');
    expect(next).toHaveLength(MAX_COMPARE_TICKERS);
    expect(next).toEqual(['JEPI', 'O', 'VYM', 'QYLD']);
  });

  it('빈 문자열은 담지 않는다', () => {
    expect(addTickerWithEviction(['SCHD'], '   ')).toEqual(['SCHD']);
  });
});

describe('removeTicker', () => {
  it('담긴 종목을 뺀다', () => {
    expect(removeTicker(['SCHD', 'JEPI'], 'SCHD')).toEqual(['JEPI']);
  });

  it('없는 종목을 빼도 그대로 둔다 — 호출부가 존재를 먼저 확인하지 않아도 된다', () => {
    expect(removeTicker(['SCHD'], 'JEPI')).toEqual(['SCHD']);
  });
});

describe('canOpenCompare', () => {
  it('두 종목부터 비교를 열 수 있다', () => {
    expect(canOpenCompare(['SCHD'])).toBe(false);
    expect(canOpenCompare(['SCHD', 'JEPI'])).toBe(true);
  });

  it('유니버스에 없는 종목은 개수로 세지 않는다', () => {
    // 🔴 이걸 세면 "두 개 골랐는데 빈 비교가 열리는" 경로가 생긴다.
    expect(canOpenCompare(['SCHD', 'ZZZZ'])).toBe(false);
  });
});

describe('buildCompareHref', () => {
  it('실제 비교 경로와 파라미터 이름으로 만든다', () => {
    // 🔴 `/compare?tickers=` 가 아니다 — 그 주소는 존재하지 않고, 파라미터 이름이 다르면 빈 비교가 열린다.
    const href = buildCompareHref(['SCHD', 'JEPI'], 'congress');
    expect(href.startsWith('/ticker/compare?')).toBe(true);

    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe('SCHD,JEPI');
    expect(params.get('from')).toBe('congress');
  });

  it('유니버스에 없는 종목은 주소에서 걸러 낸다', () => {
    // sessionStorage 에 남아 있던 옛 선택이 섞여도 비교 화면이 빈 열을 그리지 않게 한다.
    const params = new URLSearchParams(buildCompareHref(['SCHD', 'ZZZZ'], 'investors').split('?')[1]);
    expect(params.get('t')).toBe('SCHD');
  });

  it('상한을 넘겨 넘기면 앞에서부터 상한까지만 싣는다', () => {
    const params = new URLSearchParams(
      buildCompareHref(['SCHD', 'JEPI', 'O', 'VYM', 'QYLD'], 'nps').split('?')[1]
    );
    expect(params.get('t')?.split(',')).toHaveLength(MAX_COMPARE_TICKERS);
  });

  it('선택이 비면 파라미터 없는 비교 화면으로 보낸다', () => {
    expect(buildCompareHref([], 'congress')).toBe('/ticker/compare');
  });
});
