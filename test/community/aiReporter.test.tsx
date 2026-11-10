import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * AI 리포터(자동 작성 계정, 2026-11-10) — 기반 장치.
 *
 * 잠그는 것: ① 계정 id 가 비어 있으면 **어떤 글도 봇 글이 아니다**(계정 생성 전 배포 안전) ② 봇 글엔 작성자
 * 옆 배지 ③ 색인 허용 전 봇 글은 사이트맵에서 빠지고 크롤러 HTML 에 noindex ④ 사람 글은 영향 없음.
 * ⑤ 화면 코드는 profiles.is_bot 을 **읽지 않는다**(마이그레이션 적용 전 배포에도 조회가 깨지지 않게).
 */
const BOT_ID = '0000000b-1111-2222-3333-444444444444';
const HUMAN_ID = '0000000a-1111-2222-3333-444444444444';

describe('판별 함수 — 기본 설정(계정 생성 전)', () => {
  it('🔴 userIds 가 비어 있으면 누구도 봇이 아니고, 모든 글이 색인 대상이다', async () => {
    const { AI_REPORTER, isAiReporterUserId, isPostIndexable } = await import('@/shared/constants/community');
    expect(AI_REPORTER.indexable).toBe(false);
    expect(isAiReporterUserId(BOT_ID)).toBe(AI_REPORTER.userIds.includes(BOT_ID));
    expect(isPostIndexable(HUMAN_ID)).toBe(true);
    expect(isPostIndexable(null)).toBe(true);
  });

  it('주입한 설정으로: 봇 글은 색인 허용 전 false, 허용 뒤 true, 사람 글은 언제나 true', async () => {
    const { isAiReporterUserId, isPostIndexable } = await import('@/shared/constants/community');
    const before = { userIds: [BOT_ID], indexable: false };
    const after = { userIds: [BOT_ID], indexable: true };
    expect(isAiReporterUserId(BOT_ID, before)).toBe(true);
    expect(isPostIndexable(BOT_ID, before)).toBe(false);
    expect(isPostIndexable(BOT_ID, after)).toBe(true);
    expect(isPostIndexable(HUMAN_ID, before)).toBe(true);
  });
});

describe('배지 · 사이트맵 · noindex — 봇 계정이 등록된 상태', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/shared/constants/community', async (importOriginal) => {
      const original = await importOriginal<typeof import('@/shared/constants/community')>();
      const config = { userIds: [BOT_ID], indexable: false };
      return {
        ...original,
        AI_REPORTER: { ...original.AI_REPORTER, ...config },
        isAiReporterUserId: (id: string | null | undefined) => original.isAiReporterUserId(id, config),
        isPostIndexable: (id: string | null | undefined) => original.isPostIndexable(id, config)
      };
    });
    vi.stubEnv('SUPABASE_URL', 'https://project.supabase.test');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SITE_URL', 'https://snowball.test');
  });

  afterEach(() => {
    vi.doUnmock('@/shared/constants/community');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('🔴 봇 작성자 옆에만 "AI 리포터" 배지가 붙는다', async () => {
    const { AiReporterBadge } = await import('@/components/community/AiReporterBadge');
    const { rerender } = render(<AiReporterBadge authorId={BOT_ID} />);
    expect(screen.getByText('AI 리포터')).toBeInTheDocument();

    rerender(<AiReporterBadge authorId={HUMAN_ID} />);
    expect(screen.queryByText('AI 리포터')).toBeNull();
  });

  it('🔴 사이트맵에서 봇 글을 빼고 사람 글은 남긴다 (user_id 를 함께 읽는다)', async () => {
    const stub = vi.fn(async (_input: unknown) =>
      new Response(
        JSON.stringify([
          { id: `00000001-1111-2222-3333-444444444444`, kind: 'board', updated_at: '2026-11-10T00:00:00Z', user_id: BOT_ID },
          { id: `00000002-1111-2222-3333-444444444444`, kind: 'board', updated_at: '2026-11-10T00:00:00Z', user_id: HUMAN_ID }
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', stub);
    const { handler } = await import('@/server/handlers/Sitemap');

    const xml = await (await handler(new Request('https://x.test/api/sitemap'))).text();

    expect(String(stub.mock.calls[0]?.[0])).toContain('user_id');
    expect(xml).not.toContain('00000001-1111');
    expect(xml).toContain('00000002-1111');
  });

  it('🔴 봇 글의 크롤러 HTML 은 robots 가 noindex, 사람 글은 그대로', async () => {
    const shell =
      '<!doctype html><html><head><title>t</title><meta name="description" content="d" />' +
      '<meta name="robots" content="index, follow" /><link id="canonical-link" rel="canonical" href="https://snowball.test/" />' +
      '</head><body><div id="root"></div></body></html>';
    const postId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const stubWith = (userId: string) =>
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: unknown) =>
          String(input).endsWith('/index.html')
            ? new Response(shell, { status: 200 })
            : new Response(
                JSON.stringify([
                  { id: postId, kind: 'board', title: '제목', description: '설명', body: '<p>본문</p>', updated_at: '2026-11-10T00:00:00Z', user_id: userId }
                ]),
                { status: 200, headers: { 'content-type': 'application/json' } }
              )
        )
      );
    const { handler } = await import('@/server/handlers/PostHtml');
    const call = () => handler(new Request(`https://snowball.test/api/post-html?kind=board&id=${postId}`));

    stubWith(BOT_ID);
    expect(await (await call()).text()).toContain('<meta name="robots" content="noindex, follow"');

    stubWith(HUMAN_ID);
    expect(await (await call()).text()).toContain('<meta name="robots" content="index, follow"');
  });

  it('🔴 화면 조회 쿼리는 profiles.is_bot 을 읽지 않는다', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const queries = readFileSync(resolve(__dirname, '../../shared/lib/supabase/queries.ts'), 'utf8');
    expect(queries).not.toContain('is_bot');
  });
});
