// @vitest-environment node — 파일만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { FAQ_STRUCTURED_DATA_ID } from '@/shared/lib/seo/faqStructuredData';
import {
  LANDING_FAQ_SCRIPT_ID,
  removeDivByClassName,
  SHELL_FALLBACK_CLASS_NAME,
  stripLandingShellBody
} from '@/shared/lib/og';

/**
 * **크롤러용 HTML 에 랜딩 셸 본문이 섞여 나가지 않는다**는 계약.
 *
 * `index.html` 은 SPA 전 라우트가 쓰는 셸이고 `#root` 안에 랜딩 본문이 들어 있다. 서버 렌더 핸들러는
 * 고유 콘텐츠를 `<div id="root">` 여는 태그 **직후**에 넣으므로, 걷어내지 않으면 랜딩 본문이 뒤에
 * 그대로 남아 ①h1 이 둘 ②전 페이지가 같은 텍스트를 공유 ③랜딩 FAQPage JSON-LD 가 페이지 자신의
 * FAQPage 와 충돌 — 셋이 한꺼번에 생긴다.
 *
 * 🔴 이 결함은 **브라우저에서 보이지 않는다.** 하이드레이션이 `#root` 를 갈아치우기 때문에 화면과
 *    JS 실행 크롤러는 멀쩡하고, 초기 HTML 과 JS 미실행 크롤러(네이버 Yeti·다음)에만 나간다.
 *    그래서 사람이 눈으로 잡을 수 없고 테스트로만 잡힌다.
 */

const readRepoFile = (relativePath: string): string =>
  // ⚠ 줄바꿈 정규화 — 이 레포는 Windows 에서 개발하고 git 이 CRLF 로 체크아웃한다. JS 정규식의 `.` 은
  //   `\r` 을 매치하지 않아, 정규화하지 않으면 새로 clone 한 환경에서만 검사가 통째로 실패한다.
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

/** 본문을 **직접 주입하는** 핸들러 전부. 새 핸들러가 생기면 여기 추가 → 안 부르면 아래 테스트가 빨개진다. */
const BODY_INJECTING_HANDLERS = [
  'TickerHtml/TickerHtml.ts',
  'GuideHtml/GuideHtml.ts',
  'DividendListHtml/DividendListHtml.ts',
  'PostHtml/PostHtml.ts',
  'PostList/PostList.ts'
] as const;

const indexHtml = readRepoFile('../../index.html');

describe('index.html 과의 상수 계약', () => {
  it('랜딩 본문 래퍼 class 가 셸에 실제로 있다', () => {
    expect(indexHtml).toContain(`class="${SHELL_FALLBACK_CLASS_NAME}"`);
  });

  it('랜딩 FAQ script id 가 셸에 실제로 있다', () => {
    expect(indexHtml).toContain(`id="${LANDING_FAQ_SCRIPT_ID}"`);
  });

  it('FAQ script id 가 런타임 제거 로직(faqStructuredData)과 같은 값이다', () => {
    // 두 곳이 갈라지면 한쪽은 조용히 아무것도 하지 않는다 — 그게 이 결함의 원래 발생 경로다.
    expect(LANDING_FAQ_SCRIPT_ID).toBe(FAQ_STRUCTURED_DATA_ID);
  });
});

describe('stripLandingShellBody — 실제 셸', () => {
  const stripped = stripLandingShellBody(indexHtml);

  it('랜딩 본문을 걷어낸다', () => {
    expect(stripped).not.toContain(`class="${SHELL_FALLBACK_CLASS_NAME}"`);
  });

  it('랜딩 h1 이 남지 않는다', () => {
    expect(stripped).not.toMatch(/<h1[\s>]/i);
  });

  it('랜딩 FAQPage JSON-LD 를 함께 걷어낸다', () => {
    // 🔴 본문만 지우고 JSON-LD 를 남기면 "화면에 없는 콘텐츠의 마크업"이 되어 오히려 더 나쁘다
    //    (faqStructuredData.ts 가 정적 HTML 에 FAQ 를 남겨 두는 근거가 바로 본문의 존재였다).
    expect(stripped).not.toContain(`id="${LANDING_FAQ_SCRIPT_ID}"`);
    expect(stripped).not.toContain('"@type": "FAQPage"');
  });

  it('주입 지점(`#root` 여는 태그)과 앱 부팅 태그는 그대로 둔다', () => {
    expect(stripped).toMatch(/<div\s+id="root"[^>]*>/i);
    expect(stripped).toContain('<script type="module" src="/main.tsx"></script>');
  });

  it('head 의 메타·canonical·사이트 수준 JSON-LD 는 건드리지 않는다', () => {
    expect(stripped).toContain('<link id="canonical-link" rel="canonical"');
    expect(stripped).toContain('id="structured-data"');
  });

  it('멱등이다 — 두 번 돌려도 같은 결과', () => {
    expect(stripLandingShellBody(stripped)).toBe(stripped);
  });
});

describe('stripLandingShellBody — 경계', () => {
  it('빈 `#root` 픽스처는 그대로 둔다(기존 api 테스트 셸)', () => {
    const fixture = '<html><body><div id="root"></div></body></html>';
    expect(stripLandingShellBody(fixture)).toBe(fixture);
  });

  it('중첩 div 를 깊이로 세어 짝이 맞는 닫는 태그까지 지운다', () => {
    const html = '<div id="root"><div class="app-shell-fallback"><div><p>안</p></div></div><p>뒤</p></div>';

    // 첫 `</div>` 를 집었다면 `</div><p>뒤</p></div>` 가 깨진 채 남는다.
    expect(removeDivByClassName(html, SHELL_FALLBACK_CLASS_NAME)).toBe('<div id="root"><p>뒤</p></div>');
  });

  it('class 부분일치로 엉뚱한 블록을 지우지 않는다', () => {
    const html = '<div class="app-shell-fallback-x"><p>남아야</p></div>';
    expect(removeDivByClassName(html, SHELL_FALLBACK_CLASS_NAME)).toBe(html);
  });

  it('닫는 태그를 못 찾으면 원문을 보존한다(반쯤 잘린 HTML 금지)', () => {
    const broken = '<div id="root"><div class="app-shell-fallback"><p>안 닫힘</p>';
    expect(removeDivByClassName(broken, SHELL_FALLBACK_CLASS_NAME)).toBe(broken);
  });
});

describe('본문을 주입하는 핸들러는 전부 걷어낸다', () => {
  /**
   * 공용 진입점 둘 중 하나를 반드시 지난다. `injectIntoRoot` 는 내부에서 `stripLandingShellBody` 를
   * 부르므로(shellBody.ts) 어느 쪽이든 계약은 같다 — 핸들러가 셸에 직접 문자열을 이어 붙이면 실패한다.
   */
  it.each(BODY_INJECTING_HANDLERS)('%s 가 공용 주입 경로를 지난다', (handler) => {
    const source = readRepoFile(`../../server/handlers/${handler}`);
    expect(/injectIntoRoot\(|stripLandingShellBody\(/.test(source), handler).toBe(true);
  });

  it('🔴 지역 사본을 다시 만들지 않는다 — 복사본이 갈리면서 이 결함이 생겼다', () => {
    for (const handler of BODY_INJECTING_HANDLERS) {
      const source = readRepoFile(`../../server/handlers/${handler}`);
      expect(source, handler).not.toContain('const injectAtRoot');
      expect(source, handler).not.toContain('const applyMeta');
    }
  });

  it('ShareHtml 은 부르지 않는다 — 본문 없는 실제 시뮬레이터 셸이라 지우면 빈 화면이 된다', () => {
    const source = readRepoFile('../../server/handlers/ShareHtml/ShareHtml.ts');
    expect(source).not.toContain('stripLandingShellBody');
    expect(source).not.toContain('injectIntoRoot');
  });
});
