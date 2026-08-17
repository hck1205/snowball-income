import { createElement, useState, type ChangeEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InputField, { FrequencySelect } from './InputField';

/**
 * 실제 소비처와 **같은 방식으로** 값을 되돌려주는 부모(예: `InvestmentSettings` 의 세율 필드).
 * 문자열을 `Number` 로 파싱해 숫자 상태로 들고 있는 것이 핵심이다 — 소수점이 지워지던 원인이
 * 그 파싱이므로, 부모가 문자열을 그대로 보관하면 재현되지 않는다.
 */
const ControlledNumberField = ({ label = '세율 (%)', initial = 15 }: { label?: string; initial?: number }) => {
  const [value, setValue] = useState<number | undefined>(initial);

  return createElement(InputField, {
    label,
    type: 'number',
    value: value ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValue(next === '' ? undefined : Number(next));
    }
  });
};

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

  /*
   * 2026-08-17 사용자 신고: "세율에 소수점이 입력이 안 된다."
   * 원인은 controlled + `Number` 파싱이다 — "15." 이 15 가 되어 표시값으로 돌아오면 점이 사라지므로
   * 소수 둘째 자리로 넘어갈 수가 없었다(15.4 를 넣을 방법이 아예 없었다).
   */
  it('소수점을 찍는 중에도 그 점이 지워지지 않는다 (15.4 를 끝까지 입력할 수 있다)', () => {
    render(createElement(ControlledNumberField));
    const input = screen.getByLabelText('세율 (%)');

    fireEvent.change(input, { target: { value: '15.' } });
    expect(input).toHaveValue('15.');

    fireEvent.change(input, { target: { value: '15.4' } });
    expect(input).toHaveValue('15.4');
  });

  /** 소수점 뒤 0 도 살아 있어야 한다 — "15.40" 을 쓰는 중에 "15.4" 로 잘리면 뒷자리를 못 찍는다. */
  it('소수점 뒤 0 을 유지한다', () => {
    render(createElement(ControlledNumberField));
    const input = screen.getByLabelText('세율 (%)');

    fireEvent.change(input, { target: { value: '15.0' } });
    expect(input).toHaveValue('15.0');
  });

  /** 초안이 이기는 것은 **수치가 같을 때만** 이다 — 바깥에서 값이 바뀌면 즉시 새 값이 보여야 한다. */
  it('바깥에서 값이 바뀌면 입력 중간 상태가 화면에 남지 않는다', () => {
    const props = { label: '배당률', value: 15 as string | number, type: 'number' as const, onChange: () => undefined };
    const { rerender } = render(createElement(InputField, props));
    const input = screen.getByLabelText('배당률');

    fireEvent.change(input, { target: { value: '15.' } });
    expect(input).toHaveValue('15.');

    rerender(createElement(InputField, { ...props, value: 3.5 }));
    expect(input).toHaveValue('3.5');
  });

  /** 천단위 구분은 그대로 — 초안을 표시할 때도 같은 포맷터를 지난다. */
  it('입력 중간 상태에도 천단위 구분을 유지한다', () => {
    render(createElement(ControlledNumberField, { label: '월 투자금', initial: 1000 }));
    const input = screen.getByLabelText('월 투자금');

    fireEvent.change(input, { target: { value: '1234.' } });
    expect(input).toHaveValue('1,234.');
  });

  it('renders select and handles change', () => {
    const onChange = vi.fn();
    render(createElement(FrequencySelect, { label: '배당 주기', value: 'monthly', onChange }));

    fireEvent.change(screen.getByLabelText('배당 주기'), { target: { value: 'quarterly' } });
    expect(onChange).toHaveBeenCalled();
  });
});
