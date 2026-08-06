import { LANDING_COPY } from '../../copy';
import { ConceptBody, ConceptGrid, ConceptItem, ConceptOrder, ConceptTitle } from './ConceptLadder.styled';

/**
 * S3 — 주식 → ETF → 배당주.
 *
 * 이 화면의 독자는 "주식도 배당도 모르는 사람"이다. 세 단어를 **순서가 있는 목록**(`ol`)으로 두는
 * 이유는 순서 자체가 내용이기 때문이다(주식을 모르면 ETF 를 설명할 수 없다).
 *
 * ## 2026-08-03: 배지 숫자 → **숫자 자체가 조판 요소**
 * before 는 24px 배지 안에 12px 숫자가 있고 그 옆에 14px 용어가 붙어 있었다 — 세 항목의 머리가
 * 전부 "작은 것 둘"이라 세로로 훑을 때 걸리는 것이 없었다. 지금은 숫자가 30~38px 로 서고 용어가
 * 20px 로 그 아래 앉는다. **색은 하나도 늘지 않았다**(숫자는 중립 텍스트다) — 늘어난 것은 크기 대비다.
 *
 * ⚠ 숫자는 `aria-hidden` 이다. `ol` 이 이미 순서를 말하므로 "일, 주식"으로 두 번 읽히면 안 된다.
 */
export default function ConceptLadder() {
  return (
    <ConceptGrid>
      {LANDING_COPY.concept.items.map((item) => (
        <ConceptItem key={item.id}>
          <ConceptOrder aria-hidden>{item.order}</ConceptOrder>
          <ConceptTitle>{item.title}</ConceptTitle>
          <ConceptBody>{item.body}</ConceptBody>
        </ConceptItem>
      ))}
    </ConceptGrid>
  );
}
