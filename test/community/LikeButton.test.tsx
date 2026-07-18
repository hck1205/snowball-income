import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LikeButton } from '@/components/community';

describe('LikeButton', () => {
  it('꺼진 상태: aria-pressed=false, 라벨 "좋아요", 축약 카운트 표시', () => {
    render(<LikeButton liked={false} count={1200} onToggle={() => undefined} />);

    const button = screen.getByRole('button', { name: '좋아요' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('1.2천');
  });

  it('켜진 상태: aria-pressed=true, 라벨 "좋아요 취소"', () => {
    render(<LikeButton liked count={3} onToggle={() => undefined} />);

    const button = screen.getByRole('button', { name: '좋아요 취소' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('클릭하면 onToggle을 부른다', async () => {
    const onToggle = vi.fn();
    render(<LikeButton liked={false} count={0} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('disabled면 클릭해도 onToggle을 부르지 않는다', async () => {
    const onToggle = vi.fn();
    render(<LikeButton liked={false} count={0} onToggle={onToggle} disabled />);

    const button = screen.getByRole('button', { name: '좋아요' });
    expect(button).toBeDisabled();
    await userEvent.click(button);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
