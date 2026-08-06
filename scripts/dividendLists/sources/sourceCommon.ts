/** 소스에서 온 실패는 전부 이 타입이다 — CLI 가 "지어내지 않고 그대로 보고"하기 위한 경계다. */
export class ListSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListSourceError';
  }
}

/**
 * 무키 공개 엔드포인트도 브라우저 형태의 UA 를 요구한다(야후 chart 는 UA 없으면 거절).
 * `scripts/tickerRefresh/provider/yahooProvider.ts` 와 같은 값·같은 이유다.
 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * 클래스 주식 표기를 **점 형태**로 통일한다: `BF/B`(ProShares) · `BF-B`(야후) → `BF.B`(위키피디아).
 * 정규화를 빠뜨리면 같은 회사가 두 줄로 들어와 목록 수가 늘고 교차검증이 어긋난다.
 */
export const canonicalTicker = (raw: string): string => raw.trim().toUpperCase().replace(/[/-]/g, '.');

/** 야후는 점을 하이픈으로 쓴다(`BF.B` → `BF-B`). 조회 직전에만 변환한다. */
export const toYahooSymbol = (ticker: string): string => ticker.replace(/\./g, '-');

/** 비공식 공개 API 를 연달아 두드리지 않기 위한 간격. 기본 2초는 `ticker:refresh` 의 배려 정책과 같다. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const todayIso = (): string => new Date().toISOString().slice(0, 10);
