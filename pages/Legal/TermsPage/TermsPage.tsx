import { LegalDocument } from '../components';
import { TERMS_DOCUMENT } from '../copy';

/**
 * `/terms` — 이용약관.
 *
 * 개인정보처리방침과 같은 이유로 `noindex` 를 걸지 않는다 — 서비스의 조건을 공개하는 문서이고,
 * 링크를 받은 사람이 검색으로도 찾을 수 있어야 한다.
 *
 * 면책(제10조·제11조)의 근거와 승계 관계는 `pages/Legal/copy/termsCopy.ts` 상단 주석에 있다.
 *
 * `related` 는 **문서 내용이 아니라 화면 사이의 길**이라 카피가 아니라 여기서 준다(PrivacyPage 와 같다).
 */
export default function TermsPage() {
  return (
    <LegalDocument
      document={TERMS_DOCUMENT}
      related={{
        to: '/privacy',
        title: '개인정보처리방침',
        summary: '서비스가 어떤 정보를 어떤 목적으로 처리하고 얼마나 보관하는지를 밝힌 문서입니다.'
      }}
    />
  );
}
