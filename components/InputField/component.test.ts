import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InputField, { FrequencySelect } from './component';

describe('InputField', () => {
  it('renders input and handles change', () => {
    const onChange = vi.fn();
    render(createElement(InputField, { label: '현재 주가', value: 100, type: 'number', onChange }));

    fireEvent.change(screen.getByLabelText('현재 주가'), { target: { value: '101' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(createElement(InputField, { label: '월 투자금', value: 0, disabled: true, onChange: () => undefined }));
    expect(screen.getByLabelText('월 투자금')).toBeDisabled();
  });

  it('renders select and handles change', () => {
    const onChange = vi.fn();
    render(createElement(FrequencySelect, { label: '배당 주기', value: 'monthly', onChange }));

    fireEvent.change(screen.getByLabelText('배당 주기'), { target: { value: 'quarterly' } });
    expect(onChange).toHaveBeenCalled();
  });
});
