import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/* ── 닉네임 폼 ─────────────────────────────────────────────────────────────── */

export const FieldBlock = styled.div`
  display: grid;
  gap: ${space[3]};
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const FieldLabel = styled.label`
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

/** 글자 수는 캡션이 아니라 **알약 계기**다 — 상한이 가까워지는 것이 형태로 보인다. */
export const Counter = styled.span<{ near: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ near }) => (near ? color.warning : color.border)};
  color: ${({ near }) => (near ? color.warning : color.textMuted)};
  background: ${color.surface};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/**
 * 입력은 이 카드의 주역이라 **본문보다 두 단 크다**(구 16px → 24px 대역).
 * 언더라인 두께도 1px → 2px 로 올려 "여기를 고친다"가 형태로 읽히게 한다.
 */
export const NicknameInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 2px solid ${({ invalid }) => (invalid ? color.danger : color.borderStrong)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  &:focus {
    outline: none;
    border-bottom-color: ${({ invalid }) => (invalid ? color.danger : color.brand)};
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const FieldError = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${space[1]};
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/** 상태 피드백이 같은 부모 안에서 교체되도록 감싼다(aria-live 안정). */
export const Feedback = styled.div`
  display: grid;
  gap: ${space[1]};
  min-height: 22px;
`;

export const SuccessText = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  margin: 0;
  color: ${color.success};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/**
 * 저장 줄. 카드 하단에 얇은 선을 긋고 그 아래에 둔다 — 폼과 확정 동작이 분리되어 보인다.
 * 좁은 폭에서는 버튼이 전폭이 된다(엄지로 누르는 자리).
 */
export const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};

  > * {
    min-width: 120px;
  }

  ${media.down('mobileWide')} {
    > * {
      flex: 1 1 auto;
    }
  }
`;
