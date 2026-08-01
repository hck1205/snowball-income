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

/*
 * 구 `ThemeMenuLabel` · `ThemeCaret` · `ThemePanel`(메뉴 안 테마 디스클로저)은 2026-07-31 에 삭제됐다 —
 * 테마 스위처가 `AppHeader` 오른쪽 상시 노출로 승격하면서 이 메뉴에는 테마 항목 자체가 없다.
 */

/** 메뉴 항목 라벨 — 남은 폭을 채워 우측 슬롯(스피너 등)을 끝으로 민다. */
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
 * PDF 리포트 생성 중 스피너.
 *
 * 🔴 구 주석은 *"전역 reduced-motion 리셋은 `transition-duration`만 덮고 `animation`은 건드리지
 * 않는다"* 고 적었는데 **사실이 아니다** — `globalStyles.ts` 는 `animation-duration: 0.01ms` 와
 * `animation-iteration-count: 1` 을 **`!important` 로** 건다. 즉 아래 `animation: none` 이 없어도
 * 회전은 어차피 첫 바퀴에서 얼어붙었다. 이 오해가 레포 여러 곳에 복제돼 있었다(2026-07-30 정정).
 *
 * 여기는 라벨이 "리포트 만드는 중…"으로 **켜져 있어** 정적 단서가 이미 있다. 그래도 회전을 완전히
 * 끄지 않고 **불투명도 펄스로 되찾는** 이유: 정적 텍스트는 "시작했다"만 말하고 "**아직 살아 있다**"를
 * 말하지 못한다. 리포트 생성은 수 초가 걸려서(html2canvas + 폰트 대기) 아무 것도 변하지 않으면
 * 멈춘 것으로 읽힌다. 펄스는 움직임이 없어 전정계에 안전하다(선례 `Button.styled.ts`).
 *
 * ⚠ 되찾으려면 `animation-duration`·`animation-iteration-count` 를 `!important` 로 **회수**해야 한다
 * (`MainContentLoader.styled.ts` 가 확립한 패턴). 이름만 바꾸면 여전히 0.01ms 1회로 끝난다.
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

  @keyframes sb-overflow-busy-pulse {
    50% {
      opacity: 0.35;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation-name: sb-overflow-busy-pulse;
    animation-timing-function: ${motion.ease};
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
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
