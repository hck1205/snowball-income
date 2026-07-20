import type { ReactNode } from 'react';

export type SimulatorHeaderProps = {
  /**
   * 컨트롤 줄 1열(좌)의 **맨 앞** — 모바일 설정 드로어 토글.
   *
   * 헤더가 sticky라 이 자리에 정적으로 두면 항상 보이고 눌린다. 그래서 예전의 fixed 플로팅 승격
   * (+ IntersectionObserver sentinel)이 필요 없다 — 되살리지 말 것.
   */
  leading?: ReactNode;
  /** 컨트롤 줄 1열(좌) — 클라우드 저장/동기화 상태 등. 없어도 그리드 트랙 자리는 유지된다. */
  status?: ReactNode;
  /** 컨트롤 줄 3열(우) — 로그인·더보기(⋯)·투어 오버레이 등. */
  actions?: ReactNode;
};
