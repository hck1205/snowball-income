import type { PortfolioPresetPlaceholder } from './PortfolioPresetBoard.constants';

/**
 * 보드가 서는 두 자리.
 * - `onboarding` — 결과가 아직 없는 화면(진짜 빈 포트폴리오). 장식 워시 면 + "시작해보세요".
 * - `browse`     — 결과가 이미 있는 화면(첫 방문 프리필 등) **아래**에 붙는 고르개. 평범한 본문 카드.
 */
export type PortfolioPresetBoardVariant = 'onboarding' | 'browse';

export type PortfolioPresetBoardProps = {
  /** 포함 티커 0개(진짜 빈 상태) → 프리셋 그리드, 아니면(입력 오류로 결과만 없음) 안내 문구. */
  isPortfolioEmpty: boolean;
  /** 카드 클릭 → 부모가 확인 모달(pendingPreset)을 띄운다. 즉시 적용하지 않는다(모바일 오탭 방지). */
  onPresetSelect: (preset: PortfolioPresetPlaceholder) => void;
  /** 기본 `onboarding`. */
  variant?: PortfolioPresetBoardVariant;
  /** 지금 화면에 적용돼 있는 프리셋 id(프리필 포함). 그 카드에만 "지금 적용됨" 표식이 붙는다. */
  appliedPresetId?: string | null;
};
