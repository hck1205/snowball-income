import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 버튼과 실패 알림을 함께 쥐는 자리. 알림은 흐름 밖(절대 배치)이라 컨트롤 줄 높이를 흔들지 않는다. */
export const CaptureSlot = styled.div<{ $iconSize: number }>`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;

  /*
   * 🔴 공용 Button 은 아이콘을 width/height: 1em 으로 **고정**한다(글자와 함께 커지라는 설계).
   * 그래서 lucide 의 size prop 은 무시된다 — 아이콘 전용 버튼에서 아이콘만 키우려면
   * 여기서 실제 픽셀로 덮어써야 한다. 글자가 없는 버튼이라 1em 규칙이 지킬 것도 없다.
   *
   * 스피너(로딩 중)는 svg 가 아니라 별도 요소라 이 규칙에 걸리지 않는다.
   */
  button svg {
    width: ${({ $iconSize }) => $iconSize}px;
    height: ${({ $iconSize }) => $iconSize}px;
  }
`;

/**
 * 실패 안내. 컨트롤 줄은 결과 그리드 바로 위 한 줄이라, 여기서 높이가 늘면 아래 카드가 통째로 밀린다.
 * 그래서 흐름에서 빼고 버튼 아래에 띄운다. 우측 정렬은 "간략히" 토글 쪽으로 넘치지 않게 하는 장치다.
 */
export const CaptureFailureNote = styled.p`
  position: absolute;
  top: calc(100% + ${space[1]});
  right: 0;
  z-index: ${zIndex.dropdown};
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  width: max-content;
  max-width: min(320px, 70vw);
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.dangerBorder};
  border-radius: ${radius.md};
  /* 톤 조합은 Banner danger 와 같다(테두리=danger-border, 면=danger-surface, 글자는 중립 text). */
  background: ${color.dangerSurface};
  color: ${color.text};
  box-shadow: ${shadow.e2};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 안내를 치우는 버튼. 문구 오른쪽에 붙되 문구를 밀어내지 않는다(`flex: 0 0 auto`).
 * 아이콘 14px 은 12px 본문 첫 줄의 라인박스 중심에 맞춘다 — `heroTitleRow` 의 잉크 보정이
 * 필요할 만큼 큰 글자가 아니라 `align-items: flex-start` + 미세 오프셋으로 충분하다.
 */
export const CaptureFailureDismiss = styled.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`;
