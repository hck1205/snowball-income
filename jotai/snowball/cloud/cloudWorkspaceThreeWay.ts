import { serializeMeaningfulScenario } from '../persistence';
import type { PersistedAppStatePayload, PersistedScenarioState } from '../types';

/**
 * 워크스페이스 3-way 병합 — **탭(시나리오) 단위** 판정. 순수 함수.
 *
 * 🔴 왜 필요한가. 종전 판정은 payload **전체 문자열** 하나를 base 와 비교했다
 * (`serializeMeaningfulPayload(payload) !== base`). 그래서 A 기기가 탭1만, B 기기가 탭2만
 * 고쳐도 "양쪽 다 변함"이 되어 충돌 모달이 떴고, 선택지가 **로컬 전체 ↔ 클라우드 전체**라
 * 어느 쪽을 고르든 **반대편 편집이 통째로 사라졌다**(데이터 유실 경로).
 *
 * 탭 단위로 보면 그 대부분은 충돌이 아니다 — 겹치지 않는 편집은 **양쪽을 다 살려** 합칠 수 있고,
 * 진짜로 **같은 탭**을 양쪽에서 고친 경우에만 사람에게 물으면 된다.
 *
 * ⚠ `cloudWorkspaceReconcile` 의 `mergeWorkspaces` 를 쓰면 안 된다. 그건 사용자가 "블렌드"를
 * **고른 뒤**의 비파괴 합집합이라, 같은 id 의 내용이 다르면 무조건 "(클라우드)" 복제본을 만든다.
 * 자동 병합에서 그러면 한쪽만 바뀐 탭까지 매번 복제되어 탭이 증식한다. 여기서는 base 가 있으므로
 * "누가 바꿨는가"를 알 수 있고, 바꾼 쪽 것을 그대로 채택하면 된다.
 */

/** 탭 id → 그 탭의 "의미있는" 내용 해시. base 로 저장되는 형태. */
export type ScenarioHashMap = Readonly<Record<string, string>>;

/** payload 를 탭 id → 해시 맵으로 만든다. base 기록과 변경 판정이 같은 함수를 쓴다. */
export const toScenarioHashMap = (payload: PersistedAppStatePayload): ScenarioHashMap =>
  Object.fromEntries(payload.scenarios.map((scenario) => [scenario.id, serializeMeaningfulScenario(scenario)]));

/**
 * base 저장 형식의 버전 표식.
 *
 * base 는 **사용자 기기에 남아 있는 값**이라, 형식을 바꾸면 이미 저장된 구 형식(payload 전체
 * 문자열)을 만나게 된다. 접두사로 갈라 구 형식은 종전 경로로 넘긴다 — 판정 방식이 바뀌었다고
 * 남의 기기에 있던 기준을 무효로 만들면 그 세션은 전부 충돌 모달이 된다.
 */
const TAB_BASE_PREFIX = 'v2:';

/** 탭 단위 base 로 직렬화한다(저장용). */
export const serializeTabBase = (payload: PersistedAppStatePayload): string =>
  `${TAB_BASE_PREFIX}${JSON.stringify(toScenarioHashMap(payload))}`;

/**
 * 저장된 base 문자열을 탭 맵으로 되돌린다.
 * 구 형식(접두사 없음)·깨진 JSON 이면 `null` — 호출부가 종전 전체 비교로 폴백한다.
 */
export const parseTabBase = (base: string | undefined): ScenarioHashMap | null => {
  if (base === undefined || !base.startsWith(TAB_BASE_PREFIX)) return null;
  try {
    const parsed: unknown = JSON.parse(base.slice(TAB_BASE_PREFIX.length));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    // 값이 전부 문자열일 때만 신뢰한다 — 손상된 base 로 잘못된 "안 바뀜" 판정을 내리면 편집이 사라진다.
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (!entries.every(([, value]) => typeof value === 'string')) return null;
    return Object.fromEntries(entries) as ScenarioHashMap;
  } catch {
    return null;
  }
};

/**
 * 이 payload 가 base 에서 조금이라도 달라졌는가(추가·삭제·편집 무엇이든).
 *
 * 엔진이 **한쪽만 바뀐 순수 fast-forward** 를 종전대로 처리하기 위해 쓴다 — 그 경우는 병합할 것이
 * 없고, 굳이 병합 경로로 보내면 필요 없는 push/mirror 가 한 번 더 돈다.
 */
export const hasChangesFromBase = (base: ScenarioHashMap, payload: PersistedAppStatePayload): boolean => {
  const current = toScenarioHashMap(payload);
  const ids = new Set([...Object.keys(base), ...Object.keys(current)]);
  for (const id of ids) if (base[id] !== current[id]) return true;
  return false;
};

export type ThreeWayMergeResult =
  /** 겹치는 편집이 없어 자동 병합했다. `payload` 는 양쪽 편집을 모두 담는다. */
  | { readonly type: 'merged'; readonly payload: PersistedAppStatePayload }
  /** 같은 탭을 양쪽에서 다르게 고쳤다 — 사람에게 물어야 한다. */
  | { readonly type: 'conflict'; readonly conflictingIds: readonly string[] };

/** 한 탭이 base 대비 바뀌었는가. 없어졌으면(삭제) 그것도 변경이다. */
const changedFromBase = (base: ScenarioHashMap, current: ScenarioHashMap, id: string): boolean => {
  const before = base[id];
  const after = current[id];
  if (before === undefined) return after !== undefined; // base 에 없던 것이 생김 = 추가
  if (after === undefined) return true; // base 에 있던 것이 사라짐 = 삭제
  return before !== after;
};

/**
 * base 를 기준으로 로컬·클라우드를 탭 단위로 합친다.
 *
 * 탭 하나에 대한 판정:
 * | 로컬 | 클라우드 | 결과 |
 * |---|---|---|
 * | 안 바뀜 | 안 바뀜 | 아무 쪽이나(같다) |
 * | 바뀜 | 안 바뀜 | **로컬 채택**(삭제였다면 삭제) |
 * | 안 바뀜 | 바뀜 | **클라우드 채택**(삭제였다면 삭제) |
 * | 바뀜 | 바뀜 · 내용 같음 | 같은 결론에 도달 → 충돌 아님 |
 * | 바뀜 | 바뀜 · 내용 다름 | **충돌** |
 *
 * 순서: 로컬 순서를 유지하고, 클라우드에만 있는 탭을 뒤에 붙인다 — 사용자가 보던 탭 순서가
 * 동기화 때문에 흔들리지 않게 한다.
 *
 * 활성 탭: 로컬의 활성 탭이 살아남았으면 그대로. 아니면 첫 탭(이 기기에서 보던 맥락을 우선).
 * 최상위 `portfolio`/`investmentSettings` 는 활성 탭의 미러라 그에 맞춰 재합성한다.
 */
export const mergeWorkspacesThreeWay = (
  base: ScenarioHashMap,
  local: PersistedAppStatePayload,
  cloud: PersistedAppStatePayload
): ThreeWayMergeResult => {
  const localHashes = toScenarioHashMap(local);
  const cloudHashes = toScenarioHashMap(cloud);
  const localById = new Map(local.scenarios.map((scenario) => [scenario.id, scenario]));
  const cloudById = new Map(cloud.scenarios.map((scenario) => [scenario.id, scenario]));

  const ids = [...new Set([...local.scenarios.map((s) => s.id), ...cloud.scenarios.map((s) => s.id)])];
  const conflictingIds: string[] = [];
  /** id → 채택본. `null` 은 "삭제로 합의됨"(어느 쪽도 되살리지 않는다). */
  const resolved = new Map<string, PersistedScenarioState | null>();

  for (const id of ids) {
    const localChanged = changedFromBase(base, localHashes, id);
    const cloudChanged = changedFromBase(base, cloudHashes, id);
    const localScenario = localById.get(id) ?? null;
    const cloudScenario = cloudById.get(id) ?? null;

    if (localChanged && cloudChanged) {
      // 양쪽이 같은 결론이면(같은 편집·같은 삭제) 다툴 것이 없다.
      if (localHashes[id] === cloudHashes[id]) {
        resolved.set(id, localScenario);
        continue;
      }
      conflictingIds.push(id);
      continue;
    }

    // 바꾼 쪽이 있으면 그쪽, 없으면 아무 쪽이나(내용이 같다).
    if (localChanged) resolved.set(id, localScenario);
    else if (cloudChanged) resolved.set(id, cloudScenario);
    else resolved.set(id, localScenario ?? cloudScenario);
  }

  if (conflictingIds.length > 0) return { type: 'conflict', conflictingIds };

  // 로컬 순서 우선 + 클라우드 고유 탭을 뒤에.
  const ordered: PersistedScenarioState[] = [];
  const emitted = new Set<string>();
  const push = (id: string): void => {
    if (emitted.has(id)) return;
    const scenario = resolved.get(id);
    emitted.add(id);
    if (scenario) ordered.push(scenario);
  };
  local.scenarios.forEach((scenario) => push(scenario.id));
  cloud.scenarios.forEach((scenario) => push(scenario.id));

  const activeScenarioId = ordered.some((scenario) => scenario.id === local.activeScenarioId)
    ? local.activeScenarioId
    : (ordered[0]?.id ?? local.activeScenarioId);
  const activeScenario = ordered.find((scenario) => scenario.id === activeScenarioId);

  return {
    type: 'merged',
    payload: {
      portfolio: activeScenario?.portfolio ?? local.portfolio,
      investmentSettings: activeScenario?.investmentSettings ?? local.investmentSettings,
      scenarios: ordered,
      activeScenarioId,
      ...(local.savedName !== undefined ? { savedName: local.savedName } : {})
    }
  };
};
