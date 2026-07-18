import {
  buildStoreRecord,
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  PORTFOLIO_STATE_KEY,
  resolveNextSavedName,
  type PersistedAppStatePayload
} from '@/jotai';

const payload: PersistedAppStatePayload = {
  portfolio: EMPTY_PORTFOLIO_STATE,
  investmentSettings: EMPTY_INVESTMENT_SETTINGS,
  scenarios: [{ id: 'a', name: 'A', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS }],
  activeScenarioId: 'a'
};

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
    const record = buildStoreRecord('snapshot:내 저장', payload, '내 저장', 1_700_000_000_000);

    expect(record).toEqual({
      key: 'snapshot:내 저장',
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
