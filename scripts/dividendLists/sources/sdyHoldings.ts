import { ListSourceError, USER_AGENT, canonicalTicker } from './sourceCommon';

/**
 * SPDR **SDY**(S&P High Yield Dividend Aristocrats, 20년 이상 연속 증배) 일일 보유내역 xlsx.
 * 후보 유니버스의 네 번째 소스이자, ProShares 세 펀드가 못 덮는 20년대 종목을 채우는 자리다.
 *
 * ## 파일 형태 (2026-08-04 실측)
 * - URL 은 리다이렉트를 따라가야 받아진다. 응답 29,270바이트 ·
 *   `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
 * - 시트 머리 4줄이 메타(`Fund Name:` · `Ticker Symbol:` · `Holdings: As of 31-Jul-2026`)이고
 *   **5행이 헤더**다: `Name | Ticker | Identifier | SEDOL | Weight | Sector | Shares Held | Local Currency`.
 *   그래서 행 번호를 상수로 박지 않고 **`Ticker` 가 있는 줄을 찾아** 헤더로 삼는다.
 * - 티커가 있는 행 158개 중 3개는 종목이 아니다(`SSI US GOV MONEY MARKET`·`US DOLLAR` 는 티커가 `-`,
 *   `ESU6` 는 S&P500 선물). 티커 형태로 걸러 155종이 남는다.
 *
 * ## 🔴 `Sector` 열은 오늘자 파일에서 **전부 비어 있다**
 * 실측 158행 전부 `-` 였다. 그래서 이 소스는 **오늘 기준 섹터를 0종 공급한다** — 섹터는 위키피디아
 * 사전이 채운다. 그럼에도 파서를 남기는 이유는 이 열이 채워진 날에 자동으로 쓰이기 위해서다.
 * `-`·빈 문자열은 "모르는 섹터 문자열"이 아니라 **"안 적혀 있음"** 으로 다룬다(에러로 올리지 않는다).
 *
 * ## 🔴 원본을 레포에 커밋하지 않는다
 * `proSharesNobl.ts` 와 같은 이유다 — 우리가 저장하는 것은 우리가 확정한 티커 목록(사실)뿐이고,
 * xlsx 는 수집 시점에만 메모리에서 읽고 버린다.
 */
const SDY_HOLDINGS_URL =
  'https://www.ssga.com/us/en/intermediary/etfs/library-content/products/fund-data/etfs/us/holdings-daily-us-en-sdy.xlsx';

export type SdyHolding = {
  ticker: string;
  name: string;
  /** 파일이 적어 준 섹터 문자열. `-`·빈 값은 `null`(안 적혀 있음). */
  sectorLabel: string | null;
};

export type SdyHoldingsResult = {
  holdings: SdyHolding[];
  /** `Holdings: As of 31-Jul-2026` → `2026-07-31`. 못 읽으면 `null`. */
  fileAsOf: string | null;
  /** 티커 형태가 아니어서 **뺀** 행(현금·선물). 비어 있지 않은 게 정상이다. */
  skipped: string[];
  url: string;
};

/* ────────────────────────────── xlsx = zip + xml ────────────────────────────── */

/**
 * raw DEFLATE 해제 함수. **주입받는다** — 이 모듈이 `node:zlib` 를 import 하면 이 파일을 참조하는
 * 테스트가 앱 tsconfig(=node 타입 없음)에서 깨진다. 순수 파서와 노드 전용 IO 를 이 한 줄로 가른다.
 */
export type InflateRaw = (compressed: Uint8Array) => Uint8Array;

type ZipEntry = { compressionMethod: number; compressedSize: number; localHeaderOffset: number };

const LOCAL_HEADER_FIXED_SIZE = 30;
const CENTRAL_HEADER_FIXED_SIZE = 46;

/**
 * zip 중앙 디렉터리만 읽는 최소 구현. 외부 의존성 0.
 * xlsx 는 zip 이고 우리가 필요한 건 두 파트뿐이라 전체 zip 라이브러리를 들일 이유가 없다.
 */
const readZipEntries = (buffer: Uint8Array): Map<string, ZipEntry> => {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let endOffset = -1;
  // EOCD 는 파일 끝에 있고 가변 길이 주석이 뒤에 붙을 수 있어 뒤에서 찾는다.
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x0605_4b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new ListSourceError('SDY xlsx 가 zip 형식이 아니다(EOCD 를 찾지 못했다)');

  const entryCount = view.getUint16(endOffset + 10, true);
  let cursor = view.getUint32(endOffset + 16, true);
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, ZipEntry>();
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x0201_4b50) {
      throw new ListSourceError(`SDY xlsx 중앙 디렉터리 ${index}번 항목의 시그니처가 깨졌다`);
    }
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const name = decoder.decode(
      buffer.subarray(cursor + CENTRAL_HEADER_FIXED_SIZE, cursor + CENTRAL_HEADER_FIXED_SIZE + nameLength)
    );
    entries.set(name, {
      compressionMethod: view.getUint16(cursor + 10, true),
      compressedSize: view.getUint32(cursor + 20, true),
      localHeaderOffset: view.getUint32(cursor + 42, true)
    });
    cursor += CENTRAL_HEADER_FIXED_SIZE + nameLength + extraLength + commentLength;
  }
  return entries;
};

const readZipPart = (buffer: Uint8Array, name: string, inflateRaw: InflateRaw): string => {
  const entries = readZipEntries(buffer);
  const entry = entries.get(name);
  if (!entry) throw new ListSourceError(`SDY xlsx 에 ${name} 가 없다(파일 구조 변경?)`);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  // 로컬 헤더의 이름·extra 길이는 중앙 디렉터리 값과 다를 수 있어 여기서 다시 읽는다.
  const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  const dataStart = entry.localHeaderOffset + LOCAL_HEADER_FIXED_SIZE + nameLength + extraLength;
  const data = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  const decoder = new TextDecoder('utf-8');
  if (entry.compressionMethod === 0) return decoder.decode(data);
  if (entry.compressionMethod !== 8) {
    throw new ListSourceError(`SDY xlsx ${name} 의 압축 방식(${entry.compressionMethod})을 다루지 못한다`);
  }
  return decoder.decode(inflateRaw(data));
};

/* ────────────────────────────── 시트 → 행 ────────────────────────────── */

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decodeXmlText = (raw: string): string =>
  raw
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => XML_ENTITIES[name.toLowerCase()] ?? whole);

/** `sharedStrings.xml` → 인덱스 배열. 서식이 나뉜 문자열(`<r><t>`)은 조각을 이어 붙인다. */
export const parseSharedStrings = (xml: string): string[] => {
  const strings: string[] = [];
  for (const item of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...item[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXmlText(match[1]));
    strings.push(parts.join(''));
  }
  return strings;
};

export type SheetRow = { rowNumber: number; cells: Record<string, string> };

/** `sheet1.xml` → 행 배열. 셀 좌표(`B12`)에서 열 문자만 남겨 키로 쓴다. */
export const parseSheetRows = (xml: string, sharedStrings: readonly string[]): SheetRow[] => {
  const rows: SheetRow[] = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*\sr="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {};
    for (const cellMatch of rowMatch[2].matchAll(/<c\s+r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const valueMatch = /<v>([\s\S]*?)<\/v>/.exec(cellMatch[3]);
      let value = valueMatch ? decodeXmlText(valueMatch[1]) : '';
      if (/\st="s"/.test(cellMatch[2])) value = sharedStrings[Number(value)] ?? '';
      cells[cellMatch[1]] = value;
    }
    rows.push({ rowNumber: Number(rowMatch[1]), cells });
  }
  return rows;
};

/** `As of 31-Jul-2026` → `2026-07-31`. 형태가 다르면 `null`(틀린 날짜보다 없는 편이 낫다). */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const parseSdyAsOf = (raw: string | undefined): string | null => {
  const match = /As of\s+(\d{1,2})-([A-Za-z]{3})-(\d{4})/.exec(raw ?? '');
  if (!match) return null;
  const monthIndex = MONTHS.indexOf(match[2].toLowerCase());
  if (monthIndex < 0) return null;
  return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const TICKER_PATTERN = /^[A-Z]{1,5}(\.[A-Z])?$/;

/** 섹터 열의 `-`·빈 값은 "안 적혀 있음"이다. 대응표에 없는 **문자열**과 구분해야 한다. */
const toSectorLabel = (raw: string | undefined): string | null => {
  const trimmed = (raw ?? '').trim();
  return trimmed.length === 0 || trimmed === '-' ? null : trimmed;
};

/** 파싱된 시트 행 → 보유 종목. 헤더 행을 값으로 찾아 열 위치를 잡는다(행 번호를 박지 않는다). */
export const toSdyHoldings = (rows: readonly SheetRow[]): Omit<SdyHoldingsResult, 'url'> => {
  const headerRow = rows.find((row) => Object.values(row.cells).some((value) => value.trim() === 'Ticker'));
  if (!headerRow) throw new ListSourceError('SDY 시트에서 `Ticker` 헤더 행을 찾지 못했다(파일 구조 변경?)');

  const columnOf = (label: string): string | null =>
    Object.entries(headerRow.cells).find(([, value]) => value.trim() === label)?.[0] ?? null;
  const tickerColumn = columnOf('Ticker');
  const nameColumn = columnOf('Name');
  const sectorColumn = columnOf('Sector');
  if (!tickerColumn || !nameColumn) throw new ListSourceError('SDY 시트에 Ticker/Name 열이 없다');

  const holdings: SdyHolding[] = [];
  const skipped: string[] = [];
  for (const row of rows) {
    if (row.rowNumber <= headerRow.rowNumber) continue;
    const rawTicker = (row.cells[tickerColumn] ?? '').trim();
    if (rawTicker.length === 0) continue;
    const ticker = canonicalTicker(rawTicker);
    const name = (row.cells[nameColumn] ?? '').trim();
    if (!TICKER_PATTERN.test(ticker)) {
      // 현금·선물 행이다. 조용히 버리면 파일 구조가 바뀐 날 그 사실이 묻힌다 — 세어서 보고한다.
      skipped.push(`${rawTicker || '(빈 티커)'}: ${name || '(이름 없음)'}`);
      continue;
    }
    holdings.push({ ticker, name, sectorLabel: sectorColumn ? toSectorLabel(row.cells[sectorColumn]) : null });
  }

  if (holdings.length === 0) throw new ListSourceError('SDY 시트에서 종목을 하나도 뽑지 못했다(파일 구조 변경?)');

  const asOfCell = rows
    .filter((row) => row.rowNumber < headerRow.rowNumber)
    .flatMap((row) => Object.values(row.cells))
    .find((value) => value.includes('As of'));
  return { holdings, fileAsOf: parseSdyAsOf(asOfCell), skipped };
};

/** xlsx 바이트 → 보유 종목. zip 해제만 주입받고 나머지는 전부 순수 파싱이다. */
export const parseSdyWorkbook = (buffer: Uint8Array, inflateRaw: InflateRaw): Omit<SdyHoldingsResult, 'url'> => {
  const sharedStrings = parseSharedStrings(readZipPart(buffer, 'xl/sharedStrings.xml', inflateRaw));
  const rows = parseSheetRows(readZipPart(buffer, 'xl/worksheets/sheet1.xml', inflateRaw), sharedStrings);
  return toSdyHoldings(rows);
};

export const fetchSdyHoldings = async (
  inflateRaw: InflateRaw,
  fetchImpl: typeof fetch = fetch
): Promise<SdyHoldingsResult> => {
  let response: Response;
  try {
    // 이 URL 은 리다이렉트를 거친다 — `redirect: 'follow'`(기본값)를 끄면 302 로 끝난다.
    response = await fetchImpl(SDY_HOLDINGS_URL, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  } catch (error) {
    throw new ListSourceError(`SDY 보유내역 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`SDY 보유내역 HTTP ${response.status}`);

  const buffer = new Uint8Array(await response.arrayBuffer());
  return { ...parseSdyWorkbook(buffer, inflateRaw), url: SDY_HOLDINGS_URL };
};
