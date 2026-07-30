import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/** 가정 요약 — 접힘. 면(surface)을 새로 만들지 않고 왼쪽 선 하나로 "부속 정보"임을 말한다. */
export const AssumptionsDetails = styled.details`
  border-left: 2px solid ${color.border};
  padding: 0 0 0 ${space[4]};
`;

export const AssumptionsSummary = styled.summary`
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

export const AssumptionsBody = styled.div`
  display: grid;
  gap: ${space[3]};
  margin: ${space[3]} 0 0;
`;

export const TaxFieldSlot = styled.div`
  max-width: 200px;
`;

/**
 * 가정 요약 안의 두 번째 그룹 제목(예상 달성 시점 계산 조건).
 *
 * 접힘 블록을 새로 만들지 않고 **그룹 제목 한 줄**로 소속을 밝힌다 — 같은 라벨(배당소득세)이 두 번
 * 나와도 각 행이 자기 기준을 말하면 모순이 아니다. `h3`(카드 `h2` 아래 위계)로 두어 제목 목록에서도 읽힌다.
 */
export const AssumptionsGroupTitle = styled.h3`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
`;

export const AssumptionsGroupNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const ConditionsList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${space[2]} ${space[4]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const ConditionRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const ConditionTerm = styled.dt`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const ConditionValue = styled.dd`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;
