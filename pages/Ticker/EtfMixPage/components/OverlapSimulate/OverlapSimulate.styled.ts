import styled from '@emotion/styled';
import { DATA_RADIUS, DATA_SURFACE, color, font, space, surface } from '@/shared/styles';

/* OverlapSimulate 의 스타일 — 읽는 면(data)이다. 채도 면을 깔지 않는다(한 화면 틴트 면 상한 2 — DESIGN.md 색 규칙 6). */

export const SimulateSection = styled.section`
  ${surface(DATA_RADIUS, DATA_SURFACE.pad)}
  display: grid;
  gap: ${space[3]};
  border: 1px solid ${color.border};
  background: ${color.surface};
  min-width: 0;
`;

export const SimulateLede = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/** 빠지는 ETF 안내. 경고 면이 아니라 글자로 — 막는 것이 아니라 알리는 것이다. */
export const SimulateNote = styled.p`
  margin: 0;
  color: ${color.warning};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.normal};
`;

export const SimulateActions = styled.div`
  display: flex;
  justify-content: flex-start;
`;
