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

  /**
   * 통일된 스위치의 부정 계약: 라벨은 **스위치 바깥**에 있고, 스위치(트랙) 안에는 글자가 없다.
   * 구 API(`onText`/`offText`)가 어떤 형태로든 되살아나면 여기서 죽는다.
   */
  it('보이는 라벨은 스위치 바깥에 있고 트랙 안에는 글자가 없다', () => {
    render(createElement(ToggleField, { label: '재투자', checked: false, onChange: () => undefined }));

    const control = screen.getByRole('checkbox', { name: '재투자' });
    const track = control.parentElement;

    expect(track).not.toBeNull();
    expect(track?.textContent).toBe('');
    // 라벨 텍스트는 트랙 밖(라벨 줄)에 있다 — 트랙이 라벨을 품으면 이 단정이 깨진다.
    expect(track?.contains(screen.getByText('재투자'))).toBe(false);
  });

  /** `hideLabel`은 여전히 있는 탈출구지만, 통일된 모드 스위치 5곳은 쓰지 않는다. */
  it('hideLabel이면 보이는 라벨이 사라지고 접근명만 남는다', () => {
    render(
      createElement(ToggleField, {
        label: '재투자',
        checked: false,
        hideLabel: true,
        onChange: () => undefined
      })
    );

    expect(screen.queryByText('재투자')).toBeNull();
    expect(screen.getByRole('checkbox', { name: '재투자' })).toBeInTheDocument();
  });
});
