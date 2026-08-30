import { useMemo } from 'react';
import { useScenarioTabs } from '@/pages/Main/hooks';
import type { ScenarioTabsProps } from '../components';
import { useScenarioTabInteractions } from './useScenarioTabInteractions';

type ScenarioTabPanelDeps = Parameters<typeof useScenarioTabInteractions>[0] extends {
  renameScenarioTab: unknown;
  deleteScenarioTab: unknown;
  createScenarioTab: unknown;
  setActiveHelp: infer H;
  communityAuth: infer A;
}
  ? { setActiveHelp: H; communityAuth: A }
  : never;

/**
 * 시나리오 탭 한 벌 — **데이터 훅과 상호작용 훅을 하나로 묶는다.**
 *
 * ## 왜 생겼나 (2026-08-30 리팩터)
 * `MainRightPanel` 이 `useScenarioTabs` + `useScenarioTabInteractions` 두 훅에서 **이름 45개를
 * 통째로 풀어** 들고 있었고, 그중 22개를 다시 `<ScenarioTabs>` 에 한 줄씩 넘겼다. 그 파일이 하는
 * 일은 "결과 화면을 조립하는 것"인데, 탭 스트립의 드래그 상태·이름 편집 폭 같은 **부품 내부 사정**이
 * 그 스코프를 절반 넘게 차지하고 있었다.
 *
 * 🔴 **두 훅은 그대로 둔다.** 하나는 데이터(탭 목록·CRUD)이고 하나는 상호작용(편집·드래그·모달)이라
 *   합칠 대상이 아니다 — 여기서 하는 일은 **호출부 하나를 위해 조립**하는 것뿐이다.
 * ⚠ 동작은 한 글자도 바뀌지 않는다. 반환값은 같은 참조를 같은 이름으로 다시 묶은 것이다.
 *
 * ## 무엇을 돌려주나
 *  · `tabsProps` — `<ScenarioTabs>` 가 그대로 스프레드할 수 있는 한 덩어리.
 *  · `overlays` — 탭이 여는 오버레이 셋(삭제 모달·로그인 유도·호버 툴팁)의 상태와 닫기.
 *  · `tabApi` — 탭 API 중 **다른 훅이 필요로 하는 조각**(프리필 커밋·프리셋 적용). 전체를 흘리지
 *    않고 실제로 쓰이는 것만 좁혀서 내보낸다 — 넓히면 이 훅이 다시 45개 이름의 통로가 된다.
 */
export const useScenarioTabPanel = ({ setActiveHelp, communityAuth }: ScenarioTabPanelDeps) => {
  const {
    tabs,
    activeScenarioId,
    canCreateTab,
    canDeleteTab,
    requiresLoginToCreateTab,
    tabCreationGate,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab,
    reorderScenarioTabs
  } = useScenarioTabs();

  const {
    editingTabId,
    editingTabName,
    editingTabWidth,
    deleteTargetTabId,
    hoverTooltip,
    draggingTabId,
    dragOverTabId,
    dragJustFinishedRef,
    isLoginNudgeOpen,
    setEditingTabName,
    setDraggingTabId,
    setDragOverTabId,
    startRenameMode,
    cancelRenameMode,
    commitRenameMode,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteTab,
    showHoverTooltip,
    hideHoverTooltip,
    handleCreateTab,
    openLoginNudge,
    closeLoginNudge,
    handleLoginFromNudge,
    openScenarioTabsHelp
  } = useScenarioTabInteractions({
    renameScenarioTab,
    deleteScenarioTab,
    createScenarioTab,
    setActiveHelp,
    communityAuth
  });

  /*
   * ⚠ `useMemo` 는 참조 안정을 위한 것이 아니다 — 안쪽 값들이 매 렌더 새 참조일 수 있어 이 객체도
   *   따라 바뀐다. 그래도 두는 이유는 **의존성 목록이 곧 계약 문서**이기 때문이다: 여기 없는 이름이
   *   tabsProps 에 들어오면 타입이 아니라 이 배열이 먼저 어긋난다.
   */
  const tabsProps = useMemo<ScenarioTabsProps>(
    () => ({
      tabs,
      activeScenarioId,
      editingTabId,
      editingTabName,
      editingTabWidth,
      draggingTabId,
      dragOverTabId,
      dragJustFinishedRef,
      canCreateTab,
      canDeleteTab,
      requiresLoginToCreateTab,
      setEditingTabName,
      setDraggingTabId,
      setDragOverTabId,
      commitRenameMode,
      cancelRenameMode,
      startRenameMode,
      openDeleteModal,
      selectScenarioTab,
      reorderScenarioTabs,
      showHoverTooltip,
      hideHoverTooltip,
      onCreateTab: handleCreateTab,
      openScenarioTabsHelp
    }),
    [
      activeScenarioId,
      canCreateTab,
      canDeleteTab,
      cancelRenameMode,
      commitRenameMode,
      dragJustFinishedRef,
      dragOverTabId,
      draggingTabId,
      editingTabId,
      editingTabName,
      editingTabWidth,
      handleCreateTab,
      hideHoverTooltip,
      openDeleteModal,
      openScenarioTabsHelp,
      reorderScenarioTabs,
      requiresLoginToCreateTab,
      selectScenarioTab,
      setDragOverTabId,
      setDraggingTabId,
      setEditingTabName,
      showHoverTooltip,
      startRenameMode,
      tabs
    ]
  );

  return {
    tabsProps,
    /** 탭이 여는 오버레이 셋. 그리는 자리는 호출부이고, 여는 조건과 닫기는 여기가 소유한다. */
    overlays: {
      deleteTargetTabId,
      closeDeleteModal,
      confirmDeleteTab,
      isLoginNudgeOpen,
      closeLoginNudge,
      handleLoginFromNudge,
      hoverTooltip
    },
    /**
     * 탭 API 중 다른 훅이 쓰는 조각.
     * ⚠ 여기 이름을 늘리기 전에 **정말 그 훅의 입력인지** 따져라. 편의로 하나씩 더하다 보면
     *   이 훅이 걷어 낸 바로 그 상태(45개 이름의 통로)로 되돌아간다.
     */
    tabApi: {
      activeScenarioId,
      renameScenarioTab,
      tabCreationGate,
      createScenarioTab,
      openLoginNudge
    }
  };
};
