import { TOUR_TARGET } from '@/shared/constants';
import type { ScenarioTabsProps } from './ScenarioTabs.types';
import {
  ScenarioTabButton,
  ScenarioTabCloseButton,
  ScenarioTabEditWrap,
  ScenarioTabRenameInput,
  ScenarioTabsHelpButton,
  ScenarioTabsWrap
} from './ScenarioTabs.styled';

/**
 * 시나리오(포트폴리오) 탭 스트립 — 선택·이름변경(더블클릭)·삭제(×)·드래그 정렬·추가(+)·도움말(?).
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 상태/훅 배선·호출 순서는 부모에 그대로 있다.
 */
function ScenarioTabs({
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
  onCreateTab,
  openScenarioTabsHelp
}: ScenarioTabsProps) {
  return (
    <ScenarioTabsWrap data-tour={TOUR_TARGET.scenarioTabs} aria-label="포트폴리오 탭 목록">
      {tabs.map((tab) =>
        editingTabId === tab.id ? (
          <ScenarioTabEditWrap key={tab.id} style={editingTabWidth ? { width: `${editingTabWidth}px` } : undefined}>
            <ScenarioTabRenameInput
              autoFocus
              aria-label={`${tab.name} 이름 변경`}
              value={editingTabName}
              onChange={(event) => setEditingTabName(event.target.value)}
              onBlur={commitRenameMode}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRenameMode();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelRenameMode();
                }
              }}
            />
            <ScenarioTabCloseButton
              type="button"
              aria-label={`${tab.name} 삭제`}
              disabled={!canDeleteTab}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openDeleteModal(tab.id);
              }}
            >
              ×
            </ScenarioTabCloseButton>
          </ScenarioTabEditWrap>
        ) : (
          <ScenarioTabButton
            key={tab.id}
            type="button"
            active={tab.id === activeScenarioId}
            dragOver={dragOverTabId === tab.id && draggingTabId !== tab.id}
            isDragging={draggingTabId === tab.id}
            draggable
            onClick={() => {
              if (dragJustFinishedRef.current) {
                dragJustFinishedRef.current = false;
                return;
              }
              selectScenarioTab(tab.id);
            }}
            onDragStart={(event) => {
              setDraggingTabId(tab.id);
              setDragOverTabId(null);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', tab.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (draggingTabId && draggingTabId !== tab.id) {
                setDragOverTabId(tab.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromTabId = draggingTabId || event.dataTransfer.getData('text/plain');
              if (!fromTabId || fromTabId === tab.id) return;
              reorderScenarioTabs(fromTabId, tab.id);
              dragJustFinishedRef.current = true;
              setDragOverTabId(null);
            }}
            onDragEnd={() => {
              setDraggingTabId(null);
              setDragOverTabId(null);
            }}
            onMouseEnter={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
            onMouseMove={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
            onDoubleClick={(event) => startRenameMode(tab.id, tab.name, event.currentTarget.getBoundingClientRect().width)}
            onMouseLeave={hideHoverTooltip}
          >
            {tab.name}
          </ScenarioTabButton>
        )
      )}
      {canCreateTab ? (
        <ScenarioTabButton
          type="button"
          aria-label="새 포트폴리오 탭 추가"
          title={requiresLoginToCreateTab ? '로그인하면 탭을 더 만들 수 있습니다' : undefined}
          onClick={onCreateTab}
        >
          +
        </ScenarioTabButton>
      ) : null}
      <ScenarioTabsHelpButton type="button" aria-label="포트폴리오 탭 도움말 열기" onClick={openScenarioTabsHelp}>
        ?
      </ScenarioTabsHelpButton>
    </ScenarioTabsWrap>
  );
}

export default ScenarioTabs;
