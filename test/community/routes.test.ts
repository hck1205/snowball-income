import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { routes } from '@/router/routes';

/**
 * 게이팅 OFF (라우팅 레벨) — isCommunityEnabled=false(기본 테스트 env)에서는
 * 커뮤니티 라우트가 아예 존재하지 않고, 모르는 경로는 '/'로 리다이렉트된다.
 */

const flatten = (list: readonly RouteObject[]): RouteObject[] =>
  list.flatMap((route) => [route, ...(route.children ? flatten(route.children) : [])]);

describe('앱 라우트 (커뮤니티 비활성)', () => {
  const all = flatten(routes);

  it('/community 로 시작하는 라우트가 없다', () => {
    const communityPaths = all.map((r) => r.path).filter((p): p is string => typeof p === 'string' && p.includes('community'));
    expect(communityPaths).toEqual([]);
  });

  it('알 수 없는 경로(*)를 "/"로 리다이렉트하는 catch-all이 있다', () => {
    const wildcard = all.find((r) => r.path === '*');
    expect(wildcard).toBeDefined();

    // Navigate 엘리먼트의 목적지를 확인한다 (라우팅 계약)
    const element = wildcard?.element as { props?: { to?: unknown } } | undefined;
    expect(element?.props?.to).toBe('/');
  });

  it('루트("/")는 존재한다', () => {
    expect(all.some((r) => r.path === '/')).toBe(true);
  });
});
