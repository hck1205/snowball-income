import { LegalDocument } from '../components';
import { PRIVACY_DOCUMENT } from '../copy';

/**
 * `/privacy` — 개인정보처리방침.
 *
 * 🔴 `noindex` 를 걸지 않는다(404 와 다른 점). 구글 OAuth 동의 화면 심사에서 이 주소가 공개적으로
 * 접근 가능해야 하고, 색인을 막으면 그 검토가 막힌다.
 *
 * 내용은 `pages/Legal/copy/privacyCopy.ts` 가 소유한다 — 문장만 바뀌는 개정이 마크업 변경과 섞이지
 * 않게 하기 위해서다(법무 문서는 "무엇이 바뀌었나"가 곧 고지 대상이다).
 */
export default function PrivacyPage() {
  return <LegalDocument document={PRIVACY_DOCUMENT} />;
}
