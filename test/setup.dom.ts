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
 *
 * 🔴 4초 → 8초 (2026-08-23). **같은 증상이 4초에서도 계속 났다.** 연속 세 번의 전체 실행에서
 *    서로 다른 파일이 하나씩 죽었고, 셋 다 단독 실행에서는 통과했다:
 *      dividendCalendarDayJump · tickerSaveKeepsDrawerOpen · portfolioHeroDDay
 *    사유는 전부 `Unable to find …`(= RTL 쿼리 대기 초과)였지 단정 실패가 아니었다.
 *
 *    왜 4초가 모자란가: 이 세 파일의 개별 테스트가 **단독으로도 3~5초**를 쓴다. 거기에 전체
 *    실행의 경합(실측 약 3.5배)이 얹히면 4초는 애초에 닿지 않는 한도다.
 * ⚠ `testTimeout`(vitest.config, 30초)과 **다른 한도**다 — 그쪽을 올려도 이 경로는 안 막힌다.
 *   RTL 쿼리가 먼저 포기하고 "못 찾았다"로 끝내기 때문이다. 같은 증상이 8초에서도 나면 한도를
 *   또 올리지 말고 **그 테스트가 왜 5초를 쓰는지**를 봐라(대개 전체 페이지를 렌더한다).
 */
configure({ asyncUtilTimeout: 8000 });

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
