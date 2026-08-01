import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

export const AuthRoot = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
`;

export const SessionTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 36px;
  padding: 0 ${space[2]} 0 ${space[1]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  /*
   * 모바일(≤640px)에선 TriggerName이 display:none 이라 24px 아바타만 남는다. 이때 아바타+텍스트용
   * 비대칭 패딩(좌 4/우 8)이 아바타를 좌측으로 치우치게 하므로, 36px 정사각(=pill 반경→원형) 안에
   * 대칭 중앙 정렬로 되돌린다. TriggerName의 숨김 브레이크포인트(640px)와 반드시 일치해야 한다.
   */
  @media (max-width: 640px) {
    width: 36px;
    padding: 0;
    justify-content: center;
  }
`;

export const TriggerName = styled.span`
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Menu = styled.div`
  position: absolute;
  top: calc(100% + ${space[2]});
  right: 0;
  z-index: ${zIndex.dropdown};
  /* 테마 옵션(스와치+라벨+✓)이 잘리지 않게 넉넉히 — 테마 팝오버(208px)와 맞춘다. */
  min-width: 208px;
  padding: ${space[1]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};
  display: grid;
  gap: 2px;
`;

export const MenuHeader = styled.div`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  margin-bottom: ${space[1]};

  strong {
    display: block;
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  width: 100%;
  min-height: 40px;
  padding: 0 ${space[3]};
  border: 0;
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.sm};
  text-align: left;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

  svg {
    color: ${color.textMuted};
    flex: 0 0 auto;
  }
`;

/*
 * 구 `ThemeMenuLabel` · `ThemeCaret` · `ThemePanel`(프로필 드롭다운 안 테마 디스클로저)은 삭제됐다.
 * 테마 진입점은 오래전에 이 드롭다운을 떠났고(→ `⋯` 메뉴 → 2026-07-31 `AppHeader` 오른쪽 상시 노출),
 * 이 스타일들만 호출부 0인 채로 남아 있었다. 테마는 로그인 여부와 무관한 기능이라 여기로 돌아오지 않는다.
 */
