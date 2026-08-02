import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import ColorSchemeToggle from './ColorSchemeToggle';

/**
 * 🔴 **글리프 전환 애니메이션은 "사용자가 눌렀을 때"만 재생된다.**
 *
 * 이 앱은 페이지마다 자기 `AppHeader` 를 렌더한다 — 라우트를 옮기면 이 토글이 통째로 다시 마운트된다.
 * 예전에는 `iconSwapIn` 이 `svg` 에 무조건 걸려 있어 **페이지를 옮길 때마다 해·달이 튀어 들어왔고**
 * 사용자에게는 아이콘이 깜빡이는 것으로 보였다(2026-08-02 제보).
 *
 * 그래서 이 테스트는 **마운트 직후에는 애니메이션이 없다**를 잠근다. 조건을 지우고 다시 무조건
 * 걸면 첫 단정이 빨개진다.
 *
 * ⚠ jsdom 은 실제 애니메이션을 돌리지 않으므로 **클래스가 아니라 emotion 이 만든 규칙의 존재**로
 *   판정한다 — 애니메이션이 걸리면 그 스타일 규칙에 `animation` 선언이 생긴다.
 */
const renderToggle = () => {
  const store = createStore();
  return render(<ColorSchemeToggle />, {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
  });
};

/** 문서에 실린 emotion 스타일 전체에서 이 컴포넌트가 만든 애니메이션 선언을 찾는다. */
const hasIconAnimation = (container: HTMLElement): boolean => {
  const svg = container.querySelector('svg');
  if (svg === null) return false;
  const styles = [...document.querySelectorAll('style')].map((node) => node.textContent ?? '').join('\n');
  // 아이콘 전환은 svg 선택자 아래에 animation 을 건다. 이름은 emotion 이 해시하므로 선언만 본다.
  return /svg\s*\{[^}]*animation/.test(styles);
};

describe('ColorSchemeToggle — 글리프 전환', () => {
  it('🔴 마운트 직후에는 애니메이션이 없다 (페이지 이동마다 깜빡이지 않는다)', () => {
    const { container } = renderToggle();

    expect(screen.getByRole('button', { name: '다크 모드' })).toBeInTheDocument();
    expect(hasIconAnimation(container)).toBe(false);
  });

  it('사용자가 누르면 그때 전환 애니메이션이 붙는다', async () => {
    const user = userEvent.setup();
    const { container } = renderToggle();

    await user.click(screen.getByRole('button', { name: '다크 모드' }));

    expect(hasIconAnimation(container)).toBe(true);
  });
});
