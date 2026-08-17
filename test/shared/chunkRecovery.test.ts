import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storageKey } from '@/shared/lib/storage';
import {
  clearChunkReloadMark,
  isChunkLoadError,
  reloadOnceForChunkError
} from '@/shared/lib/chunkRecovery';

/**
 * 배포 스큐 복구의 계약.
 *
 * 🔴 이 파일이 있는 이유는 실제 사고다(2026-08-07). 새 배포로 lazy 청크 해시가 바뀌자 이미 열려
 * 있던 탭이 없는 파일을 가져오려다 실패했고, react-router 의 기본 에러 화면이 앱을 통째로 덮었다
 * ("Unexpected Application Error! / Failed to fetch dynamically imported module").
 *
 * 🔴 **이 결함은 배포해 봐야만 드러난다** — 로컬 dev 는 해시가 바뀌지 않아 재현되지 않고,
 * 렌더 테스트도 볼 수 없다. 그래서 여기서 **판정과 루프 방지**를 직접 잠근다.
 */
const RELOAD_MARK = storageKey('chunk-reload');

let reloadSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  window.sessionStorage.clear();
  reloadSpy = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadSpy }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe('청크 오류 판정 — 브라우저마다 문구가 다르다', () => {
  it.each([
    ['크롬/파이어폭스', new Error('Failed to fetch dynamically imported module: https://x/assets/a-123.js')],
    ['다른 표현', new Error('error loading dynamically imported module')],
    ['사파리', new Error('Importing a module script failed.')],
    ['웹팩류 이름', new Error('ChunkLoadError: Loading chunk 3 failed.')],
    ['문자열로 온 경우', 'Failed to fetch dynamically imported module']
  ])('%s 를 청크 오류로 본다', (_label, reason) => {
    expect(isChunkLoadError(reason)).toBe(true);
  });

  /** ⚠ 아무 오류나 새로고침으로 덮으면 진짜 버그가 "가끔 새로고침되는 화면"으로 숨는다. */
  it.each([
    ['평범한 런타임 오류', new Error("Cannot read properties of undefined (reading 'map')")],
    ['네트워크 오류', new Error('Failed to fetch')],
    ['빈 값', null],
    ['숫자', 42]
  ])('%s 는 청크 오류가 아니다', (_label, reason) => {
    expect(isChunkLoadError(reason)).toBe(false);
  });
});

describe('한 번만 새로고침한다', () => {
  it('첫 호출은 새로고침한다', () => {
    expect(reloadOnceForChunkError()).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * 🔴 이 단정이 이 파일에서 가장 중요하다. 조건 없이 새로고침하면 청크가 **정말로** 없는 경우
   * (자산 배포 실패·네트워크 차단) 무한 새로고침 루프가 된다 — 원래 증상보다 훨씬 나쁘다.
   */
  it('두 번째부터는 새로고침하지 않는다 — 무한 루프를 만들지 않는다', () => {
    reloadOnceForChunkError();
    reloadSpy.mockClear();

    expect(reloadOnceForChunkError()).toBe(false);
    expect(reloadOnceForChunkError()).toBe(false);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('표식은 sessionStorage 에 남는다 — 탭을 닫으면 사라져야 한다', () => {
    reloadOnceForChunkError();
    expect(window.sessionStorage.getItem(RELOAD_MARK)).toBe('1');
  });

  /**
   * ⚠ 표식을 안 지우면 **탭 수명 동안 복구가 한 번뿐**이라, 하루에 두 번 배포하면 두 번째는 못 산다.
   * 실제로 2026-08-07 에 배포를 두 번 했다.
   */
  it('앱이 정상으로 뜨면 표식을 지워 다음 배포에서 또 복구할 수 있다', () => {
    reloadOnceForChunkError();
    clearChunkReloadMark();
    reloadSpy.mockClear();

    expect(reloadOnceForChunkError()).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
