import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** `MainRightPanel.styled.ts`에서 옮겨온 것 — 원래는 인라인 style 속성이었다 (스타일 값 동일, 마크업/동작 변화 없음). */

export const ProjectionControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const ProjectionYearField = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

/* 기간 셀렉트는 공용 프리미티브(`@/components/common` Select, size='sm', width='64px')가 그린다. */

export const ProjectionYearSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;
