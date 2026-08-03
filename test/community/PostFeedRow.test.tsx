import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostFeedRow } from '@/pages/Community/components';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

/**
 * 게시판 본문과 갤러리 "목록 보기"가 **실제로 그리는 행**의 계약.
 *
 * 이 파일이 있는 이유: 2026-08-03 목록 리워크로 두 화면이 `components/community/PostRow` 에서
 * `pages/Community/components/PostFeedRow` 로 갈아탔다. 행의 조판은 통째로 다시 짰지만
 * **행이 말해야 하는 것**(제목·요약·작성자 폴백·숨김 라벨·시뮬 배지 폴백·분류 배지 규칙)은
 * 그대로다. 그 계약이 새 부품에도 살아 있는지 여기서 지킨다 — 옛 `PostRow.test` 가 계속
 * 초록불이어도 그건 이제 화면에 없는 부품을 보고 있다.
 */

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

const renderRow = (data: PostListItem, summary?: ScenarioSimSummary | null) =>
  render(
    <MemoryRouter>
      <PostFeedRow item={data} simSummary={summary} />
    </MemoryRouter>
  );

describe('PostFeedRow — 표제·리드·상세 링크', () => {
  it('제목을 heading 으로 세우고 상세로 가는 링크를 만든다', () => {
    renderRow(item());

    expect(screen.getByRole('heading', { name: '월 500 배당 포트폴리오 만들기' })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/community/portfolio/s1');
  });

  it('게시판 글은 게시판 상세로 간다', () => {
    renderRow(item({ kind: 'board' }));

    expect(screen.getByRole('link')).toHaveAttribute('href', '/community/board/s1');
  });

  it('요약이 없으면 리드 줄을 렌더하지 않는다', () => {
    renderRow(item({ description: null }));

    expect(screen.queryByText(/SCHD 60%/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '월 500 배당 포트폴리오 만들기' })).toBeInTheDocument();
  });
});

describe('PostFeedRow — 키커와 계수 레일', () => {
  it('작성자와 계수(조회·댓글·좋아요)를 숨김 라벨과 함께 읽히게 한다', () => {
    renderRow(item());

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('윤석');
    expect(link).not.toHaveTextContent('by 윤석');
    // 아이콘은 장식(aria-hidden) — 숫자 옆의 숨김 라벨이 뜻을 진다.
    expect(link).toHaveTextContent(/조회수\s?41/);
    expect(link).toHaveTextContent(/댓글\s?2/);
    expect(link).toHaveTextContent(/좋아요\s?12/);
  });

  it('작성자가 없으면 "익명"으로 폴백한다', () => {
    renderRow(item({ author: null }));

    expect(screen.getByRole('link')).toHaveTextContent('익명');
  });

  it('공유 버튼을 행 안에 둔다 — 목록에서 바로 공유할 수 있는 진입점이다', () => {
    renderRow(item());

    expect(screen.getByRole('button', { name: /공유/ })).toBeInTheDocument();
  });
});

describe('PostFeedRow — 시뮬 숫자 스트립과 배지 폴백', () => {
  it('simSummary 가 있으면 숫자 스트립(월 배당·최종 자산·목표 배지)을 보여준다', () => {
    renderRow(item({ has_payload: true }), simSummary());

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
  });

  it('simSummary 가 없으면 has_payload=true 여도 숫자 없이 텍스트 행으로 폴백한다', () => {
    renderRow(item({ has_payload: true }));

    expect(screen.queryByText('월 배당(세후)')).not.toBeInTheDocument();
    expect(screen.queryByText('187만원')).not.toBeInTheDocument();
  });

  it('숫자가 없는 첨부 글만 "시뮬 결과" 배지로 첨부 사실을 대신 말한다', () => {
    renderRow(item({ has_payload: true }));

    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('숫자가 있으면 배지는 중복이라 달지 않는다', () => {
    renderRow(item({ has_payload: true }), simSummary());

    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });
});

describe('PostFeedRow — 분류 배지 (게시판)', () => {
  const labels = COMMUNITY_COPY.write.categoryLabels;

  it('공지·건의사항·질문&고민은 배지를 단다', () => {
    renderRow(item({ kind: 'board', category: 'notice' }));
    expect(screen.getByText(labels.notice)).toBeInTheDocument();
  });

  it('기본값(자유)에는 배지를 달지 않는다 — 모든 행에 붙으면 공지가 묻힌다', () => {
    renderRow(item({ kind: 'board', category: 'free' }));

    expect(screen.queryByText(labels.free)).not.toBeInTheDocument();
  });

  it('포트폴리오 글에는 분류 배지를 달지 않는다', () => {
    renderRow(item({ kind: 'portfolio', category: 'notice' }));

    expect(screen.queryByText(labels.notice)).not.toBeInTheDocument();
  });
});
