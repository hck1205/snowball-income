import type { RefObject } from 'react';
// 부모 배럴(../../index.ts)을 경유하면 HeaderOverflowMenu ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import type { InstallPlatform } from '../../HeaderOverflowMenu.types';

export type InstallGuideModalProps = {
  platform: InstallPlatform;
  /** `ModalTitle`과 `aria-labelledby`를 잇는 id. */
  titleId: string;
  /** 열릴 때 초기 포커스를 받는 닫기 버튼 ref. */
  closeButtonRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  /** `createPortal`이 붙을 대상 노드. */
  modalRoot: Element;
};
