import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 지표 그리드 — 요약 카드와 같은 리듬을 쓴다(같은 종류의 숫자 나열이므로 형태도 같아야 한다). */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** "전량 매도 가정" 같은 전제 조건을 작게 명시한다. */
export const TaxAssumptionNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
`;
