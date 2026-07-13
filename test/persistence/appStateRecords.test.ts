import {
  buildStoreRecord,
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  PORTFOLIO_STATE_KEY,
  resolveNextSavedName,
  SNAPSHOT_KEY_PREFIX,
  toSavedStateSummaries,
  toSnapshotKey,
  type PersistedAppStatePayload,
  type PortfolioStoreRecord
} from '@/jotai';

const payload: PersistedAppStatePayload = {
  portfolio: EMPTY_PORTFOLIO_STATE,
  investmentSettings: EMPTY_INVESTMENT_SETTINGS,
  scenarios: [{ id: 'a', name: 'A', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS }],
  activeScenarioId: 'a'
};

const buildRecord = (key: string, savedName: string | undefined, updatedAt: number): PortfolioStoreRecord => ({
  key,
  value: {
    portfolio: EMPTY_PORTFOLIO_STATE,
    investmentSettings: EMPTY_INVESTMENT_SETTINGS,
    savedName
  },
  updatedAt
});

describe('toSnapshotKey', () => {
  it('trim 후 snapshot: prefix를 붙인다', () => {
    expect(toSnapshotKey('  내 저장  ')).toBe(`${SNAPSHOT_KEY_PREFIX}내 저장`);
  });

  it('빈 이름/공백뿐인 이름이면 null', () => {
    expect(toSnapshotKey('')).toBeNull();
    expect(toSnapshotKey('    ')).toBeNull();
  });
});

describe('toSavedStateSummaries', () => {
  it('snapshot 레코드만 남기고 최신순으로 정렬한다', () => {
    const summaries = toSavedStateSummaries([
      buildRecord(PORTFOLIO_STATE_KEY, '자동저장', 999),
      buildRecord(`${SNAPSHOT_KEY_PREFIX}old`, 'old', 100),
      buildRecord(`${SNAPSHOT_KEY_PREFIX}new`, 'new', 300),
      buildRecord(`${SNAPSHOT_KEY_PREFIX}mid`, 'mid', 200)
    ]);

    expect(summaries).toEqual([
      { name: 'new', updatedAt: 300 },
      { name: 'mid', updatedAt: 200 },
      { name: 'old', updatedAt: 100 }
    ]);
  });

  it('savedName이 없으면 키에서 이름을 복원한다', () => {
    const summaries = toSavedStateSummaries([buildRecord(`${SNAPSHOT_KEY_PREFIX}복구된 이름`, undefined, 1)]);
    expect(summaries).toEqual([{ name: '복구된 이름', updatedAt: 1 }]);
  });

  it('savedName이 공백뿐이면 키 이름으로 폴백한다', () => {
    const summaries = toSavedStateSummaries([buildRecord(`${SNAPSHOT_KEY_PREFIX}key-name`, '   ', 1)]);
    expect(summaries).toEqual([{ name: 'key-name', updatedAt: 1 }]);
  });

  it('이름을 복원할 수 없는 레코드(prefix만 있는 키)는 버린다', () => {
    expect(toSavedStateSummaries([buildRecord(SNAPSHOT_KEY_PREFIX, undefined, 1)])).toEqual([]);
  });

  it('updatedAt이 유한하지 않으면 0으로 본다', () => {
    const summaries = toSavedStateSummaries([buildRecord(`${SNAPSHOT_KEY_PREFIX}a`, 'a', Number.NaN)]);
    expect(summaries).toEqual([{ name: 'a', updatedAt: 0 }]);
  });

  it('입력 배열을 변형하지 않는다', () => {
    const records = [
      buildRecord(`${SNAPSHOT_KEY_PREFIX}a`, 'a', 1),
      buildRecord(`${SNAPSHOT_KEY_PREFIX}b`, 'b', 2)
    ];
    const snapshot = [...records];

    toSavedStateSummaries(records);

    expect(records).toEqual(snapshot);
  });
});

describe('resolveNextSavedName', () => {
  it('새 이름이 있으면 새 이름을 쓴다', () => {
    expect(resolveNextSavedName('이전', '새 이름')).toBe('새 이름');
  });

  it('새 이름이 없으면 이전 이름을 유지한다', () => {
    expect(resolveNextSavedName('이전', undefined)).toBe('이전');
    expect(resolveNextSavedName('이전', '   ')).toBe('이전');
  });

  it('둘 다 없으면 undefined', () => {
    expect(resolveNextSavedName(undefined, undefined)).toBeUndefined();
    expect(resolveNextSavedName('  ', '')).toBeUndefined();
  });

  it('이름은 trim 된다', () => {
    expect(resolveNextSavedName(undefined, '  이름  ')).toBe('이름');
  });
});

describe('buildStoreRecord', () => {
  it('주입한 now를 updatedAt으로 쓰고 savedName을 덮어쓴다', () => {
    const record = buildStoreRecord(`${SNAPSHOT_KEY_PREFIX}내 저장`, payload, '내 저장', 1_700_000_000_000);

    expect(record).toEqual({
      key: `${SNAPSHOT_KEY_PREFIX}내 저장`,
      value: { ...payload, savedName: '내 저장' },
      updatedAt: 1_700_000_000_000
    });
  });

  it('savedName이 undefined면 undefined로 저장된다', () => {
    const record = buildStoreRecord(PORTFOLIO_STATE_KEY, payload, undefined, 1);
    expect(record.value.savedName).toBeUndefined();
  });

  it('같은 인자에 대해 항상 같은 결과 (결정적)', () => {
    expect(buildStoreRecord('k', payload, 'n', 42)).toEqual(buildStoreRecord('k', payload, 'n', 42));
  });

  it('입력 payload를 변형하지 않는다', () => {
    const original = { ...payload };
    buildStoreRecord('k', payload, '이름', 1);
    expect(payload).toEqual(original);
    expect(payload).not.toHaveProperty('savedName', '이름');
  });
});
