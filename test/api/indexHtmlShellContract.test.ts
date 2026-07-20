import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { replaceLinkHref, replaceMetaContent, replaceTitleTag } from '@/shared/lib/og';

/**
 * **하네스 픽스처 ↔ 실제 `index.html` 드리프트 방지.**
 *
 * `test/api/apiHarness.ts`의 셸은 `index.html`의 *형태를 모사한* 픽스처다. 서버 핸들러
 * (`api/share-html.ts`·`api/post-html.ts`)는 런타임에 **진짜 index.html**을 fetch해 치환하므로,
 * 실제 파일의 태그 포맷이 바뀌면(따옴표 종류·속성 순서·태그 분해) **픽스처 기반 테스트는 전부 통과하는데
 * 실배포만 조용히 무치환**이 된다 — 크롤러에게는 모든 글이 같은 제목으로 보이고, 아무도 실패를 눈치채지 못한다.
 *
 * 그래서 여기서는 픽스처가 아니라 **소스 `index.html` 원문**에 치환 함수를 직접 걸어 본다.
 * dist가 아니라 소스를 읽는 이유: 빌드 산출물에 의존하면 `npm run build` 없이는 테스트가 못 돈다.
 * (`%VITE_SITE_URL%` 같은 빌드 치환 토큰은 이 테스트의 관심사가 아니다 — 우리는 *태그를 찾아내는지*만 본다.)
 */

const INDEX_HTML = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8');

/** 서버 핸들러가 실제로 갈아끼우는 메타. 하나라도 못 찾으면 그 항목은 실배포에서 조용히 무치환된다. */
const REPLACED_META = [
  ['property', 'og:title'],
  ['property', 'og:description'],
  ['property', 'og:url'],
  ['property', 'og:image'],
  ['property', 'og:image:alt'],
  ['name', 'twitter:title'],
  ['name', 'twitter:description'],
  ['name', 'twitter:image'],
  ['name', 'twitter:image:alt']
] as const;

describe('index.html 셸 계약', () => {
  it.each(REPLACED_META)('%s="%s" 메타를 실제로 치환할 수 있다', (attribute, key) => {
    const sentinel = `SENTINEL_${key}`;
    const replaced = replaceMetaContent(INDEX_HTML, attribute, key, sentinel);

    // 치환이 일어났다 = 원문과 달라졌고, 센티넬이 정확히 1번 등장한다.
    expect(replaced).not.toBe(INDEX_HTML);
    expect(replaced.split(sentinel)).toHaveLength(2);
  });

  it('<title>을 치환할 수 있다', () => {
    const replaced = replaceTitleTag(INDEX_HTML, '게시글 제목');

    expect(replaced).not.toBe(INDEX_HTML);
    expect(replaced).toContain('<title>게시글 제목</title>');
  });

  it('canonical link의 href를 치환할 수 있다', () => {
    const replaced = replaceLinkHref(INDEX_HTML, 'canonical', 'https://example.test/community/board/1');

    expect(replaced).not.toBe(INDEX_HTML);
    expect(replaced).toContain('https://example.test/community/board/1');
  });

  it('앱 부팅 지점(#root)이 존재한다', () => {
    // 본문 주입(PR-B)이 붙을 자리이자, 셸이 통째로 갈아엎어졌는지 감지하는 최소 신호.
    expect(INDEX_HTML).toContain('id="root"');
  });
});
