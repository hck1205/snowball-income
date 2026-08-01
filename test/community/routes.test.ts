// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { routes } from '@/router/routes';

/**
 * 게이팅 OFF (라우팅 레벨) — isCommunityEnabled=false(기본 테스트 env)에서는
 * 커뮤니티 라우트가 아예 존재하지 않는다.
 *
 * ⚠ 모르는 경로(`*`)의 계약은 **2026-07-31 에 뒤집혔다** — 예전에는 `<Navigate to="/">` 였고
 * 이 파일이 그 목적지를 잠그고 있었다. 지금은 404 화면을 그린다(`test/router/notFoundRoute.test.tsx`
 * 가 렌더로 잠근다). 여기서는 "리다이렉트가 아니다"만 확인한다 — 되돌리려면 두 파일을 함께 봐야 한다.
 */

const flatten = (list: readonly RouteObject[]): RouteObject[] =>
  list.flatMap((route) => [route, ...(route.children ? flatten(route.children) : [])]);

describe('앱 라우트 (커뮤니티 비활성)', () => {
  const all = flatten(routes);

  it('/community 로 시작하는 라우트가 없다', () => {
    const communityPaths = all.map((r) => r.path).filter((p): p is string => typeof p === 'string' && p.includes('community'));
    expect(communityPaths).toEqual([]);
  });

  it('알 수 없는 경로(*)를 받는 catch-all 이 있고, 리다이렉트가 아니다', () => {
    const wildcard = all.find((r) => r.path === '*');
    expect(wildcard).toBeDefined();

    // `Navigate` 는 목적지를 `to` 로 갖는다 — 그 prop 이 있으면 다시 리다이렉트로 되돌아간 것이다.
    const element = wildcard?.element as { props?: { to?: unknown } } | undefined;
    expect(element?.props?.to).toBeUndefined();
  });

  it('루트("/")는 존재한다', () => {
    expect(all.some((r) => r.path === '/')).toBe(true);
  });
});
