import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Toggle from './Toggle';

describe('Toggle', () => {
  it('fires change on click', () => {
    const onChange = vi.fn();
    render(createElement(Toggle, { label: '재투자', checked: false, onChange }));

    fireEvent.click(screen.getByLabelText('재투자'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /**
   * 스위치는 "보이는 방식"이지 시맨틱이 아니다. role은 checkbox로 남아야 한다
   * (앱 테스트가 getByRole('checkbox')로 토글을 잡는다).
   */
  it('keeps native checkbox semantics', () => {
    render(createElement(Toggle, { label: '재투자', checked: true, onChange: () => undefined }));

    expect(screen.getByRole('checkbox', { name: '재투자' })).toBeChecked();
  });

  it('supports disabled state', () => {
    render(createElement(Toggle, { label: '재투자', checked: false, disabled: true, onChange: () => undefined }));

    expect(screen.getByLabelText('재투자')).toBeDisabled();
  });

  it('renders no state text by default (no "OFF" stamped in the track)', () => {
    render(createElement(Toggle, { label: '재투자', checked: false, onChange: () => undefined }));

    expect(screen.queryByText('OFF')).not.toBeInTheDocument();
    expect(screen.queryByText('ON')).not.toBeInTheDocument();
  });

  it('renders mode text when onText/offText are given', () => {
    const { rerender } = render(
      createElement(Toggle, { label: '결과 상세도', checked: true, onText: '간략', offText: '상세', onChange: () => undefined })
    );

    expect(screen.getByText('간략')).toBeInTheDocument();

    rerender(
      createElement(Toggle, { label: '결과 상세도', checked: false, onText: '간략', offText: '상세', onChange: () => undefined })
    );

    expect(screen.getByText('상세')).toBeInTheDocument();
  });
});
