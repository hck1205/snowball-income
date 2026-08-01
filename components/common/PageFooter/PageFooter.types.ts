import type { ReactNode } from 'react';

export type PageFooterProps = {
  /**
   * 페이지별 각주 묶음의 제목(예: `이 숫자에 대해`). `notes` 가 있을 때만 의미가 있다.
   * 없으면 제목 없이 문장만 쌓인다.
   */
  notesTitle?: string;
  /**
   * 🔴 **페이지별 각주 슬롯.** 화면마다 계산 가정·추정 근거가 달라서 문구를 하나로 합칠 수 없다
   * (면책은 법적 성격이 있어 "비슷하니까" 뭉뚱그리면 안 되는 종류의 글이다).
   * 공통 문장은 이 컴포넌트가 소유하고, 이 슬롯에는 **그 화면에서만 참인 문장**만 넣는다.
   */
  notes?: readonly ReactNode[];
  /**
   * 랜드마크 구분용 접근명. 한 문서에 `<footer>` 가 둘 이상이면(시뮬레이터의 `MarketDataAsOf`)
   * 스크린리더가 둘을 구별하지 못한다.
   */
  'aria-label'?: string;
};
