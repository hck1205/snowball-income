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

  /** 트랙 안에는 어떤 글자도 넣지 않는다 — 모드 의미는 ToggleField의 보이는 라벨이 말한다. */
  it('renders no text inside the track', () => {
    const { container } = render(
      createElement(Toggle, { label: '재투자', checked: false, onChange: () => undefined })
    );

    expect(container.textContent).toBe('');
  });
});
