import { describe, expect, it } from 'vitest';
import { readCloudSavedAt, stampCloudAutosave } from '@/jotai/snowball/cloud';
import { buildDefaultPayload, isSamePersistedPayload, normalizePersistedAppState } from '@/jotai';

/**
 * 클라우드 autosave 타임스탬프 심기/읽기 헬퍼 — latest-wins 비교의 근거.
 *
 * 최우선 불변식: savedAt은 **전송 전용 메타**라 정규화가 버려야 한다. 그래야 매 저장마다 savedAt이 달라져도
 * no-op 게이트(isSamePersistedPayload)가 "영원히 다름"으로 무력화되지 않는다.
 */

describe('stampCloudAutosave / readCloudSavedAt — 왕복', () => {
  it('payload에 savedAt을 심고 raw에서 다시 읽는다', () => {
    const stamped = stampCloudAutosave(buildDefaultPayload(), 1_700_000_000_000);
    expect(stamped.savedAt).toBe(1_700_000_000_000);
    expect(readCloudSavedAt(stamped)).toBe(1_700_000_000_000);
  });

  it('savedAt이 없거나 유한한 숫자가 아니면 undefined(구버전·오염 방어)', () => {
    expect(readCloudSavedAt(buildDefaultPayload())).toBeUndefined();
    expect(readCloudSavedAt({ savedAt: 'nope' })).toBeUndefined();
    expect(readCloudSavedAt({ savedAt: Number.NaN })).toBeUndefined();
    expect(readCloudSavedAt({ savedAt: Number.POSITIVE_INFINITY })).toBeUndefined();
    expect(readCloudSavedAt(null)).toBeUndefined();
    expect(readCloudSavedAt(undefined)).toBeUndefined();
  });
});

describe('savedAt은 정규화가 버린다 → no-op 게이트가 무력화되지 않는다', () => {
  it('정규화 출력에는 savedAt 키가 없다', () => {
    const normalized = normalizePersistedAppState(stampCloudAutosave(buildDefaultPayload(), 42));
    expect('savedAt' in normalized).toBe(false);
    expect(readCloudSavedAt(normalized)).toBeUndefined();
  });

  it('savedAt만 다르고 내용이 같으면 정규화 후 isSamePersistedPayload가 같다고 본다', () => {
    const a = normalizePersistedAppState(stampCloudAutosave(buildDefaultPayload(), 1000));
    const b = normalizePersistedAppState(stampCloudAutosave(buildDefaultPayload(), 9999));
    expect(isSamePersistedPayload(a, b)).toBe(true);
  });
});

describe('하위 호환: savedAt 없는 기존 payload 왕복', () => {
  it('savedAt 없는 payload도 정규화/왕복돼 그대로 열린다', () => {
    const legacy = buildDefaultPayload();
    const roundTripped = normalizePersistedAppState(JSON.parse(JSON.stringify(legacy)));
    expect(isSamePersistedPayload(legacy, roundTripped)).toBe(true);
    expect(readCloudSavedAt(roundTripped)).toBeUndefined();
  });
});
