/**
 * SEC EDGAR 접근 계층 — ETF 보유 수집기에서 네트워크에 닿는 유일한 곳. 파싱은 `parseNport.ts`(순수)가 한다.
 *
 * 🔴 User-Agent 는 13F 수집기와 **같은 값**을 쓴다(없으면 403 — `scripts/investorHoldings/sec.ts` 머리주석).
 *
 * ## 요청 예산
 * 감시 단계는 ETF 당 1 요청(공시 목록)이고, 새 공시가 있을 때만 +1(보유 명세)이다.
 * 명단 150개면 평소 하루 150여 요청 — SEC 의 10 요청/초 기준에 견주면 작지만, 간격을 둔다.
 */
import { SEC_USER_AGENT } from '../investorHoldings/sec';
import { parseFundTickers, parseNportFilingsAtom } from './parseNport';
import type { FundSeries, NportFilingRef } from './parseNport';

export type EtfSecClientOptions = {
  readonly delayMs?: number;
  readonly fetchImpl?: typeof fetch;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class EtfSecClient {
  private readonly delayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: EtfSecClientOptions = {}) {
    this.delayMs = options.delayMs ?? 200;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request(url: string): Promise<Response> {
    await sleep(this.delayMs);
    const response = await this.fetchImpl(url, { headers: { 'User-Agent': SEC_USER_AGENT } });
    if (!response.ok) {
      const hint = response.status === 403 ? ' (User-Agent 헤더를 확인하라 — SEC 는 요청자 식별을 요구한다)' : '';
      throw new Error(`SEC ${response.status} ${url}${hint}`);
    }
    return response;
  }

  /** 펀드 티커 → (CIK, 시리즈 ID). ETF 가 어느 시리즈인지 알아야 그 시리즈의 N-PORT 를 찾는다. */
  async fetchFundSeries(): Promise<Map<string, FundSeries>> {
    const response = await this.request('https://www.sec.gov/files/company_tickers_mf.json');
    return parseFundTickers(await response.json());
  }

  /**
   * 그 시리즈의 최신 N-PORT. 없으면 `null`.
   * EDGAR 회사 검색은 CIK 자리에 **시리즈 ID** 를 받는다 — 한 신탁(예: iShares Trust)이 수백 개 펀드의
   * 공시를 한 CIK 로 내므로, CIK 로 찾으면 어느 공시가 이 ETF 것인지 알 수 없다.
   */
  async findLatestNport(seriesId: string): Promise<NportFilingRef | null> {
    const url =
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(seriesId)}` +
      '&type=NPORT-P&dateb=&owner=include&count=10&output=atom';
    const response = await this.request(url);
    return parseNportFilingsAtom(await response.text())[0] ?? null;
  }

  async fetchNportXml(filing: NportFilingRef): Promise<string> {
    const response = await this.request(`${filing.directoryUrl}/primary_doc.xml`);
    return response.text();
  }
}
