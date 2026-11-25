import { act, cleanup, render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';

/**
 * 전체 라우트를 렌더하는 테스트의 **예열** — 주소마다 한 번 그려 lazy 청크(페이지와 그 안쪽 조각)를
 * 전부 불러 둔 뒤 지운다(2026-11-25).
 *
 * 왜: 처음 진입하는 화면은 모듈 변환 비용(단독 1.3~1.9초)이 RTL 대기 시간 안에 들어간다. 전체 스위트의
 * 경합(약 3.5배)이 얹히면 대기 한도(8초, test/setup.dom.ts)를 넘겨 "못 찾았다"로 떨어지고, 단독 실행은
 * 늘 통과한다(calendarRelatedLinks · faqStructuredDataScope 실측). 한도를 또 올리는 대신 비용을 대기 밖으로 뺀다.
 *
 * 데운 뒤 재는 것은 렌더뿐이고, 검증 대상(실제 라우트·실제 페이지)은 그대로다.
 * `beforeAll` 에서 부르고 타임아웃을 넉넉히 준다: `beforeAll(() => warmRoutes([...]), 60_000)`.
 */
export const warmRoutes = async (urls: readonly string[], settleMs = 1500): Promise<void> => {
  // 예열 중에는 네트워크로 나가지 않는다 — 화면이 부르는 fetch 는 영원히 대기시킨다(실제 테스트의 스텁과 무관).
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;
  try {
    for (const url of urls) {
      render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [url] })} />);
      // lazy 경계가 풀릴 때까지 기다린다 — 무엇이 보일지는 화면마다 달라 시간으로 기다린다(대기 한도와 무관).
      await act(() => new Promise((resolve) => setTimeout(resolve, settleMs)));
      cleanup();
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
};
