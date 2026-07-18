import type { PersistedAppStateReadResult } from '../persistence';
import type { LocalAutosaveRead } from './cloudWorkspaceSyncEngine';

/**
 * 세션 시작 하이드레이션이 읽은 로컬 autosave **원본**(readPersistedAppState 결과)을 클라우드 sync의
 * 입력 형태(LocalAutosaveRead)로 변환한다.
 *  - 읽기 실패(ok:false) → `failed`: sync가 "읽지 못한 로컬은 덮어쓰지 않는다" 가드로 들어간다.
 *  - 성공이지만 실제 포트폴리오가 없음(빈/기본) → `payload=null`: 정본 후보가 될 수 없다(올릴 게 없음).
 */
export const toLocalAutosaveRead = (result: PersistedAppStateReadResult): LocalAutosaveRead => {
  if (!result.ok) return { status: 'failed' };
  const hasContent = result.payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);
  return {
    status: 'ok',
    payload: hasContent ? result.payload : null,
    updatedAt: hasContent ? result.updatedAt : undefined
  };
};

/**
 * 세션 시작 로컬 autosave를 **1회만 읽어** 하이드레이션과 세션시작 클라우드 sync가 공유하게 만드는 캐시.
 *
 * 왜(데이터 유실 경로 차단): 예전에는 하이드레이션(usePortfolioPersistence)과 세션시작 sync
 * (useCloudWorkspaceSync)가 로컬 IndexedDB를 **각각 독립 read**했다. 두 read가 수 ms 사이에 불일치하면
 * — 하이드레이션은 로컬 L을 성공적으로 읽어 앱을 L로 채우고 autosave 잠금을 걸지 않는데, **직후** sync의
 * read가 일시 실패(cross-tab IndexedDB blocked 등)하면 엔진이 더 오래된 클라우드 C를 apply → 잠기지 않은
 * app autosave가 120ms 뒤 로컬 L을 C로 덮어써 **더 최신이던 로컬 편집이 유실**됐다. read를 1회로 통일하면
 * 두 read의 불일치 창 자체가 사라진다("로컬을 읽지 못하면 덮어쓰지 않는다" 불변식이 app autosave 경로까지 성립).
 */
export type SessionLocalAutosaveCache = {
  /** 하이드레이션이 부른다: 실제 read를 **1회** 수행·캐시하고 원본(readPersistedAppState 결과)을 반환. */
  read: () => Promise<PersistedAppStateReadResult>;
  /** sync가 부른다: 캐시된 하이드레이션 read를 LocalAutosaveRead로 변환해 **재사용**(캐시 없으면 1회 read). */
  readForSync: () => Promise<LocalAutosaveRead>;
};

export const createSessionLocalAutosaveCache = (
  readPersistedAppState: () => Promise<PersistedAppStateReadResult>
): SessionLocalAutosaveCache => {
  let cached: PersistedAppStateReadResult | null = null;
  const readOnce = async (): Promise<PersistedAppStateReadResult> => {
    if (!cached) cached = await readPersistedAppState();
    return cached;
  };
  return {
    read: readOnce,
    readForSync: async () => toLocalAutosaveRead(await readOnce())
  };
};
