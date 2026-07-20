import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostRow } from '@/components/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

const item = (overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: 's1',
  user_id: 'u1',
  kind: 'portfolio',
  category: 'free',
  title: '월 500 배당 포트폴리오 만들기',
  description: 'SCHD 60% + JEPI 40%로 15년 굴리면 어디까지 가는지',
  is_public: true,
  has_payload: false,
  sim_summary: null,
  like_count: 12,
  view_count: 41,
  comment_count: 2,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: { id: 'u1', display_name: '스노우볼러', avatar_url: null },
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

const renderRow = (data: PostListItem, summary?: ScenarioSimSummary | null) =>
  render(
    <MemoryRouter>
      <PostRow item={data} simSummary={summary} />
    </MemoryRouter>
  );

describe('PostRow — velog 피드식 세로 스택 (§I)', () => {
  it('제목(heading)·요약·상세 링크를 만든다', () => {
    renderRow(item());

    expect(screen.getByRole('heading', { name: '월 500 배당 포트폴리오 만들기' })).toBeInTheDocument();
    expect(screen.getByText('SCHD 60% + JEPI 40%로 15년 굴리면 어디까지 가는지')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/community/portfolio/s1');
  });

  it('요약이 없으면 요약 줄을 렌더하지 않는다', () => {
    renderRow(item({ description: null }));

    expect(screen.queryByText(/SCHD 60%/)).not.toBeInTheDocument();
    expect(screen.getByText('월 500 배당 포트폴리오 만들기')).toBeInTheDocument();
  });

  it('서브 정보 한 줄에 작성자(닉네임만, "by" 없이)·댓글·조회·좋아요를 보여준다 (모바일 숨김 없음)', () => {
    renderRow(item());

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('스노우볼러');
    expect(link).not.toHaveTextContent('by 스노우볼러');
    expect(link).toHaveTextContent('댓글 2');
    expect(link).toHaveTextContent('조회수 41');
    // ♥ 아이콘은 장식(aria-hidden) — 숨김 라벨 "좋아요"가 숫자와 함께 읽힌다.
    expect(link).toHaveTextContent(/좋아요\s?12/);
  });

  it('작성자가 없으면 "익명"으로 폴백한다', () => {
    renderRow(item({ author: null }));

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('익명');
    expect(link).not.toHaveTextContent('by 익명');
  });
});

describe('PostRow — 시뮬 숫자 클러스터 (§B안, §I I4)', () => {
  it('simSummary가 있으면 hero(월 배당 세후)·보조(최종 자산·투입 대비)·목표 배지를 보여준다', () => {
    renderRow(item({ has_payload: true }), simSummary());

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('9.2억')).toBeInTheDocument();
    expect(screen.getByText('투입 대비')).toBeInTheDocument();
    expect(screen.getByText('×3.7')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
  });

  it('simSummary가 없으면 has_payload=true여도 숫자 줄 없이 텍스트 행으로 폴백한다', () => {
    renderRow(item({ has_payload: true }));

    expect(screen.queryByText('월 배당(세후)')).not.toBeInTheDocument();
    expect(screen.queryByText('187만원')).not.toBeInTheDocument();
  });
});

describe('PostRow — 하이브리드 모델 배지', () => {
  it('요약이 없는 시나리오 첨부 글(has_payload=true)은 "시뮬 결과" 배지를 단다', () => {
    renderRow(item({ has_payload: true }));

    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('숫자 칩이 있으면(simSummary 존재) "시뮬 결과" 배지는 중복이라 달지 않는다', () => {
    renderRow(item({ has_payload: true }), simSummary());

    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });

  it('자유 글(has_payload=false)은 배지를 달지 않는다', () => {
    renderRow(item());

    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });
});
