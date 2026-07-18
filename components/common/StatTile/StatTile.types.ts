import type { ReactNode } from 'react';

/**
 * hero    — 그 화면의 **주인공 지표** (예: 최종 자산 가치). 화면당 1개를 넘기지 마라.
 *           2개를 hero로 만들면 0개가 된다.
 * default — 일반 지표.
 */
export type StatEmphasis = 'hero' | 'default';

/**
 * 숫자의 방향성. 한국 증권 관례를 따른다(상승=적색, 하락=청색).
 * 부호가 있는 값(평가이익 등)에만 쓴다. 그냥 큰 숫자에 색을 칠하면 의미가 죽는다.
 */
export type StatTone = 'neutral' | 'positive' | 'negative';

export type StatTileProps = {
  label: string;
  /** 이미 포맷된 값. StatTile은 포맷하지 않는다(포맷 로직은 호출부 소유). */
  value: ReactNode;
  /** 값 아래 한 줄. 단위·전제·부연. */
  hint?: ReactNode;
  emphasis?: StatEmphasis;
  tone?: StatTone;
  /** 라벨 오른쪽 슬롯 — 보통 도움말 `?` 버튼. */
  action?: ReactNode;
  /**
   * 목표 대비 달성률(0~1). 주면 값 아래에 오로라 진행률 바 + 병기 문구("목표의 N% 도달"/"목표 달성")가
   * 붙는다. 범위 밖 값은 0~1로 클램프. **표시용 비율만** 넣어라 — 타일은 계산하지 않는다.
   */
  progress?: number;
  /** 진행률 바의 접근성 이름(예: "목표 월배당 달성률"). `progress`를 줄 때 함께 준다. */
  progressLabel?: string;
};
