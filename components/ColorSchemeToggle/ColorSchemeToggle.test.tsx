import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// ⚠ 'jotai' 루트가 아니라 서브패스로 — baseUrl 때문에 루트는 레포의 `jotai/` 배럴로 섀도잉된다.
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import { COLOR_SCHEME_STORAGE_KEY } from '@/jotai';
import ColorSchemeToggle from './ColorSchemeToggle';

/**
 * 헤더 밝기 토글의 사용자 계약.
 *
 * 여기서 잠그는 것은 ①상태가 **색이 아닌 단서**(접근명 + `aria-pressed`)로 전달된다
 * ②한 번 누르면 그 선택이 저장된다 ③고를 수 있는 것이 이것뿐이다(색 프리셋 진입점 없음).
 *
 * jsdom 의 `matchMedia` 스텁은 모든 질의에 `matches: false` 를 돌려준다 —
 * 즉 이 테스트의 OS 설정은 항상 **라이트**이고, 첫 렌더의 눌림 상태는 그것이 기준이다.
 */
const renderToggle = () => render(<ColorSchemeToggle />, { wrapper: ({ children }) => <Provider store={createStore()}>{children}</Provider> });

describe('ColorSchemeToggle', () => {
  beforeEach(() => {
    window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
  });

  it('접근명과 aria-pressed 로 현재 밝기를 알린다 (색 단서에 의존하지 않는다)', () => {
    renderToggle();

    const toggle = screen.getByRole('button', { name: '다크 모드' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('title', '다크 모드로 바꿉니다');
  });

  it('누르면 다크로 바뀌고 저장되며, 다시 누르면 라이트로 돌아온다', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: '다크 모드' }));

    const toggle = screen.getByRole('button', { name: '다크 모드' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('title', '라이트 모드로 바꿉니다');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: '다크 모드' })).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light');
  });

  it('저장된 다크 선호를 그대로 눌린 상태로 보여준다', () => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    renderToggle();

    expect(screen.getByRole('button', { name: '다크 모드' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('🔒 색 프리셋을 고르는 진입점을 만들지 않는다 — 버튼 하나가 전부다', () => {
    renderToggle();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
});
