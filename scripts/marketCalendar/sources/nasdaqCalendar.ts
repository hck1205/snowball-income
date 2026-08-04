/**
 * Nasdaq 공개 캘린더 API 어댑터 — 네트워크에 닿는 유일한 곳. 정규화는 `normalize.ts`(순수)가 한다.
 *
 * ```
 *   https://api.nasdaq.com/api/calendar/earnings?date=YYYY-MM-DD
 *   https://api.nasdaq.com/api/calendar/economicevents?date=YYYY-MM-DD
 * ```
 *
 * ## 🔴 실측으로 확인한 것 (2026-08-04)
 * 1. **키가 필요 없다.** 다만 브라우저 UA 가 없으면 막힌다.
 * 2. **앞으로 볼 수 있는 거리가 짧다.** 실적은 오늘 근처가 빽빽하고(8/6 577건) 한 달 뒤면 성기며
 *    (9/10 20건) 두 달 뒤는 0 이다(10/15). 기업이 발표일을 3~4주 전에야 알리기 때문이다.
 *    → 그래서 이 소스는 **"가까운 몇 주"** 담당이고, 1년 앞을 보는 휴장일·FOMC 는 큐레이션이 맡는다.
 * 3. **`gmt` 필드는 GMT 가 아니다.** 이름과 달리 값이 **미 동부시각**이다(실물 대조: 신규 실업수당
 *    청구가 `08:30` 으로 온다 — 실제 발표 시각이 08:30 ET 다). 이름을 믿지 말고 ET 로 다룬다.
 * 4. **경제지표에 빠지는 것이 있다.** 2026-08-07(금)에 고용보고서가 없었다. 이 소스는 완전한
 *    목록이 아니다 — 화면이 "여기 없는 일정도 있다"고 말할 수 있어야 한다.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export type NasdaqEarningsRow = {
  symbol?: string;
  name?: string;
  time?: string;
  marketCap?: string;
};

export type NasdaqEconomicRow = {
  gmt?: string;
  country?: string;
  eventName?: string;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export type NasdaqClientOptions = {
  /** 요청 사이 간격(ms). 기본 250 — 무료 공개 API 를 쓰는 쪽의 예의다. */
  readonly delayMs?: number;
  /** 테스트 주입용. */
  readonly fetchImpl?: typeof fetch;
};

export class NasdaqCalendarClient {
  private readonly delayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NasdaqClientOptions = {}) {
    this.delayMs = options.delayMs ?? 250;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * 하루치를 받는다.
   *
   * 🔴 **실패를 예외로 올리지 않고 빈 배열로 접는다.** 90일을 도는 수집에서 하루가 실패했다고
   * 전체를 버리면, 남은 89일의 정상 자료까지 잃는다. 대신 호출부가 실패한 날을 셀 수 있게
   * `null` 과 `[]` 를 구분해 돌려준다 — `null` 은 "못 받았다", `[]` 는 "받았는데 일정이 없다".
   */
  private async fetchDay<T>(path: string, date: string, pick: (payload: unknown) => T[] | null): Promise<T[] | null> {
    await sleep(this.delayMs);
    try {
      const response = await this.fetchImpl(`https://api.nasdaq.com/api/calendar/${path}?date=${date}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' }
      });
      if (!response.ok) return null;
      return pick(await response.json());
    } catch {
      return null;
    }
  }

  async earnings(date: string): Promise<NasdaqEarningsRow[] | null> {
    return this.fetchDay(path('earnings'), date, (payload) => {
      const rows = (payload as { data?: { rows?: NasdaqEarningsRow[] | null } })?.data?.rows;
      return Array.isArray(rows) ? rows : [];
    });
  }

  async economic(date: string): Promise<NasdaqEconomicRow[] | null> {
    return this.fetchDay(path('economicevents'), date, (payload) => {
      const rows = (payload as { data?: { rows?: NasdaqEconomicRow[] | null } })?.data?.rows;
      return Array.isArray(rows) ? rows : [];
    });
  }
}

/** 경로 오타를 한 곳에서 막는다(두 엔드포인트가 같은 형태라 문자열을 흩뿌리기 쉽다). */
const path = (name: 'earnings' | 'economicevents'): string => name;
