import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardCategoryFilter } from './BoardCategoryFilter';
import {
  COMMUNITY_COPY,
  POST_CATEGORY_IDS,
  toggleBoardCategory
} from '@/shared/constants/community';

/**
 * 게시판 분류 필터의 **행동** 계약. className·Emotion 내부는 보지 않는다.
 * 핵심은 "켜짐/꺼짐이 색이 아니라 `aria-pressed` 로도 읽히는가"와 "전체가 조건 없음인가" 둘이다.
 */

const b = COMMUNITY_COPY.board;
const labels = COMMUNITY_COPY.write.categoryLabels;

const setup = (categories: readonly ('free' | 'question' | 'insight' | 'suggestion' | 'notice')[] = []) => {
  const onToggle = vi.fn();
  const onSelectAll = vi.fn();
  render(<BoardCategoryFilter categories={categories} onToggle={onToggle} onSelectAll={onSelectAll} />);
  return { onToggle, onSelectAll };
};

describe('BoardCategoryFilter — 전체 + 5개 분류', () => {
  it('전체를 맨 앞에 두고 분류 5개를 순서대로 세운다', () => {
    setup();

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      b.categoryAll,
      ...POST_CATEGORY_IDS.map((id) => labels[id])
    ]);
  });

  it('아무것도 고르지 않았으면 전체가 켜져 있다(기본값)', () => {
    setup();

    expect(screen.getByRole('button', { name: b.categoryAll })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: labels.question })).toHaveAttribute('aria-pressed', 'false');
  });

  it('고른 분류만 aria-pressed 로 켜지고 전체는 꺼진다', () => {
    setup(['question', 'notice']);

    expect(screen.getByRole('button', { name: b.categoryAll })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: labels.question })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: labels.notice })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: labels.insight })).toHaveAttribute('aria-pressed', 'false');
  });

  it('분류를 누르면 그 분류로 토글을 요청한다', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup();

    await user.click(screen.getByRole('button', { name: labels.insight }));

    expect(onToggle).toHaveBeenCalledWith('insight');
  });

  it('전체를 누르면 선택 해제를 요청한다', async () => {
    const user = userEvent.setup();
    const { onSelectAll } = setup(['insight']);

    await user.click(screen.getByRole('button', { name: b.categoryAll }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('필터 묶음이 group 랜드마크로 이름을 갖는다(라벨 낱말을 지운 자리를 접근명이 대신한다)', () => {
    setup();

    expect(screen.getByRole('group', { name: b.categoryFilterLabel })).toBeInTheDocument();
  });
});

describe('toggleBoardCategory — All 과 개별의 관계', () => {
  it('마지막 하나를 끄면 전체(빈 집합)로 돌아간다', () => {
    expect(toggleBoardCategory(['insight'], 'insight')).toEqual([]);
  });

  it('5개를 전부 켜면 전체로 접는다(조건 없음과 결과가 같다)', () => {
    const all = POST_CATEGORY_IDS.slice(0, POST_CATEGORY_IDS.length - 1);
    expect(toggleBoardCategory(all, POST_CATEGORY_IDS[POST_CATEGORY_IDS.length - 1])).toEqual([]);
  });

  it('선택 순서와 무관하게 POST_CATEGORY_IDS 순서로 정규화한다', () => {
    expect(toggleBoardCategory(['notice'], 'question')).toEqual(['question', 'notice']);
  });
});
