import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 결과 숫자의 전제를 한 줄로 붙여 두는 띠. 카드 안에서 한 단계 가라앉은 면(surfaceSunken)이라
 * "이건 결과가 아니라 결과의 조건"임을 형태로 말한다.
 */
export const StripRoot = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]} ${space[2]};
  margin: ${space[4]} 0 0;
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.text};
  ${font.numeric}
`;

/** 스크린리더가 항목 나열의 성격을 먼저 알도록 하는 프리픽스. 시각적으로만 감춘다. */
export const StripPrefix = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const StripItem = styled.span`
  color: ${color.textSecondary};
  white-space: nowrap;
`;

/** 항목 사이 가운뎃점 — 순수 장식이라 낭독에서 제외한다. */
export const StripSeparator = styled.span`
  color: ${color.textMuted};
`;

/**
 * "조건 수정" 액션. 좁은 폭에서는 줄을 통째로 차지해 항목과 겹치지 않게 우측에 선다.
 */
export const StripAction = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: auto;

  ${media.down('mobile')} {
    flex-basis: 100%;
    justify-content: flex-end;
  }
`;
