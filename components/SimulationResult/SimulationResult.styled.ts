import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 기존 요약 그리드와 새 세금 섹션을 구분하는 구분선. */
export const TaxSection = styled.section`
  margin-top: ${space[4]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
`;

export const TaxSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[2]};
`;

export const TaxSectionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/** "전량 매도 가정" 같은 전제 조건을 작게 명시한다. */
export const TaxAssumptionNote = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
`;

/** 금융소득종합과세 임계 초과 경고. 눈에 띄되 공포를 조장하지 않는 톤. */
export const FinancialIncomeWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  margin-top: ${space[3]};
  padding: ${space[3]};
  border: 1px solid ${color.warning};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const FinancialIncomeWarningIcon = styled.span`
  flex: 0 0 auto;
  color: ${color.warning};
  font-weight: ${font.weight.bold};
  line-height: 1.5;
`;

export const FinancialIncomeWarningText = styled.p`
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textSecondary};
`;
