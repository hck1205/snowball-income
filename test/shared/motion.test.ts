import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, scrollIntoViewSafely } from '@/shared/utils';

/**
 * 모션 선호 판정 + 안전한 스크롤 이동.
 *
 * 세 화면(티커 상세·결과 카드 CTA·투어 가이드)과 배당 캘린더의 날짜 이동이 이 두 함수에 얹혀 있다 —
 * 여기서 조용히 죽으면 "버튼이 안 먹는다"로만 보인다. 그래서 **환경이 없는 경우**(matchMedia 부재,
 * `scrollIntoView` 없는 jsdom, 대상 요소 없음)를 전부 고정한다.
 */

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia');

/** test/setup.ts 의 전역 스텁은 항상 matches:false 다 — 분기를 보려면 여기서 갈아 끼운다. */
const stubMatchMedia = (matches: boolean, onQuery?: (query: string) => void) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => {
      onQuery?.(query);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false
      };
    }
  });
};

const removeMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
};

afterEach(() => {
  if (ORIGINAL_MATCH_MEDIA) Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA);
});

describe('prefersReducedMotion', () => {
  it('reduce 선호일 때만 참이다', () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);

    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('matchMedia 가 없는 환경(SSR·구형)에서는 던지지 않고 거짓을 준다', () => {
    removeMatchMedia();

    expect(() => prefersReducedMotion()).not.toThrow();
    expect(prefersReducedMotion()).toBe(false);
  });

  it('OS 접근성 설정과 같은 질의를 쓴다', () => {
    const queries: string[] = [];
    stubMatchMedia(false, (query) => queries.push(query));

    prefersReducedMotion();

    // 오타 하나면 모든 사용자가 "reduce 아님"으로 판정된다 — 조용히 틀리는 종류의 버그다.
    expect(queries).toEqual(['(prefers-reduced-motion: reduce)']);
  });
});

describe('scrollIntoViewSafely', () => {
  const elementWithSpy = () => {
    const element = document.createElement('div');
    const scrollIntoView = vi.fn();
    element.scrollIntoView = scrollIntoView;

    return { element, scrollIntoView };
  };

  it('기본은 부드럽게 옮긴다', () => {
    stubMatchMedia(false);
    const { element, scrollIntoView } = elementWithSpy();

    scrollIntoViewSafely(element);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('reduce 선호면 애니메이션 없이 옮긴다', () => {
    // 전역 CSS 의 `scroll-behavior: auto !important` 는 JS 가 지정한 'smooth' 를 못 이긴다.
    stubMatchMedia(true);
    const { element, scrollIntoView } = elementWithSpy();

    scrollIntoViewSafely(element, { block: 'center' });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('호출부가 behavior 를 명시하면 그 값이 이긴다', () => {
    stubMatchMedia(true);
    const { element, scrollIntoView } = elementWithSpy();

    scrollIntoViewSafely(element, { behavior: 'smooth', block: 'end' });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
  });

  it('대상이 없으면 조용히 아무것도 하지 않는다', () => {
    expect(() => scrollIntoViewSafely(null)).not.toThrow();
    expect(() => scrollIntoViewSafely(undefined)).not.toThrow();
  });

  it('scrollIntoView 를 구현하지 않은 환경(jsdom)에서도 던지지 않는다', () => {
    // jsdom 은 Element.prototype.scrollIntoView 를 구현하지 않는다. 프로토타입에서 지우는 대신
    // "그 메서드가 없는 대상"을 직접 만들어, 나중에 jsdom 이 구현해도 이 계약이 공허해지지 않게 한다.
    const withoutScrollIntoView = { nodeType: 1 } as unknown as Element;

    expect(() => scrollIntoViewSafely(withoutScrollIntoView)).not.toThrow();
  });
});
