import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 드로어 맨 아래 접힘 블록. 기본은 검색이고 이건 폴백이라 시각적으로 한 단계 눌러 둔다. */
export const ManualDetails = styled.details`
  border-top: 1px solid ${color.border};
  padding-top: ${space[3]};
`;

export const ManualSummary = styled.summary`
  cursor: pointer;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const ManualBody = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const ManualForm = styled.form`
  display: grid;
  gap: ${space[3]};
  margin-top: ${space[3]};
`;

export const ManualFieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
`;

/** 검증 실패는 색이 아니라 **문장**이 말한다. 그래도 눈에 띄어야 하므로 대비 검증된 쌍을 쓴다. */
export const InvalidNote = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
`;
