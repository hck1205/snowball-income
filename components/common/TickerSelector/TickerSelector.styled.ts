import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  TOUCH_TARGET,
  color,
  font,
  media,
  motion,
  pressTransition,
  pressable,
  radius,
  shadow,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';

/* ── 행 체크박스 ───────────────────────────────────────────────────────────── */

/**
 * 표의 첫 열에 서는 체크박스.
 *
 * 🔴 `<input type="checkbox">` 를 그대로 쓴다. 커스텀 그림으로 바꾸면 키보드·스크린리더·자동완성이
 * 전부 직접 구현 대상이 되는데, 이 화면에서 얻는 것은 모양뿐이다.
 * ⚠ 라벨이 시각적으로 없으므로 **터치 타겟은 라벨이 만든다**(체크박스 자체는 작게 둔다).
 */
export const CheckboxLabel = styled.label<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${TOUCH_TARGET};
  min-height: ${TOUCH_TARGET};
  margin: calc(-1 * ${space[2]}) 0;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

/**
 * 체크박스를 세울 수 없는 줄에 **대신 서는 자리**(`—`).
 *
 * 🔴 위 `CheckboxLabel` 과 **똑같은 상자**를 차지한다. 종전에는 화면마다 맨몸 `span` 이라 셀의
 * 정렬을 그대로 따랐는데(첫 열은 왼쪽, 숫자 열은 오른쪽), 체크박스는 44px 상자 **한가운데**에
 * 서므로 같은 열에서 `—` 만 22px 씩 밀려 보였다(2026-08-14 사용자 지시: "가운데 정렬로").
 * 정렬값을 따로 주는 대신 상자를 맞추면, 셀의 정렬이 무엇이든 둘이 항상 같은 자리에 선다.
 *
 * ⚠ `min-height`/`margin` 까지 같게 두는 이유는 **행 높이**다 — 상자가 작으면 티커를 모르는 줄만
 *   낮아져 표가 들쭉날쭉해진다.
 */
export const UnknownSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${TOUCH_TARGET};
  min-height: ${TOUCH_TARGET};
  margin: calc(-1 * ${space[2]}) 0;
  color: ${color.textMuted};
  font-family: ${font.sans};
  font-size: ${font.size.xs};
  cursor: help;
`;

export const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${color.brand};
  cursor: inherit;

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/* ── 하단 바 ───────────────────────────────────────────────────────────────── */

/**
 * 화면 하단에 고정되는 선택 바.
 *
 * 🔴 선택이 하나도 없으면 **렌더 자체를 하지 않는다**(컴포넌트가 `null` 을 낸다). 빈 바를 띄워 두면
 * 아무것도 안 고른 사용자에게 영구 배너가 되고, 모바일에서는 본문 한 줄을 상시로 가린다.
 *
 * ⚠ `zIndex.stickyAction`(10)이 아니라 `dropdown`(20)이다 — 같은 층에 두면 오른쪽 아래에 겹치는
 *   `ScrollTopButton`(fixed, stickyAction)과 순서가 DOM 에 의해 정해져 화면마다 달라진다.
 *   헤더(30)보다는 낮게 유지해 스크롤 시 헤더가 항상 위에 남는다.
 * ⚠ `env(safe-area-inset-bottom)` 은 iOS 홈바 대비다(`ScrollTopButton` 과 같은 처방).
 */
export const BarRoot = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${zIndex.dropdown};
  display: flex;
  justify-content: center;
  padding: ${space[3]};
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + ${space[3]});
  pointer-events: none;
`;

export const BarPanel = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  width: min(1200px, 100%);
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.lg};
  background: ${color.surfaceRaised};
  /* 본문 위에 떠 있는 층이므로 가장 높은 고도를 쓴다 — 그림자가 얕으면 표에 붙어 보인다. */
  box-shadow: ${shadow.e3};
  pointer-events: auto;

  ${media.down('tablet')} {
    flex-wrap: wrap;
    gap: ${space[2]};
  }
`;

/** 고른 티커 칩들. 넘치면 가로 스크롤 — 줄바꿈으로 바가 화면을 반쯤 덮는 것보다 낫다. */
export const BarChips = styled.ul`
  display: flex;
  flex: 1;
  gap: ${space[2]};
  min-width: 0;
  margin: 0;
  padding: 0;
  overflow-x: auto;
  list-style: none;
  /* 🔴 생 overflow 만 두면 각진 네이티브 스크롤바가 나온다 — 공용 믹스인이 모양의 유일한 출처다. */
  ${subtleScrollbar};
`;

export const BarChip = styled.li`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[1]} ${space[1]} ${space[3]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

export const ChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: ${radius.pill};
  background: transparent;
  color: inherit;
  cursor: pointer;
  line-height: 1;

  &:hover {
    background: ${color.brandSubtleHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const BarCount = styled.span`
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  white-space: nowrap;

  ${media.down('tablet')} {
    order: -1;
  }
`;

export const BarActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${space[2]};
`;

export const ClearButton = styled.button`
  padding: ${space[2]} ${space[3]};
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  cursor: pointer;
  ${pressTransition};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 비교하기 CTA.
 *
 * 🔴 최소 개수를 못 채웠을 때 **링크를 그리지 않는다**(호출부가 `HintText` 로 바꿔 그린다).
 * 눌리지 않는 링크를 남겨 두면 "왜 안 되지"를 사용자가 추측해야 한다.
 */
export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  min-height: ${TOUCH_TARGET};
  padding: 0 ${space[4]};
  border-radius: ${radius.md};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  white-space: nowrap;
  /* 🔴 누름 mixin 은 transition 을 선언하지 않는다 — 여기서 background 전환과 함께 pressTransition 을
     한 목록에 담아야 누름 scale 이 애니메이션된다(가드: test/shared/pressTransition.test.ts). */
  transition: background-color ${motion.fast} ${motion.ease}, ${pressTransition};
  ${pressable};

  &:hover {
    background: ${color.brandHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 최소 개수 미달 안내. CTA 자리에 **대신** 들어간다(같은 자리를 두 상태가 나눠 쓴다). */
export const BarHint = styled.span`
  flex: 0 0 auto;
  padding: 0 ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  white-space: nowrap;
`;
