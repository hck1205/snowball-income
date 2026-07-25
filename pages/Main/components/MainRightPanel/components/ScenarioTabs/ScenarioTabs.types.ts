import type { MutableRefObject } from 'react';

/** 스트립이 그리는 데 필요한 최소 형태 — `useScenarioTabs`의 탭 객체가 구조적으로 만족한다. */
export type ScenarioTabItem = {
  id: string;
  name: string;
};

/**
 * 시나리오 탭 스트립 props.
 *
 * 상태(편집·드래그·툴팁)와 비즈니스 훅(`useScenarioTabs`)은 전부 MainRightPanel이 쥔다 —
 * 이 컴포넌트는 뷰 조각만 담당하고, 핸들러 이름은 부모의 로컬 이름을 그대로 따른다(배선 추적 용이).
 */
export type ScenarioTabsProps = {
  tabs: ScenarioTabItem[];
  activeScenarioId: string;
  editingTabId: string | null;
  editingTabName: string;
  editingTabWidth: number | null;
  draggingTabId: string | null;
  dragOverTabId: string | null;
  /** 드롭 직후의 클릭 1회를 무시하기 위한 플래그 — 부모와 공유하는 ref. */
  dragJustFinishedRef: MutableRefObject<boolean>;
  canCreateTab: boolean;
  canDeleteTab: boolean;
  requiresLoginToCreateTab: boolean;
  setEditingTabName: (name: string) => void;
  setDraggingTabId: (tabId: string | null) => void;
  setDragOverTabId: (tabId: string | null) => void;
  commitRenameMode: () => void;
  cancelRenameMode: () => void;
  startRenameMode: (tabId: string, tabName: string, tabWidth?: number) => void;
  openDeleteModal: (tabId: string) => void;
  selectScenarioTab: (tabId: string) => void;
  reorderScenarioTabs: (fromTabId: string, toTabId: string) => void;
  showHoverTooltip: (text: string, x: number, y: number) => void;
  hideHoverTooltip: () => void;
  onCreateTab: () => void;
  openScenarioTabsHelp: () => void;
};
