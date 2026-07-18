import { useId, useRef, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Button } from '@/components/common';
import { CommunityModal } from '@/components/community/CommunityModal';
import type { DeleteAccountDialogProps } from './DeleteAccountDialog.types';
import {
  ConfirmField,
  ConfirmInput,
  ConfirmLabel,
  ErrorAlert,
  Irreversible,
  ScopeIntro,
  ScopeList
} from './DeleteAccountDialog.styled';

const p = COMMUNITY_COPY.profile;

/**
 * 회원 탈퇴 재확인 다이얼로그(파괴적 플로우).
 *
 * - `CommunityModal` 의 포커스 트랩·Esc·포커스 복귀를 상속하고, `initialFocusRef` 로 **취소 버튼**에
 *   기본 포커스를 준다(첫 포커서블=입력이 먼저 잡히는 것을 막아 실수 실행 방지).
 * - 재확인 입력이 trim 후 정확히 '탈퇴' 일 때만 확인 버튼 활성. 불일치는 에러를 띄우지 않고
 *   비활성 자체가 피드백이며, 입력 위 안내 문장이 조건을 상시 설명한다.
 * - 처리 중에는 모든 버튼·입력 잠금 + Esc/백드롭 닫기 무시(성공/실패 미상 상태 방지).
 * - 실패 시 상단 role="alert" 에러로 원인을 알리되 **다이얼로그는 유지**한다(성공 위장 금지).
 */
export default function DeleteAccountDialog({ loading, error, onConfirm, onCancel }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  const canConfirm = confirmText.trim() === p.deleteConfirmWord && !loading;

  // 처리 중 이탈 차단 — Esc·백드롭이 onClose 로 들어와도 무시한다.
  const handleClose = () => {
    if (!loading) onCancel();
  };

  return (
    <CommunityModal
      title={p.deleteTitle}
      onClose={handleClose}
      initialFocusRef={cancelRef}
      actions={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={handleClose} disabled={loading}>
            {p.deleteCancel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={!canConfirm}>
            {p.deleteExecute}
          </Button>
        </>
      }
    >
      {error ? <ErrorAlert role="alert">{error}</ErrorAlert> : null}

      <ScopeIntro>{p.deleteScopeIntro}</ScopeIntro>
      <ScopeList>
        {p.deleteScopeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ScopeList>
      <Irreversible>{p.deleteIrreversible}</Irreversible>

      <ConfirmField>
        <ConfirmLabel htmlFor={inputId}>{p.deleteConfirmInstruction}</ConfirmLabel>
        <ConfirmInput
          id={inputId}
          value={confirmText}
          disabled={loading}
          autoComplete="off"
          aria-label={p.deleteConfirmLabel}
          onChange={(event) => setConfirmText(event.target.value)}
        />
      </ConfirmField>
    </CommunityModal>
  );
}
