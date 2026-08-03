import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostGalleryCard } from '@/pages/Community/components';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

/**
 * 갤러리 격자가 **실제로 그리는 카드**의 계약.
 *
 * 2026-08-03 목록 리워크로 갤러리는 `components/community/PostCard` 에서 공용 `PickCard` 위에
 * 다시 세운 `PostGalleryCard` 로 갈아탔다. 순서(숫자판 → 제목 ⟶ 제목 → … → 숫자판)는 뒤집혔지만
 * **카드가 말해야 하는 것**은 그대로다. 여기서 지키는 것은 조판이 아니라 그 내용이다.
 */

const item = (overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: 's1',
  user_id: 'u1',
  kind: 'portfolio',
  category: 'free',
  title: '월배당 포트폴리오',
  description: '매달 현금흐름을 노린 구성',
  is_public: true,
  has_payload: false,
  sim_summary: null,
  like_count: 12,
  view_count: 340,
  comment_count: 3,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: { id: 'u1', display_name: '윤석', avatar_url: null },
  ...overrides
});

const simSummary = (overrides: Partial<ScenarioSimSummary> = {}): ScenarioSimSummary => ({
  version: 1,
  durationYears: 20,
  tickerCount: 4,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  totalContribution: 250_000_000,
  finalAssetValue: 920_000_000,
  finalMonthlyDividend: 1_870_000,
  targetMonthlyDividend: 3_000_000,
  targetReachedInYears: 8,
  ...overrides
});

/** 카드는 격자의 항목(li)이라 목록 안에서 렌더한다 — 화면에서의 부모와 같게 둔다. */
const renderCard = (data: PostListItem, summary?: ScenarioSimSummary | null) =>
  render(
    <MemoryRouter>
      <ul>
        <PostGalleryCard item={data} simSummary={summary} />
      </ul>
    </MemoryRouter>
  );

describe('PostGalleryCard — 제목이 첫 앵커', () => {
  it('제목을 heading 으로 세우고 상세로 가는 링크를 만든다', () => {
    renderCard(item());

    const heading = screen.getByRole('heading', { name: '월배당 포트폴리오' });
    expect(heading).toBeInTheDocument();
    expect(within(heading).getByRole('link')).toHaveAttribute('href', '/community/portfolio/s1');
  });

  it('작성자와 요약을 보여준다', () => {
    renderCard(item());

    expect(screen.getByText('윤석')).toBeInTheDocument();
    expect(screen.getByText('매달 현금흐름을 노린 구성')).toBeInTheDocument();
  });

  it('작성자가 없으면 "익명"으로 폴백한다', () => {
    renderCard(item({ author: null }));

    expect(screen.getByText('익명')).toBeInTheDocument();
  });

  it('요약이 없으면 요약을 렌더하지 않는다', () => {
    renderCard(item({ description: null }));

    expect(screen.queryByText('매달 현금흐름을 노린 구성')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '월배당 포트폴리오' })).toBeInTheDocument();
  });
});

describe('PostGalleryCard — 계수 줄과 공유', () => {
  it('조회·댓글·좋아요를 숨김 라벨과 함께 읽히게 한다', () => {
    renderCard(item());

    const card = screen.getByRole('listitem');
    expect(card).toHaveTextContent(/조회수\s?340/);
    expect(card).toHaveTextContent(/댓글\s?3/);
    expect(card).toHaveTextContent(/좋아요\s?12/);
  });

  it('공유 버튼을 카드 안에 둔다 — 격자에서 바로 공유할 수 있는 진입점이다', () => {
    renderCard(item());

    expect(screen.getByRole('button', { name: /공유/ })).toBeInTheDocument();
  });
});

describe('PostGalleryCard — 숫자판과 배지 폴백', () => {
  it('simSummary 가 주입되면 숫자판(월 배당·최종 자산·달성 배지)을 보여준다', () => {
    renderCard(item({ has_payload: true }), simSummary());

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
  });

  it('simSummary 가 없으면 has_payload=true 여도 숫자판을 그리지 않고 배지로 대신 말한다', () => {
    renderCard(item({ has_payload: true }));

    expect(screen.queryByText('월 배당(세후)')).not.toBeInTheDocument();
    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('숫자판이 있으면 배지는 중복이라 달지 않는다', () => {
    renderCard(item({ has_payload: true }), simSummary());

    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });

  it('목표 미달성 요약은 배지 없이 숫자만 보여준다', () => {
    renderCard(item(), simSummary({ targetReachedInYears: null }));

    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.queryByText(/목표 달성/)).not.toBeInTheDocument();
  });
});
