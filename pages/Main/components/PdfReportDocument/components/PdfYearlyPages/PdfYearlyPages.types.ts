import type { SimulationResult } from '@/shared/types';

export type PdfYearlyPagesProps = {
  /** `chunkYearlyRows`로 이미 페이지 단위로 나뉜 연도별 행 — 부모가 계산한다(세금 페이지 푸터 번호와
   * 공유하는 단일 소스라서, 여기서 다시 청킹하지 않는다). */
  yearlyPages: SimulationResult[][];
  /** 목표 달성 연차의 연도 라벨 — 그 행에만 레일·라벨을 단다. 미설정이면 null. */
  reachedYearLabel: number | null;
  title: string;
  themeVars: Record<string, string>;
};
