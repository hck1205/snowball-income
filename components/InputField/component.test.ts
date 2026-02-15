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

  it('formats numeric value with separators', () => {
    render(createElement(InputField, { label: '월 투자금', value: 1000000, type: 'number', onChange: () => undefined }));
    expect(screen.getByLabelText('월 투자금')).toHaveValue('1,000,000');
  });

  it('normalizes separators on numeric change', () => {
    const onChange = vi.fn();
    render(createElement(InputField, { label: '월 투자금', value: 1000000, type: 'number', onChange }));

    fireEvent.change(screen.getByLabelText('월 투자금'), { target: { value: '1,234,567' } });

    const firstEvent = onChange.mock.calls[0][0] as React.ChangeEvent<HTMLInputElement>;
    expect(firstEvent.target.value).toBe('1234567');
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
