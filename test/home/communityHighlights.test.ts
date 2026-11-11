import { describe, expect, it } from 'vitest';
import { fetchHighlightRows, pickHighlights, type HighlightRow } from '@/pages/Home/components';

/**
 * 첫 화면 커뮤니티 칸(2026-11-11). 잠그는 것:
 * ① 네 칸(포트폴리오·인사이트·질문·영상)에 각자 맞는 글이 들어간다 ② 칸마다 최근 글 중 반응 1위, 같으면 최신
 * ③ 글이 없는 칸은 빠진다 ④ 커뮤니티 비활성·실패면 빈 배열(첫 화면이 깨지지 않는다)
 */
const row = (overrides: Partial<HighlightRow>): HighlightRow => ({
  id: 'x',
  kind: 'board',
  category: 'free',
  title: '제목',
  description: null,
  like_count: 0,
  comment_count: 0,
  created_at: '2026-11-01T00:00:00Z',
  payload: null,
  sim_summary: null,
  user_id: null,
  author: { display_name: '작성자' },
  ...overrides
});

describe('pickHighlights', () => {
  it('🔴 칸마다 맞는 글, 반응 1위(같으면 최신)를 고르고 글이 없는 칸은 안내 카드가 선다', () => {
    const cards = pickHighlights([
      row({ id: 'p1', kind: 'portfolio', like_count: 1 }),
      row({ id: 'p2', kind: 'portfolio', like_count: 5 }),
      row({ id: 'i1', category: 'insight', created_at: '2026-11-01T00:00:00Z' }),
      row({ id: 'i2', category: 'insight', created_at: '2026-11-05T00:00:00Z' }),
      row({ id: 'f1', kind: 'fire', payload: { url: 'https://youtu.be/x', image: 'https://i.ytimg.com/vi/x/hqdefault.jpg' } }),
      row({ id: 'free', category: 'free', like_count: 99 })
    ]);
    expect(cards.map((card) => [card.slot, card.id])).toEqual([
      ['portfolio', 'p2'],
      ['insight', 'i2'],
      ['question', 'empty-question'],
      ['video', 'f1']
    ]);
    expect(cards[0]!.href).toBe('/community/portfolio/p2');
    expect(cards[2]).toMatchObject({ empty: true, href: '/community/board/write' });
    expect(cards[3]).toMatchObject({ href: '/community/firenow/f1', image: 'https://i.ytimg.com/vi/x/hqdefault.jpg' });
  });

  it('받아 온 글이 하나도 없으면(실패·비활성) 안내 카드만 세우지 않고 칸 전체를 숨긴다', () => {
    expect(pickHighlights([])).toEqual([]);
  });

  it('포트폴리오 카드는 결과 요약 한 줄을 붙인다', () => {
    const [card] = pickHighlights([
      row({
        kind: 'portfolio',
        sim_summary: {
          version: 1,
          durationYears: 20,
          tickerCount: 3,
          initialInvestment: 20_000_000,
          monthlyContribution: 1_000_000,
          totalContribution: 260_000_000,
          finalAssetValue: 700_000_000,
          finalMonthlyDividend: 1_520_000,
          targetMonthlyDividend: 1_500_000,
          targetReachedInYears: 19
        }
      })
    ]);
    expect(card!.stat).toMatch(/^20년 뒤 월 배당 /);
  });
});

describe('fetchHighlightRows', () => {
  it('🔴 커뮤니티 비활성·응답 실패면 빈 배열 — 첫 화면은 이 칸 없이 온전하다', async () => {
    expect(await fetchHighlightRows({})).toEqual([]);
    const env = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' };
    expect(await fetchHighlightRows(env, (async () => new Response('', { status: 500 })) as typeof fetch)).toEqual([]);
    expect(await fetchHighlightRows(env, (async () => { throw new Error('offline'); }) as typeof fetch)).toEqual([]);
  });

  it('공개 글만, 세 종류만, 최신순으로 한 번 요청한다', async () => {
    let requested = '';
    const env = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' };
    await fetchHighlightRows(env, (async (url: string) => {
      requested = decodeURIComponent(url);
      return new Response('[]', { status: 200 });
    }) as typeof fetch);
    expect(requested).toContain('is_public=eq.true');
    expect(requested).toContain('kind=in.(portfolio,board,fire)');
    expect(requested).toContain('order=created_at.desc');
  });
});
