import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultPayload,
  deletePersistedAppStateByName,
  listPersistedStateNames,
  readPersistedAppState,
  readPersistedAppStateByName,
  recoverCorruptedPortfolioDb,
  writePersistedAppState,
  writePersistedAppStateByName,
  type PersistedAppStatePayload
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

const PORTFOLIO_DB_NAME = 'snowball-income-db';
const SAVED_NAME = '내 포트폴리오';

const buildProfile = (): TickerProfile => ({
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  dividendYield: 3.6,
  // 정합 모델의 고정점: dividendGrowth === expectedTotalReturn - dividendYield.
  // 이렇게 두어야 normalize 를 한 번 더 통과해도 값이 바뀌지 않는다.
  dividendGrowth: 6.4,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
});

/** 사용자가 실제로 저장했을 법한, 티커가 들어 있는 페이로드. */
const buildUserPayload = (savedName?: string): PersistedAppStatePayload => {
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
    scenarios: base.scenarios.map((scenario) => ({ ...scenario, portfolio })),
    savedName
  };
};

const deletePortfolioDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

/**
 * IndexedDB `open` 이 실패하는 상황을 흉내낸다.
 * 실제 사례: 다른 탭이 버전 업그레이드를 막고 있음(blocked), 용량 초과, 사파리 ITP, 프라이빗 모드.
 * 이런 **일시적** 오류에서 사용자 데이터가 지워지면 안 된다.
 */
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

/** 저장된 데이터가 그대로 살아 있는지 (삭제되지 않았는지) 확인한다. */
const expectUserDataSurvived = async () => {
  const names = await listPersistedStateNames();
  expect(names.map((item) => item.name)).toContain(SAVED_NAME);

  const named = await readPersistedAppStateByName(SAVED_NAME);
  expect(named?.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);

  const autosaved = await readPersistedAppState();
  expect(autosaved.ok).toBe(true);
  expect(autosaved.payload.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);
};

const seedUserData = async () => {
  await writePersistedAppState(buildUserPayload());
  await writePersistedAppStateByName(SAVED_NAME, buildUserPayload(SAVED_NAME));
};

beforeEach(async () => {
  vi.restoreAllMocks();
  await deletePortfolioDb();
  await seedUserData();
});

describe('appStateStorage: 정상 경로', () => {
  it('저장한 상태를 다시 읽어온다', async () => {
    const result = await readPersistedAppState();

    expect(result.ok).toBe(true);
    expect(result.payload.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD']);
  });

  it('이름 슬롯을 나열하고 삭제한다', async () => {
    expect((await listPersistedStateNames()).map((item) => item.name)).toEqual([SAVED_NAME]);

    expect(await deletePersistedAppStateByName(SAVED_NAME)).toBe(true);
    expect(await listPersistedStateNames()).toEqual([]);
  });
});

describe('appStateStorage: IO 실패는 사용자 데이터를 지우지 않는다', () => {
  it('읽기 실패 시 기본 페이로드를 돌려주되 저장된 데이터는 남는다', async () => {
    const result = await withFailingIndexedDb(() => readPersistedAppState());

    // 앱은 계속 동작해야 하므로 기본값을 돌려준다.
    expect(result.payload.portfolio.tickerProfiles).toEqual([]);
    // 다만 실패 사실을 호출자가 알 수 있어야 한다.
    expect(result.ok).toBe(false);

    // 핵심: DB 를 지우지 않았다.
    await expectUserDataSurvived();
  });

  it('목록 조회 실패를 빈 목록으로 위장하지 않고 전파한다', async () => {
    await expect(withFailingIndexedDb(() => listPersistedStateNames())).rejects.toThrow();

    await expectUserDataSurvived();
  });

  it('이름 슬롯 읽기 실패를 전파하고 데이터를 남긴다', async () => {
    await expect(withFailingIndexedDb(() => readPersistedAppStateByName(SAVED_NAME))).rejects.toThrow();

    await expectUserDataSurvived();
  });

  it('쓰기 실패를 조용히 삼키지 않고 전파하며 기존 데이터를 남긴다', async () => {
    await expect(
      withFailingIndexedDb(() => writePersistedAppStateByName('다른 이름', buildUserPayload('다른 이름')))
    ).rejects.toThrow();

    await expectUserDataSurvived();
  });

  it('자동 저장 실패를 전파하며 직전 자동 저장 레코드를 남긴다', async () => {
    await expect(withFailingIndexedDb(() => writePersistedAppState(buildUserPayload()))).rejects.toThrow();

    await expectUserDataSurvived();
  });

  it('삭제 실패를 전파하며 대상 데이터를 남긴다', async () => {
    await expect(withFailingIndexedDb(() => deletePersistedAppStateByName(SAVED_NAME))).rejects.toThrow();

    await expectUserDataSurvived();
  });
});

describe('recoverCorruptedPortfolioDb: 명시적 복구만 삭제할 수 있다', () => {
  it('삭제 전에 기존 데이터를 JSON 으로 백업해서 돌려준다', async () => {
    const recovery = await recoverCorruptedPortfolioDb();

    expect(recovery.deleted).toBe(true);
    expect(recovery.backupJson).toBeTruthy();
    // 백업에는 지워지기 전의 사용자 데이터가 들어 있다.
    expect(recovery.backupJson).toContain(SAVED_NAME);
    expect(recovery.backupJson).toContain('SCHD');

    // 명시적으로 호출했으므로 이번에는 실제로 지워진다.
    expect(await listPersistedStateNames()).toEqual([]);
  });
});
