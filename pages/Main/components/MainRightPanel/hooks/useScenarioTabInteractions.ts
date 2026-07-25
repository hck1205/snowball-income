import { useCallback, useRef, useState } from 'react';
import type { useOptionalCommunityAuth } from '@/components/community/CommunityAuthProvider';
import type { useScenarioTabs } from '@/pages/Main/hooks';
import type { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

type RenameScenarioTab = ReturnType<typeof useScenarioTabs>['renameScenarioTab'];
type DeleteScenarioTab = ReturnType<typeof useScenarioTabs>['deleteScenarioTab'];
type CreateScenarioTab = ReturnType<typeof useScenarioTabs>['createScenarioTab'];
type SetActiveHelp = ReturnType<typeof useSetActiveHelpWrite>;
type CommunityAuth = ReturnType<typeof useOptionalCommunityAuth>;

type UseScenarioTabInteractionsArgs = {
  renameScenarioTab: RenameScenarioTab;
  deleteScenarioTab: DeleteScenarioTab;
  createScenarioTab: CreateScenarioTab;
  setActiveHelp: SetActiveHelp;
  communityAuth: CommunityAuth;
};

/**
 * 시나리오 탭 스트립의 인터랙션 로컬 상태(편집·삭제·드래그·호버 툴팁·로그인 유도)를 묶는다.
 * `useScenarioTabs()`가 주는 데이터 조작 함수와 전역 setter는 인자로 주입받는다 — 이 훅 내부에서
 * atom을 다시 구독하지 않는다(중복 구독 방지, 주입 함수의 항등성은 호출부 훅이 보장).
 * MainRightPanel.tsx에서 그대로 옮긴 로직이라 동작은 1:1 동일하다.
 */
export const useScenarioTabInteractions = ({
  renameScenarioTab,
  deleteScenarioTab,
  createScenarioTab,
  setActiveHelp,
  communityAuth
}: UseScenarioTabInteractionsArgs) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingTabWidth, setEditingTabWidth] = useState<number | null>(null);
  const [deleteTargetTabId, setDeleteTargetTabId] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  // 비로그인 2번째 탭 생성 시도 시 뜨는 로그인 유도 프롬프트. 커뮤니티 비활성 배포에선 게이트가 없어 안 뜬다.
  const [isLoginNudgeOpen, setIsLoginNudgeOpen] = useState(false);
  const dragJustFinishedRef = useRef(false);

  const startRenameMode = useCallback((tabId: string, tabName: string, tabWidth?: number) => {
    setHoverTooltip(null);
    setEditingTabId(tabId);
    setEditingTabName(tabName);
    setEditingTabWidth(typeof tabWidth === 'number' && tabWidth > 0 ? tabWidth + 20 : null);
  }, []);

  const cancelRenameMode = useCallback(() => {
    setHoverTooltip(null);
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, []);

  const commitRenameMode = useCallback(() => {
    if (!editingTabId) return;
    setHoverTooltip(null);
    const nextName = editingTabName.trim();
    if (!nextName) {
      // Empty input keeps previous tab name.
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
      return;
    }
    const success = renameScenarioTab(editingTabId, editingTabName);
    if (!success) return;
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, [editingTabId, editingTabName, renameScenarioTab]);

  const openDeleteModal = useCallback((tabId: string) => {
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'delete_tab_modal',
      scenario_id: tabId
    });
    setDeleteTargetTabId(tabId);
  }, []);

  const openScenarioTabsHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_scenario_tabs',
      placement: 'scenario_tabs'
    });
    setActiveHelp('scenarioTabs');
  }, [setActiveHelp]);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetTabId(null);
  }, []);

  const confirmDeleteTab = useCallback(() => {
    if (!deleteTargetTabId) return;
    deleteScenarioTab(deleteTargetTabId);
    setDeleteTargetTabId(null);
    if (editingTabId === deleteTargetTabId) {
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
    }
  }, [deleteScenarioTab, deleteTargetTabId, editingTabId]);

  const showHoverTooltip = useCallback((text: string, x: number, y: number) => {
    setHoverTooltip({ text, x, y });
  }, []);

  const hideHoverTooltip = useCallback(() => {
    setHoverTooltip(null);
  }, []);

  // 탭 추가("+"). 로그인 게이트에 걸리면(비로그인 2번째 탭) 생성하지 않고 로그인 유도 프롬프트를 띄운다.
  const handleCreateTab = useCallback(() => {
    const outcome = createScenarioTab();
    if (outcome === 'login-required') {
      trackEvent(ANALYTICS_EVENT.MODAL_VIEW, { modal_type: 'scenario_login_nudge' });
      setIsLoginNudgeOpen(true);
    }
  }, [createScenarioTab]);

  const closeLoginNudge = useCallback(() => setIsLoginNudgeOpen(false), []);
  // [로그인] → 프롬프트를 닫고 기존 로그인 모달을 연다(소셜 로그인 선택). 로그인 성공 후 탭1 클라우드 push는
  // 코어의 "클라우드 empty + 로컬 내용 → 무음 push"가 처리하므로 여기선 유도만 한다.
  const handleLoginFromNudge = useCallback(() => {
    setIsLoginNudgeOpen(false);
    communityAuth?.openLoginPrompt();
  }, [communityAuth]);

  return {
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
    closeLoginNudge,
    handleLoginFromNudge,
    openScenarioTabsHelp
  };
};
