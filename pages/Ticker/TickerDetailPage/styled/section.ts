import styled from '@emotion/styled';
import { DATA_RADIUS, cardElevation, color, font, media, radius, space } from '@/shared/styles';
import { MEASURE, RAIL } from './metrics';
import { REVEAL_EASE, revealIn } from './motion';

/* -------------------------------------------------------------------------- */
/* 섹션 — 번호 붙은 장                                                          */
/* -------------------------------------------------------------------------- */

export const Section = styled.section<{ $revealed: boolean }>`
  scroll-margin-top: 96px;
  display: grid;
  gap: ${space[4]};

  /*
   * ── 폴백: scroll-driven 미지원 브라우저(구형 Safari 등)용 IntersectionObserver one-shot 리빌 ──
   * useInView 가 준 $revealed 로 한 번 등장하고 유지한다. 지원 브라우저에서는 아래 @supports 블록이
   * opacity/transform/transition 을 통째로 덮어써 이 값들은 무시된다(JS 는 무해하게 계속 돈다).
   */
  opacity: ${({ $revealed }) => ($revealed ? 1 : 0)};
  transform: ${({ $revealed }) => ($revealed ? 'none' : 'translate3d(0, 24px, 0)')};
  transition:
    opacity 720ms ${REVEAL_EASE},
    transform 720ms ${REVEAL_EASE};

  /* 프로그램적 포커스 타깃(목차 점프 시 focus) — 얇은 링을 남긴다(outline:none 금지 규칙 취지). */
  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 8px;
    border-radius: ${radius.sm};
  }

  /*
   * ── scroll-driven: 뷰포트 진입 스크롤 진행도에 매여 서서히 안착(위로 되감으면 자연 역재생) ──
   * duration 은 지정하지 않는다 — 스크롤 타임라인에서는 auto 가 곧 "animation-range 전체에 매핑"이다.
   */
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

  /* ── reduced-motion: 완전 정지(위 두 경로를 모두 덮도록 마지막에 둔다) ── */
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
    animation: none;
  }

  ${media.down('layout')} {
    scroll-margin-top: 120px;
  }
`;

/**
 * 장 머리 — 번호 줄 + 제목.
 *
 * 종전에는 제목 왼쪽 4px 레일 하나가 전부였다. 레일은 "여기가 제목"만 말하고 **문서가 몇 장으로
 * 이뤄졌는지**는 말하지 못한다. 번호 + 가로 헤어라인이 그 일을 한다(목차의 번호와 같은 값).
 */
export const SectionHead = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const SectionEyebrow = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tk-text);
  ${font.numeric};

  /* 번호 뒤로 뻗는 헤어라인 — 장의 시작을 가로선으로도 말한다. */
  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.border};
  }
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['3xl']}, 3.2vw, ${font.size['5xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.035em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  max-width: 22ch;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 첫 문단은 **리드**다 — 한 단 크고 진하다. 나머지 문단과 같은 무게면 장이 어디서 시작하는지
 * 눈이 못 잡는다(굵기로는 위계를 만들 수 없다 — display 서체가 Bold 한 벌뿐이라 600/700/800 이
 * 같게 렌더된다. 위계는 크기·색·간격뿐이다).
 */
export const Lead = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: clamp(${font.size.lg}, 1.3vw, ${font.size.xl});
  line-height: ${font.leading.relaxed};
  color: ${color.text};
`;

export const Paragraph = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.lg};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

/**
 * 근거 불릿 — 기본 disc 마커를 버리고 액센트 사각 마커를 쓴다. 마커가 티커 색이라 본문 안에서
 * "이 목록은 이 티커 이야기"라는 신호가 되고, 회색조에서도 모양(사각)이 남는다.
 */
export const BulletList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[3]};
  max-width: ${MEASURE};

  li {
    position: relative;
    padding-left: ${space[5]};
    color: ${color.textSecondary};
    font-size: ${font.size.lg};
    line-height: ${font.leading.relaxed};
  }

  li::before {
    content: '';
    position: absolute;
    left: 0;
    /* 첫 줄 잉크 중심에 맞춘 값 — 폰트 크기 × 줄간의 절반에서 마커 절반을 뺀다. */
    top: calc(${font.size.lg} * ${font.leading.relaxed} / 2 - 3px);
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: var(--tk-solid);
  }
`;

/**
 * 섹션 숫자 하이라이트 — **틴트 면에서 중립 밴드로** 바꿨다.
 *
 * 🔴 종전에는 이것이 티커 틴트 면이었고, SCHD 기준 한 화면에 4개가 서서 tintscan 5면(상한 2)의
 * 직접 원인이었다. 색을 뺀 자리는 **기하와 타이포**가 채운다 — 왼쪽 4px 레일, 값·라벨의 2열 배치,
 * 값의 히어로급 크기. 색면 없이도 이 블록이 문단 사이에서 가장 먼저 눈에 들어온다.
 */
export const StatBand = styled.figure`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: clamp(16px, 2.4vw, 32px);
  padding: clamp(16px, 2vw, 24px) clamp(18px, 2.4vw, 28px);
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
  border-left: ${RAIL} solid var(--tk-solid);
  max-width: ${MEASURE};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const StatBandValue = styled.p`
  margin: 0;
  font-size: clamp(${font.size['4xl']}, 4vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: 1;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

export const StatBandBody = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const StatBandLabel = styled.figcaption`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: var(--tk-text);
`;

export const StatBandCaption = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;
