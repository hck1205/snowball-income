import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, media, pageHueMix, radius, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* -------------------------------------------------------------------------- */
/* 본문 한 장(章) — 번호 · 제목 · 리드 · 문단 · 주의                              */
/* -------------------------------------------------------------------------- */

const REVEAL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

/**
 * 장 하나.
 *
 * 등장 연출은 **두 겹**이다. 스크롤 타임라인을 지원하는 브라우저는 진행도에 매인 애니메이션을 쓰고,
 * 그렇지 않으면 IntersectionObserver 가 준 `$shown` 으로 한 번 등장한다.
 *
 * 🔴 연출이 실패하면 그것은 "연출이 없는 화면"이 아니라 **"내용이 없는 화면"** 이다. 그래서
 * `useRevealOnScroll` 은 안전망 타이머를 갖고, reduced-motion 은 아래에서 두 경로를 모두 덮는다.
 */
export const Section = styled.section<{ $shown: boolean }>`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
  /* 목차로 점프했을 때 제목이 앱 헤더 밑에 가리지 않게. */
  scroll-margin-top: calc(var(--sb-app-header-h, 64px) + ${space[4]});

  opacity: ${({ $shown }) => ($shown ? 1 : 0)};
  transform: ${({ $shown }) => ($shown ? 'none' : 'translate3d(0, 24px, 0)')};
  transition:
    opacity 640ms ${REVEAL_EASE},
    transform 640ms ${REVEAL_EASE};

  /* 프로그램적 포커스 타깃(목차 점프) — 얇은 링을 남긴다. */
  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 8px;
    border-radius: ${radius.sm};
  }

  @supports (animation-timeline: view()) {
    opacity: 1;
    transform: none;
    transition: none;
    animation-name: ${revealIn};
    animation-fill-mode: both;
    animation-timing-function: ease-out;
    animation-timeline: view();
    animation-range: entry 0% cover 34%;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
    animation: none;
  }

  ${media.down('layout')} {
    scroll-margin-top: calc(var(--sb-app-header-h, 64px) + 56px);
  }
`;

export const SectionHead = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 장 머리의 번호 줄 — 번호 배지 + 짧은 이름 + 뒤로 뻗는 헤어라인.
 *
 * 종전에는 제목 하나뿐이라 "문서가 몇 장으로 이뤄졌는지"를 본문 안에서 알 수 없었다. 번호는
 * 목차 레일의 번호와 **같은 값**이라, 레일을 보지 않아도 자기 위치가 읽힌다.
 */
export const SectionEyebrow = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.textMuted};
  ${font.numeric};

  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.border};
  }
`;

/**
 * 번호 배지. 페이지 hue 가 본문에서 드러나는 자리다.
 *
 * ⚠ 면은 hue 파생(14%)이고 글자는 검증된 `text` 다 — hue 를 글자색으로 쓰지 않는다
 *   (표시색 토큰은 3:1 비텍스트 계약만 갖는다, shared/styles/pageHue.ts).
 */
export const SectionIndex = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  padding: 2px 6px;
  border-radius: ${radius.sm};
  background: ${pageHueMix(16)};
  color: ${color.text};
  letter-spacing: 0.04em;
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size['2xl']}, 2.8vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  max-width: 24ch;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 첫 문단은 **리드**다 — 한 단 크고 진하다.
 *
 * 📝 굵기로는 위계를 만들 수 없다(display 서체에 중간 굵기가 없어 600/700/800 이 같게 렌더된다).
 * 위계는 크기·색·간격뿐이다 — 이 레포의 확정 사실이다.
 */
export const Lead = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: clamp(${font.size.base}, 1.2vw, ${font.size.lg});
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;
`;

export const Paragraph = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

/**
 * 장 끝의 주의 한 줄.
 *
 * ⚠ 경고색을 쓰지 않는다 — 이 문장들은 "위험"이 아니라 **읽는 법**이다(배당률이 오르는 이유 같은 것).
 * 색 대신 **왼쪽 레일과 옅은 면**이 이 줄을 본문에서 떼어 놓는다.
 */
export const Caution = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  padding: ${space[3]} ${space[4]};
  border-left: 3px solid ${color.borderStrong};
  border-radius: 0 ${radius.sm} ${radius.sm} 0;
  background: ${color.surfaceHover};
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;
