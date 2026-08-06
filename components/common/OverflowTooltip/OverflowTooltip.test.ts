import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import OverflowTooltip from './OverflowTooltip';
import { isTextClipped } from './OverflowTooltip.utils';

/**
 * "잘렸을 때만 툴팁"의 계약.
 *
 * 🔴 이 컴포넌트의 값은 **안 붙이는 쪽**에 있다. 다 보이는 글자에 같은 글자를 또 띄우면 소음이고,
 * 쓸데없는 탭 정거장까지 생긴다. 그래서 "잘리면 붙는다"보다 "안 잘리면 안 붙는다"를 먼저 잠근다.
 */

/** jsdom 은 레이아웃을 하지 않아 scroll/client 값이 전부 0 이다 — 잘림을 흉내 내려면 직접 심는다. */
const withMetrics = (element: HTMLElement, metrics: Partial<Record<'scrollWidth' | 'clientWidth' | 'scrollHeight' | 'clientHeight', number>>) => {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
  return element;
};

const measure = (metrics: Parameters<typeof withMetrics>[1]) =>
  isTextClipped(withMetrics(document.createElement('span'), metrics));

describe('isTextClipped', () => {
  it('가로로 넘치면 잘린 것이다 — 한 줄 말줄임', () => {
    expect(measure({ scrollWidth: 200, clientWidth: 120 })).toBe(true);
  });

  it('세로로 넘쳐도 잘린 것이다 — 여러 줄 자름(line-clamp)', () => {
    /* 🔴 가로만 재면 카드·표의 2줄 자름이 조용히 툴팁 없이 잘린다. */
    expect(measure({ scrollHeight: 80, clientHeight: 40 })).toBe(true);
  });

  it('딱 맞으면 잘린 것이 아니다', () => {
    expect(measure({ scrollWidth: 120, clientWidth: 120, scrollHeight: 40, clientHeight: 40 })).toBe(false);
  });

  it('1px 차이는 잘린 것으로 보지 않는다', () => {
    /* 서브픽셀 레이아웃에서 반올림 때문에 1 이 뜬다 — 그대로 믿으면 멀쩡한 글자에 툴팁이 붙는다. */
    expect(measure({ scrollWidth: 121, clientWidth: 120 })).toBe(false);
  });
});

describe('OverflowTooltip', () => {
  it('잘리지 않았으면 툴팁도 탭 정거장도 만들지 않는다', () => {
    render(createElement(OverflowTooltip, { text: '삼성전자', children: createElement('span') }));

    const node = screen.getByText('삼성전자');
    expect(node).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('전체 문자열을 그대로 그린다 — 줄임은 CSS 의 몫이다', () => {
    /* 컴포넌트가 글자를 미리 잘라 넣으면 스크린리더까지 잘린 글을 읽게 된다. */
    const long = '메타플랫폼스 클래스 A 보통주';
    render(createElement(OverflowTooltip, { text: long, children: createElement('span') }));
    expect(screen.getByText(long)).toBeInTheDocument();
  });
});
