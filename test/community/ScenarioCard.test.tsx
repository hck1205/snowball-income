import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScenarioCard } from '@/components/community';
import type { ScenarioListItem } from '@/shared/lib/supabase';

const item = (overrides: Partial<ScenarioListItem> = {}): ScenarioListItem => ({
  id: 's1',
  user_id: 'u1',
  title: '월배당 포트폴리오',
  description: '매달 현금흐름을 노린 구성',
  is_public: true,
  has_payload: false,
  like_count: 12,
  view_count: 340,
  comment_count: 3,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: { id: 'u1', display_name: '눈덩이', avatar_url: null },
  ...overrides
});

const renderCard = (data: ScenarioListItem) =>
  render(
    <MemoryRouter>
      <ScenarioCard item={data} />
    </MemoryRouter>
  );

describe('ScenarioCard — 하이브리드 모델 배지', () => {
  it('시나리오 첨부 글(has_payload=true)은 "시뮬 결과" 배지를 단다', () => {
    renderCard(item({ has_payload: true }));
    expect(screen.getByText('시뮬 결과')).toBeInTheDocument();
  });

  it('자유 글(has_payload=false)은 배지를 달지 않는다', () => {
    renderCard(item({ has_payload: false }));
    expect(screen.queryByText('시뮬 결과')).not.toBeInTheDocument();
  });
});

describe('ScenarioCard — 표시', () => {
  it('제목/요약/작성자를 보여주고 상세로 가는 링크를 만든다', () => {
    renderCard(item());

    expect(screen.getByText('월배당 포트폴리오')).toBeInTheDocument();
    expect(screen.getByText('매달 현금흐름을 노린 구성')).toBeInTheDocument();
    expect(screen.getByText('눈덩이')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/community/s1');
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
