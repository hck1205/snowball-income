import { LANDING_COPY } from '../../copy';
import {
  ConceptBody,
  ConceptGrid,
  ConceptHead,
  ConceptItem,
  ConceptOrder,
  ConceptTitle
} from './ConceptLadder.styled';

/**
 * S3 — 주식 → ETF → 배당주.
 *
 * 이 화면의 독자는 "주식도 배당도 모르는 사람"이다. 세 단어를 **순서가 있는 목록**(`ol`)으로 두는
 * 이유는 순서 자체가 내용이기 때문이다(주식을 모르면 ETF 를 설명할 수 없다). 화살표는 장식이고,
 * 목록의 의미는 마크업이 이미 갖고 있다.
 */
export default function ConceptLadder() {
  return (
    <ConceptGrid>
      {LANDING_COPY.concept.items.map((item) => (
        <ConceptItem key={item.id}>
          <ConceptHead>
            <ConceptOrder aria-hidden>{item.order}</ConceptOrder>
            <ConceptTitle>{item.title}</ConceptTitle>
          </ConceptHead>
          <ConceptBody>{item.body}</ConceptBody>
        </ConceptItem>
      ))}
    </ConceptGrid>
  );
}
