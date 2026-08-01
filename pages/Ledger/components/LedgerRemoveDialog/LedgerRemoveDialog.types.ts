import type { OverlayPhase } from '@/shared/hooks';
import type { LedgerErrorModel, LedgerRemoveTarget } from '../../types';

export type LedgerRemoveDialogProps = {
  target: LedgerRemoveTarget;
  phase: OverlayPhase;
  /** 원래 열림 상태(잔류값이 아니다) — Escape·뒤로가기 층 스택에 이 값을 넘긴다. */
  isOpen: boolean;
  isRemoving: boolean;
  isExpired: boolean;
  isReconnecting: boolean;
  expiredHintId: string;
  error: LedgerErrorModel | null;
  onConfirm: () => void;
  onClose: () => void;
  /** 만료 상태에서 "다시 연결하고 삭제" — 재연결 성공 시 삭제가 이어서 실행된다. */
  onReconnect: () => void;
};
