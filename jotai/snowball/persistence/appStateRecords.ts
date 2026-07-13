import type { PersistedAppStatePayload } from '../types';
import { sanitizeSavedName, type PersistedAppState } from './appStateNormalize';

export const PORTFOLIO_STATE_KEY = 'yield_architect_portfolio';
export const SNAPSHOT_KEY_PREFIX = 'snapshot:';

export type PortfolioStoreRecord = {
  key: string;
  value: PersistedAppState;
  updatedAt: number;
};

export type SavedStateSummary = {
  name: string;
  updatedAt: number;
};

/** 이름 슬롯의 IndexedDB 키를 만든다. 공백만 있는 이름은 저장 대상이 아니므로 null. */
export const toSnapshotKey = (rawName: string): string | null => {
  const trimmedName = rawName.trim();
  if (!trimmedName) return null;
  return `${SNAPSHOT_KEY_PREFIX}${trimmedName}`;
};

/** 저장 목록 요약: snapshot 레코드만 골라 이름/시각을 정리하고 최신순 정렬. */
export const toSavedStateSummaries = (records: readonly PortfolioStoreRecord[]): SavedStateSummary[] =>
  records
    .filter((record) => record.key.startsWith(SNAPSHOT_KEY_PREFIX))
    .map((record) => ({
      name: sanitizeSavedName(record.value?.savedName) ?? record.key.slice(SNAPSHOT_KEY_PREFIX.length),
      updatedAt: Number.isFinite(record.updatedAt) ? record.updatedAt : 0
    }))
    .filter((item) => item.name.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

/** 자동 저장 시 savedName 병합 규칙: 새 이름이 있으면 그것, 없으면 이전 이름을 유지한다. */
export const resolveNextSavedName = (previousSavedName: unknown, nextSavedName: unknown): string | undefined =>
  sanitizeSavedName(nextSavedName) ?? sanitizeSavedName(previousSavedName);

/** IndexedDB에 넣을 레코드를 만든다. `now`를 주입받아 결정적으로 동작한다. */
export const buildStoreRecord = (
  key: string,
  state: PersistedAppStatePayload,
  savedName: string | undefined,
  now: number
): PortfolioStoreRecord => ({
  key,
  value: {
    ...state,
    savedName
  },
  updatedAt: now
});
