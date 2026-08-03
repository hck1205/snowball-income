import type { LegalRelatedDocument } from '../LegalDocument';

export type LegalExitNavProps = {
  /** 형제 법무 문서. 없으면 그 줄만 빠지고 나머지 길은 남는다. */
  related?: LegalRelatedDocument;
  /** 문서 처음(첫 조항 제목)의 id. 눌러서 맨 위로 돌아갈 때 쓴다. */
  firstClauseId: string | null;
};
