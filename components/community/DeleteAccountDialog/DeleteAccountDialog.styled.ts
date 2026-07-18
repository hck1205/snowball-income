import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 상단 인라인 에러 — role="alert" 는 컴포넌트에서 부여. 색만으로 말하지 않도록 문장 자체가 원인을 담는다. */
export const ErrorAlert = styled.p`
  margin: 0 0 ${space[3]};
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.dangerBorder};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

export const ScopeIntro = styled.p`
  margin: 0 0 ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;

export const ScopeList = styled.ul`
  margin: 0 0 ${space[3]};
  padding-left: ${space[5]};
  display: grid;
  gap: ${space[1]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};

  li {
    list-style: disc;
  }
`;

/** 되돌릴 수 없음 — 경고의 무게를 danger 토큰(전 프리셋 공통 불변)으로만 싣는다. */
export const Irreversible = styled.p`
  margin: 0 0 ${space[4]};
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.normal};
`;

export const ConfirmField = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const ConfirmLabel = styled.label`
  color: ${color.text};
  font-size: ${font.size.sm};
`;

export const ConfirmInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
