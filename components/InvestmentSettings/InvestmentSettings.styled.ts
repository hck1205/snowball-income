import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const ReinvestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const ReinvestLabel = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
`;

export const ReinvestControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const ReinvestPercentField = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

/**
 * 비율 앞의 "기본" 표기. 이 숫자는 포트폴리오 전체 비율이 아니라 **종목별 값이 없을 때의 기본값**
 * 이다(종목별 재투자 도입, 2026-08-23). 이 낱말이 없으면 한 종목만 달라져도 화면이 거짓을 말한다.
 */
export const ReinvestPercentPrefix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  white-space: nowrap;
`;

export const ReinvestPercentInput = styled.input`
  width: 64px;
  height: 32px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: 0 ${space[2]};
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: ${color.surface};
  text-align: right;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

export const ReinvestPercentSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;
