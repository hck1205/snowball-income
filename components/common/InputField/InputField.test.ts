import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InputField, { FrequencySelect } from './InputField';

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

  /*
   * 명시 id — 다른 화면(결과 카드의 "직접 입력" CTA)이 이 필드를 고정 id로 지목한다.
   * 라벨 파생 id는 카피를 한 글자만 고쳐도 조용히 끊기므로, 준 id가 그대로 쓰이는지가 계약이다.
   */
  it('uses the explicit id and keeps the label pointing at it', () => {
    render(
      createElement(InputField, {
        id: 'target-monthly-dividend-input',
        label: '목표 월배당 (원)',
        value: 0,
        type: 'number',
        onChange: () => undefined
      })
    );

    // getByLabelText 로 찾힌다는 것 자체가 라벨(htmlFor)이 이 id 를 가리킨다는 증거다.
    const input = screen.getByLabelText('목표 월배당 (원)');
    expect(input).toBe(document.getElementById('target-monthly-dividend-input'));
  });

  it('derives the id from the label when none is given (기존 동작)', () => {
    render(createElement(InputField, { label: '월 투자금', value: 0, type: 'number', onChange: () => undefined }));

    const input = screen.getByLabelText('월 투자금');
    expect(input.id).not.toBe('');
    expect(input).toBe(document.getElementById(input.id));
  });

  it('ties the hint to the explicit id (aria-describedby)', () => {
    render(
      createElement(InputField, {
        id: 'custom-field',
        label: '월 투자금',
        value: 0,
        type: 'number',
        hint: '약 $1,000',
        onChange: () => undefined
      })
    );

    const input = screen.getByLabelText('월 투자금');
    expect(input).toHaveAccessibleDescription('약 $1,000');
    expect(input).toHaveAttribute('aria-describedby', 'custom-field-hint');
  });

  it('renders select and handles change', () => {
    const onChange = vi.fn();
    render(createElement(FrequencySelect, { label: '배당 주기', value: 'monthly', onChange }));

    fireEvent.change(screen.getByLabelText('배당 주기'), { target: { value: 'quarterly' } });
    expect(onChange).toHaveBeenCalled();
  });
});
