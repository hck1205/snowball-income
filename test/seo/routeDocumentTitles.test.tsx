import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { DIVIDEND_CALENDAR_COPY } from '@/pages/DividendCalendar/copy';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { SIMULATOR_COPY } from '@/shared/constants';

/**
 * **라우트마다 문서 제목이 다르다** — 특히 시뮬레이터가 자기 제목을 갖는가.
 *
 * 왜 이 가드가 필요한가: `/` 가 시뮬레이터이던 시절에는 `index.html` 의 정적 `<title>` 이 곧
 * 시뮬레이터의 제목이었다. 랜딩이 `/` 를 가져가면서 그 자리는 랜딩 문구가 됐고, `/simulator` 는
 * 자기 제목을 **덮어쓸 주체를 잃었다**(`applySeoRuntimeMetadata` 는 canonical·og:url 만 고친다).
 * 그 상태의 증상은 셋 다 **화면상 아무 이상이 없다**:
 *  ① 색인 대상 두 라우트의 제목이 **완전히 동일**해지고 주력 키워드("배당 재투자 시뮬레이터")가 사라진다,
 *  ② `/simulator` 링크를 공유하면 랜딩 카드가 뜬다,
 *  ③ GA4 `page_view` 의 `page_title`(= `document.title`)이 랜딩 제목으로 기록된다.
 * 눈으로도 기존 렌더 테스트로도 잡히지 않으므로 여기서 문서 제목 자체를 단정한다.
 *
 * ⚠ 셸 제목은 `index.html` 에서 **읽어서** 쓴다(하드코딩하지 않는다) — 단정이 "같지 않다"라서
 * 셸 카피가 개정돼도 이 가드는 계속 옳다.
 */

/*
 * jsdom 환경이라 `import.meta.url` 기준 상대 경로가 아니라 **실행 루트**에서 읽는다
 * (`landingShellCopyParity.test.ts` 는 node 환경이라 URL 기준이 통한다 — 여기서는 렌더가 필요해
 *  jsdom 을 쓴다. URL 기준으로 두면 `C:\index.html` 을 찾다가 죽는다).
 */
const readRepoFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf-8');

/** 정적 셸(`index.html`)의 `<title>` = 랜딩(`/`)의 제목. */
const SHELL_TITLE = (readRepoFile('index.html').match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim();

/** `useDocumentMeta` 는 **있는 태그만** 고친다 — 실제 문서와 같은 준비물을 깔아 준다. */
const META_TAGS = [
  { attr: 'name', key: 'description' },
  { attr: 'name', key: 'twitter:title' },
  { attr: 'name', key: 'twitter:description' },
  { attr: 'property', key: 'og:title' },
  { attr: 'property', key: 'og:description' }
] as const;

const readMeta = (attr: string, key: string): string =>
  document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.content ?? '';

const renderSimulator = () =>
  render(
    <Provider store={createStore()}>
      <MainPage />
    </Provider>
  );

beforeEach(() => {
  // 랜딩에서 넘어온 직후의 문서 상태를 재현한다.
  document.title = SHELL_TITLE;
  META_TAGS.forEach(({ attr, key }) => {
    const meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    meta.content = `셸 ${key}`;
    document.head.append(meta);
  });
});

afterEach(() => {
  document.head.querySelectorAll('meta').forEach((meta) => meta.remove());
  document.title = '';
});

describe('문서 제목 — 라우트마다 다르다', () => {
  it('가드가 빈 셸 제목을 훑고 통과하지 않는다', () => {
    expect(SHELL_TITLE.length).toBeGreaterThan(10);
  });

  it('🔴 `/simulator` 를 그리면 제목이 랜딩(정적 셸) 제목과 달라진다', () => {
    renderSimulator();

    expect(document.title).not.toBe(SHELL_TITLE);
    expect(document.title).toBe(`${SIMULATOR_COPY.meta.title} - Hungry Hippo`);
  });

  it('제목에 이 사이트의 주력 키워드가 남아 있다', () => {
    renderSimulator();

    expect(document.title).toContain('배당 재투자 시뮬레이터');
  });

  it('description·og:*·twitter:* 도 시뮬레이터의 것으로 바뀐다', () => {
    renderSimulator();

    expect(readMeta('name', 'description')).toBe(SIMULATOR_COPY.meta.description);
    expect(readMeta('property', 'og:description')).toBe(SIMULATOR_COPY.meta.description);
    expect(readMeta('name', 'twitter:description')).toBe(SIMULATOR_COPY.meta.description);
    expect(readMeta('property', 'og:title')).toContain(SIMULATOR_COPY.meta.title);
    expect(readMeta('name', 'twitter:title')).toContain(SIMULATOR_COPY.meta.title);
  });

  it('언마운트하면 이전 값으로 되돌아간다 — 랜딩↔시뮬레이터 왕복', () => {
    const { unmount } = renderSimulator();
    unmount();

    expect(document.title).toBe(SHELL_TITLE);
    expect(readMeta('name', 'description')).toBe('셸 description');
    expect(readMeta('property', 'og:title')).toBe('셸 og:title');
  });

  it('선언된 콘텐츠 라우트 메타 제목이 서로 겹치지 않는다', () => {
    const titles = [
      SHELL_TITLE,
      SIMULATOR_COPY.meta.title,
      PORTFOLIO_COPY.meta.title,
      DIVIDEND_CALENDAR_COPY.meta.title
    ];

    expect(new Set(titles).size).toBe(titles.length);
  });
});
