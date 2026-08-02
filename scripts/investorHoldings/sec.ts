/**
 * SEC EDGAR 접근 계층 — 네트워크에 닿는 유일한 곳. 파싱은 `parse13f.ts`(순수)가 한다.
 *
 * ## 🔴 User-Agent 는 선택이 아니다
 * SEC 는 요청자 식별을 요구한다. **헤더가 없으면 403** 이고, 붙이면 200 이다(2026-08-02 실측:
 * 같은 URL 이 UA 없이 403, UA 붙여 200). `pitfalls.md` 에 "sec.gov 직접 fetch 는 403" 으로 적혀 있던
 * 항목은 **차단이 아니라 이 헤더 누락**이 원인이었다 — 그 기록은 이 사실로 정정됐다.
 *
 * ## 요청 예산
 * 감시 단계는 인물당 **1 요청**(제출 목록)이고, 실제로 새 공시가 있을 때만 인물당 +2(색인·정보표)다.
 * 13명이면 평소 13 요청/일 — SEC 의 10 요청/초 기준에 견주면 무시할 수준이다. 그래도 `delayMs` 로
 * 간격을 둔다: 무료 공개 API 를 쓰는 쪽의 예의이고, 러너 IP 가 묶이는 것을 막는다.
 */

/** 연락처를 포함한 UA. SEC 가 요구하는 형식이다(누가 긁는지 알 수 있어야 한다). */
export const SEC_USER_AGENT = 'snowball-income (dividend simulator) contact: headtotoe1205@gmail.com';

export type SecClientOptions = {
  /** 요청 사이 간격(ms). 기본 300 — 하루 13 요청이라 넉넉하다. */
  readonly delayMs?: number;
  /** 테스트 주입용. 미지정이면 전역 fetch. */
  readonly fetchImpl?: typeof fetch;
};

export type FilingRef = {
  readonly accessionNumber: string;
  /** 보고 기준 분기말(YYYY-MM-DD). **화면이 말하는 "언제 기준"이 이 값이다.** */
  readonly reportDate: string;
  /** 제출일. 지연 폭을 계산할 때 쓴다. */
  readonly filingDate: string;
  /** SEC 등록명. 명단의 표시명과 다를 수 있어 대조용으로 들고 다닌다. */
  readonly registrantName: string;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SecClient {
  private readonly delayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SecClientOptions = {}) {
    this.delayMs = options.delayMs ?? 300;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request(url: string): Promise<Response> {
    await sleep(this.delayMs);
    const response = await this.fetchImpl(url, { headers: { 'User-Agent': SEC_USER_AGENT } });
    if (!response.ok) {
      /* 403 은 거의 언제나 UA 문제다 — 다음 사람이 헤매지 않게 사유를 문구에 박는다. */
      const hint = response.status === 403 ? ' (User-Agent 헤더를 확인하라 — SEC 는 요청자 식별을 요구한다)' : '';
      throw new Error(`SEC ${response.status} ${url}${hint}`);
    }
    return response;
  }

  /**
   * 그 기관의 **최신 13F 보고**를 찾는다.
   *
   * 🔴 `13F-HR` 과 정정본 `13F-HR/A` 를 함께 본다. 정정이 있으면 원본의 보유가 바뀌므로 **같은 분기에서는
   * 정정본이 이긴다.** 목록은 최신순이라 먼저 만나는 것이 최신 제출이지만, 분기 비교를 명시적으로 한다.
   * 13F 를 한 번도 낸 적 없으면 `null` — 예외가 아니라 값으로 돌려준다(명단에 사람을 잘못 넣었을 수 있다).
   */
  async findLatest13F(cik: string): Promise<FilingRef | null> {
    const response = await this.request(`https://data.sec.gov/submissions/CIK${cik}.json`);
    const payload = (await response.json()) as {
      name?: string;
      filings?: { recent?: { form?: string[]; accessionNumber?: string[]; reportDate?: string[]; filingDate?: string[] } };
    };

    const recent = payload.filings?.recent;
    if (!recent?.form) return null;

    let best: FilingRef | null = null;
    for (let index = 0; index < recent.form.length; index += 1) {
      const form = recent.form[index];
      if (form !== '13F-HR' && form !== '13F-HR/A') continue;

      const candidate: FilingRef = {
        accessionNumber: recent.accessionNumber?.[index] ?? '',
        reportDate: recent.reportDate?.[index] ?? '',
        filingDate: recent.filingDate?.[index] ?? '',
        registrantName: payload.name ?? ''
      };
      if (!candidate.accessionNumber || !candidate.reportDate) continue;

      /* 더 최신 분기가 이긴다. 같은 분기면 목록 상단(= 더 나중 제출 = 정정본)이 이긴다. */
      if (!best || candidate.reportDate > best.reportDate) best = candidate;
    }
    return best;
  }

  /**
   * 그 공시의 **정보표 XML** 을 받는다.
   *
   * ⚠ 정보표 파일명은 제출자마다 다르다(`53405.xml` 처럼 임의다). 그래서 색인을 먼저 읽고
   * `primary_doc` 이 **아닌** `.xml` 을 고른다. 후보가 없으면 `null` — 기밀 취급 요청 등으로
   * 정보표가 없는 공시가 실제로 존재한다.
   */
  async fetchInfoTableXml(cik: string, accessionNumber: string): Promise<string | null> {
    const accession = accessionNumber.replace(/-/g, '');
    const directory = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession}`;

    const indexResponse = await this.request(`${directory}/index.json`);
    const index = (await indexResponse.json()) as { directory?: { item?: { name: string }[] } };

    const file = index.directory?.item?.find(
      (item) => item.name.toLowerCase().endsWith('.xml') && !item.name.toLowerCase().includes('primary_doc')
    );
    if (!file) return null;

    const xmlResponse = await this.request(`${directory}/${file.name}`);
    return xmlResponse.text();
  }
}
