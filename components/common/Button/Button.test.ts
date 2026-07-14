import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders label and fires click', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, children: '저장' }));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type=button so it never submits a form by accident', () => {
    render(createElement(Button, { children: '저장' }));

    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'button');
  });

  it('does not fire click when disabled', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, disabled: true, children: '저장' }));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled and marked busy while loading', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, loading: true, children: '저장' }));

    const button = screen.getByRole('button', { name: '저장' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the accessible name for icon-only buttons via aria-label', () => {
    render(createElement(Button, { iconOnly: true, 'aria-label': '설정 닫기', children: '×' }));

    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
  });
});
