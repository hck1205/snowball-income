import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/** 트리거 + 드롭다운을 묶는 기준점. 바깥 클릭 판정(rootRef)과 뱃지 위치의 기준이다. */
export const MenuRoot = styled.div`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
`;

/**
 * 첫 방문 유도 점 — "더보기" 트리거 모서리에 건다. 자동 팝업 대신 이 점만으로 튜토리얼의 존재를 알린다.
 * 트리거가 MenuRoot의 유일한 인플로우 요소라(드롭다운은 absolute), 그 우상단 모서리에 정확히 얹힌다.
 *
 * `aria-hidden` + `pointer-events: none`: 시각 힌트일 뿐이라 스크린리더/클릭 대상에서 뺀다.
 * 상태는 트리거의 aria-label이 말한다.
 */
export const NewDot = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: ${radius.pill};
  /* "새 것" 신호는 accent — 포커스/선택 의미의 brand와 어휘를 분리한다(테마 프리셋 공통). */
  background: ${color.accent};
  /* 아이콘 위에 겹쳐도 점으로 읽히도록 서피스 색 링을 두른다. */
  border: 2px solid ${color.surface};
  pointer-events: none;
`;

/** 우측 정렬 드롭다운 패널. AuthControl 드롭다운과 같은 시각 언어(자체 styled). */
export const Menu = styled.div`
  position: absolute;
  top: calc(100% + ${space[2]});
  right: 0;
  z-index: ${zIndex.dropdown};
  min-width: 200px;
  padding: ${space[1]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};
  display: grid;
  gap: 2px;
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
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

  &:disabled {
    color: ${color.textMuted};
    cursor: default;
  }

  svg {
    color: ${color.textMuted};
    flex: 0 0 auto;
  }
`;

/** "테마" 디스클로저 라벨 — 남은 폭을 채워 캐럿을 우측으로 민다. */
export const ThemeMenuLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

/** 펼침 캐럿 — 펼쳐지면 180° 회전. */
export const ThemeCaret = styled.span<{ open: boolean }>`
  display: inline-flex;
  align-items: center;
  color: ${color.textMuted};
  transition: transform ${motion.fast} ${motion.ease};
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;

/**
 * 테마 옵션 패널 — 드롭다운 안에 인라인 radiogroup을 담는다(팝오버 중첩 회피).
 * 프리셋 8종이 길면 이 패널만 스크롤한다(드롭다운 전체가 아니라).
 */
export const ThemePanel = styled.div`
  max-height: min(50vh, 320px);
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 2px;
`;

/**
 * 메뉴 항목 라벨 — 남은 폭을 채워 우측 슬롯(스피너 등)을 끝으로 민다.
 * `ThemeMenuLabel`과 역할이 같지만 이름이 상태를 말하도록 분리해 둔다.
 */
export const MenuItemLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

/**
 * 비활성 사유 캡션. `disabled` 요소는 `title` 툴팁이 뜨지 않으므로 사유를 **본문으로** 보여주고,
 * 메뉴 항목에서 `aria-describedby`로 연결한다.
 */
export const MenuCaption = styled.p`
  margin: 0;
  padding: 0 ${space[3]} ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  max-width: 240px;
`;

/** 실패 알림 — 메뉴를 닫지 않고 그 자리에서 사유와 재시도를 보여준다(무음 실패 금지). */
export const MenuAlert = styled.div`
  display: grid;
  gap: ${space[2]};
  margin: 2px;
  padding: ${space[3]};
  border: 1px solid ${color.danger};
  border-radius: ${radius.sm};
  background: ${color.dangerSurface};
  color: ${color.text};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

/** 스크린리더 전용 상태 안내(role=status) — 아이콘 회전만으로 진행 상태를 말하지 않는다. */
export const MenuLiveStatus = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

/**
 * 진행 스피너. `prefers-reduced-motion`에서는 회전을 멈춘다 — 전역 reduced-motion 리셋은
 * `transition-duration`만 덮고 `animation`은 건드리지 않으므로 여기서 직접 끈다.
 */
export const MenuSpinner = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${color.textMuted};
  animation: sb-overflow-spin 900ms linear infinite;

  @keyframes sb-overflow-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 설치 가이드 모달의 단계 목록 — 시맨틱 `<ol>`. ModalBody(p) 대신 순서 있는 안내를 담는다. */
export const GuideList = styled.ol`
  margin: 0;
  padding-left: ${space[5]};
  display: grid;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;
