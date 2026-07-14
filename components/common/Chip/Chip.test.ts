import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Chip from './Chip';

describe('Chip', () => {
  it('renders as plain text when not interactive', () => {
    render(createElement(Chip, { children: 'SCHD' }));

    expect(screen.getByText('SCHD')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders as a button and fires click when selectable', () => {
    const onClick = vi.fn();
    render(createElement(Chip, { children: 'SCHD', onClick }));

    fireEvent.click(screen.getByRole('button', { name: 'SCHD' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a remove button with an accessible name', () => {
    const onRemove = vi.fn();
    render(createElement(Chip, { children: 'SCHD', onRemove }));

    fireEvent.click(screen.getByRole('button', { name: 'SCHD 제거' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  /** 버튼 안에 버튼을 중첩하면 안 된다 — 두 액션은 형제여야 한다. */
  it('keeps select and remove as two separate buttons', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(createElement(Chip, { children: 'SCHD', onClick, onRemove }));

    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'SCHD 제거' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    // 제거 클릭이 칩 선택까지 발동시키면 안 된다.
    expect(onClick).not.toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(createElement(Chip, { children: 'SCHD', onClick: () => undefined, disabled: true }));

    expect(screen.getByRole('button', { name: 'SCHD' })).toBeDisabled();
  });
});
