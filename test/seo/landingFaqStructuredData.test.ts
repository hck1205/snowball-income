// @vitest-environment node — index.html 원문을 문자열로 읽어 본다 (DOM 불필요)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANDING_COPY } from '@/pages/Landing/copy';

/**
 * **랜딩 FAQ 의 이중 정본 드리프트 방지.**
 *
 * FAQ 문장이 사는 곳은 원래 하나(`pages/Landing/copy/landingCopy.ts`)여야 하지만, `FAQPage`
 * 구조화 데이터는 **정적 `index.html` 에 있어야만** 한다 — 런타임에 JS 로 주입하면 JS 를 실행하지
 * 않는 크롤러가 못 읽는다. 그래서 같은 문장이 두 곳에 산다. 없앨 수 없으니 **어긋나면 빨개지게** 한다.
 *
 * 잠그는 것 셋:
 *  ① 🔴 **승인 경계** — `needsApproval: true` 인 문항은 JSON-LD 에 **없어야** 한다. JSON-LD 는 검색
 *     결과에 그대로 인용되는 공개 약속이라, 사용자 승인 전 문항은 화면에만 두고 색인시키지 않는다.
 *  ② 🔴 **문자 단위 일치** — 승인된 문항은 질문·답변이 카피와 완전히 같고 순서도 같다.
 *     승인이 떨어져 나머지를 넣을 때, 이 단정이 짝을 맞춰 준다.
 *  ③ **가시성** — 마크업한 문항이 정적 셸(`.app-shell-fallback`) 본문에도 보인다. 보이지 않는
 *     콘텐츠를 마크업하는 것은 구글 구조화 데이터 정책 위반이다.
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const INDEX_HTML = readRepoFile('index.html');

type FaqNode = {
  '@type': string;
  mainEntity?: ReadonlyArray<{
    '@type': string;
    name: string;
    acceptedAnswer: { '@type': string; text: string };
  }>;
};

/**
 * FAQ 는 사이트 수준 `@graph`(`#structured-data`)가 아니라 **단독 script** 로 산다 — 페이지 수준
 * 타입이라 라우트가 바뀌면 통째로 떼어 내야 하기 때문이다(`shared/lib/seo/faqStructuredData.ts`).
 * 범위 계약은 `test/seo/faqStructuredDataScope.test.tsx` 가 따로 잠근다.
 */
const readFaqNode = (): FaqNode | undefined => {
  const match = INDEX_HTML.match(
    /<script id="faq-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error('index.html 에서 faq-structured-data 스크립트를 찾지 못했다.');
  // `%VITE_SITE_URL%` 은 JSON 문자열 **안**에 있어 파싱을 막지 않는다(빌드 때 치환된다).
  const node = JSON.parse(match[1]) as FaqNode;
  return node['@type'] === 'FAQPage' ? node : undefined;
};

/** 사이트 수준 그래프에 FAQ 가 되돌아오면(=범위 처방 무력화) 여기서 잡는다. */
const readSiteGraph = (): readonly FaqNode[] => {
  const match = INDEX_HTML.match(/<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('index.html 에서 structured-data 스크립트를 찾지 못했다.');
  return (JSON.parse(match[1]) as { '@graph': FaqNode[] })['@graph'];
};

/** 사람이 실제로 읽는 본문만 남긴다 — 주석·태그를 걷고 줄바꿈 들여쓰기를 한 칸으로 접는다. */
const shellText = () => {
  const shell = INDEX_HTML.slice(INDEX_HTML.indexOf('class="app-shell-fallback"'));
  return shell
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const FAQ_PAGE = readFaqNode();
const MARKED_UP = FAQ_PAGE?.mainEntity ?? [];

const APPROVED = LANDING_COPY.faq.items.filter((item) => !item.needsApproval);
const PENDING = LANDING_COPY.faq.items.filter((item) => item.needsApproval);

describe('랜딩 FAQ 구조화 데이터', () => {
  it('index.html 의 단독 script 에 FAQPage 노드가 있다', () => {
    expect(FAQ_PAGE).toBeDefined();
  });

  it('🔴 사이트 수준 @graph 에는 FAQPage 가 없다 (라우트 범위 처방이 무력해진다)', () => {
    expect(readSiteGraph().map((node) => node['@type'])).not.toContain('FAQPage');
  });

  it('🔴 승인된 문항만 실려 있다 (개수)', () => {
    // 승인 대기 문항이 하나라도 섞이면 여기서 먼저 걸린다.
    expect(MARKED_UP).toHaveLength(APPROVED.length);
    expect(APPROVED.length).toBeGreaterThan(0);
  });

  it.each(APPROVED.map((item, index) => [item.id, index] as const))(
    '🔴 "%s" 문항이 landingCopy 와 문자 단위로 같다',
    (id, index) => {
      const source = APPROVED[index];
      const markedUp = MARKED_UP[index];

      expect(markedUp, `${id} 문항이 JSON-LD 에 없다`).toBeDefined();
      expect(markedUp['@type']).toBe('Question');
      expect(markedUp.name).toBe(source.question);
      expect(markedUp.acceptedAnswer['@type']).toBe('Answer');
      expect(markedUp.acceptedAnswer.text).toBe(source.answer);
    }
  );

  it.each(PENDING.map((item) => [item.id, item.question, item.answer] as const))(
    '🔴 승인 대기 문항 "%s" 은 index.html 어디에도 없다',
    (_id, question, answer) => {
      // 화면에는 이미 떠 있지만 색인시키지 않는다 — JSON-LD 는 공개 약속이 된다.
      expect(INDEX_HTML).not.toContain(question);
      expect(INDEX_HTML.replace(/\s+/g, ' ')).not.toContain(answer);
    }
  );

  it.each(APPROVED.map((item) => [item.id, item.question, item.answer] as const))(
    '마크업한 문항 "%s" 이 정적 셸 본문에도 보인다',
    (_id, question, answer) => {
      const text = shellText();

      expect(text).toContain(question);
      expect(text).toContain(answer);
    }
  );
});
