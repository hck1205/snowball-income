import styled from '@emotion/styled';
import { color, font, motion, space } from '@/shared/styles';

/** 제목·본문 필드 조각. 분류 드롭다운은 인스펙터(`PostKindField`)로 갔다. */

export const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

/** 필드 라벨 — 시트 안의 작은 안내. 값(제목·본문)보다 확실히 약해야 위계가 선다. */
export const FieldLabel = styled.label`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
`;

export const Counter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/**
 * 본문 블록. 시트 안에서 **남는 세로를 전부 먹는다** — 에디터가 화면의 주인공이라
 * 다른 필드와 같은 높이 대접을 받으면 안 된다(min-height 는 에디터가 자기 안에서 잡는다).
 */
export const BodyBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * velog 식 언더라인 제목 입력. 컨트롤 경계 3:1 원칙의 **의도적 예외**(스펙 §A1/§D) —
 * 화면당 1개인 문서 제목 필드라 라벨·카운터·placeholder·언더라인으로 식별이 충분하다.
 * invalid 시 언더라인이 danger(검증된 대비)로 바뀌고 aria-describedby 에러가 병기된다.
 *
 * 포커스: 전역 포커스 링(globalStyles 의 input:focus-visible outline+box-shadow)은 이 필드에서만
 * 끈다 — 테두리 없는 전폭 입력이라 사각 링이 폼을 가로지르는 이물이 된다(사용자 요청).
 * 대신 **언더라인 강조**로 대체해 키보드 사용자가 포커스를 잃지 않게 한다:
 * inset 0 -2px(레이아웃 점프 없는 두께 증가) + brand 색. 색만으로 전달하지 않으므로(두께 변화)
 * 색각 이상·저대비 프리셋에서도 신호가 남는다.
 *
 * 🔴 **크기는 xl(18px)/semibold 로 못 박혀 있다.** 2xl(20px)+bold 는 2026-07 에 사용자가
 * "과하다(placeholder 까지 커 보인다)"고 되돌린 값이다 — 리워크에서도 올리지 않았다.
 * 제목의 위계는 크기가 아니라 **자리**(시트의 첫 줄)와 언더라인이 만든다.
 */
export const TitleInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 52px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 1px solid ${({ invalid }) => (invalid ? color.danger : color.border)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
  transition:
    background-color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  /*
   * 포커스 신호는 **언더라인만** 쓴다(배경 채색 없음). 이전에는 surfaceSunken 을 깔았는데 큰 전폭
   * 입력이라 면적이 넓어 "너무 어둡다"는 신고가 있었다. 이 입력은 전역 포커스 링을 제거한 승인
   * 예외라 언더라인이 유일한 신호이므로 약하게 두면 안 된다.
   */
  &:focus,
  &:focus-visible {
    outline: none;
    border-bottom-color: ${({ invalid }) => (invalid ? color.danger : color.brand)};
    box-shadow: inset 0 -2px 0 ${({ invalid }) => (invalid ? color.danger : color.brand)};
    background: transparent;
  }
`;
