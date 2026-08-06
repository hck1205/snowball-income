import type { LegalSection } from '../LegalDocument';

export type LegalClauseProps = {
  section: LegalSection;
  /** 문서 안 순서(0 기준). 첫 조항만 위쪽 구분선을 그리지 않는다. */
  index: number;
};
