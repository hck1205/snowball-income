import { isSameMeaningfulScenario } from '../persistence';
import type { PersistedAppStatePayload, PersistedScenarioState } from '../types';

/**
 * 디바이스(로컬)↔클라우드 워크스페이스 **화해(reconciliation)** 순수 로직 — React·Supabase 비의존.
 *
 * 무음 last-write-wins가 반대쪽 기기의 탭을 조용히 덮던 유실을, "충돌 감지 → 사용자 3택(디바이스/클라우드/
 * 블렌드)" 으로 바꾼다. 여기 함수들은 전부 순수하거나 IO를 주입받아, fake IO로 부작용을 결정론 검증한다.
 *
 * ⚠ 저장 포맷·스키마는 **변경하지 않는다** — 병합 결과도 기존 `PersistedAppStatePayload` 그대로라
 *   `normalizePersistedAppState`/`applyPersistedPayload` 왕복이 그대로 성립한다(탭 개수 상한 절단 없음).
 */

/** 세션 시작에 감지된 충돌 스냅샷 — 화해 액션·요약의 입력. device=로컬(IndexedDB), cloud=클라우드 슬롯. */
export type CloudWorkspaceConflict = {
  device: PersistedAppStatePayload;
  cloud: PersistedAppStatePayload;
  /** 로컬 autosave 레코드의 updatedAt(클라이언트 시각). 구버전=undefined. 요약의 "마지막 편집시각". */
  deviceUpdatedAt: number | undefined;
  /** 클라우드 payload에 실린 savedAt(클라이언트 시각). 구버전=undefined. 요약의 "마지막 편집시각". */
  cloudSavedAt: number | undefined;
};

// ── 블렌드 병합(합집합·비파괴) ────────────────────────────────────────────────

/** 발산한 클라우드 시나리오 이름에 붙이는 접미(디바이스 원본과 나란히 구분). */
const CLOUD_DIVERGENCE_SUFFIX = ' (클라우드)';

/**
 * 블렌드 병합의 새 id 생성기(발산본에 부여). useScenarioTabs.makeScenarioId와 **같은 형식**이지만, 엔진은
 * React·pages 비의존이라 여기 로컬로 둔다. 테스트는 결정론을 위해 makeId를 주입할 수 있다.
 */
const makeBlendScenarioId = (): string => `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 디바이스·클라우드 워크스페이스를 **합집합·비파괴**로 병합한다(결정 §블렌드).
 *
 *  - 시나리오 id 합집합. 같은 id·내용 same → 디바이스본 하나로 유지.
 *  - 같은 id·내용 다름 → **둘 다 보존**: 디바이스는 원 id/이름, 클라우드는 **새 id + 이름 "(클라우드)" 접미**.
 *  - 한쪽만 있는 id → 그대로 포함.
 *  - 순서: 디바이스 → 클라우드 고유(디바이스에 없는 id) → 클라우드 발산본.
 *  - 활성 탭 = 디바이스 활성. 최상위 portfolio/investmentSettings는 활성 탭의 미러로 재합성한다.
 *
 * **1라운드 수렴**: 발산본에 준 새 id는 다음 라운드에 "한쪽만 있는 id"로 취급되어(양쪽 슬롯에 동일 반영되므로)
 * 재발산·증식하지 않는다. mergeWorkspaces(m, m) === m(개수 불변). 회귀 테스트로 고정.
 */
export const mergeWorkspaces = (
  device: PersistedAppStatePayload,
  cloud: PersistedAppStatePayload,
  makeId: () => string = makeBlendScenarioId
): PersistedAppStatePayload => {
  const deviceById = new Map(device.scenarios.map((scenario) => [scenario.id, scenario]));

  // 새 id는 디바이스·클라우드 기존 id 및 이번에 생성한 id와 절대 겹치지 않게 한다.
  const usedIds = new Set<string>();
  device.scenarios.forEach((scenario) => usedIds.add(scenario.id));
  cloud.scenarios.forEach((scenario) => usedIds.add(scenario.id));
  const nextUniqueId = (): string => {
    let id = makeId();
    while (usedIds.has(id)) id = makeId();
    usedIds.add(id);
    return id;
  };

  const cloudUnique: PersistedScenarioState[] = [];
  const cloudDivergent: PersistedScenarioState[] = [];
  for (const cloudScenario of cloud.scenarios) {
    const deviceScenario = deviceById.get(cloudScenario.id);
    if (!deviceScenario) {
      cloudUnique.push(cloudScenario); // 클라우드 고유 id
      continue;
    }
    if (isSameMeaningfulScenario(deviceScenario, cloudScenario)) continue; // 같은 id·내용 same → 디바이스본 유지
    // 같은 id·내용 다름 → 클라우드 발산본을 새 id·"(클라우드)" 접미로 둘 다 보존(비파괴).
    cloudDivergent.push({
      ...cloudScenario,
      id: nextUniqueId(),
      name: `${cloudScenario.name}${CLOUD_DIVERGENCE_SUFFIX}`
    });
  }

  const scenarios = [...device.scenarios, ...cloudUnique, ...cloudDivergent];
  const activeScenarioId = scenarios.some((scenario) => scenario.id === device.activeScenarioId)
    ? device.activeScenarioId
    : scenarios[0]?.id ?? device.activeScenarioId;
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];

  return {
    portfolio: activeScenario?.portfolio ?? device.portfolio,
    investmentSettings: activeScenario?.investmentSettings ?? device.investmentSettings,
    scenarios,
    activeScenarioId: activeScenario?.id ?? activeScenarioId,
    ...(device.savedName !== undefined ? { savedName: device.savedName } : {})
  };
};

// ── 충돌 요약(모달 표시용) ────────────────────────────────────────────────────

/** 한 워크스페이스의 충돌 요약(탭 개수·이름 목록·마지막 편집시각). */
export type CloudWorkspaceSummary = {
  tabCount: number;
  tabNames: string[];
  lastEditedAt: number | null;
};

export type CloudReconciliationSummary = {
  device: CloudWorkspaceSummary;
  cloud: CloudWorkspaceSummary;
};

const summarizeWorkspace = (
  payload: PersistedAppStatePayload,
  editedAt: number | undefined
): CloudWorkspaceSummary => ({
  tabCount: payload.scenarios.length,
  tabNames: payload.scenarios.map((scenario) => scenario.name),
  lastEditedAt: editedAt ?? null
});

/** 충돌 스냅샷 → 모달이 그리는 좌(디바이스)/우(클라우드) 요약. 순수(계산만). */
export const summarizeReconciliation = (conflict: CloudWorkspaceConflict): CloudReconciliationSummary => ({
  device: summarizeWorkspace(conflict.device, conflict.deviceUpdatedAt),
  cloud: summarizeWorkspace(conflict.cloud, conflict.cloudSavedAt)
});

/**
 * 병합 미리보기(모달이 "블렌드하면 탭 N개"를 보여줄 때). 부작용 없이 결과 탭 개수·이름만 낸다.
 * 발산본 새 id는 비결정이지만 **개수·이름은 결정적**이라 미리보기로 안전하다. lastEditedAt은 무의미 → null.
 */
export const previewBlend = (conflict: CloudWorkspaceConflict): CloudWorkspaceSummary =>
  summarizeWorkspace(mergeWorkspaces(conflict.device, conflict.cloud), undefined);

// ── 3-way 화해(IO 주입, 양쪽 수렴) ────────────────────────────────────────────

/**
 * 화해가 쓰는 IO — 세션 시작 sync와 **같은 주입 IO**를 재사용한다.
 *  - applyPayload: 앱(현재 기기)에 적용
 *  - writeLocalAutosave: 로컬 IndexedDB autosave 슬롯 미러
 *  - pushCloudAutosave: 클라우드 autosave 슬롯 push(savedAt 심음)
 */
export type WorkspaceReconcileDeps = {
  applyPayload: (payload: PersistedAppStatePayload) => void;
  writeLocalAutosave: (payload: PersistedAppStatePayload) => Promise<void>;
  pushCloudAutosave: (payload: PersistedAppStatePayload, savedAt: number) => Promise<void>;
  /** savedAt 주입(결정론 테스트). 기본 Date.now. */
  now?: () => number;
};

/**
 * **디바이스 기준**: 로컬을 채택한다. 앱·로컬 슬롯은 이미 로컬 정본(하이드레이션 결과)이므로 클라우드에만
 * push해 덮어써 양쪽을 로컬 내용으로 수렴시킨다. 반환=반영된 payload(계측 result_tabs 집계용).
 */
export const resolveWithDevice = async (
  device: PersistedAppStatePayload,
  deps: WorkspaceReconcileDeps
): Promise<PersistedAppStatePayload> => {
  const now = deps.now ?? Date.now;
  await deps.pushCloudAutosave(device, now());
  return device;
};

/**
 * **클라우드 기준**: 클라우드를 채택한다. 앱에 적용 + 로컬 슬롯에 미러(클라우드는 이미 정본). 양쪽을 클라우드
 * 내용으로 수렴시킨다. 반환=반영된 payload.
 */
export const resolveWithCloud = async (
  cloud: PersistedAppStatePayload,
  deps: WorkspaceReconcileDeps
): Promise<PersistedAppStatePayload> => {
  deps.applyPayload(cloud);
  await deps.writeLocalAutosave(cloud);
  return cloud;
};

/**
 * **블렌드**: 합집합 병합 후 앱·로컬·클라우드 **양쪽에 동일 반영**해 1라운드 수렴시킨다. 반환=병합 payload.
 */
export const resolveWithBlend = async (
  device: PersistedAppStatePayload,
  cloud: PersistedAppStatePayload,
  deps: WorkspaceReconcileDeps & { makeId?: () => string }
): Promise<PersistedAppStatePayload> => {
  const now = deps.now ?? Date.now;
  const merged = mergeWorkspaces(device, cloud, deps.makeId);
  deps.applyPayload(merged);
  await deps.writeLocalAutosave(merged);
  await deps.pushCloudAutosave(merged, now());
  return merged;
};
