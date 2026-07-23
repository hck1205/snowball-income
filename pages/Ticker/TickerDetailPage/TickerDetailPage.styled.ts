import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 액센트 스코프 + 스크롤 리빌 공통                                               */
/* -------------------------------------------------------------------------- */

/**
 * 티커별 액센트를 페이지 루트에 주입하는 스코프.
 *
 * 인라인 style 로 원시 값(`--tk-from/to/text-light/text-dark`)만 받고, 여기서 테마-인지 파생 변수
 * (`--tk-text/gradient/soft/border/active-bg/solid`)를 만든다. 장식 컴포넌트는 이 파생 변수만 참조하므로
 * **액센트 미지정 티커는 기본 브랜드 팔레트로 자동 폴백**한다(아래 기본값). soft/border 는 `--tk-text` 를
 * 서피스와 color-mix 해 파생해 라이트/다크 전환을 리렌더 없이 따라간다.
 */
export const AccentScope = styled.div`
  /* 기본(액센트 미지정) = 앱 브랜드 팔레트 */
  --tk-gradient: ${color.gradientAurora};
  --tk-text: ${color.brandText};
  --tk-soft: ${color.brandSubtle};
  --tk-border: ${color.brandBorder};
  --tk-active-bg: ${color.brandSubtle};
  --tk-solid: ${color.brand};

  &[data-accent='true'] {
    --tk-text: var(--tk-text-light);
    --tk-gradient: linear-gradient(120deg, var(--tk-from), var(--tk-to));
    --tk-solid: var(--tk-from);
    --tk-soft: color-mix(in srgb, var(--tk-text) 12%, ${color.surface});
    --tk-border: color-mix(in srgb, var(--tk-text) 40%, transparent);
    --tk-active-bg: color-mix(in srgb, var(--tk-text) 16%, ${color.surface});

    /* 다크 서피스에서는 액센트 기준색을 밝은 쪽으로 — soft/border 는 --tk-text 참조라 자동 반영. */
    @media (prefers-color-scheme: dark) {
      --tk-text: var(--tk-text-dark);
    }
    /* 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다. */
    :root[data-theme='light'] & {
      --tk-text: var(--tk-text-light);
    }
    :root[data-theme='dark'] & {
      --tk-text: var(--tk-text-dark);
    }
  }
`;

/** Apple 마케팅 페이지풍 이징 — 초기 가속 없이 길게 감속하며 안착. */
const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * 등장 키프레임 — **시간 기반 마운트 리빌(히어로)과 스크롤 기반 리빌(섹션)이 같은 키프레임을 공유**한다.
 * 은은하게: opacity 0→1, translateY 40px→0, scale 0.96→1. 과한 점프·바운스 없음.
 * (blur는 스크롤 연동 섹션에서 중간 스크롤 구간에 텍스트가 흐릿하게 남아 사용자 요청으로 제거 — 2026-07-22.)
 */
const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

/**
 * 히어로(첫 화면·above-the-fold) 요소용 **시간 기반 마운트 리빌**.
 *
 * `view()` 스크롤 타임라인은 로드 시점에 이미 뷰포트 안에 있는 요소를 애니메이트하지 못한다(entry 구간이
 * 이미 지나 있어 곧장 종료 상태로 스냅된다). 그래서 히어로는 스크롤 연동 대신 마운트 애니메이션으로
 * `$delay` stagger 한다 — CSS 애니메이션이라 JS 트리거가 필요 없고 전 브라우저에서 동작한다.
 */
export const HeroReveal = styled.div<{ $delay?: number }>`
  animation: ${revealIn} 900ms ${REVEAL_EASE} both;
  animation-delay: ${({ $delay = 0 }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* -------------------------------------------------------------------------- */
/* 히어로                                                                       */
/* -------------------------------------------------------------------------- */

export const Hero = styled.section`
  position: relative;
  display: grid;
  /* 단일 열을 히어로 박스에 묶는다 — 기본 auto 열은 max-content(긴 영문명/캡션 한 줄)로 커져,
     overflow:hidden 이 그걸 히어로 가장자리에서 잘라 "이름이 잘리는" 깨짐을 만든다. */
  grid-template-columns: minmax(0, 1fr);
  /* 히어로 다이어트 — 여백을 줄여 첫 화면에 덜 압도적으로 들어오게(구 gap space[5]/padding 24~40). */
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 32px);
  border: 1px solid var(--tk-border);
  border-radius: ${radius.xl};
  background: var(--tk-soft);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: var(--tk-gradient);
  }
`;

export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.xs};
  color: ${color.textMuted};

  a {
    color: var(--tk-text);
    text-decoration: none;
    font-weight: ${font.weight.medium};

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const HeroHead = styled.div`
  display: grid;
  /* minmax(0,1fr) 로 열을 뷰포트에 묶는다 — 기본 auto 열은 max-content(긴 영문명 한 줄)로 커져 히어로를 넘긴다. */
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[3]};
  min-width: 0;
`;

/** 페이지의 유일 `<h1>` — 서버 렌더러(renderHero)의 h1 과 대칭(위계 h1→h2→h3 유지). */
export const TickerBadge = styled.h1`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
`;

export const TickerSymbol = styled.span`
  /* 히어로 다이어트 — 상한 44px(6xl) → 36px, vw 계수·하한도 낮춰 데스크톱/모바일 모두 덜 크게. */
  font-size: clamp(26px, 4.5vw, 36px);
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric};
`;

export const TickerNames = styled.span`
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: var(--tk-text);
  /* 긴 영문명이 히어로를 넘겨 잘리지 않도록 flex 아이템을 줄이고 필요 시 줄바꿈시킨다. */
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const HeroTagline = styled.p`
  margin: 0;
  /* 히어로 다이어트 — 상한 2xl(20) → xl(18), 하한도 한 단계 낮춤. */
  font-size: clamp(15px, 2vw, ${font.size.xl});
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  max-width: 42ch;
`;

export const HeroStatGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space[3]};

  ${media.down('tablet')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /* 가장 좁은 티어에서도 트랙이 min-content 로 못 줄어 넘치는 일이 없게 minmax(0,·) 유지(1fr 1fr 금지). */
  ${media.down('mobile')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/**
 * 스탯 카드 — 히어로 안에서 `--card-i`(뷰가 주입) 순서대로 시간차 마운트한다(Apple 스탯 그리드 리듬).
 * 위쪽 HeroReveal 은 감싸지 않는다: 카드가 각자 stagger 하므로 이중 애니메이션을 피한다.
 */
export const HeroStat = styled.div`
  /* 카드 폭 기준 컨테이너 — 안쪽 폰트를 카드가 좁아질수록 cqi(카드 인라인 폭 %)로 유동 축소한다.
     container-type 은 contain: inline-size 라 카드 폭이 콘텐츠로 늘지도 않는다(오버플로 이중 방어). */
  container-type: inline-size;
  display: grid;
  gap: 2px;
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surface};
  border: 1px solid ${color.border};

  animation: ${revealIn} 760ms ${REVEAL_EASE} both;
  animation-delay: calc(200ms + var(--card-i, 0) * 80ms);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const HeroStatLabel = styled.dt`
  font-size: clamp(10px, 11cqi, ${font.size.xs});
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const HeroStatValue = styled.dd`
  margin: 0;
  /* 좁은 카드에서 큰 숫자를 한 줄로 유지하도록 카드 폭에 맞춰 축소(넘치면 overflow-wrap 이 마지막 방어).
     히어로 다이어트로 상한도 2xl(20) → xl(18). */
  font-size: clamp(13px, 12cqi, ${font.size.xl});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  overflow-wrap: anywhere;
  ${font.numeric};
`;

export const HeroStatCaption = styled.p`
  margin: 2px 0 0;
  font-size: clamp(9px, 10cqi, ${font.size['2xs']});
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* CTA 버튼(링크)                                                               */
/* -------------------------------------------------------------------------- */

export const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[3]};
  align-items: center;
`;

export const SecondaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[3]} ${space[5]};
  border-radius: ${radius.pill};
  background: transparent;
  color: var(--tk-text);
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  border: 1px solid var(--tk-border);

  &:hover {
    background: var(--tk-soft);
  }
`;

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃: 목차 + 본문                                                     */
/* -------------------------------------------------------------------------- */

export const Layout = styled.div`
  margin-top: clamp(28px, 4vw, 44px);
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    /* 모바일: 히어로와 sticky 목차 가로바 사이 상단 여백 축소(구 28~44px → 12px). 데스크톱 2단은 그대로. */
    margin-top: ${space[3]};
    gap: ${space[4]};
  }
`;

export const TocAside = styled.nav`
  position: sticky;
  /* 데스크톱 사이드바 — 앱 헤더 높이(--tk-header-h) + 약간의 여백 아래에 붙는다(하드코딩 84px 대체). */
  top: calc(var(--tk-header-h) + ${space[3]});
  align-self: start;
  min-width: 0;

  ${media.down('layout')} {
    position: sticky;
    /* ⚠ 앱 헤더 높이에 정확히 맞물린다 — 하드코딩 57px 은 티커 한 줄 헤더(≈48px)와 안 맞아
       헤더와 이 목차 바 사이에 빈 띠(갭)를 만들었다. 이제 헤더 바로 아래에 딱 붙는다. */
    top: var(--tk-header-h);
    z-index: 5;
    /* 화면 끝까지 번지게 하던 음수 마진(0 calc(4vw*-1))을 제거했다 — 뷰포트 단위 음수 마진이
       모바일 레이아웃 뷰포트를 스스로 넓히는 폭주(overflow) 루프의 씨앗이었다(490px대까지 확장).
       목차 바는 이제 본문 열 안에 머문다. */
    padding: ${space[2]} 0;
    background: ${color.surfaceGlassFallback};
    border-bottom: 1px solid ${color.border};
  }
`;

export const TocTitle = styled.p`
  margin: 0 0 ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${color.textMuted};

  ${media.down('layout')} {
    display: none;
  }
`;

export const TocList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;

  ${media.down('layout')} {
    /* 가로 스크롤 대신 줄바꿈 — 좁은 화면에서 목차 칩이 여러 줄로 접혀 전부 보인다(사용자 요청).
       옆으로 밀려 안 보이던 항목이 없어진다. */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

export const TocButton = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: none;
  cursor: pointer;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border-left: 2px solid ${({ $active }) => ($active ? 'var(--tk-solid)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'var(--tk-active-bg)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${({ $active }) => ($active ? font.weight.semibold : font.weight.medium)};
  line-height: ${font.leading.snug};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  ${media.down('layout')} {
    /* 줄바꿈 칩 — 내용 폭으로 줄어 한 줄에 여러 개가 들어가고 넘치면 다음 줄로 접힌다.
       (base의 width:100%를 auto로 풀지 않으면 flex 자식이 줄을 통째로 차지해 세로로만 쌓인다.)
       활성=액센트 채움 pill(base의 background/color 상속) + 액센트 테두리, 비활성=옅은 테두리 칩. */
    width: auto;
    white-space: nowrap;
    padding: ${space[1]} ${space[3]};
    border-radius: ${radius.pill};
    border: 1px solid ${({ $active }) => ($active ? 'var(--tk-solid)' : color.border)};
  }
`;

export const Content = styled.div`
  display: grid;
  gap: clamp(28px, 4vw, 44px);
  min-width: 0;
`;

/* -------------------------------------------------------------------------- */
/* 섹션                                                                         */
/* -------------------------------------------------------------------------- */

export const Section = styled.section<{ $revealed: boolean }>`
  scroll-margin-top: 96px;
  display: grid;
  gap: ${space[4]};

  /*
   * ── 폴백: scroll-driven 미지원 브라우저(구형 Safari 등)용 IntersectionObserver one-shot 리빌 ──
   * useInView 가 준 $revealed 로 한 번 등장하고 유지한다. 지원 브라우저에서는 아래 @supports 블록이
   * opacity/transform/filter/transition 을 통째로 덮어써 이 값들은 무시된다(JS 는 무해하게 계속 돈다).
   */
  opacity: ${({ $revealed }) => ($revealed ? 1 : 0)};
  transform: ${({ $revealed }) => ($revealed ? 'none' : 'translate3d(0, 40px, 0) scale(0.96)')};
  transition:
    opacity 900ms ${REVEAL_EASE},
    transform 900ms ${REVEAL_EASE};
  will-change: opacity, transform;

  /* 프로그램적 포커스 타깃(목차 점프 시 focus) — 얇은 링을 남긴다(outline:none 금지 규칙 취지). */
  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 6px;
    border-radius: ${radius.sm};
  }

  /*
   * ── scroll-driven: 뷰포트 진입 스크롤 진행도에 매여 서서히 안착(위로 되감으면 자연 역재생) ──
   * animation-timeline: view() 는 이 요소가 뷰포트를 가로지르는 진행도를 타임라인으로 삼는다.
   * duration 은 지정하지 않는다 — 스크롤 타임라인에서는 auto 가 곧 "animation-range 전체에 매핑"이다.
   */
  @supports (animation-timeline: view()) {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
    animation-name: ${revealIn};
    animation-fill-mode: both;
    animation-timing-function: ease-out;
    animation-timeline: view();
    animation-range: entry 0% cover 42%;
  }

  /* ── reduced-motion: 완전 정지(위 두 경로를 모두 덮도록 마지막에 둔다) ── */
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
    animation: none;
  }

  ${media.down('layout')} {
    scroll-margin-top: 120px;
  }
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size.xl}, 2.6vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const Paragraph = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const BulletList = styled.ul`
  margin: 0;
  padding-left: ${space[5]};
  display: grid;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.md};
  line-height: ${font.leading.snug};
`;

/** 섹션에 곁들이는 숫자 하이라이트 — 큰 값 + 라벨 + "왜 매력적인지" 캡션. */
export const StatHighlight = styled.figure`
  margin: 0;
  display: grid;
  gap: ${space[1]};
  padding: ${space[4]} ${space[5]};
  border-radius: ${radius.lg};
  border: 1px solid var(--tk-border);
  background: var(--tk-soft);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--tk-gradient);
  }
`;

export const StatHighlightLabel = styled.figcaption`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: var(--tk-text);
  order: -1;
`;

export const StatHighlightValue = styled.p`
  margin: 0;
  font-size: clamp(${font.size['3xl']}, 4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric};
`;

export const StatHighlightCaption = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* reference / FAQ / related / disclaimer                                      */
/* -------------------------------------------------------------------------- */

export const Panel = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 28px);
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

export const PanelHeading = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const FactGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

export const FactRow = styled.div`
  display: grid;
  gap: 2px;
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const FactLabel = styled.dt`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  font-weight: ${font.weight.medium};
`;

export const FactValue = styled.dd`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const SectorRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  align-items: center;
`;

export const SectorChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.accentSubtle};
  color: ${color.accentText};
  border: 1px solid ${color.accentBorder};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const AsOfNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const FaqList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const FaqItem = styled.details`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  overflow: hidden;

  &[open] {
    background: ${color.surface};
    border-color: ${color.borderStrong};
  }
`;

export const FaqSummary = styled.summary`
  cursor: pointer;
  list-style: none;
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '+';
    font-size: ${font.size.xl};
    font-weight: ${font.weight.regular};
    color: ${color.textMuted};
    transition: transform ${motion.fast} ${motion.ease};
  }

  details[open] &::after {
    content: '−';
  }
`;

export const FaqAnswer = styled.div`
  padding: 0 ${space[4]} ${space[4]};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

/** 콘텐츠 있는 관련 티커 — 링크 카드. */
export const RelatedCard = styled(Link)`
  display: grid;
  gap: 2px;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  text-decoration: none;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    border-color: var(--tk-border);
    background: var(--tk-soft);
  }
`;

/** 콘텐츠 없는 관련 티커 — 데드엔드 링크 대신 비링크 텍스트(서버 렌더러와 일치). */
export const RelatedStatic = styled.div`
  display: grid;
  gap: 2px;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
`;

export const RelatedTicker = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  letter-spacing: -0.02em;
`;

export const RelatedKorean = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const RelatedRelation = styled.span`
  margin-top: ${space[1]};
  font-size: ${font.size.sm};
  color: var(--tk-text);
  font-weight: ${font.weight.medium};
`;

export const Disclaimer = styled.footer`
  margin-top: ${space[4]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  display: grid;
  gap: ${space[2]};
`;

export const DisclaimerText = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

export const UpdatedAt = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;
