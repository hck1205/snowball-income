import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { routes } from '@/router/routes';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';

/**
 * 가계부(`/ledger`) **기능 게이트**의 계약.
 *
 * 이 화면은 환경변수 3종(`VITE_GOOGLE_CLIENT_ID`·`VITE_GOOGLE_API_KEY`·`VITE_GOOGLE_PROJECT_NUMBER`)이
 * 전부 있을 때만 존재한다. 테스트 환경에는 그 값이 없으므로 **꺼진 상태가 기본**이고, 이 파일이
 * 잠그는 것은 "꺼져 있을 때 앱이 지금과 100% 같다"이다.
 *
 *  ① 🔴 라우트가 **배열에 아예 없다**. `element` 를 조건부로 비우는 방식이면 라우트는 매칭에 성공하고
 *     빈 화면이 뜬다 — 사용자는 자기가 무엇을 잘못 요청했는지 알 수 없다.
 *  ② 🔴 매칭에 실패해 `*` catch-all 이 받아 **404** 가 뜬다. 홈 리다이렉트는 확정 결정으로 금지다
 *     (잘못된 주소가 "정상적으로 메인이 떴다"로 보이는 것이 예전 결함이었다).
 *  ③ 게이트가 켜지면 라우트가 정확히 1개 생긴다 — 가드가 "지우면 잡히는데 더하면 안 잡히는" 단방향이
 *     되지 않게 **양방향**으로 단정한다.
 */

/** 최상위 레이아웃 아래 children 에서 `/ledger` 를 찾는다(라우트는 한 층 안에 있다). */
const findLedgerRoutes = (list: readonly RouteObject[]): RouteObject[] =>
  list.flatMap((route) => [
    ...(route.path === '/ledger' ? [route] : []),
    ...findLedgerRoutes(route.children ?? [])
  ]);

describe('가계부 라우트 게이트', () => {
  it('게이트 상태와 라우트 존재 여부가 정확히 일치한다', () => {
    // 🔴 양방향 단정 — 켜져 있으면 정확히 1개, 꺼져 있으면 0개.
    expect(findLedgerRoutes(routes).length).toBe(isGoogleSheetsEnabled ? 1 : 0);
  });

  it('꺼져 있으면 /ledger 는 404 로 간다 — 홈으로 보내지 않는다', async () => {
    if (isGoogleSheetsEnabled) return;

    const router = createMemoryRouter(routes, { initialEntries: ['/ledger'] });
    render(<RouterProvider router={router} />);

    // 🔴 가계부 화면이 아니라 **404** 가 떠야 한다. 헤딩이 하나 있다는 것만 보면 게이트를 무시하는
    //    뮤턴트(라우트를 무조건 등록)에서도 통과한다 — 어느 화면인지까지 단정한다.
    expect(await screen.findByRole('heading', { level: 1, name: '요청하신 페이지를 찾을 수 없습니다' })).toBeInTheDocument();
    // 주소가 홈으로 바뀌지 않는다 — 무엇을 요청했는지가 주소창에 남아야 한다.
    expect(router.state.location.pathname).toBe('/ledger');
  });
});
