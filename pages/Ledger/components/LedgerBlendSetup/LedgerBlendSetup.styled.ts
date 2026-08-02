import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * B-3 블렌딩 설정의 로컬 스타일.
 *
 * 🔴 **두 자리를 나란히 세운다** — "첫 번째 / 두 번째"가 위아래로 멀어지면 무엇과 무엇을 합치는지가
 * 한눈에 안 잡힌다. 좁은 폭(≤820px)에서는 한 줄로 접히되 `<fieldset>` 테두리가 묶음을 계속 말한다.
 * 🔴 색으로만 두 자리를 구분하지 않는다 — 범례 텍스트(`첫 번째 가계부`)가 1차 채널이고, 틴트는 보조다.
 */

export const NoteList = styled.div`
  display: grid;
  gap: ${space[1]};
  margin-bottom: ${space[4]};
  min-width: 0;
`;

export const Note = styled.p`
  margin: 0;
  max-width: 62ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

export const SourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
  min-width: 0;

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 한 출처 묶음. `<fieldset>` 이라 범례가 두 컨트롤(선택·이름)의 공통 이름이 된다 —
 * 스크린리더에서 "가계부" 셀렉트가 두 개 나올 때 어느 쪽인지 구분되는 유일한 단서다.
 */
export const SourceFieldset = styled.fieldset<{ $source: 'a' | 'b' }>`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  margin: 0;
  padding: ${space[4]};
  border: 1px ${({ $source }) => ($source === 'a' ? 'solid' : 'dashed')}
    ${({ $source }) => ($source === 'a' ? color.accentBorder : color.accentAltBorder)};
  border-radius: ${radius.lg};
  background: ${({ $source }) => ($source === 'a' ? color.accentSubtle : color.accentAltSubtle)};
`;

export const SourceLegend = styled.legend`
  padding: 0 ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Field = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.label`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/**
 * 이름 입력. 공용 `InputField` 를 쓰지 않는 이유는 **`maxLength` 를 넘길 수 없기 때문**이다 —
 * 라벨 길이 상한은 저장 단계에서도 잘리지만(`normalizeLedgerBlendLabel`), 입력에서 막아야
 * 사용자가 "잘린다"는 사실을 타이핑하는 동안 안다. 컨트롤 형태는 `InputField` 의 것을 그대로 따른다.
 */
export const LabelInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }
`;

export const FieldHint = styled.span`
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 🔴 무음 비활성 금지 — 제출 버튼이 `aria-describedby` 로 이 줄을 가리킨다. */
export const BlockedHint = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[4]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;
