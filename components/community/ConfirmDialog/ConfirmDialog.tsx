import { Button } from '@/components/common';
import { CommunityModal } from '@/components/community/CommunityModal';
import type { ConfirmDialogProps } from './ConfirmDialog.types';
import { ConfirmBody } from './ConfirmDialog.styled';

/**
 * 되돌릴 수 없는 액션 확인(글/댓글 삭제, 작성 이탈). CommunityModal 위에 얹은 확인 다이얼로그.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <CommunityModal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body ? <ConfirmBody>{body}</ConfirmBody> : null}
    </CommunityModal>
  );
}
