import styled from '@emotion/styled';
import { color, font, motion, space } from '@/shared/styles';

/**
 * 분류·제목·본문 필드 조각 — `CommunityWritePage.styled.ts`에서 옮겨왔다(스타일 값 동일, 마크업/동작 변화 없음).
 */

export const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const FieldLabel = styled.label`
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

export const Counter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/**
 * velog식 언더라인 제목 입력. 컨트롤 경계 3:1 원칙의 **의도적 예외**(스펙 §A1/§D) —
 * 화면당 1개인 문서 제목 필드라 라벨·카운터·placeholder·언더라인으로 식별이 충분하다.
 * invalid 시 언더라인이 danger(검증된 대비)로 바뀌고 aria-describedby 에러가 병기된다.
 *
 * 포커스: 전역 포커스 링(globalStyles의 `input:focus-visible` outline+box-shadow)은 이 필드에서만
 * 끈다 — 테두리 없는 전폭 입력이라 사각 링이 폼을 가로지르는 이물이 된다(사용자 요청).
 * 대신 **언더라인 강조**로 대체해 키보드 사용자가 포커스를 잃지 않게 한다:
 * `inset 0 -2px`(레이아웃 점프 없는 두께 증가) + brand 색. 색만으로 전달하지 않으므로(두께 변화)
 * 색각 이상·저대비 프리셋에서도 신호가 남는다.
 * invalid 상태에서는 강조색이 danger를 유지해 에러 표시를 brand가 덮지 않는다.
 */
export const TitleInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 1px solid ${({ invalid }) => (invalid ? color.danger : color.border)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  /*
   * 본문 에디터가 md(15px)라 제목은 그보다 한 단계 크면 위계가 충분하다.
   * 2xl(20px)+bold(700)은 과했다 — 입력란은 "읽는 제목"이 아니라 "쓰는 칸"이라
   * 완성된 글의 h1 크기를 그대로 가져올 이유가 없고, placeholder까지 커 보인다.
   */
  font-size: ${font.size.xl};
  font-weight: ${font.weight.semibold};
  transition:
    background-color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  /*
   * 포커스 신호는 **언더라인만** 쓴다(배경 채색 없음).
   * 이전에는 surfaceSunken 을 깔았는데 큰 전폭 입력이라 면적이 넓어 "너무 어둡다"는 신고가 있었다.
   * 대신 밑줄을 2px 브랜드색으로 굵혀(border + inset box-shadow) 포커스 위치가 확실히 보이게 한다 —
   * 이 입력은 전역 포커스 링을 제거한 승인 예외라 언더라인이 유일한 신호이므로 약하게 두면 안 된다.
   */
  &:focus,
  &:focus-visible {
    outline: none;
    border-bottom-color: ${({ invalid }) => (invalid ? color.danger : color.brand)};
    box-shadow: inset 0 -2px 0 ${({ invalid }) => (invalid ? color.danger : color.brand)};
    background: transparent;
  }
`;

/*
 * 글 종류 드롭다운(자유게시판 전용)은 공용 프리미티브(`@/components/common` Select)가 그린다.
 * 네이티브 `<select>`를 쓰는 이유는 그대로다: 옵션이 2~3개뿐이고, 모바일 OS 휠 UI·키보드·스크린리더
 * 지원이 공짜다(role=combobox + `<label htmlFor>`). 폭 정책(width='auto' + minWidth)만 호출부에서 준다.
 */
