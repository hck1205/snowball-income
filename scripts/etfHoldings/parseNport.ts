/**
 * N-PORT 공시 파서 — **순수**. 네트워크·파일시스템·시계에 닿지 않는다(테스트가 공시 형식의 문자열로 돈다).
 *
 * N-PORT(`NPORT-P`)는 등록 펀드가 SEC 에 내는 보유 명세다. ETF 도 대부분 1940년법 펀드라 여기에
 * **전체 보유 종목**이 실린다(발행사 사이트처럼 막히지 않고, 형식이 모든 발행사에 같다).
 *
 * ## 🔴 이 파일이 처리하는 함정
 * 1. **티커가 비어 있다** — `identifiers` 의 `ticker` 는 선택 항목이라 흔히 없다. 그래서 같은 종목을
 *    ISIN → CUSIP → 정규화한 이름 순으로 알아본다(`holdingKey`). 티커로 맞추면 겹침이 조용히 줄어든다.
 * 2. **CUSIP 자리에 가짜 값** — `N/A`·`000000000` 이 들어온다. 그대로 열쇠로 쓰면 서로 다른 종목이
 *    한 덩어리로 합쳐져 **없는 겹침이 생긴다**.
 * 3. **현금성·파생 포지션** — 증권대여 담보로 받은 머니마켓펀드(`STIV`·`RF`)가 같은 운용사의 ETF 마다
 *    실린다. 이것을 종목으로 세면 같은 운용사 ETF 끼리 **가짜로 겹친다**. 파생(`D*`)은 비중이 명목이라
 *    보유가 아니다. 그래서 `INCLUDED_ASSET_CATS` 허용 목록만 담는다.
 * 4. **공매도** — `payoffProfile` 이 `Short` 인 행은 보유가 아니라 하락 베팅이다. `Long` 만 담는다.
 * 5. **네임스페이스 접두사·엔티티** — 13F 파서(`scripts/investorHoldings/parse13f.ts`)와 같은 처리.
 */
import type { EtfHolding } from '@/shared/lib/etfOverlap';

/**
 * 담는 자산 분류(N-PORT `assetCat`).
 * EC 보통주 · EP 우선주 · DBT 채권 · ABS-* 자산유동화증권.
 * ⚠ RF(등록 펀드)는 뺀다 — 머니마켓 담보 계좌가 대부분이고, ETF 를 담은 ETF 는 속을 들여다볼 수 없다.
 */
const INCLUDED_ASSET_CATS = new Set(['EC', 'EP', 'DBT', 'ABS-MBS', 'ABS-ABCP', 'ABS-CBDO', 'ABS-O']);

/**
 * 스냅샷 한 장에 남기는 최대 행 수(비중 큰 순).
 *
 * VTI 는 3,600종, 채권 ETF 는 만 줄이 넘는다. 전부 두면 파일 하나가 수백 KB 다. 겹침은
 * "작은 쪽 비중의 합"이라 꼬리의 아주 작은 비중이 결과를 거의 움직이지 않는다 — 500번째 종목의 비중은
 * 대형 지수 ETF 에서도 0.01% 안팎이다. 잘린 몫은 `coveredWeightPercent` 가 밝힌다.
 */
export const MAX_HOLDINGS = 500;

export type ParsedNport = {
  readonly seriesId: string | null;
  readonly seriesName: string | null;
  /** 보고 기준일(YYYY-MM-DD). */
  readonly reportDate: string | null;
  /** 원본 보유 행 수(거르기 전). */
  readonly rowCount: number;
  /** 거르고·합친 뒤의 종목 수(잘라내기 전). */
  readonly holdingCount: number;
  /** 비중 큰 순, 최대 `MAX_HOLDINGS`. */
  readonly holdings: readonly EtfHolding[];
  readonly coveredWeightPercent: number;
};

const ENTITIES: readonly (readonly [RegExp, string])[] = [
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&apos;/g, "'"],
  /* ⚠ &amp; 는 맨 마지막 — 먼저 풀면 `&amp;lt;` 가 이중 디코드된다. */
  [/&amp;/g, '&']
];

const decodeEntities = (value: string): string =>
  ENTITIES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);

const readTag = (block: string, name: string): string | null => {
  const match = block.match(new RegExp(`<(?:\\w+:)?${name}>([^<]*)</(?:\\w+:)?${name}>`));
  return match ? decodeEntities(match[1]!.trim()) : null;
};

/** `<isin value="US..."/>` 같은 속성형 식별자. */
const readValueAttr = (block: string, name: string): string | null => {
  const match = block.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*\\bvalue="([^"]*)"`));
  return match ? decodeEntities(match[1]!.trim()) : null;
};

/** `assetCat` 는 태그로 오거나, 분류 밖 자산이면 `<assetConditional assetCat="..."/>` 속성으로 온다. */
const readAssetCat = (block: string): string | null => {
  const tag = readTag(block, 'assetCat');
  if (tag) return tag.toUpperCase();
  const conditional = block.match(/<(?:\w+:)?assetConditional\b[^>]*\bassetCat="([^"]*)"/);
  return conditional ? conditional[1]!.trim().toUpperCase() : null;
};

const ISIN = /^[A-Z]{2}[A-Z0-9]{9}\d$/;
const CUSIP = /^[A-Z0-9]{9}$/;

/** 같은 종목을 알아보는 열쇠(함정 1·2). */
export const holdingKey = (isin: string | null, cusip: string | null, name: string): string => {
  const cleanIsin = (isin ?? '').toUpperCase();
  if (ISIN.test(cleanIsin)) return cleanIsin;
  const cleanCusip = (cusip ?? '').toUpperCase();
  if (CUSIP.test(cleanCusip) && !/^0+$/.test(cleanCusip)) return `CUSIP:${cleanCusip}`;
  return `NAME:${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
};

const cleanSymbol = (raw: string | null): string | null => {
  const value = (raw ?? '').trim().toUpperCase();
  if (!value || value === 'N/A' || value === 'NONE' || value === '0') return null;
  return value;
};

const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

export const parseNport = (xml: string): ParsedNport => {
  const genInfo = xml.match(/<(?:\w+:)?genInfo>([\s\S]*?)<\/(?:\w+:)?genInfo>/)?.[1] ?? xml;
  const seriesId = readTag(genInfo, 'seriesId');
  const seriesName = readTag(genInfo, 'seriesName');
  const reportDate = readTag(genInfo, 'repPdDate');

  const blocks = xml.match(/<(?:\w+:)?invstOrSec>[\s\S]*?<\/(?:\w+:)?invstOrSec>/g) ?? [];

  type Acc = { symbol: string | null; name: string; weight: number };
  const byKey = new Map<string, Acc>();

  for (const block of blocks) {
    if ((readTag(block, 'payoffProfile') ?? '').toLowerCase() !== 'long') continue;
    const assetCat = readAssetCat(block);
    if (!assetCat || !INCLUDED_ASSET_CATS.has(assetCat)) continue;
    const weight = Number(readTag(block, 'pctVal'));
    if (!Number.isFinite(weight) || weight <= 0) continue;

    const name = readTag(block, 'name') || readTag(block, 'title') || '';
    if (!name) continue;
    const key = holdingKey(readValueAttr(block, 'isin'), readTag(block, 'cusip'), name);
    const symbol = cleanSymbol(readValueAttr(block, 'ticker'));

    /* 같은 종목이 로트·계정별로 여러 행에 나뉘어 온다 — 합친다(13F 파서 함정 1과 같은 이유). */
    const existing = byKey.get(key);
    if (existing) {
      existing.weight += weight;
      if (!existing.symbol && symbol) existing.symbol = symbol;
    } else {
      byKey.set(key, { symbol, name, weight });
    }
  }

  const all = [...byKey.entries()]
    .map(([key, acc]) => ({ key, symbol: acc.symbol, name: acc.name, weight: round4(acc.weight) }))
    .sort((left, right) => right.weight - left.weight || left.key.localeCompare(right.key));
  const holdings = all.slice(0, MAX_HOLDINGS);

  return {
    seriesId,
    seriesName,
    reportDate,
    rowCount: blocks.length,
    holdingCount: all.length,
    holdings,
    coveredWeightPercent: Math.round(holdings.reduce((sum, holding) => sum + holding.weight, 0) * 100) / 100
  };
};

export type NportFilingRef = {
  readonly accessionNumber: string;
  readonly filingDate: string;
  readonly form: string;
  /** 공시 폴더(끝 슬래시 없음) — `primary_doc.xml` 이 여기 있다. */
  readonly directoryUrl: string;
};

/**
 * EDGAR 회사 검색(시리즈 ID)의 Atom 피드에서 N-PORT 공시 목록을 뽑는다. 최신 제출순 그대로.
 * 정정본(`NPORT-P/A`)도 담는다 — 같은 분기라면 나중 제출이 이긴다(호출부가 첫 번째를 고른다).
 */
export const parseNportFilingsAtom = (atom: string): NportFilingRef[] => {
  const entries = atom.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const refs: NportFilingRef[] = [];
  for (const entry of entries) {
    const form = readTag(entry, 'filing-type') ?? '';
    if (form !== 'NPORT-P' && form !== 'NPORT-P/A') continue;
    const accessionNumber = readTag(entry, 'accession-number') ?? '';
    const filingDate = readTag(entry, 'filing-date') ?? '';
    const href = readTag(entry, 'filing-href') ?? '';
    const directoryUrl = href.replace(/\/[^/]+-index\.html?$/, '');
    if (!accessionNumber || !directoryUrl || directoryUrl === href) continue;
    refs.push({ accessionNumber, filingDate, form, directoryUrl });
  }
  return refs;
};

/** SEC 의 펀드 티커 표(`company_tickers_mf.json`) → 티커별 시리즈. */
export type FundSeries = { readonly cik: string; readonly seriesId: string };

export const parseFundTickers = (payload: unknown): Map<string, FundSeries> => {
  const map = new Map<string, FundSeries>();
  const table = payload as { fields?: string[]; data?: unknown[][] };
  if (!Array.isArray(table?.fields) || !Array.isArray(table?.data)) return map;
  const cikIndex = table.fields.indexOf('cik');
  const seriesIndex = table.fields.indexOf('seriesId');
  const symbolIndex = table.fields.indexOf('symbol');
  if (cikIndex < 0 || seriesIndex < 0 || symbolIndex < 0) return map;

  for (const row of table.data) {
    const symbol = String(row[symbolIndex] ?? '').trim().toUpperCase();
    const seriesId = String(row[seriesIndex] ?? '').trim();
    const cik = String(row[cikIndex] ?? '').trim();
    if (!symbol || !seriesId || !cik) continue;
    /* 한 티커가 두 번 나오면 첫 번째를 둔다(표가 정렬돼 있어 대표 클래스가 먼저 온다). */
    if (!map.has(symbol)) map.set(symbol, { cik, seriesId });
  }
  return map;
};
