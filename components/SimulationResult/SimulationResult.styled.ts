import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 결과 카드의 지표 그리드.
 *
 * hero 타일(최종 자산 가치)은 **한 줄을 통째로 차지**한다(`grid-column: 1 / -1`).
 * 나머지 지표는 그 아래에 작게 깔린다. 이렇게 해야 "이 앱을 켠 이유"가 첫눈에 들어온다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** hero 지표는 그리드 한 줄 전체를 쓴다. */
export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;

/**
 * "전량 매도한다면" — 가정이 다른 별도 세계다(계속 보유하면 내지 않는 세금).
 * 그래서 위쪽 지표들과 **같은 평면에 두면 안 된다**. sunken 서피스로 한 단계 내려서
 * "이건 조건부 시나리오"라는 걸 형태로 말한다.
 */
export const TaxSection = styled.section`
  margin-top: ${space[4]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const TaxSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

export const TaxSectionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

/** "전량 매도 가정" 같은 전제 조건을 작게 명시한다. */
export const TaxAssumptionNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
`;

/** 금융소득종합과세 경고 배너의 위쪽 간격. */
export const WarningSlot = styled.div`
  margin-top: ${space[3]};
`;
