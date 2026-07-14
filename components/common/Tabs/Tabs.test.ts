import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Tabs from './Tabs';

const items = [
  { id: 'preset', label: '프리셋' },
  { id: 'input', label: '입력' }
];

describe('Tabs', () => {
  it('exposes tablist/tab roles with accessible names', () => {
    render(createElement(Tabs, { items, activeId: 'preset', onChange: () => undefined, ariaLabel: '티커 생성 탭' }));

    expect(screen.getByRole('tablist', { name: '티커 생성 탭' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '프리셋' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '입력' })).toBeInTheDocument();
  });

  it('marks only the active tab as selected', () => {
    render(createElement(Tabs, { items, activeId: 'input', onChange: () => undefined, ariaLabel: '탭' }));

    expect(screen.getByRole('tab', { name: '입력' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '프리셋' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the clicked tab id', () => {
    const onChange = vi.fn();
    render(createElement(Tabs, { items, activeId: 'preset', onChange, ariaLabel: '탭' }));

    fireEvent.click(screen.getByRole('tab', { name: '입력' }));

    expect(onChange).toHaveBeenCalledWith('input');
  });

  it('does not report disabled tabs', () => {
    const onChange = vi.fn();
    render(
      createElement(Tabs, {
        items: [items[0], { ...items[1], disabled: true }],
        activeId: 'preset',
        onChange,
        ariaLabel: '탭'
      })
    );

    fireEvent.click(screen.getByRole('tab', { name: '입력' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
