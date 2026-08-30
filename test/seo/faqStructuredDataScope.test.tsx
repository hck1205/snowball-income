import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { routes } from '@/router/routes';
import { FAQ_STRUCTURED_DATA_ID } from '@/shared/lib/seo';
import { LANDING_COPY } from '@/pages/Landing/copy';
import { ABOUT_PATH } from '@/shared/constants/routes';
import { storageKey } from '@/shared/lib/storage';

/**
 * 🔴 **`FAQPage` JSON-LD 는 `/about` 에서만 DOM 에 있다.**
 *
 * 셸은 SPA 전 라우트가 공유하므로, 아무 조치도 하지 않으면 이 노드가 `/`·`/simulator`·`/privacy`·
 * 없는 주소 어디서나 렌더 결과에 남는다. 그 화면들에는 해당 FAQ 가 **없다** — 렌더링하는 검증
 * 도구가 "보이지 않는 콘텐츠 마크업"으로 보면 FAQ 리치 결과가 사이트 전체에서 무효화될 수 있다.
 * 처방과 되돌리기 조건은 `shared/lib/seo/faqStructuredData.ts` 주석에 있다.
 *
 * 🔴 **2026-08-27: 그 주소가 `/` 에서 `/about` 으로 옮겼다.** 첫 화면이 목표 여섯을 고르는 화면이
 * 되면서 FAQ 가 보이는 곳은 `/about` 하나가 됐고, 마크업도 함께 따라갔다. `/` 가 이제 **제거 대상**
 * 이라는 것이 이 이관의 핵심이라, 아래 목록의 첫 줄이 그것을 잠근다.
 *
 * 픽스처를 지어내지 않고 **진짜 `tools/seo/shells/about.head.html` 의 script 태그를 잘라 붙인다** —
 * id 를 한쪽만 바꾸면(=계약 파기) 여기 준비 단계가 먼저 터진다.
 */

/** 🔴 `index.html` 이 아니다 — 빌드가 이 조각을 `/about` 셸에만 붙인다(위 머리말). */
const ABOUT_HEAD_HTML = readFileSync(
  resolve(__dirname, '../../tools/seo/shells/about.head.html'),
  'utf-8'
);

/** 셸에서 FAQ script 태그 원문을 그대로 떼어 온다. 못 찾으면 그 자체가 계약 파기다. */
const FAQ_SCRIPT_MARKUP = (() => {
  const match = ABOUT_HEAD_HTML.match(
    new RegExp(`<script id="${FAQ_STRUCTURED_DATA_ID}" type="application/ld\\+json">[\\s\\S]*?</script>`)
  );
  if (!match) {
    throw new Error(`about.head.html 에서 #${FAQ_STRUCTURED_DATA_ID} script 를 찾지 못했다 (id 계약 파기).`);
  }
  return match[0];
})();

const faqNode = () => document.getElementById(FAQ_STRUCTURED_DATA_ID);

/** 지수 조회 드라이버(랜딩)의 네트워크를 끊는다 — 영원히 대기하는 프로미스로 스켈레톤에 고정. */
const stubNeverResolvingFetch = (): (() => void) => {
  const original = globalThis.fetch;
  globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
};

const enterAt = (url: string) => {
  window.history.replaceState(null, '', url);

  const store = createStore();
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );

  return router;
};

let restoreFetch: () => void;

beforeEach(() => {
  restoreFetch = stubNeverResolvingFetch();
  window.localStorage.removeItem(storageKey('has-workspace'));
  // 실제 셸과 같은 출발점: 어느 주소로 들어오든 서버는 이 노드가 든 HTML 을 내려준다.
  document.head.insertAdjacentHTML('beforeend', FAQ_SCRIPT_MARKUP);
});

afterEach(() => {
  restoreFetch();
  faqNode()?.remove();
  window.history.replaceState(null, '', '/');
});

describe('FAQPage JSON-LD 의 라우트 범위', () => {
  it('안내문(`/about`)에서는 그대로 남는다', async () => {
    enterAt(ABOUT_PATH);

    expect(
      await screen.findByRole('heading', { level: 1, name: LANDING_COPY.hero.title })
    ).toBeInTheDocument();

    const node = faqNode();
    expect(node).not.toBeNull();

    // 남아 있는 것이 정말 FAQPage 이고 자기 대상을 `/about` 이라고 말하는지까지 본다.
    const parsed = JSON.parse(node?.textContent ?? '{}') as { '@type': string; url: string };
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.url).toMatch(/\/about$/);
  });

  it.each([
    // 🔴 `/` 가 이 목록에 있는 것이 2026-08-27 이관의 핵심이다 — 첫 화면에 FAQ 가 없다.
    ['첫 화면', '/'],
    ['시뮬레이터', '/simulator'],
    ['개인정보처리방침', '/privacy'],
    ['없는 주소(404)', '/이런-주소는-없다']
  ])('%s (%s) 에서는 DOM 에서 사라진다', async (_label, url) => {
    enterAt(url);

    await waitFor(() => {
      expect(faqNode()).toBeNull();
    });
  });

  it('시뮬레이터에서 안내문으로 돌아오면 다시 붙는다 — 제거는 편도가 아니다', async () => {
    const router = enterAt('/simulator');

    await waitFor(() => {
      expect(faqNode()).toBeNull();
    });

    await router.navigate(ABOUT_PATH);

    await waitFor(() => {
      expect(faqNode()).not.toBeNull();
    });
    // 다시 붙은 것은 **같은 노드**다 — 본문을 코드에서 재생성하지 않는다(정본은 파셜 하나).
    expect(JSON.parse(faqNode()?.textContent ?? '{}')['@type']).toBe('FAQPage');
    // 중복 부착도 없다.
    expect(document.querySelectorAll(`#${FAQ_STRUCTURED_DATA_ID}`)).toHaveLength(1);
  });
});
