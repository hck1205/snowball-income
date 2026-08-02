import type { LedgerTabPickerModel } from '../../types';

export type LedgerTabPickerProps = {
  model: LedgerTabPickerModel;
  /** 고른 탭으로 옮긴다. 🔴 비활성일 때는 호출되지 않는다(컨테이너가 사유를 모델에 실어 준다). */
  onSelectTab: (sheetId: number) => void;
};
