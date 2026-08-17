import type { LandingLevelId } from '../../copy';

export type LevelPickerProps = {
  /** 수준 카드를 누른 순간. 계측만 한다 — 이동은 `Link` 가 한다(새 탭·가운데 클릭 보존). */
  readonly onSelectLevel: (levelId: LandingLevelId) => void;
  /** 직행로("바로 계산기로")를 누른 순간. 같은 이유로 계측만 한다. */
  readonly onDirect: () => void;
};
