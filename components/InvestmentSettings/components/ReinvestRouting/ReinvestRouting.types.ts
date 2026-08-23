import type { TickerProfile } from '@/shared/types/snowball';

export type ReinvestRoutingProps = {
  /** 편입된 종목만 온다 — 담지 않은 종목은 배당도 없고 목적지도 될 수 없다. */
  includedProfiles: TickerProfile[];
  /** 종목별 재투자 비율(%). 키가 없으면 전역값을 쓴다. */
  percentByTickerId: Record<string, number>;
  /** 종목별 목적지 티커 id. 키가 없으면 자기 자신이다. */
  targetByTickerId: Record<string, string>;
  /** 전역 재투자 비율 — 종목별 값이 없을 때 입력창에 보이는 값이다. */
  globalPercent: number;
  /** 전역 재투자 토글. 꺼져 있으면 이 표 전체가 무의미하므로 잠근다. */
  enabled: boolean;
  onSetPercent: (profileId: string, percent: number) => void;
  onSetTarget: (profileId: string, targetId: string) => void;
};
