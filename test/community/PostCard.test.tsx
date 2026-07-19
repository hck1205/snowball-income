import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostCard } from '@/components/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

const item = (overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: 's1',
  user_id: 'u1',
  kind: 'portfolio',
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
  author: { id: 'u1', display_name: '눈덩이', avatar_url: null },
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

const renderCard = (data: PostListItem, summary?: ScenarioSimSummary | null) =>
  render(
    <MemoryRouter>
      <PostCard item={data} simSummary={summary} />
    </MemoryRouter>
  );

describe('PostCard — 하이브리드 모델 배지', () => {
  it('시나리오 첨부 글(has_payload=true)은 "시뮬 결과" 배지를 단다', () => {
    renderCard(item({ has_payload: true }));
    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('자유 글(has_payload=false)은 배지를 달지 않는다', () => {
    renderCard(item({ has_payload: false }));
    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });
});

describe('PostCard — 표시', () => {
  it('제목/요약/작성자를 보여주고 상세로 가는 링크를 만든다', () => {
    renderCard(item());

    expect(screen.getByText('월배당 포트폴리오')).toBeInTheDocument();
    expect(screen.getByText('매달 현금흐름을 노린 구성')).toBeInTheDocument();
    expect(screen.getByText('눈덩이')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/community/portfolio/s1');
  });

  it('작성자가 없으면 "익명"으로 폴백한다', () => {
    renderCard(item({ author: null }));
    expect(screen.getByText('익명')).toBeInTheDocument();
  });

  it('요약이 없으면 요약을 렌더하지 않는다', () => {
    renderCard(item({ description: null }));
    expect(screen.queryByText('매달 현금흐름을 노린 구성')).not.toBeInTheDocument();
    expect(screen.getByText('월배당 포트폴리오')).toBeInTheDocument();
  });
});

describe('PostCard — 시뮬 프리뷰 (§E)', () => {
  it('simSummary가 주입되면 프리뷰 블록(hero 월 배당·보조·달성 배지)을 보여준다', () => {
    renderCard(item({ has_payload: true }), simSummary());

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('9.2억')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
    // 제목 이하 기존 구조는 그대로다
    expect(screen.getByText('월배당 포트폴리오')).toBeInTheDocument();
  });

  it('simSummary가 없으면 has_payload=true여도 프리뷰를 그리지 않는다 (구버전 글 폴백 §J)', () => {
    renderCard(item({ has_payload: true }));

    expect(screen.queryByText('월 배당(세후)')).not.toBeInTheDocument();
    // 첨부 배지는 프리뷰와 무관하게 유지된다
    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('목표 미달성 요약은 배지 없이 숫자만 보여준다', () => {
    renderCard(item(), simSummary({ targetReachedInYears: null }));

    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.queryByText(/목표 달성/)).not.toBeInTheDocument();
  });
});

describe('PostCard — velog 카드 정보', () => {
  it('서브 정보 줄에 댓글·조회 수를 보여준다', () => {
    renderCard(item());

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('댓글 3');
    expect(link).toHaveTextContent('조회수 340');
  });

  it('푸터에 작성자를 닉네임만(아바타·"by" 없이) 보여주고 좋아요 수를 라벨과 함께 보여준다', () => {
    renderCard(item());

    const link = screen.getByRole('link');
    // 아바타 썸네일·"by" 접두어 제거 → 닉네임 텍스트만 남는다(사용자 지시).
    expect(screen.getByText('눈덩이')).toBeInTheDocument();
    expect(link).not.toHaveTextContent('by 눈덩이');
    // ♥ 아이콘은 장식(aria-hidden) — 숨김 라벨 "좋아요"가 숫자와 함께 읽힌다.
    expect(link).toHaveTextContent(/좋아요\s?12/);
  });
});
