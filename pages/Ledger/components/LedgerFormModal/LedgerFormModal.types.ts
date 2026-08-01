import type { OverlayPhase } from '@/shared/hooks';
import type { LedgerDraftForm, LedgerFormModel } from '../../types';

export type LedgerFormModalProps = {
  model: LedgerFormModel;
  /** 퇴장 모션을 위한 단계. `'exit'` 이면 공용 `Modal` 셸이 스스로 role/aria 를 뗀다. */
  phase: OverlayPhase;
  /** 원래 열림 상태(잔류값이 아니다) — Escape·뒤로가기 층 스택에 이 값을 넘긴다. */
  isOpen: boolean;
  /** 🔴 만료 중에도 모달을 닫지 않는다. 저장만 막고 입력값은 남는다(§4.7-4). */
  isExpired: boolean;
  isReconnecting: boolean;
  /** 화면에 하나뿐인 만료 사유 줄의 id. 비활성 버튼이 이것을 가리킨다. */
  expiredHintId: string;
  /** 충돌 배너를 모달 안에도 띄운다(§4.10) — 새로고침 후에도 입력값은 유지된다. */
  isConflict: boolean;
  onChange: (patch: Partial<LedgerDraftForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
  /** 만료 상태에서 "다시 연결하고 저장" — 재연결 성공 시 저장이 이어서 실행된다. */
  onReconnect: () => void;
  onRefresh: () => void;
};
