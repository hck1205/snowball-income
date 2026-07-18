export type DeleteAccountDialogProps = {
  /** 삭제 요청 처리 중. 모든 버튼·입력이 잠기고 Esc·백드롭 닫기가 무시된다. */
  loading: boolean;
  /** 처리 실패 시 상단 인라인 에러(role="alert"). 성공 위장 금지 — 실패면 다이얼로그가 유지된다. */
  error: string | null;
  /** 재확인 입력이 정확히 일치할 때 눌린 확인. 부모가 실제 탈퇴 요청을 수행한다. */
  onConfirm: () => void;
  /** 취소/닫기. loading 중에는 부모가 무시하거나 이 컴포넌트가 잠근다. */
  onCancel: () => void;
};
