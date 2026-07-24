import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ToggleField from './ToggleField';

describe('ToggleField', () => {
  it('handles click event', () => {
    const onChange = vi.fn();
    render(createElement(ToggleField, { label: '재투자', checked: false, onChange }));

    fireEvent.click(screen.getByLabelText('재투자'));
    expect(onChange).toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(createElement(ToggleField, { label: '재투자', checked: false, disabled: true, onChange: () => undefined }));
    expect(screen.getByLabelText('재투자')).toBeDisabled();
  });

  it('보이는 라벨은 그대로 두고 스위치 접근명만 따로 줄 수 있다', () => {
    render(
      createElement(ToggleField, {
        label: '표시 통화',
        accessibleName: '결과를 달러로 표시',
        checked: false,
        onChange: () => undefined
      })
    );

    expect(screen.getByText('표시 통화')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '결과를 달러로 표시' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: '표시 통화' })).toBeNull();
  });
});
