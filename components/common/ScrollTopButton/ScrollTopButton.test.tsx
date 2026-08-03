import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrollTopButton } from './index';

/**
 * "맨 위로" 버튼의 계약.
 *
 * 이 부품이 지키는 것은 **모양이 아니라 세 가지 행동**이다: ①짧은 문서에서는 아예 없다
 * ②누르면 맨 위로 간다 ③사라지기 전에 포커스를 넘긴다. 셋 중 하나라도 조용히 죽으면
 * 키보드·스크린리더 사용자가 "사라진 요소"에 남는다.
 *
 * jsdom 은 스크롤을 계산하지 않으므로 `window.scrollY` 를 직접 세워 사건을 만든다 —
 * 이 부품이 판정을 순수 함수(`ScrollTopButton.utils.ts`)로 뽑아 둔 덕에 가능한 검증이다.
 */

/** jsdom 의 `scrollY` 는 읽기 전용이라 정의를 갈아 끼운다. 값을 세운 뒤 스크롤 이벤트를 흘린다. */
const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
};

afterEach(() => {
  scrollTo(0);
  vi.restoreAllMocks();
});

describe('ScrollTopButton', () => {
  it('첫 화면(임계 아래)에서는 렌더 자체를 하지 않는다 — 숨김이 아니라 부재다', () => {
    render(<ScrollTopButton focusRef={createRef<HTMLElement>()} />);

    expect(screen.queryByRole('button', { name: '맨 위로' })).not.toBeInTheDocument();
  });

  it('뷰포트 한 개분을 내려가면 나타난다', () => {
    render(<ScrollTopButton focusRef={createRef<HTMLElement>()} />);

    scrollTo(window.innerHeight);

    expect(screen.getByRole('button', { name: '맨 위로' })).toBeInTheDocument();
  });

  it('다시 위로 올라오면 사라진다', () => {
    render(<ScrollTopButton focusRef={createRef<HTMLElement>()} />);
    scrollTo(window.innerHeight);
    expect(screen.getByRole('button', { name: '맨 위로' })).toBeInTheDocument();

    scrollTo(0);

    expect(screen.queryByRole('button', { name: '맨 위로' })).not.toBeInTheDocument();
  });

  it('누르면 문서 맨 위로 이동한다', async () => {
    const user = userEvent.setup();
    const scrollSpy = vi.fn();
    // jsdom 은 scrollTo 를 구현하지 않는다("not implemented" 경고만 낸다) — 호출을 직접 본다.
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollSpy as typeof window.scrollTo);

    render(<ScrollTopButton focusRef={createRef<HTMLElement>()} />);
    scrollTo(window.innerHeight);
    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  /**
   * 🔴 이 부품의 가장 중요한 계약. 버튼은 누르는 즉시 임계 아래로 내려가 **스스로 사라지므로**,
   * 포커스를 넘기지 않으면 키보드 사용자는 사라진 요소에 남는다.
   * `preventScroll` 은 브라우저가 대상으로 즉시 점프해 부드러운 스크롤을 무의미하게 만드는 것을 막는다.
   */
  it('누르면 호출부가 지정한 요소로 포커스를 넘긴다 (preventScroll)', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'scrollTo').mockImplementation(vi.fn() as typeof window.scrollTo);

    const target = document.createElement('h1');
    target.tabIndex = -1;
    target.textContent = '문서 제목';
    document.body.appendChild(target);
    const focusSpy = vi.spyOn(target, 'focus');

    render(<ScrollTopButton focusRef={{ current: target }} />);
    scrollTo(window.innerHeight);
    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(target);

    target.remove();
  });
});
