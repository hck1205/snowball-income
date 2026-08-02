// @vitest-environment node — 상수 두 벌을 비교하는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TICKER_PAGE_INDEX } from '@/shared/constants/tickerPages';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { LANDING_SEARCH_FALLBACK } from '@/pages/Landing/copy';

/**
 * 🔴 **복제한 값은 반드시 어긋난다 — 이 가드가 그 순간을 잡는다.**
 *
 * 랜딩 검색은 `shared/constants/tickerPages` 의 경량 인덱스만 본다. 원본
 * (`shared/constants/tickers`, 11종 한국어 서사 + FAQ)을 직접 읽으면 첫인상 지면이 서버 번들
 * 실측 416KB 를 그대로 진다. 대신 치르는 대가가 **복제**이고, 복제의 대가는 드리프트다:
 * 12번째 티커 페이지를 추가하면서 이 배열을 빼먹으면 새 종목이 검색에서 조용히 사라지고,
 * 반대로 인덱스에만 넣으면 검색 결과가 **죽은 링크**가 된다. 둘 다 화면은 멀쩡해 보인다.
 */

const key = (symbol: string, slug: string) => `${symbol}:${slug}`;

describe('랜딩 티커 인덱스 — 소개 페이지 레지스트리와 1:1', () => {
  it('양방향으로 정확히 같은 집합이다', () => {
    const fromIndex = [...TICKER_PAGE_INDEX].map((entry) => key(entry.symbol, entry.slug)).sort();
    const fromRegistry = TICKER_CONTENT_LIST.map((content) => key(content.ticker, content.slug)).sort();

    // 실패 메시지가 "어느 쪽에 무엇이 더 있는지"를 그대로 보여 준다.
    expect(fromIndex).toEqual(fromRegistry);
  });

  it('모든 심볼이 한글명을 갖는다 — 검색이 심볼로만 걸리는 종목이 생기지 않는다', () => {
    const names: Record<string, string | undefined> = PRESET_TICKER_KOREAN_NAME_BY_TICKER;
    const missing = TICKER_PAGE_INDEX.filter((entry) => !names[entry.symbol]).map((entry) => entry.symbol);

    expect(missing).toEqual([]);
  });

  it('무결과 폴백 3종이 전부 인덱스 안에 있다 — 죽은 폴백을 막는다', () => {
    const symbols = new Set(TICKER_PAGE_INDEX.map((entry) => entry.symbol));
    const dead = LANDING_SEARCH_FALLBACK.filter((symbol) => !symbols.has(symbol));

    expect(dead).toEqual([]);
  });

  /**
   * 🔴 이 파일이 무거워지면 격리의 의미가 사라진다. import 를 하나라도 들이는 순간 그 캐스케이드가
   * 랜딩 청크로 따라오고, 그러면 애초에 원본을 읽는 것과 다를 게 없다.
   */
  it('경량 인덱스는 의존성 0의 리프다 — import 문이 하나도 없다', () => {
    const source = readFileSync(resolve(process.cwd(), 'shared/constants/tickerPages/index.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
