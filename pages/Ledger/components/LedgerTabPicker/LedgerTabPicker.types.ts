import type { LedgerTabPickerModel } from '../../types';

export type LedgerTabPickerProps = {
  model: LedgerTabPickerModel;
  /**
   * 시트를 새 창에서 여는 주소.
   *
   * 🔴 탭이 하나뿐이면 이 자리는 **셀렉트가 아니라 시트로 가는 버튼**이 된다 — 고를 것이 없는
   *    선택지를 그리는 대신 실제로 할 일이 있는 것을 놓는다(2026-08-08 사용자 요청).
   */
  sheetUrl?: string;
  /** 고른 탭으로 옮긴다. 🔴 비활성일 때는 호출되지 않는다(컨테이너가 사유를 모델에 실어 준다). */
  onSelectTab: (sheetId: number) => void;
};
