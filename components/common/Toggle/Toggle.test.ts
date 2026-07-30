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

  /**
   * **넓힌 히트 영역이 실제로 눌린다.**
   *
   * 스위치는 38×20 이지만 터치 하한을 위해 `::before` 로 44×32 띠를 깔아 둔다. 그 띠는 **트랙
   * 요소의** 의사요소라, 띠에 떨어진 클릭의 이벤트 타깃은 트랙 요소 자신이다(헤드리스 Chrome 에서
   * `elementFromPoint` 로 확인 — 트랙 위/아래 4px, 좌우 2px 네 지점 모두 트랙 요소를 돌려준다).
   * 그런데 실제 클릭 타깃인 체크박스는 트랙을 **정확히** 덮을 뿐이라(inset: 0), 트랙이 `<span>` 이면
   * 그 클릭은 **어느 핸들러에도 닿지 않았다** — 넓혀 놓고 작동하지 않는 히트 영역이었다.
   *
   * 그래서 여기서는 **트랙 요소에** 클릭을 쏜다(= 띠를 누른 것과 같은 이벤트). 트랙이 `<label>` 이면
   * 라벨 활성화가 체크박스로 위임돼 `onChange` 가 온다. `<span>` 으로 되돌리면 이 테스트만 빨개진다.
   * (jsdom 은 레이아웃·의사요소를 계산하지 않으므로 띠의 **크기**는 실브라우저에서 재고, 여기서는
   *  띠의 클릭이 **어디로 가는가**라는 위임 계약만 잠근다.)
   */
  it('트랙 밖 히트 영역을 눌러도 토글된다 — 트랙이 클릭을 체크박스로 위임한다', () => {
    const onChange = vi.fn();
    render(createElement(Toggle, { label: '재투자', checked: false, onChange }));

    const control = screen.getByRole('checkbox', { name: '재투자' });
    const track = control.parentElement as HTMLElement;

    fireEvent.click(track);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /** 트랙 안에는 어떤 글자도 넣지 않는다 — 모드 의미는 ToggleField의 보이는 라벨이 말한다. */
  it('renders no text inside the track', () => {
    const { container } = render(
      createElement(Toggle, { label: '재투자', checked: false, onChange: () => undefined })
    );

    expect(container.textContent).toBe('');
  });
});
