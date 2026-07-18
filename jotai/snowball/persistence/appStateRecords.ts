import type { PersistedAppStatePayload } from '../types';
import { sanitizeSavedName, type PersistedAppState } from './appStateNormalize';

export const PORTFOLIO_STATE_KEY = 'yield_architect_portfolio';

export type PortfolioStoreRecord = {
  key: string;
  value: PersistedAppState;
  updatedAt: number;
};

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
