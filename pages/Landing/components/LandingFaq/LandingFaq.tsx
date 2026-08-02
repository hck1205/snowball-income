import { LANDING_COPY } from '../../copy';
import { FaqAnswer, FaqItem, FaqList, FaqSummary } from './LandingFaq.styled';

/**
 * S8 — 자주 묻는 질문 8문항.
 *
 * 문항은 `<summary>` 이고 **헤딩이 아니다**(티커 상세 FAQ 와 같은 관례) — 8개를 h3 로 올리면
 * 문서 개요에서 이 섹션이 다른 섹션 전부보다 커 보인다.
 *
 * ⚠ 다음 트랙이 이 목록을 `index.html` 의 FAQPage JSON-LD 로 옮긴다. 그때부터는 문장이 검색 결과에
 * 그대로 인용되므로, 카피 파일의 `needsApproval` 표시를 반드시 확인하고 옮겨라.
 */
export default function LandingFaq() {
  return (
    <FaqList>
      {LANDING_COPY.faq.items.map((item) => (
        <FaqItem key={item.id}>
          <FaqSummary>{item.question}</FaqSummary>
          <FaqAnswer>{item.answer}</FaqAnswer>
        </FaqItem>
      ))}
    </FaqList>
  );
}
