import { describe, expect, it } from 'vitest';
import { parseNasdaqLikeTxt, pickEtfTickers } from '@/utils/TickerParser/index.mjs';

/* 실제 원본 두 형식의 머리줄 그대로다 — ETF 열의 위치가 서로 다르다. */
const NASDAQ_LISTED = [
  'Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares',
  'AAPL|Apple Inc. - Common Stock|Q|N|N|100|N|N',
  'QQQ|Invesco QQQ Trust, Series 1|G|N|N|100|Y|N',
  'ZXZZT|NASDAQ TEST STOCK|G|Y|N|100|Y|N',
  'File Creation Time: 0929202521:32|||||||'
].join('\n');

const OTHER_LISTED = [
  'ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol',
  'SCHD|Schwab US Dividend Equity ETF|P|SCHD|Y|100|N|SCHD',
  'JPM|JP Morgan Chase & Co. Common Stock|N|JPM|N|100|N|JPM',
  'File Creation Time: 0929202521:32|||||||'
].join('\n');

describe('pickEtfTickers', () => {
  it('ETF 열이 Y 인 행만 티커 → 종목명으로 뽑는다 (두 원본 형식 모두)', () => {
    expect(pickEtfTickers(NASDAQ_LISTED)).toEqual({ QQQ: 'Invesco QQQ Trust, Series 1' });
    expect(pickEtfTickers(OTHER_LISTED)).toEqual({ SCHD: 'Schwab US Dividend Equity ETF' });
  });

  it('테스트 종목은 ETF 로 표시돼 있어도 뺀다', () => {
    expect(pickEtfTickers(NASDAQ_LISTED)).not.toHaveProperty('ZXZZT');
  });

  it('ETF 열이 없는 형식이면 빈 목록이다 (추측하지 않는다)', () => {
    expect(pickEtfTickers('Symbol|Security Name\nSCHD|Schwab US Dividend Equity ETF')).toEqual({});
  });

  it('기존 파서 출력은 그대로다 — ETF 플래그를 끼우지 않는다', () => {
    const parsed = parseNasdaqLikeTxt(OTHER_LISTED);
    expect(Object.keys(parsed)).toEqual(['SCHD', 'JPM']);
    expect(Object.keys(parsed.SCHD!).sort()).toEqual(['issuer', 'name']);
  });
});
