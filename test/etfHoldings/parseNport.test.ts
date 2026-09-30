import { describe, expect, it } from 'vitest';
import {
  MAX_HOLDINGS,
  holdingKey,
  parseFundTickers,
  parseNport,
  parseNportFilingsAtom
} from '../../scripts/etfHoldings/parseNport';
import { buildUniverse, displayEtfName, serializeSnapshot, serializeUniverse } from '../../scripts/etfHoldings/universe';

/** N-PORT `primary_doc.xml` 의 실제 골격(필요한 태그만). */
const security = (fields: {
  name: string;
  cusip?: string;
  isin?: string;
  ticker?: string;
  pct: number;
  payoff?: string;
  assetCat?: string;
  conditional?: string;
}): string => `
      <invstOrSec>
        <name>${fields.name}</name>
        <lei>N/A</lei>
        <title>${fields.name}</title>
        <cusip>${fields.cusip ?? 'N/A'}</cusip>
        <identifiers>
          ${fields.isin ? `<isin value="${fields.isin}"/>` : ''}
          ${fields.ticker ? `<ticker value="${fields.ticker}"/>` : ''}
        </identifiers>
        <balance>100</balance>
        <units>NS</units>
        <curCd>USD</curCd>
        <valUSD>1000</valUSD>
        <pctVal>${fields.pct}</pctVal>
        <payoffProfile>${fields.payoff ?? 'Long'}</payoffProfile>
        ${fields.conditional ? `<assetConditional desc="x" assetCat="${fields.conditional}"/>` : `<assetCat>${fields.assetCat ?? 'EC'}</assetCat>`}
        <issuerCat>CORP</issuerCat>
        <invCountry>US</invCountry>
      </invstOrSec>`;

const nport = (securities: string[]): string => `<?xml version="1.0" encoding="UTF-8"?>
<edgarSubmission xmlns="http://www.sec.gov/edgar/nport">
  <formData>
    <genInfo>
      <regName>Schwab Strategic Trust</regName>
      <seriesName>Schwab U.S. Dividend Equity ETF</seriesName>
      <seriesId>S000027243</seriesId>
      <repPdEnd>2026-08-31</repPdEnd>
      <repPdDate>2026-06-30</repPdDate>
    </genInfo>
    <invstOrSecs>${securities.join('')}
    </invstOrSecs>
  </formData>
</edgarSubmission>`;

describe('parseNport', () => {
  it('시리즈·기준일과 보유 종목을 비중 큰 순으로 읽는다', () => {
    const parsed = parseNport(
      nport([
        security({ name: 'Coca-Cola Co/The', cusip: '191216100', isin: 'US1912161007', ticker: 'KO', pct: 4.1 }),
        security({ name: 'AbbVie Inc', cusip: '00287Y109', isin: 'US00287Y1091', ticker: 'ABBV', pct: 4.3 })
      ])
    );
    expect(parsed.seriesId).toBe('S000027243');
    expect(parsed.reportDate).toBe('2026-06-30');
    expect(parsed.holdings).toEqual([
      { key: 'US00287Y1091', symbol: 'ABBV', name: 'AbbVie Inc', weight: 4.3 },
      { key: 'US1912161007', symbol: 'KO', name: 'Coca-Cola Co/The', weight: 4.1 }
    ]);
    expect(parsed.coveredWeightPercent).toBe(8.4);
  });

  it('🔴 공매도·파생·현금성(머니마켓 담보) 행은 담지 않는다', () => {
    const parsed = parseNport(
      nport([
        security({ name: 'Apple Inc', isin: 'US0378331005', pct: 5 }),
        security({ name: 'Short Tesla', isin: 'US88160R1014', pct: 1, payoff: 'Short' }),
        security({ name: 'S&amp;P 500 Future', pct: 2, assetCat: 'DFE' }),
        security({ name: 'BlackRock Cash Funds', pct: 3, assetCat: 'STIV' }),
        security({ name: 'Money Market Fund', pct: 1.5, assetCat: 'RF' }),
        security({ name: 'Other thing', pct: 0.5, conditional: 'OTHER' })
      ])
    );
    expect(parsed.rowCount).toBe(6);
    expect(parsed.holdings.map((holding) => holding.name)).toEqual(['Apple Inc']);
  });

  it('같은 종목이 여러 행에 나뉘면 합친다', () => {
    const parsed = parseNport(
      nport([
        security({ name: 'Alphabet Inc', isin: 'US02079K3059', pct: 1.2 }),
        security({ name: 'Alphabet Inc', isin: 'US02079K3059', ticker: 'GOOGL', pct: 0.8 })
      ])
    );
    expect(parsed.holdings).toEqual([{ key: 'US02079K3059', symbol: 'GOOGL', name: 'Alphabet Inc', weight: 2 }]);
  });

  it(`비중 큰 순으로 최대 ${MAX_HOLDINGS}행만 남기고, 전체 수는 따로 센다`, () => {
    const rows = Array.from({ length: MAX_HOLDINGS + 20 }, (_, index) =>
      security({ name: `Co ${index}`, cusip: String(100000000 + index), pct: 0.001 * (index + 1) })
    );
    const parsed = parseNport(nport(rows));
    expect(parsed.holdingCount).toBe(MAX_HOLDINGS + 20);
    expect(parsed.holdings).toHaveLength(MAX_HOLDINGS);
    expect(parsed.holdings[0]!.name).toBe(`Co ${MAX_HOLDINGS + 19}`);
  });

  it('네임스페이스 접두사가 붙어도 읽는다', () => {
    const xml = nport([security({ name: 'Apple Inc', isin: 'US0378331005', pct: 5 })]).replace(
      /<(\/?)(\w+)/g,
      (_, slash: string, tag: string) => `<${slash}ns1:${tag}`
    );
    expect(parseNport(xml).holdings).toHaveLength(1);
  });
});

describe('holdingKey — 같은 종목을 알아보는 열쇠', () => {
  it('ISIN → CUSIP → 이름 순이다', () => {
    expect(holdingKey('US0378331005', '037833100', 'Apple')).toBe('US0378331005');
    expect(holdingKey(null, '037833100', 'Apple')).toBe('CUSIP:037833100');
    expect(holdingKey(null, null, 'Apple Inc.')).toBe('NAME:APPLEINC');
  });

  it('🔴 가짜 CUSIP(N/A·000000000)는 열쇠로 쓰지 않는다 — 서로 다른 종목이 합쳐진다', () => {
    expect(holdingKey(null, '000000000', 'Foo Corp')).toBe('NAME:FOOCORP');
    expect(holdingKey('N/A', 'N/A', 'Bar Corp')).toBe('NAME:BARCORP');
  });
});

describe('parseNportFilingsAtom', () => {
  it('N-PORT 공시만 최신순 그대로, 공시 폴더와 함께 뽑는다', () => {
    const entry = (form: string, accession: string, date: string) => `
<entry>
<category label="form type" scheme="https://www.sec.gov/" term="${form}"/>
<content type="text/xml">
<accession-number>${accession}</accession-number>
<filing-date>${date}</filing-date>
<filing-href>https://www.sec.gov/Archives/edgar/data/1454889/${accession.replace(/-/g, '')}/${accession}-index.htm</filing-href>
<filing-type>${form}</filing-type>
</content>
</entry>`;
    const atom = `<feed>${entry('NPORT-P', '0001752724-26-100001', '2026-08-28')}${entry('N-CEN', '0001752724-26-100000', '2026-08-01')}${entry('NPORT-P', '0001752724-26-050000', '2026-05-29')}</feed>`;
    expect(parseNportFilingsAtom(atom)).toEqual([
      {
        accessionNumber: '0001752724-26-100001',
        filingDate: '2026-08-28',
        form: 'NPORT-P',
        directoryUrl: 'https://www.sec.gov/Archives/edgar/data/1454889/000175272426100001'
      },
      {
        accessionNumber: '0001752724-26-050000',
        filingDate: '2026-05-29',
        form: 'NPORT-P',
        directoryUrl: 'https://www.sec.gov/Archives/edgar/data/1454889/000175272426050000'
      }
    ]);
  });
});

describe('parseFundTickers', () => {
  it('SEC 펀드 표를 티커 → (CIK, 시리즈)로 바꾼다', () => {
    const map = parseFundTickers({
      fields: ['cik', 'seriesId', 'classId', 'symbol'],
      data: [
        [1454889, 'S000027243', 'C000082745', 'SCHD'],
        [36405, 'S000002839', 'C000092055', 'VOO']
      ]
    });
    expect(map.get('SCHD')).toEqual({ cik: '1454889', seriesId: 'S000027243' });
    expect(map.get('VOO')).toEqual({ cik: '36405', seriesId: 'S000002839' });
  });

  it('모양이 다르면 빈 표다(추측하지 않는다)', () => {
    expect(parseFundTickers({ unexpected: true }).size).toBe(0);
  });
});

describe('검색 목록 · 직렬화', () => {
  it('명단의 티커는 거래소 목록에 없어도 들어가고, 인기 목록은 보유 종목이 있는 것만 남는다', () => {
    const universe = buildUniverse({
      listed: { SCHD: 'Schwab US Dividend Equity ETF', AAA: 'Some CLO ETF' },
      roster: ['SCHD', 'QQQ'],
      popular: ['SCHD', 'QQQ'],
      withHoldings: new Map([['SCHD', 'Schwab US Dividend Equity ETF']])
    });
    expect(universe.etfs).toEqual([
      { ticker: 'AAA', name: 'Some CLO ETF', hasHoldings: false },
      { ticker: 'QQQ', name: 'QQQ', hasHoldings: false },
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', hasHoldings: true }
    ]);
    expect(universe.popular).toEqual(['SCHD']);
  });

  it('거래소 이름의 꼬리(- Common Stock 등)만 걷는다', () => {
    expect(displayEtfName('Invesco QQQ Trust, Series 1')).toBe('Invesco QQQ Trust, Series 1');
    expect(displayEtfName('Foo ETF - Shares of Beneficial Interest')).toBe('Foo ETF');
  });

  it('직렬화한 파일을 다시 읽으면 같은 값이다(왕복)', () => {
    const universe = { popular: ['SCHD'], etfs: [{ ticker: 'SCHD', name: 'Schwab', hasHoldings: true }] };
    expect(JSON.parse(serializeUniverse(universe))).toEqual(universe);
    const snapshot = {
      ticker: 'SCHD',
      name: 'Schwab',
      seriesId: 'S000027243',
      asOfDate: '2026-06-30',
      filingDate: '2026-08-28',
      accessionNumber: 'x',
      sourceUrl: 'https://www.sec.gov/',
      totalHoldings: 2,
      coveredWeightPercent: 8.4,
      holdings: [
        { key: 'A', symbol: 'ABBV', name: 'AbbVie', weight: 4.3 },
        { key: 'B', symbol: null, name: 'Coca-Cola', weight: 4.1 }
      ]
    };
    expect(JSON.parse(serializeSnapshot(snapshot))).toEqual(snapshot);
    expect(JSON.parse(serializeSnapshot({ ...snapshot, holdings: [] }))).toEqual({ ...snapshot, holdings: [] });
  });
});
