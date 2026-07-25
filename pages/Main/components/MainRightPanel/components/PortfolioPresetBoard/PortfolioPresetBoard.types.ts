import type { PortfolioPresetPlaceholder } from './PortfolioPresetBoard.constants';

export type PortfolioPresetBoardProps = {
  /** 포함 티커 0개(진짜 빈 상태) → 프리셋 그리드, 아니면(입력 오류로 결과만 없음) 안내 문구. */
  isPortfolioEmpty: boolean;
  /** 카드 클릭 → 부모가 확인 모달(pendingPreset)을 띄운다. 즉시 적용하지 않는다(모바일 오탭 방지). */
  onPresetSelect: (preset: PortfolioPresetPlaceholder) => void;
};
