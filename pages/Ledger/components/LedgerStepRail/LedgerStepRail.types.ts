/**
 * 표시줄이 앉는 면의 종류.
 *
 * - `panel` — 네이비 브랜드 패널 위(`brandPanel()`). 🔴 금색(`onPanelGold`)이 합법인 유일한 자리다.
 * - `plain` — 밝은 본문 면 위. 같은 자리에 금색을 쓰면 1.83:1 이라 읽히지 않으므로 brand 축을 쓴다.
 */
export type LedgerStepTone = 'panel' | 'plain';

export type LedgerStepRailProps = {
  /** 지금 서 있는 단계(1-based). 지난 단계는 체크, 남은 단계는 흐리게 그린다. */
  current: 1 | 2 | 3;
  tone?: LedgerStepTone;
};
