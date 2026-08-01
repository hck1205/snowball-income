import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESULT_CAPTURE_ROOT_ATTRIBUTE } from '@/pages/Main/hooks';

/**
 * 🔴 **연출이 도는 중에는 찍지 않는다.**
 *
 * 첫 결과 등장 연출(W3)은 카드를 `opacity: 0` 에서 밀어 올린다(`animation-fill-mode: backwards`).
 * 그 도중에 직렬화하면 아직 안 나타난 카드가 **투명한 채로 그림에 박힌다** — 실브라우저 실측
 * (2026-07-31, 390px · 8칸): 연출 중 저장한 PNG 의 잉크 픽셀 **1.05%** ↔ 연출 후 **74.67%**.
 * 사용자가 결과를 보자마자 저장을 누르면 정확히 이 창에 들어간다.
 *
 * ⚠ **다른 대기로는 못 잡는다.** 이 연출은 `opacity`/`transform` 만 바꿔 `scrollHeight` 가 변하지
 *   않으므로 `waitForStableHeight` 는 첫 프레임에 게이트를 연다. 폰트·이미지 대기도 이미 끝나 있다.
 *   그래서 "대기를 다 했는데 빈 그림"이라는 형태로 나타난다.
 *
 * jsdom 은 그림을 검증할 수 없다 — 여기서 잠그는 것은 **순서 계약** 하나다:
 * *돌고 있는 애니메이션이 끝나기 전에는 래스터라이저를 부르지 않는다.*
 */

const domToBlob = vi.fn(async () => new Blob(['png']));
vi.mock('modern-screenshot', () => ({ domToBlob: (...args: unknown[]) => domToBlob(...(args as [])) }));

type Deferred = { promise: Promise<void>; resolve: () => void };

const defer = (): Deferred => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

/** 진행 중인 유한 애니메이션 하나를 가진 캡처 루트. */
const mountTarget = (animation: { finished: Promise<void>; iterations: number } | null) => {
  const target = document.createElement('div');
  target.setAttribute(RESULT_CAPTURE_ROOT_ATTRIBUTE, '');
  Object.defineProperty(target, 'getAnimations', {
    configurable: true,
    value: () =>
      animation === null
        ? []
        : [{ finished: animation.finished, effect: { getComputedTiming: () => ({ iterations: animation.iterations }) } }]
  });
  document.body.appendChild(target);
  return target;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  domToBlob.mockClear();
  // 다운로드 경로는 jsdom 에 없다 — 이 테스트의 관심사가 아니므로 최소한만 세운다.
  URL.createObjectURL = vi.fn(() => 'blob:stub');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('결과 이미지 저장 — 연출이 끝나기 전에는 찍지 않는다', () => {
  it('🔴 애니메이션이 도는 동안에는 래스터라이저를 부르지 않는다', async () => {
    const running = defer();
    mountTarget({ finished: running.promise, iterations: 1 });

    const { captureResultImage } = await import('@/pages/Main/hooks/interaction/resultCapturePipeline');
    const capture = captureResultImage({ scenarioName: '내 배당 계획' });

    // 다른 대기(폰트·이미지·높이 안정)는 이 사이에 전부 통과한다 — 그런데도 찍히면 안 된다.
    await sleep(250);
    expect(domToBlob).not.toHaveBeenCalled();

    running.resolve();
    await capture;

    expect(domToBlob).toHaveBeenCalledTimes(1);
  });

  it('돌고 있는 애니메이션이 없으면 기다리지 않는다', async () => {
    mountTarget(null);

    const { captureResultImage } = await import('@/pages/Main/hooks/interaction/resultCapturePipeline');
    await captureResultImage({ scenarioName: '내 배당 계획' });

    expect(domToBlob).toHaveBeenCalledTimes(1);
  });

  /*
   * 스켈레톤 셔머·스피너는 **끝나지 않는다.** 그것까지 기다리면 캡처가 상한(1.5초)까지 헛되이
   * 붙잡힌 뒤에야 찍힌다 — 기다릴 이유가 없는 것을 기다리면 기능이 느려질 뿐이다.
   */
  it('무한 반복 애니메이션은 기다리지 않는다(스켈레톤 셔머가 캡처를 막지 않는다)', async () => {
    const never = defer();
    mountTarget({ finished: never.promise, iterations: Number.POSITIVE_INFINITY });

    const { captureResultImage } = await import('@/pages/Main/hooks/interaction/resultCapturePipeline');
    await captureResultImage({ scenarioName: '내 배당 계획' });

    expect(domToBlob).toHaveBeenCalledTimes(1);
  });
});
