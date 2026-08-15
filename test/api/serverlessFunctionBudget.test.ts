// @vitest-environment node — 파일만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { API_BUNDLES } from '@/tools/apiBundle/manifest.mjs';

/**
 * **서버리스 함수 개수 예산 (Vercel Hobby = 12개).**
 *
 * 🔴 이 상한을 넘기면 **빌드는 통과하고 배포에서 죽는다** —
 * "Deploying outputs" 단계에서 `exceeded_serverless_functions_per_deployment` 로 실패하는데
 * **빌드 로그에는 이유가 안 남는다.** 2026-08-07 에 13개로 늘렸다가 실제로 겪었다.
 *
 * 즉 이 실패는 **CI 의 어떤 단계도 잡지 못한다**(tsc·vitest·build 전부 초록). 머지한 뒤에야,
 * 그것도 조용히 드러난다. 그래서 개수 자체를 여기서 단정한다 — 이 테스트가 그 유일한 그물이다.
 *
 * ## 넘겼을 때 할 일 (새 파일을 만들지 마라)
 * 이 레포는 이미 **디스패처 패턴**으로 여러 지면을 한 함수에 담고 있다(`SeoHtml` 이 티커 상세·
 * 배당 목록·가이드·카테고리 넷을 흡수한다 — 근거는 그 파일 머리말). 늘려야 하면:
 *  - 정적 콘텐츠 렌더러 → `SeoHtml` 에 얹는다
 *  - JSON 응답 → `Fx`·`MarketIndices`·`Unfurl` 을 프록시 묶음으로 합친다
 *  - 크롤러 HTML → `PostHtml`·`ShareHtml`·`SeoHtml` 이 같은 공통 계층(`crawlerHtml.ts`)을 쓰므로
 *    디스패처로 묶기 쉽다
 *
 * ⚠ `og.js`(Satori 렌더, 528KB)와 `account-delete.js` 는 **합치지 마라.** 둘 다 `maxDuration: 30`
 *   이 함수 단위로 걸려 있고, og 의 무게가 다른 지면의 콜드스타트에 얹힌다.
 */

const SERVERLESS_FUNCTION_LIMIT = 12;

const apiDir = fileURLToPath(new URL('../../api', import.meta.url));

describe('서버리스 함수 예산', () => {
  it(`매니페스트가 상한(${SERVERLESS_FUNCTION_LIMIT})을 넘지 않는다`, () => {
    expect(API_BUNDLES.length).toBeLessThanOrEqual(SERVERLESS_FUNCTION_LIMIT);
  });

  /**
   * 매니페스트만 보면 **지운 산출물이 남아 있는 경우**를 놓친다. Vercel 은 `api/` 에 실제로 있는
   * 파일을 세므로, 세는 대상도 실제 파일이어야 한다.
   */
  it(`api/ 에 실제로 있는 .js 개수도 상한을 넘지 않는다`, () => {
    const deployed = readdirSync(apiDir).filter((name) => name.endsWith('.js'));

    expect(deployed.length).toBeLessThanOrEqual(SERVERLESS_FUNCTION_LIMIT);
  });

  /** 매니페스트와 실제 산출물이 어긋나면 개수 단정 자체가 거짓이 된다. */
  it('매니페스트와 api/ 산출물이 같은 집합이다', () => {
    const deployed = readdirSync(apiDir)
      .filter((name) => name.endsWith('.js'))
      .sort();
    const declared = API_BUNDLES.map((bundle) => bundle.out.replace(/^api\//, '')).sort();

    expect(deployed).toEqual(declared);
  });
});

/**
 * 묶은 함수의 **공개 URL 은 그대로여야 한다** (2026-08-15).
 *
 * 🔴 함수를 합치는 것은 배포 사정이지 **API 계약의 변경이 아니다.** 앱은 `/api/fx` 같은 상수를
 * 쓰고, 이미 나간 클라이언트도 그 주소로 부른다. rewrite 가 빠지면 그 지면이 통째로 404 가 되는데
 * — 번들·타입·테스트는 전부 초록이라 **배포 후에야 드러난다.**
 */
describe('묶은 함수의 공개 URL', () => {
  const vercelConfig = JSON.parse(
    readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8')
  ) as { rewrites: { source: string; destination: string }[] };

  it.each([
    ['/api/fx', 'fx'],
    ['/api/market-indices', 'market-indices'],
    ['/api/unfurl', 'unfurl']
  ])('%s 는 proxy 의 %s 지면으로 간다', (source, surface) => {
    const rewrite = vercelConfig.rewrites.find((item) => item.source === source);

    expect(rewrite).toBeDefined();
    expect(rewrite?.destination).toBe(`/api/proxy?surface=${surface}`);
  });

  /**
   * 🔴 로그인 경로다 — rewrite 가 빠지면 **소셜 로그인이 통째로 죽는다.** 그리고 그 실패는
   * 타입·테스트·번들 어디에도 안 잡히고 배포 후에야 드러난다.
   * ⚠ 외부(카카오·네이버 콘솔)에 등록된 `redirect_uri` 는 앱 라우트라 이 통합과 무관하다.
   */
  it.each([
    ['/api/kakao-auth', 'kakao'],
    ['/api/naver-auth', 'naver']
  ])('%s 는 oauth-session 의 %s 지면으로 간다', (source, surface) => {
    const rewrite = vercelConfig.rewrites.find((item) => item.source === source);

    expect(rewrite).toBeDefined();
    expect(rewrite?.destination).toBe(`/api/oauth-session?surface=${surface}`);
  });

  /** 합쳐서 없앤 함수가 되살아나면(파일이 다시 생기면) rewrite 와 파일이 겹쳐 혼란해진다. */
  it('합쳐서 없앤 함수 파일은 남아 있지 않다', () => {
    const deployed = new Set(readdirSync(apiDir));

    for (const gone of ['fx.js', 'market-indices.js', 'unfurl.js', 'kakao-auth.js', 'naver-auth.js']) {
      expect(deployed.has(gone)).toBe(false);
    }
    expect(deployed.has('proxy.js')).toBe(true);
    expect(deployed.has('oauth-session.js')).toBe(true);
  });
});
