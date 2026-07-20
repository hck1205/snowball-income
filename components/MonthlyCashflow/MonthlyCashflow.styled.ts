import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const CashflowHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
  margin-bottom: ${space[4]};
`;

/** Card의 CardTitle과 동일한 타이포로 맞춘다 (기존엔 h2에 인라인 색/크기가 박혀 있었다). */
export const CashflowTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: clamp(16px, 1.8vw, 18px);
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

export const CashflowHeaderControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/* 연도 셀렉트는 공용 프리미티브(`@/components/common` Select, size='md', width='116px')가 그린다. */

export const CashflowTotalLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric};
`;
