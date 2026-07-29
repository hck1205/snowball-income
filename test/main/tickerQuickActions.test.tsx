import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TickerCreation from '@/components/TickerCreation';
import { SHARE_DIALOG_COPY } from '@/components/common';
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

/**
 * 클립보드가 막힌 사용자만 보는 폴백 경로다. 여기서 채널 새 창까지 팝업 차단에 막히면
 * **아무 일도 일어나지 않은 것처럼** 보인다 — `window.open` 의 `null` 반환이 유일한 신호다.
 */
describe('TickerCreation 공유 창 — 채널 팝업 차단', () => {
  const ORIGINAL_OPEN = Object.getOwnPropertyDescriptor(window, 'open');

  afterEach(() => {
    if (ORIGINAL_OPEN) Object.defineProperty(window, 'open', ORIGINAL_OPEN);
  });

  const openShareDialog = async () => {
    // 복사 실패(copied:false)일 때만 공유 창이 뜬다 — 잘 되는 흐름에는 단계를 더하지 않는다.
    const onCreateShareLink = vi
      .fn()
      .mockResolvedValue({ ok: true, url: 'https://snowball.example/?s=abc', copied: false });
    render(<TickerCreation {...baseProps({ onCreateShareLink })} />);
    await userEvent.click(screen.getByRole('button', { name: '공유' }));
    return screen.findByRole('dialog', { name: SHARE_DIALOG_COPY.title });
  };

  it('팝업이 막히면 사유를 말하고 공유 창을 열어 둔다', async () => {
    Object.defineProperty(window, 'open', { value: vi.fn(() => null), configurable: true, writable: true });
    await openShareDialog();

    await userEvent.click(screen.getByRole('button', { name: SHARE_DIALOG_COPY.channelAria('X') }));

    expect(await screen.findByRole('status')).toHaveTextContent('브라우저가 새 창을 막았어요');
    // 창이 닫히면 대안(링크 복사·주소 직접 선택)까지 함께 사라진다.
    expect(screen.getByRole('dialog', { name: SHARE_DIALOG_COPY.title })).toBeInTheDocument();
  });

  it('정상적으로 열리면 공유 창을 닫는다(대조군)', async () => {
    Object.defineProperty(window, 'open', {
      value: vi.fn(() => ({}) as Window),
      configurable: true,
      writable: true
    });
    await openShareDialog();

    await userEvent.click(screen.getByRole('button', { name: SHARE_DIALOG_COPY.channelAria('X') }));

    expect(screen.queryByRole('dialog', { name: SHARE_DIALOG_COPY.title })).not.toBeInTheDocument();
  });
});
