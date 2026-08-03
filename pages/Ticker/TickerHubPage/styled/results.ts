import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 결과 영역                                                                    */
/* -------------------------------------------------------------------------- */

export const Results = styled.div`
  min-width: 0;
  display: grid;
  gap: clamp(28px, 4vw, 44px);
`;

/**
 * 결과 요약 줄 — 조건을 바꿨을 때 **무슨 일이 일어났는지**를 문장으로 말한다.
 * `role="status"` 라 스크린리더 사용자도 필터 결과를 듣는다(호출부가 건다).
 */
export const ResultSummary = styled.p`
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};

  /* 요약 줄에서만 지우기 버튼이 오른쪽 끝으로 간다 — 빈 상태의 같은 버튼은 가운데 정렬이다. */
  > button {
    margin-left: auto;
  }
`;

export const ResultCount = styled.strong`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  ${font.numeric};
`;

/** 요약 줄 안의 조건 배지 — 지금 무엇으로 거르고 있는지를 글자로 되뇐다(색 단독 채널 금지). */
export const ResultChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.text};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

export const ResetButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
    background: ${color.surfaceHover};
  }
`;
