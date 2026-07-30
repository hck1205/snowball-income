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

  /**
   * 히트 영역은 **스위치 주변 44×32 까지**다. 라벨 줄 전체가 스위치가 되면 안 된다 —
   * 이 줄은 `justify-content: space-between` 이라 라벨 텍스트와 스위치 사이에 200px 넘는 빈 공간이
   * 생기고, 거기를 눌렀을 때 설정이 바뀌면 "안 누른 게 켜졌다"가 된다.
   * (그래서 `ToggleLabel` 은 `<label>` 이 아니라 `<div>` 로 남는다 — 위임은 트랙에서 끝낸다.)
   */
  it('라벨 줄의 빈 공간·라벨 텍스트를 눌러도 토글되지 않는다', () => {
    const onChange = vi.fn();
    render(createElement(ToggleField, { label: '재투자', checked: false, onChange }));

    const row = screen.getByText('재투자').closest('div') as HTMLElement;

    fireEvent.click(row);
    fireEvent.click(screen.getByText('재투자'));

    expect(onChange).not.toHaveBeenCalled();
  });

  /** 라벨 줄 안의 다른 인터랙티브 요소(도움말)가 토글에 삼켜지지 않는다. */
  it('도움말 버튼을 눌러도 토글되지 않는다', () => {
    const onChange = vi.fn();
    const onHelpClick = vi.fn();
    render(createElement(ToggleField, { label: '재투자', checked: false, onChange, onHelpClick }));

    fireEvent.click(screen.getByRole('button', { name: '재투자 설명 열기' }));

    expect(onHelpClick).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
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
