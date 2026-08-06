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
 *
 * `related` 는 **문서 내용이 아니라 화면 사이의 길**이라 카피가 아니라 여기서 준다. 이 화면은 공용
 * 푸터를 그리지 않으므로(자기 자신으로 가는 링크가 생긴다) 형제 문서로 가는 길이 여기밖에 없다.
 * 요약 한 줄은 법적 주장이 아니라 안내문이다 — 약관의 조문을 요약하지 않는다.
 */
export default function PrivacyPage() {
  return (
    <LegalDocument
      document={PRIVACY_DOCUMENT}
      related={{
        to: '/terms',
        title: '이용약관',
        summary: '서비스의 이용 조건과 절차, 이용자와 운영자의 권리·의무를 정한 문서입니다.'
      }}
    />
  );
}
