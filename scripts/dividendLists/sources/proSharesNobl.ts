import { ListSourceError, USER_AGENT, canonicalTicker } from './sourceCommon';

/**
 * ProShares/ProFunds 의 **전 펀드 일일 보유내역 CSV**에서 배당귀족 ETF(NOBL) 편입 종목을 뽑는다.
 *
 * ## 왜 이 URL 인가 (다른 경로는 죽었다)
 * 흔히 인용되는 `proshares.com/globalassets/ProShares/Holdings/NOBL_holdings.csv` 는 **404 다**
 * (2026-08-04 실측: 301 → `www.proshares.com` → 404 HTML 185KB. UA 유무와 무관 — 봇 차단이 아니라
 * 경로 소멸이다). 살아 있는 것은 `accounts.profunds.com` 의 열린 디렉터리이고, 오늘자로 갱신된다
 * (실측: HTTP 200, `text/csv`, 1,841,662바이트, 20,108행, 펀드 170종).
 *
 * ## 파일 형태 (헤더가 1행이 아니다)
 * ```
 * 1: PORTFOLIO HOLDINGS INFORMATION
 * 2: AS OF 7/31/2026            <- 파일 기준일
 * 3: (빈 줄)
 * 4: Fund Ticker, Fund Name, Security Ticker, ... <- 진짜 헤더
 * ```
 * NOBL 행은 70개인데 그중 1개는 `Net Other Assets (Liabilities)`(Security Ticker 가 빈 문자열)이다.
 * 그래서 **티커가 빈 행을 버리면** 정확히 69종이 남는다.
 *
 * ## 🔴 원본을 레포에 커밋하지 않는다
 * ProShares 이용약관은 사전 서면 허가 없는 복제·배포를 금지한다. 우리가 저장하는 것은 **우리가 확정한
 * 티커 목록(사실)** 뿐이고, 이 CSV 는 수집 시점에만 메모리에서 읽고 버린다. 화면에도 ProShares 브랜딩을
 * 노출하지 않고 출처 표기만 남긴다.
 */
const NOBL_HOLDINGS_URL = 'https://accounts.profunds.com/etfdata/psdlyhld.csv';

/** 우리가 뽑을 펀드. 같은 파일에 REGL·SMDV·EFAD 등 169개 펀드가 함께 들어 있다. */
const FUND_TICKER = 'NOBL';

export type NoblHolding = {
  ticker: string;
  /** CSV 의 `Security Description`(예: `COCA-COLA CO/THE`). 회사명은 교차검증 소스 쪽을 쓴다. */
  description: string;
};

export type NoblHoldingsResult = {
  holdings: NoblHolding[];
  /** 파일 머리말 `AS OF M/D/YYYY` 를 ISO 로 바꾼 값. 못 읽으면 `null`. */
  fileAsOf: string | null;
  url: string;
};

/**
 * 따옴표를 존중하는 최소 CSV 분해. 회사명에 쉼표가 들어 있어(`Archer-Daniels-Midland Co, Inc`)
 * `split(',')` 로는 열이 밀린다. 이스케이프된 따옴표(`""`)는 이 파일에 없어 다루지 않는다.
 */
const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
};

/** `AS OF 7/31/2026` → `2026-07-31`. 형태가 다르면 `null`(틀린 날짜보다 없는 편이 낫다). */
const parseFileAsOf = (line: string | undefined): string | null => {
  const match = /AS OF\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(line ?? '');
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const fetchNoblHoldings = async (fetchImpl: typeof fetch = fetch): Promise<NoblHoldingsResult> => {
  let response: Response;
  try {
    response = await fetchImpl(NOBL_HOLDINGS_URL, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new ListSourceError(`NOBL 보유내역 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`NOBL 보유내역 HTTP ${response.status}`);

  const lines = (await response.text()).split(/\r?\n/);
  const holdings: NoblHolding[] = [];
  for (const line of lines) {
    if (!line.startsWith(`"${FUND_TICKER}"`) && !line.startsWith(FUND_TICKER)) continue;
    const cells = splitCsvLine(line);
    if (cells[0]?.replace(/"/g, '').trim() !== FUND_TICKER) continue;
    const rawTicker = cells[2]?.replace(/"/g, '').trim() ?? '';
    // 티커가 빈 행 = `Net Other Assets (Liabilities)`. 종목이 아니므로 버린다.
    if (rawTicker.length === 0) continue;
    holdings.push({ ticker: canonicalTicker(rawTicker), description: cells[4]?.replace(/"/g, '').trim() ?? '' });
  }

  // 한 종목이라도 못 뽑으면 파일 구조가 바뀐 것이다 — 빈 목록을 조용히 넘기면 화면이 거짓말을 한다.
  if (holdings.length === 0) throw new ListSourceError('NOBL 보유내역에서 종목을 하나도 뽑지 못했다(파일 구조 변경?)');

  return { holdings, fileAsOf: parseFileAsOf(lines[1]), url: NOBL_HOLDINGS_URL };
};
