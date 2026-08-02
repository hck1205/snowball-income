import { LegalDocument } from '../components';
import { TERMS_DOCUMENT } from '../copy';

/**
 * `/terms` — 이용약관.
 *
 * 개인정보처리방침과 같은 이유로 `noindex` 를 걸지 않는다 — 서비스의 조건을 공개하는 문서이고,
 * 링크를 받은 사람이 검색으로도 찾을 수 있어야 한다.
 *
 * 면책(제10조·제11조)의 근거와 승계 관계는 `pages/Legal/copy/termsCopy.ts` 상단 주석에 있다.
 */
export default function TermsPage() {
  return <LegalDocument document={TERMS_DOCUMENT} />;
}
