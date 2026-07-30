import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { createElement, forwardRef } from 'react';
import { vi } from 'vitest';

/*
 * jsdom 환경 전용 준비물. `test/setup.ts` 가 DOM 이 있을 때만 이 파일을 로드한다 —
 * 아래 코드는 모듈 최상위에서 window·HTMLElement 를 만지므로 node 환경에서는 즉시 터진다.
 */

/*
 * findBy·waitFor 기본 1초는 전체 스위트(워커 병렬)에서 이벤트 루프가 밀리면 모자란다 —
 * 단독 실행은 통과하고 전체 실행에서만 다이얼로그/라이브리전 대기가 번갈아 타임아웃되는
 * 플레이크가 반복됐다(displayCurrencyPropagation·dividendCalendarPage.behavior 실측).
 * 진짜 실패는 어차피 실패한다 — 늦게 보고될 뿐이라 상향이 안전하다.
 */
configure({ asyncUtilTimeout: 4000 });

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserver;

class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  configurable: true,
  value: IntersectionObserver
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 900
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 320
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({
    x: 0,
    y: 0,
    width: 900,
    height: 320,
    top: 0,
    right: 900,
    bottom: 320,
    left: 0,
    toJSON: () => ''
  })
});

vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: forwardRef<HTMLDivElement>((_props, ref) => createElement('div', { 'data-testid': 'echart', ref }))
}));
