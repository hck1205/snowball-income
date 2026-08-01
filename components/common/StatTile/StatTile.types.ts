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

/**
 * 타일 **면**의 상태. 값의 방향성(`StatTone`)과는 다른 축이다 —
 * `tone` 은 숫자에, `status` 는 타일 면과 그 옆 글리프에만 닿는다.
 *
 * 🔴 **`status` 는 값의 색을 바꾸지 않는다.** 숫자에 상태색을 넣지 않는다는 규칙은 그대로다.
 */
export type StatStatus = 'success';

export type StatTileProps = {
  label: string;
  /** 이미 포맷된 값. StatTile은 포맷하지 않는다(포맷 로직은 호출부 소유). */
  value: ReactNode;
  /** 값 아래 한 줄. 단위·전제·부연. */
  hint?: ReactNode;
  emphasis?: StatEmphasis;
  tone?: StatTone;
  /**
   * 달성·완료 같은 **상태 전환**. 주면 타일 면이 상태 틴트로 250ms 동안 바뀌고 라벨 왼쪽에
   * 체크 글리프가 한 번 들어온다. 색이 유일한 채널이 되지 않도록 `statusLabel` 을 함께 준다.
   */
  status?: StatStatus;
  /** 상태 글리프의 접근명(예: "목표 달성"). `status` 를 줄 때 함께 준다 — 색·모션 말고 텍스트로도 전달한다. */
  statusLabel?: string;
  /**
   * **지금이 그 상태가 된 순간인가.** true 일 때만 글리프가 등장 모션을 탄다.
   * 이미 달성된 화면을 다시 열 때마다 재생되지 않도록 판정은 호출부가 갖는다(기본 false).
   */
  statusEnter?: boolean;
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
