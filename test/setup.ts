import '@testing-library/jest-dom';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserver;

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
