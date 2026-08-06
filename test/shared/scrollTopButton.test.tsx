import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useRef } from 'react';
import { ScrollTopButton } from '@/components/common';
import { restoreMatchMedia, stubReducedMotion } from '../helpers';

/**
 * 글 상세 "맨 위로" 버튼의 계약.
 *
 * 무거운 이웃(댓글·시나리오 미리보기)만 갈아끼우고 **버튼은 진짜를 쓴다** — 이 테스트가 지키려는 것
 * 중 하나가 "포커스가 글 제목으로 간다"이고, 그 배선은 상세 뷰가 ref 를 넘겨야만 성립하기 때문이다.
 *
 * ⚠ jsdom 은 실제로 스크롤하지 않는다. `window.scrollY` 를 직접 세우고 scroll 이벤트를 쏴서
 * "사용자가 스크롤했다"를 만든다. 임계는 뷰포트 높이(jsdom 기본 768) 기준이다.
 */
const TITLE = '내 배당 포트폴리오';

/**
 * 하니스 — 셸이 하는 일을 그대로 축소해 재현한다: 문서 맨 위의 포커스 앵커 + 버튼.
 * 🔴 2026-08-06 에 이 버튼이 **앱 셸(RootLayout)로 올라갔다** — 긴 화면이 커뮤니티 상세만이
 * 아니어서다(티커 상세·배당 목록·가이드…). 그래서 이 계약도 페이지가 아니라 **부품**의 것이 됐다.
 */
function Harness() {
  const anchorRef = useRef<HTMLDivElement>(null);
  return (
    <MemoryRouter>
      <div ref={anchorRef} tabIndex={-1} data-testid="top-anchor" />
      <p>{TITLE}</p>
      <ScrollTopButton focusRef={anchorRef} />
    </MemoryRouter>
  );
}

const renderView = () => render(<Harness />);

/** 사용자가 y 픽셀까지 스크롤한 상태를 만든다. */
const scrollWindowTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  fireEvent.scroll(window);
};

const scrollTopButton = () => screen.queryByRole('button', { name: '맨 위로' });

let scrollToSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom 의 scrollTo 는 "not implemented" 를 뱉는다 — 호출 인자를 보기 위해서도 스파이가 필요하다.
  scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
});

afterEach(() => {
  scrollToSpy.mockRestore();
  restoreMatchMedia();
});

describe('맨 위로 버튼 (앱 셸이 전 라우트에 그린다)', () => {
  it('처음에는 없다 — 짧은 글에서 방해가 되면 안 된다', () => {
    renderView();

    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('뷰포트 1개분을 채 못 내려가면 아직 나오지 않는다', () => {
    renderView();

    scrollWindowTo(window.innerHeight - 1);

    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('뷰포트 1개분을 내려가면 나타나고, 다시 위로 오면 사라진다', () => {
    renderView();

    scrollWindowTo(window.innerHeight);
    expect(scrollTopButton()).toBeInTheDocument();

    scrollWindowTo(0);
    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('누르면 문서 맨 위로 부드럽게 올라간다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  /** 🔴 버튼은 이동 직후 사라진다 — 포커스를 그대로 두면 키보드 사용자가 문서 어디에 있는지 잃는다. */
  it('누른 뒤 포커스는 호출부가 지정한 앵커로 옮겨간다 — 사라질 버튼에 남겨두지 않는다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(screen.getByTestId('top-anchor')).toHaveFocus();
  });

  it('🔴 모션을 줄이는 설정이면 즉시 이동한다 — 전역 CSS 리셋은 JS 스크롤을 못 막는다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);
    stubReducedMotion();

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
