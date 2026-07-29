import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 구 `MainRightPanel.styled.ts`(결과 배치가 `MainResultGrid`로 옮겨가며 삭제됨)에서 이관 — 원래는 인라인 style 속성이었다. */

/* 토글 라벨이 보이게 되면서 컨트롤 줄이 길어졌다 — 좁은 폭에서는 접어서 흘리고 우측으로 붙인다. */
export const ProjectionControls = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
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
