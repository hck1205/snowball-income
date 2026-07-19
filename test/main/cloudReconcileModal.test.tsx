import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudReconcileModal } from '@/components/CloudReconcileModal';
import type { CloudReconciliationSummary } from '@/jotai/snowball/cloud';

/**
 * 충돌 화해 모달 — **사용자 행동**으로 검증한다(3버튼 각 부작용은 콜백 mock으로).
 * 색/Emotion 내부가 아니라 텍스트·역할·포커스로 단정한다.
 */
const NOW = new Date('2026-07-19T00:11:00Z');

const makeSummary = (over: Partial<CloudReconciliationSummary> = {}): CloudReconciliationSummary => ({
  device: {
    tabCount: 2,
    tabNames: ['성장형', '배당형'],
    lastEditedAt: Date.parse('2026-07-19T00:10:00Z')
  },
  cloud: {
    tabCount: 1,
    tabNames: ['은퇴 준비'],
    lastEditedAt: Date.parse('2026-07-19T00:00:00Z')
  },
  ...over
});

const renderModal = (over: { summary?: CloudReconciliationSummary; blendTabCount?: number } = {}) => {
  const handlers = {
    onUseDevice: vi.fn(),
    onUseCloud: vi.fn(),
    onBlend: vi.fn(),
    onDefer: vi.fn()
  };
  render(
    <CloudReconcileModal
      summary={over.summary ?? makeSummary()}
      blendTabCount={over.blendTabCount ?? 3}
      now={NOW}
      {...handlers}
    />
  );
  return handlers;
};

describe('CloudReconcileModal', () => {
  it('제목·본문과 양측 요약(탭 개수·이름·상대 편집시각)을 보여준다', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: /이 기기와 클라우드에 저장된 내용이 다릅니다/ })).toBeInTheDocument();
    expect(screen.getByText(/어느 쪽을 기준으로 맞출지 골라 주세요/)).toBeInTheDocument();

    // 각 측 탭 이름이 칩으로 보인다.
    expect(screen.getByText('성장형')).toBeInTheDocument();
    expect(screen.getByText('배당형')).toBeInTheDocument();
    expect(screen.getByText('은퇴 준비')).toBeInTheDocument();

    // 상대 편집시각(주입 now로 결정적) — 양측 모두 표기(이 기기 1분 전 / 클라우드 11분 전).
    expect(screen.getAllByText(/마지막 편집/)).toHaveLength(2);
    expect(screen.getByText('마지막 편집 1분 전')).toBeInTheDocument();
    expect(screen.getByText('마지막 편집 11분 전')).toBeInTheDocument();
  });

  it('더 최근에 편집된 측(이 기기)에만 "최근 편집" 태그가 붙는다', () => {
    renderModal();
    const tags = screen.getAllByText('최근 편집');
    expect(tags).toHaveLength(1);
    // 태그가 "이 기기" 탭 목록과 같은 열에 있다(성장형이 그 열의 칩).
    const deviceList = screen.getByRole('list', { name: '이 기기 탭 목록' });
    expect(within(deviceList).getByText('성장형')).toBeInTheDocument();
  });

  it('블렌드 미리보기("합치면 N개 탭")를 노출하고 기본 포커스를 가진다(비파괴 권장)', () => {
    renderModal({ blendTabCount: 5 });
    const blend = screen.getByRole('button', { name: /둘 다 합치기/ });
    expect(blend).toHaveTextContent('합치면 5개 탭');
    expect(blend).toHaveFocus();
  });

  it('"둘 다 합치기"는 onBlend를 부른다', async () => {
    const h = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /둘 다 합치기/ }));
    expect(h.onBlend).toHaveBeenCalledTimes(1);
    expect(h.onUseDevice).not.toHaveBeenCalled();
    expect(h.onUseCloud).not.toHaveBeenCalled();
  });

  it('"이 기기 데이터로 맞추기"는 onUseDevice를 부른다', async () => {
    const h = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /이 기기 데이터로 맞추기/ }));
    expect(h.onUseDevice).toHaveBeenCalledTimes(1);
    expect(h.onBlend).not.toHaveBeenCalled();
  });

  it('"클라우드 데이터로 맞추기"는 onUseCloud를 부른다', async () => {
    const h = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /클라우드 데이터로 맞추기/ }));
    expect(h.onUseCloud).toHaveBeenCalledTimes(1);
  });

  it('Esc는 이연(onDefer)이다 — 무음 화해가 아니다', async () => {
    const h = renderModal();
    await userEvent.keyboard('{Escape}');
    expect(h.onDefer).toHaveBeenCalledTimes(1);
    expect(h.onBlend).not.toHaveBeenCalled();
    expect(h.onUseDevice).not.toHaveBeenCalled();
    expect(h.onUseCloud).not.toHaveBeenCalled();
  });

  it('바깥(백드롭) 클릭도 이연(onDefer)이다', async () => {
    const h = renderModal();
    await userEvent.click(screen.getByRole('dialog'));
    expect(h.onDefer).toHaveBeenCalledTimes(1);
  });

  it('편집 시각을 알 수 없으면(양측 null) "최근 편집" 태그 없이 안내 문구를 보인다', () => {
    renderModal({
      summary: makeSummary({
        device: { tabCount: 1, tabNames: ['탭 1'], lastEditedAt: null },
        cloud: { tabCount: 1, tabNames: ['탭 A'], lastEditedAt: null }
      })
    });
    expect(screen.queryByText('최근 편집')).not.toBeInTheDocument();
    expect(screen.getAllByText('편집 시각 정보 없음')).toHaveLength(2);
  });
});
