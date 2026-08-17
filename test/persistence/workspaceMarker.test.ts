import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultPayload,
  hasStoredWorkspace,
  markWorkspaceStored,
  readPersistedAppState,
  recoverCorruptedPortfolioDb,
  writePersistedAppState,
  type PersistedAppStatePayload
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import { storageKey } from '@/shared/lib/storage';

/**
 * 랜딩(`/`)이 "이어서 계산하기"를 띄울지 판단하는 **localStorage 부기 마커**의 계약.
 * 저장 포맷(영속 payload·공유 URL)과 무관하다 — 여기서 단정하는 것은 마커의 수명뿐이다.
 */
const PORTFOLIO_DB_NAME = 'snowball-income-db';
const HAS_WORKSPACE_KEY = storageKey('has-workspace');

const buildProfile = (): TickerProfile => ({
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  dividendYield: 3.6,
  dividendGrowth: 6.4,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
});

const buildUserPayload = (): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile = buildProfile();
  const portfolio = {
    tickerProfiles: [profile],
    includedTickerIds: [profile.id],
    weightByTickerId: { [profile.id]: 100 },
    fixedByTickerId: { [profile.id]: false },
    selectedTickerId: profile.id
  };

  return {
    ...base,
    portfolio,
    scenarios: base.scenarios.map((scenario) => ({ ...scenario, portfolio }))
  };
};

const deletePortfolioDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

/** IndexedDB `open` 이 실패하는 상황(프라이빗 모드·쿼터 초과·다른 탭 blocked). */
const withFailingIndexedDb = async <T>(run: () => Promise<T>): Promise<T> => {
  const spy = vi.spyOn(window.indexedDB, 'open').mockImplementation(() => {
    const request = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      onblocked: null,
      error: new Error('QuotaExceededError'),
      result: undefined
    } as unknown as IDBOpenDBRequest;

    queueMicrotask(() => {
      request.onerror?.(new Event('error') as unknown as Event & { target: IDBRequest });
    });

    return request;
  });

  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
};

beforeEach(async () => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  await deletePortfolioDb();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('워크스페이스 마커: 저장/삭제 경로에 따라붙는다', () => {
  it('처음 방문한 브라우저에는 마커가 없다', () => {
    expect(hasStoredWorkspace()).toBe(false);
  });

  it('자동 저장이 성공하면 마커가 생긴다', async () => {
    await writePersistedAppState(buildUserPayload());

    expect(hasStoredWorkspace()).toBe(true);
  });

  it('저장이 실패하면 마커를 남기지 않는다', async () => {
    await expect(withFailingIndexedDb(() => writePersistedAppState(buildUserPayload()))).rejects.toThrow();

    expect(hasStoredWorkspace()).toBe(false);
  });

  it('명시적 복구로 DB 를 비우면 마커도 사라진다', async () => {
    await writePersistedAppState(buildUserPayload());
    expect(hasStoredWorkspace()).toBe(true);

    const recovery = await recoverCorruptedPortfolioDb();

    expect(recovery.deleted).toBe(true);
    expect(hasStoredWorkspace()).toBe(false);
  });
});

describe('워크스페이스 마커: 하위 호환 — 마커가 없어도 데이터는 그대로 열린다', () => {
  it('마커 없이 저장된 기존 사용자의 데이터를 읽을 수 있고, 다음 저장에서 마커가 백필된다', async () => {
    // 마커 배선 이전에 저장된 사용자 = DB 에는 데이터, localStorage 에는 아무것도 없음.
    await writePersistedAppState(buildUserPayload());
    window.localStorage.removeItem(HAS_WORKSPACE_KEY);
    expect(hasStoredWorkspace()).toBe(false);

    // 마커 부재가 로드를 막지 않는다.
    const loaded = await readPersistedAppState();
    expect(loaded.ok).toBe(true);
    expect(loaded.payload.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);

    // 다음 저장이 마커를 백필한다.
    await writePersistedAppState(loaded.payload);
    expect(hasStoredWorkspace()).toBe(true);
  });
});

describe('워크스페이스 마커: localStorage 를 못 쓰는 환경', () => {
  it('읽기가 throw 해도 앱이 죽지 않고 false 를 돌려준다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    expect(() => hasStoredWorkspace()).not.toThrow();
    expect(hasStoredWorkspace()).toBe(false);
  });

  it('localStorage 접근 자체가 throw 해도(사파리 프라이빗) 읽기/쓰기가 앱을 죽이지 않는다', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      }
    });

    try {
      expect(hasStoredWorkspace()).toBe(false);
      expect(() => markWorkspaceStored()).not.toThrow();
      // 저장 자체는 마커와 무관하게 계속 성공해야 한다.
      await expect(writePersistedAppState(buildUserPayload())).resolves.toBeUndefined();
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
      else Reflect.deleteProperty(window, 'localStorage');
    }
  });

  it('쓰기가 throw 해도(쿼터 초과) 저장 경로가 예외를 흘리지 않는다', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    await expect(writePersistedAppState(buildUserPayload())).resolves.toBeUndefined();

    const loaded = await readPersistedAppState();
    expect(loaded.payload.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);
  });
});
