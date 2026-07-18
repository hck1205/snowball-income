import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TickerCreation from '@/components/TickerCreation';
import type { TickerCreationProps } from '@/components/TickerCreation/TickerCreation.types';

const baseProps = (overrides: Partial<TickerCreationProps> = {}): TickerCreationProps => ({
  tickerProfiles: [],
  includedTickerIds: [],
  onOpenCreate: vi.fn(),
  onCreateShareLink: vi.fn().mockResolvedValue({ ok: true, url: 'x', copied: true }),
  onTickerClick: vi.fn(),
  onTickerPressStart: vi.fn(),
  onTickerPressEnd: vi.fn(),
  onOpenEdit: vi.fn(),
  ...overrides
});

describe('TickerCreation 퀵액션 — 공유만 남김(데이터 저장은 자동저장으로 대체·제거)', () => {
  it('공유가 보이고, 데이터 저장·Capture·Save·Load·File은 사라졌다', () => {
    render(<TickerCreation {...baseProps()} />);

    expect(screen.getByRole('button', { name: '공유' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '데이터 저장' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Capture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'File' })).not.toBeInTheDocument();
  });

  it('Coffee는 스코프 유지로 DOM에 남되 숨겨져 있다', () => {
    const { container } = render(<TickerCreation {...baseProps()} />);
    // 보이는 버튼으로는 잡히지 않는다(hidden).
    expect(screen.queryByRole('button', { name: 'Coffee' })).not.toBeInTheDocument();
    // 마크업에는 존재하고 숨겨져 있다.
    const coffee = container.querySelector('button[aria-label="Coffee"]');
    expect(coffee).not.toBeNull();
    expect(coffee).toHaveStyle({ display: 'none' });
  });

  it('공유 버튼이 onCreateShareLink를 부른다', async () => {
    const onCreateShareLink = vi.fn().mockResolvedValue({ ok: true, url: 'x', copied: true });
    render(<TickerCreation {...baseProps({ onCreateShareLink })} />);
    await userEvent.click(screen.getByRole('button', { name: '공유' }));
    expect(onCreateShareLink).toHaveBeenCalledTimes(1);
  });
});
