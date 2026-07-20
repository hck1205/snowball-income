import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Select from './Select';

const options = [
  createElement('option', { key: 'a', value: 'a' }, '당월 재투자'),
  createElement('option', { key: 'b', value: 'b' }, '익월 재투자')
];

describe('Select', () => {
  it('renders a native combobox with its accessible name and options', () => {
    render(
      createElement(Select, { 'aria-label': '재투자 시점', value: 'a', onChange: vi.fn(), children: options })
    );

    const select = screen.getByRole('combobox', { name: '재투자 시점' });

    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: '당월 재투자' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '익월 재투자' })).toBeInTheDocument();
  });

  it('reports the chosen value to onChange', () => {
    const onChange = vi.fn();
    // 비제어(defaultValue)로 렌더한다 — 제어 컴포넌트로 두면 React가 DOM 값을 즉시 되돌려
    // 이벤트 타깃에서 선택값을 읽을 수 없다.
    render(createElement(Select, { 'aria-label': '재투자 시점', defaultValue: 'a', onChange, children: options }));

    const select = screen.getByRole('combobox', { name: '재투자 시점' });
    fireEvent.change(select, { target: { value: 'b' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((select as HTMLSelectElement).value).toBe('b');
  });

  it('can be disabled', () => {
    render(
      createElement(Select, {
        'aria-label': '재투자 시점',
        value: 'a',
        disabled: true,
        onChange: vi.fn(),
        children: options
      })
    );

    expect(screen.getByRole('combobox', { name: '재투자 시점' })).toBeDisabled();
  });

  it('associates with an external label through id', () => {
    render(
      createElement(
        'div',
        null,
        createElement('label', { htmlFor: 'category' }, '글 종류'),
        createElement(Select, { id: 'category', value: 'a', onChange: vi.fn(), children: options })
      )
    );

    expect(screen.getByLabelText('글 종류')).toBe(screen.getByRole('combobox'));
  });

  it('keeps the decorative chevron out of the accessibility tree', () => {
    const { container } = render(
      createElement(Select, { 'aria-label': '재투자 시점', value: 'a', onChange: vi.fn(), children: options })
    );

    // 화살표는 장식이라 접근성 트리에 이름을 남기지 않는다(래퍼가 aria-hidden).
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });
});
