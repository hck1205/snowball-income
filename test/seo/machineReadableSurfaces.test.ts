// @vitest-environment node — 파일을 읽어 문자열만 본다 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * **`/` → 랜딩 / `/simulator` → 시뮬레이터 이전이 "기계가 읽는 표면" 전체에 반영됐는지** 잠근다.
 *
 * 이 표면들은 서로를 전혀 모른다 — 한 번은 `llms.txt`·`llms-full.txt` 만 고치고
 * `ai-overview.json` 을 빠뜨려 그 파일만 거짓으로 남았다(pitfalls 2026-08-01). 화면에서는 아무 일도
 * 일어나지 않으므로 사람이 동시에 열지 않는 한 드러나지 않는다. 그래서 한 파일에 묶는다.
 *
 * 함께 잠그는 것:
 *  - **사이트맵 정본** = `vite.config.ts` 의 `ROUTES` 배열 하나뿐이다(`public/sitemap.xml` 은 없다).
 *  - **티커 CTA 는 한 쌍** — 서버 렌더 HTML(크롤러가 읽는 전부)과 SPA 뷰가 같은 곳을 가리켜야 한다.
 *    한쪽만 고치면 화면 확인으로는 절대 드러나지 않는다.
 *  - **비유 금지**(decisions.md `[2026-07-22][copy]`)는 `copyTone.test.ts` 가 `.ts`/`.tsx` 만 훑어
 *    `index.html` 을 보지 않는다. 실제로 `featureList` 에 오래 살아남았다(2026-08-01 제거).
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const LLMS = readRepoFile('public/llms.txt');
const LLMS_FULL = readRepoFile('public/llms-full.txt');
const AI_OVERVIEW_RAW = readRepoFile('public/ai-overview.json');
const AI_OVERVIEW = JSON.parse(AI_OVERVIEW_RAW) as { entrypoints: Record<string, string> };
const INDEX_HTML = readRepoFile('index.html');
const VITE_CONFIG = readRepoFile('vite.config.ts');

const AI_SURFACES = [
  { name: 'public/llms.txt', text: LLMS },
  { name: 'public/llms-full.txt', text: LLMS_FULL },
  { name: 'public/ai-overview.json', text: AI_OVERVIEW_RAW }
] as const;

/** 주석에만 있는 문자열을 "코드에 있다"고 오판하지 않게 걷어낸다(legalSurfaceConsistency 와 같은 기법). */
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** 브랜드명 "Snowball Income" 은 이름이라 예외 — 금지 대상은 한글 비유다. */
const FORBIDDEN_METAPHORS = [/스노우볼/, /눈덩이/] as const;

describe('기계 판독 표면의 라우트 정합', () => {
  it.each(AI_SURFACES)('$name 이 /simulator 를 안다', ({ text }) => {
    expect(text).toContain('/simulator');
  });

  it('llms.txt 가 랜딩과 시뮬레이터를 따로 가리킨다', () => {
    expect(LLMS).toMatch(/^- Landing[^\n]*`\/`$/m);
    expect(LLMS).toMatch(/^- Simulator[^\n]*`\/simulator`$/m);
  });

  it('ai-overview.json 의 entrypoints 가 둘을 나눠 갖는다', () => {
    expect(AI_OVERVIEW.entrypoints.landing).toBe('/');
    expect(AI_OVERVIEW.entrypoints.simulator).toBe('/simulator');
    // 구 `app` 키는 "앱이 `/` 에 있다"는 뜻이라 이전 후에는 거짓이다.
    expect(AI_OVERVIEW.entrypoints.app).toBeUndefined();
  });

  it('🔴 사이트맵 정본(vite.config.ts ROUTES)에 랜딩 1.0 · 시뮬레이터 0.9 가 함께 있다', () => {
    const source = stripComments(VITE_CONFIG);

    expect(source).toMatch(/path: '\/', priority: '1\.0', changefreq: 'weekly'/);
    expect(source).toMatch(/path: '\/simulator', priority: '0\.9', changefreq: 'weekly'/);
  });

  it('🔴 티커 CTA 는 서버 HTML 과 SPA 가 같은 상수를 가리킨다', () => {
    const serverHandler = stripComments(readRepoFile('server/handlers/TickerHtml/TickerHtml.ts'));
    const spaView = stripComments(readRepoFile('pages/Ticker/TickerDetailPage/TickerDetailPage.view.tsx'));

    expect(serverHandler).toContain('href="${SIMULATOR_PATH}"');
    expect(spaView).toContain('<PrimaryCta to={SIMULATOR_PATH}>');
    // 경로 리터럴로 되돌아가면(= 랜딩행) 여기서 걸린다.
    expect(serverHandler).not.toMatch(/href="\/"/);
    expect(spaView).not.toMatch(/to="\/"/);
  });
});

describe('금지된 비유', () => {
  it.each(FORBIDDEN_METAPHORS)('index.html 에 %s 이(가) 없다', (metaphor) => {
    expect(INDEX_HTML).not.toMatch(metaphor);
  });

  /** 빌드 때 `index.html` 안으로 주입되는 정적 예시도 같은 규칙을 받는다(주석 포함 — 결국 같은 낱말이다). */
  it.each(FORBIDDEN_METAPHORS)('vite.config.ts 의 정적 셸 주입 문자열에 %s 이(가) 없다', (metaphor) => {
    expect(VITE_CONFIG).not.toMatch(metaphor);
  });
});
