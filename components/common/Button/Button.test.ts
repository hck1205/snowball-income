import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { restoreMatchMedia, stubReducedMotion } from '@/test/helpers';
import Button from './Button';

describe('Button', () => {
  it('renders label and fires click', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, children: '저장' }));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type=button so it never submits a form by accident', () => {
    render(createElement(Button, { children: '저장' }));

    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'button');
  });

  it('does not fire click when disabled', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, disabled: true, children: '저장' }));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled and marked busy while loading', () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick, loading: true, children: '저장' }));

    const button = screen.getByRole('button', { name: '저장' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  /*
   * 🔴 로딩 중 시각 단서가 **모션 하나뿐이면** reduced-motion 사용자에게는 아무 것도 남지 않는다.
   * 전역 리셋(globalStyles.ts)이 애니메이션을 '!important' 로 죽이므로 링은 얼어붙고, 라벨까지
   * 지우면 "빈 버튼"이 된다(2026-07-30 실측 결함). 아래 두 케이스는 **대조군 한 짝**이다 —
   * 위 케이스가 없으면 아래 단정이 "원래 늘 보인다"는 뜻인지 알 수 없다.
   */
  describe('로딩 중 라벨 (DESIGN.md §7 — 모션이 유일한 피드백 채널이면 안 된다)', () => {
    afterEach(() => {
      restoreMatchMedia();
    });

    it('모션을 허용하는 사용자에게는 라벨을 감춘다 (도는 링이 그 자리를 말한다)', () => {
      render(createElement(Button, { loading: true, children: '저장' }));

      expect(screen.getByText('저장')).not.toBeVisible();
    });

    it('reduced-motion 사용자에게는 라벨을 감추지 않는다 (링이 얼어붙어도 읽을 것이 남는다)', () => {
      stubReducedMotion();

      render(createElement(Button, { loading: true, children: '저장' }));

      expect(screen.getByText('저장')).toBeVisible();
      // 접근명과 busy 상태는 두 경로에서 모두 유지된다.
      expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('keeps the accessible name for icon-only buttons via aria-label', () => {
    render(createElement(Button, { iconOnly: true, 'aria-label': '설정 닫기', children: '×' }));

    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
  });
});
