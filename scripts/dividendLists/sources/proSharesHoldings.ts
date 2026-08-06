import { ListSourceError, USER_AGENT, canonicalTicker } from './sourceCommon';

/**
 * ProShares/ProFunds 의 **전 펀드 일일 보유내역 CSV** 한 장에서 배당 연속증배 ETF 세 종의 편입 종목을
 * 한꺼번에 뽑는다. 파일이 하나라 **요청도 한 번**이다 — 펀드마다 따로 받지 않는다.
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
 * 각 펀드 블록에는 `Net Other Assets (Liabilities)` 행이 하나씩 섞여 있는데 Security Ticker 가 빈
 * 문자열이다. 그래서 **티커가 빈 행을 버리면** 실제 종목 수가 남는다
 * (2026-08-04 실측: NOBL 70행→69종 · REGL 66행→65종 · SMDV 101행→100종).
 *
 * ## 🔴 원본을 레포에 커밋하지 않는다
 * ProShares 이용약관은 사전 서면 허가 없는 복제·배포를 금지한다. 우리가 저장하는 것은 **우리가 확정한
 * 티커 목록(사실)** 뿐이고, 이 CSV 는 수집 시점에만 메모리에서 읽고 버린다. 화면에도 ProShares 브랜딩을
 * 노출하지 않고 출처 표기만 남긴다.
 */
const PROSHARES_HOLDINGS_URL = 'https://accounts.profunds.com/etfdata/psdlyhld.csv';

/**
 * 후보 유니버스를 만드는 ProShares 세 펀드. 각각이 추종하는 지수의 **연속 증배 요건**이 곧 그 종목의
 * 연속 연수 **하한**이다 — 우리가 종목별 연수를 계산할 수 없으므로(원리적으로 불가, 근거는
 * `dividendLists.types.ts` 머리말) 이 하한이 유일하게 검증 가능한 사실이다.
 */
export const PROSHARES_DIVIDEND_FUNDS = ['NOBL', 'REGL', 'SMDV'] as const;
export type ProSharesDividendFund = (typeof PROSHARES_DIVIDEND_FUNDS)[number];

export type ProSharesHolding = {
  ticker: string;
  /** CSV 의 `Security Description`(예: `COCA-COLA CO/THE`). 회사명은 교차검증 소스 쪽을 쓴다. */
  description: string;
};

export type ProSharesHoldingsResult = {
  /** 펀드별 보유 종목. 요청한 펀드가 파일에 없으면 실패로 올린다(빈 배열로 남기지 않는다). */
  byFund: Record<ProSharesDividendFund, ProSharesHolding[]>;
  /** 파일 머리말 `AS OF M/D/YYYY` 를 ISO 로 바꾼 값. 못 읽으면 `null`. */
  fileAsOf: string | null;
  url: string;
};

/** 배당귀족 수집기가 쓰는 좁은 형태. `collect.ts` 의 기존 계약을 그대로 유지한다. */
export type NoblHoldingsResult = {
  holdings: ProSharesHolding[];
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

const unquote = (cell: string | undefined): string => (cell ?? '').replace(/"/g, '').trim();

/** CSV 본문 → 펀드별 보유 종목. 네트워크와 무관한 순수 파싱이라 그대로 테스트할 수 있다. */
export const parseProSharesHoldings = (
  csv: string,
  funds: readonly ProSharesDividendFund[] = PROSHARES_DIVIDEND_FUNDS
): Omit<ProSharesHoldingsResult, 'url'> => {
  const lines = csv.split(/\r?\n/);
  const wanted = new Set<string>(funds);
  const byFund = Object.fromEntries(funds.map((fund) => [fund, [] as ProSharesHolding[]])) as Record<
    ProSharesDividendFund,
    ProSharesHolding[]
  >;

  for (const line of lines) {
    const cells = splitCsvLine(line);
    const fund = unquote(cells[0]);
    if (!wanted.has(fund)) continue;
    const rawTicker = unquote(cells[2]);
    // 티커가 빈 행 = `Net Other Assets (Liabilities)`. 종목이 아니므로 버린다.
    if (rawTicker.length === 0) continue;
    byFund[fund as ProSharesDividendFund].push({
      ticker: canonicalTicker(rawTicker),
      description: unquote(cells[4])
    });
  }

  // 한 펀드라도 못 뽑으면 파일 구조가 바뀐 것이다 — 빈 목록을 조용히 넘기면 화면이 거짓말을 한다.
  const empty = funds.filter((fund) => byFund[fund].length === 0);
  if (empty.length > 0) {
    throw new ListSourceError(
      `ProShares 보유내역에서 ${empty.join(', ')} 종목을 하나도 뽑지 못했다(파일 구조 변경?)`
    );
  }

  return { byFund, fileAsOf: parseFileAsOf(lines[1]) };
};

const fetchHoldingsCsv = async (fetchImpl: typeof fetch): Promise<string> => {
  let response: Response;
  try {
    response = await fetchImpl(PROSHARES_HOLDINGS_URL, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new ListSourceError(`ProShares 보유내역 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`ProShares 보유내역 HTTP ${response.status}`);
  return response.text();
};

export const fetchProSharesHoldings = async (
  fetchImpl: typeof fetch = fetch,
  funds: readonly ProSharesDividendFund[] = PROSHARES_DIVIDEND_FUNDS
): Promise<ProSharesHoldingsResult> => ({
  ...parseProSharesHoldings(await fetchHoldingsCsv(fetchImpl), funds),
  url: PROSHARES_HOLDINGS_URL
});

/** 배당귀족 목록 수집기용 좁은 조회. 같은 파일에서 NOBL 블록만 꺼낸다. */
export const fetchNoblHoldings = async (fetchImpl: typeof fetch = fetch): Promise<NoblHoldingsResult> => {
  const result = await fetchProSharesHoldings(fetchImpl, ['NOBL']);
  return { holdings: result.byFund.NOBL, fileAsOf: result.fileAsOf, url: result.url };
};

export { PROSHARES_HOLDINGS_URL };
