import styled from '@emotion/styled';
import { HelpMarkButton } from '@/components/common';
import {
  color,
  font,
  hiddenScrollbar,
  media,
  motion,
  radius,
  shadow,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';

/** `pages/Main/Main.shared.styled.ts`에서 옮겨온 시나리오 탭 조각 (스타일 값 동일, 마크업/동작 변화 없음). */

/**
 * 탭 스트립. **밑줄은 여기 없다** — 래퍼(`ScenarioTabsRow`)가 갖는다.
 * 여기에 두면 스트립 폭(= 탭 개수만큼)까지만 선이 그려져 우측 "간략히" 토글 아래가 끊긴다.
 */
export const ScenarioTabsWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[1]};
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  ${subtleScrollbar}

  /* 모바일에서 탭이 넘칠 때: 스냅 + 우측 페이드로 "더 있음"을 알린다 —
     넘침 신호가 따로 있으므로 여기서만 스크롤바를 감춘다(위 선언을 덮는다). */
  ${media.down('drawer')} {
    scroll-snap-type: x proximity;
    scroll-padding-inline: ${space[2]};
    ${hiddenScrollbar}
  }
`;

/**
 * 시나리오 탭 하나.
 *
 * 🔴 **활성 탭이 이 화면의 유일한 L3 솔리드다** (brand 채움 + on-brand 글자, 2026-08-03 확정).
 * 결과 그리드는 숫자가 사는 data 면이라 채도면을 허용하지 않는다 — 그래서 "고르는 자리"인 이 탭이
 * 화면의 색 예산을 통째로 받는다. 같은 결정으로 StatTile 의 hero 면(구 accent-subtle)이 중립으로
 * 내려갔다: **색면 총량은 그대로이고 위치만 옮겼다.**
 *
 * 색이 유일한 채널이 아니다 — 활성 탭은 **채움 + 굵기(bold) + 아래 결과 영역과 이어지는 봉합선**
 * 셋으로 말한다. 회색조로 인쇄해도 어느 탭이 켜져 있는지 읽힌다.
 *
 * ⚠ 이름변경(inline input)은 이 버튼이 아니라 ScenarioTabEditWrap 이 그린다 — 입력 중에는
 * 탭이 L3 를 **잠시 반납하고** 중립 면으로 돌아간다(솔리드 면 위에 입력 필드를 얹지 않는다).
 */
export const ScenarioTabButton = styled.button<{ active?: boolean; dragOver?: boolean; isDragging?: boolean }>`
  position: relative;
  flex: 0 0 auto;
  max-width: 160px;
  scroll-snap-align: start;
  /* 활성/비활성 모두 투명 — 상태가 바뀌어도 폭이 흔들리지 않게 자리만 잡아 둔다.
     활성 신호는 테두리가 아니라 채움이 만든다. */
  border: 1px solid transparent;
  border-bottom: 0;
  background: ${({ active }) => (active ? color.brand : 'transparent')};
  color: ${({ active }) => (active ? color.onBrand : color.textMuted)};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  touch-action: manipulation;
  cursor: pointer;
  z-index: ${({ active }) => (active ? 2 : 1)};
  opacity: ${({ isDragging }) => (isDragging ? 0.65 : 1)};
  /*
   * 드래그 정렬의 **유일한** 시각 신호. 예전에는 inset 0 0 0 2px brand 였는데, 활성 탭이 brand 로
   * 통째로 채워진 지금은 그 위에서 같은 색 테두리가 보이지 않는다 — 채널을 색이 아니라
   * **형태(파선 아웃라인)** 로 옮기고, 잉크만 면에 따라 갈랐다(솔리드 위에서는 on-brand).
   */
  outline: ${({ active, dragOver }) => (dragOver ? `2px dashed ${active ? color.onBrand : color.brandBorder}` : 'none')};
  outline-offset: -2px;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /* 손가락으로 쓰는 폭에서는 터치 타깃 하한(44px)까지 올린다. */
  ${media.down('tablet')} {
    min-height: 44px;
  }

  /* 활성 탭이 아래 결과 영역과 이어져 보이도록 래퍼의 밑줄을 덮는다.
     솔리드가 된 뒤로는 덮는 색도 채움과 같은 brand 다 — surface 로 두면 색면 바로 아래에 흰 실선이
     한 줄 남아 탭이 잘린 것처럼 보인다. */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: ${({ active }) => (active ? color.brand : 'transparent')};
  }

  &[draggable='true'] {
    cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
  }

  /* 활성 탭은 이미 목적지다 — 호버로 면색을 바꾸지 않는다(바꾸면 "누르면 더 있다"고 말한다).
     비활성 탭만 중립 호버 면을 받는다. */
  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? color.brand : color.surfaceHover)};
    color: ${({ active }) => (active ? color.onBrand : color.text)};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ScenarioTabRenameInput = styled.input`
  border: 0;
  background: transparent;
  color: ${color.text};
  padding: 0 ${space[4]} 0 0;
  min-height: 20px;
  min-width: 0;
  width: 100%;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  box-shadow: none;
  appearance: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

/**
 * 이름변경 중인 탭의 껍데기.
 *
 * 🔴 면이 중립(surface)인 것이 의도다 — **솔리드 면 위에 입력 필드를 얹지 않는다.** 입력하는 동안
 * 활성 탭은 L3 를 잠시 반납하고, 그래서 캐럿·선택 영역·× 버튼이 전부 검증된 중립 면 위에 선다
 * (brand 채움 위의 캐럿 색은 대비를 보장할 수 없다). 편집을 마치면 다시 솔리드로 돌아온다.
 */
export const ScenarioTabEditWrap = styled.div`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0;
  max-width: 160px;
  border: 1px solid ${color.border};
  border-bottom: 0;
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  white-space: nowrap;
`;

export const ScenarioTabCloseButton = styled.button`
  position: absolute;
  top: 50%;
  right: ${space[2]};
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${color.textMuted};
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs};
  padding: 0;
  line-height: 1;
  font-size: ${font.size.base};
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabTooltip = styled.div`
  position: fixed;
  z-index: ${zIndex.tooltip};
  pointer-events: none;
  max-width: 280px;
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  box-shadow: ${shadow.e3};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ScenarioTabsHelpButton = styled(HelpMarkButton)`
  align-self: center;
  flex: 0 0 auto;
  margin-left: ${space[2]};
`;
