// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 🔴 **사이트맵의 정적 라우트 목록과 실제 공개 라우트가 어긋나지 않게 잠근다.**
 *
 * 2026-08-08 점검에서 넷이 빠져 있었다 — `/portfolio/investors` · `/dividend/calendar` ·
 * `/dividend/portfolio` · `/ticker/compare`. 넷 다 색인 대상인데 사이트맵에만 없었다.
 *
 * 왜 생겼나: `vite.config.ts` 의 ROUTES 는 `router/routes.tsx` 와 **손으로** 맞추는 목록이다.
 * 화면을 새로 열 때 라우트는 추가하고 사이트맵은 잊는다 — 잊었다는 사실을 알려 줄 것이 없었다.
 * 이 테스트가 그 알림이다.
 *
 * ⚠ 소스를 읽는다(렌더가 아니라). vite.config.ts 는 앱 번들이 아니라 빌드 설정이라 import 할 수
 *   없고(플러그인·esbuild 를 끌고 온다), 필요한 것은 문자열 목록뿐이다.
 */

const REPO_ROOT = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf-8').split(String.fromCharCode(13)).join('');

/**
 * 사이트맵에 **일부러 넣지 않는** 공개 라우트.
 *
 * 🔴 여기 추가할 때는 반드시 이유를 함께 적어라. 이유 없이 늘어나면 이 테스트는 "빠뜨려도 되는
 * 목록"이 되어 존재 의미가 사라진다.
 */
const INTENTIONALLY_ABSENT: Record<string, string> = {
  '/community':
    '커뮤니티 껍데기 경로. 실제 색인 대상은 그 아래 /community/portfolio · /community/board 이고, 둘은 사이트맵에 있다.',
  '/ledger':
    '가계부는 구글 시트 연동 전용 화면이라 로그인·연동 없이는 볼 것이 없다(isGoogleSheetsEnabled 로 라우트 자체가 사라지기도 한다).',
  '/guide/:slug': '가이드는 개별 slug 로 파생해 사이트맵에 들어간다(다섯 편 모두 등재돼 있다).',
  '/ticker/:name': '티커 상세는 loadTickerRoutes() 가 TICKER_CONTENT_LIST 에서 파생한다.',
  '/ticker/category/:categoryId':
    '카테고리 허브는 loadTickerCategories() 가 TICKER_CATEGORY_IDS 에서 파생한다(7개 전부 등재된다). 라벨을 한 줄 더하면 사이트맵도 함께 늘어난다.',
  '/ticker/all':
    '사이트맵에 **있다**. 다만 리터럴이 아니라 vite.config 의 TICKER_HUB_PATH 상수로 들어가 아래 정규식에 안 잡힌다.'
};

describe('사이트맵 ↔ 공개 라우트 대조', () => {
  const routesSource = read('router/routes.tsx');
  const viteConfig = read('vite.config.ts');

  /**
   * `path: '/...'` 형태만 본다.
   *
   * ⚠ **최상위 라우트만 잡힌다.** 중첩 라우트(`/community` 아래 `portfolio`·`board`)는 부모와
   *   자식이 나뉘어 선언돼 이 정규식으로는 합쳐지지 않는다. 그래서 이 테스트는 "빠짐없이 전부"를
   *   보장하지 않는다 — 다만 2026-08-08 에 실제로 빠졌던 넷이 전부 최상위였다. 얕지만 그 자리를 막는다.
   * ⚠ 반대 방향(사이트맵에는 있는데 라우터에 없는 죽은 URL)은 **검사하지 않는다.** 위 한계 때문에
   *   중첩 라우트가 전부 "죽은 URL" 로 잡혀 거짓 양성만 낸다. 틀린 가드는 없는 것보다 나쁘다.
   */
  const declaredRoutes = Array.from(routesSource.matchAll(/path:\s*'(\/[^']*)'/g)).map((m) => m[1]);

  /** ROUTES 배열의 `{ path: '/...' , priority` 형태. priority 가 붙은 것만 사이트맵 항목이다. */
  const sitemapPaths = Array.from(viteConfig.matchAll(/\{\s*path:\s*'(\/[^']*)',\s*priority:/g)).map((m) => m[1]);

  it('라우터가 경로를 하나라도 선언하고 있다(정규식이 조용히 0건이 되지 않게)', () => {
    expect(declaredRoutes.length).toBeGreaterThan(5);
    expect(sitemapPaths.length).toBeGreaterThan(5);
  });

  it('🔴 색인 대상 공개 라우트가 전부 사이트맵에 있다', () => {
    const missing = declaredRoutes.filter(
      (route) => !sitemapPaths.includes(route) && !(route in INTENTIONALLY_ABSENT)
    );

    expect(
      missing,
      `사이트맵에 없는 공개 라우트: ${missing.join(', ')}\n` +
        'vite.config.ts 의 ROUTES 에 추가하거나, 넣지 않는 이유를 INTENTIONALLY_ABSENT 에 적어라.'
    ).toEqual([]);
  });

});
