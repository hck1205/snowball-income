import { LedgerFormModal } from '../LedgerFormModal';
import { LedgerRemoveDialog } from '../LedgerRemoveDialog';
import { LedgerSideFormModal } from '../LedgerSideFormModal';
import type { LedgerOverlaysProps } from './LedgerOverlays.types';

/**
 * 가계부 화면의 **오버레이 셋** — 자산·투자 적기 · 기록 폼 · 삭제 확인.
 *
 * 🔴 **중첩 오버레이 0.** 폼 모달이 열려 있으면 삭제 다이얼로그를 열지 않는다. 둘이 겹치면 뒤엣것의
 * 포커스 트랩이 앞엣것을 가두고, 기기 뒤로가기가 한 번에 둘을 닫는다.
 *
 * ⚠ 이 부품은 **조건만 판단하고 그린다.** 열림/닫힘 잔상은 호출부(`LedgerPageView`)가
 *   `useOverlayPresence` 로 관리한다 — 그 훅이 뷰의 다른 상태와 함께 있어야 사라지는 동안의
 *   프레임이 맞는다.
 */
export default function LedgerOverlays({
  viewModel,
  form,
  removeTarget,
  expiredHintId,
  onSideFormChange,
  onSideFormSubmit,
  onSideFormClose,
  onFormChange,
  onSubmitForm,
  onCloseForm,
  onConfirmRemove,
  onCloseRemove,
  onReconnect,
  onRefresh
}: LedgerOverlaysProps) {
  return (
    <>
      {/* 🔴 자산·투자 직접 적기. 검증 규칙은 시트 쓰기와 같은 파일을 쓴다(`ledgerSideForm.ts`). */}
      {viewModel.sideForm ? (
        <LedgerSideFormModal
          kind={viewModel.sideForm.kind}
          draft={viewModel.sideForm.draft}
          errors={viewModel.sideForm.errors}
          isSaving={viewModel.sideForm.isSaving}
          writeError={viewModel.sideForm.writeError}
          onChange={onSideFormChange}
          onSubmit={onSideFormSubmit}
          onClose={onSideFormClose}
        />
      ) : null}

      {form.value ? (
        <LedgerFormModal
          model={form.value}
          phase={form.phase}
          isOpen={viewModel.form !== null}
          isExpired={viewModel.isExpired}
          isReconnecting={viewModel.isReconnecting}
          expiredHintId={expiredHintId}
          isConflict={viewModel.isConflict}
          onChange={onFormChange}
          onSubmit={onSubmitForm}
          onClose={onCloseForm}
          onReconnect={onReconnect}
          onRefresh={onRefresh}
        />
      ) : null}

      {/* 🔴 폼 모달이 열려 있으면 삭제 다이얼로그를 열 수 없다(중첩 오버레이 0). */}
      {removeTarget.value && viewModel.form === null ? (
        <LedgerRemoveDialog
          target={removeTarget.value}
          phase={removeTarget.phase}
          isOpen={viewModel.removeTarget !== null}
          isRemoving={viewModel.isRemoving}
          isExpired={viewModel.isExpired}
          isReconnecting={viewModel.isReconnecting}
          expiredHintId={expiredHintId}
          error={viewModel.removeError}
          onConfirm={onConfirmRemove}
          onClose={onCloseRemove}
          onReconnect={onReconnect}
        />
      ) : null}
    </>
  );
}
