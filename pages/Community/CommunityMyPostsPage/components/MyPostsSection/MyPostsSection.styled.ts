import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  PICK,
  PICK_RADIUS,
  color,
  font,
  media,
  motion,
  pickLift,
  pickTitleFontSize,
  radius,
  space
} from '@/shared/styles';

/* ==========================================================================
   내 글 아카이브
   --------------------------------------------------------------------------
   구 구조는 흰 카드 한 장 안에 40px 짜리 텍스트 행이 4px 간격으로 붙어 있는 것이었다.
   글이 세 개만 넘어가도 제목·배지·메타가 한 덩어리로 뭉쳐 "어느 것이 비공개인지"를 배지
   글자를 읽어야만 알 수 있었다 — 이 화면의 존재 이유가 바로 그 구분인데도.

   새 구조:
     ① 공개 범위 필터 레일(전체/공개/비공개)이 **목록 밖**에 선다 — 개수를 세는 동시에 고른다.
     ② 목록은 행이 아니라 **카드 격자**다(760px 이상 2열). 각 카드는 좌측 세로 표식을 갖고,
        비공개는 색이 아니라 **해칭 패턴 + 자물쇠 글리프 + 배지 글자** 세 채널로 말한다.
     ③ 빈 상태·필터 무결과·로딩·에러가 각각 다른 화면을 갖는다(구 화면은 전부 한 줄이었다).
   ========================================================================== */

export const SectionRoot = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/* ── 필터 레일 (Section 밖 — 목록은 읽는 면, 필터는 고르는 면) ──────────────── */

export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/**
 * 필터 알약. 폭이 180px 을 넘지 않으므로 활성 상태의 채움은 색면 예산에 잡히지 않는다.
 * 활성은 채움 + 굵기 + aria-pressed 로 말한다(색 단독 채널 금지).
 */
export const FilterChip = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 40px;
  padding: 0 ${space[4]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ active }) => (active ? 'transparent' : color.border)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.semibold)};
  cursor: pointer;
  transition:
    background-color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${({ active }) => (active ? 'transparent' : color.borderStrong)};
    color: ${({ active }) => (active ? color.onBrand : color.text)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const FilterCount = styled.span`
  color: inherit;
  opacity: 0.85;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/* ── 목록 면 (data) ───────────────────────────────────────────────────────── */

export const Section = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[4]}, 2.2vw, ${space[6]});
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  min-width: 0;
`;

/** 비공개 안내 — 이 화면의 전제라 상태와 무관하게 상시 노출한다. */
export const Hint = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  word-break: keep-all;

  svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: ${color.textMuted};
  }
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
`;

/**
 * 글 카드. 카드 전체가 상세로 가는 링크라 안에 버튼을 두지 않는다
 * (공개 전환 같은 되돌리기 어려운 동작은 상세/수정 화면이 소유한다).
 */
export const ItemLink = styled(Link, {
  /* Emotion 은 styled(Component) 에서 모든 prop 을 그대로 넘긴다(styled-components 의 `$` 관례가 없다).
     라우터 Link 는 남는 prop 을 DOM 으로 흘리므로 표시 전용 prop 은 여기서 끊는다. */
  shouldForwardProp: (prop) => prop !== '$isPublic'
})<{ $isPublic: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  height: 100%;
  padding: ${PICK.pad};
  padding-left: calc(${PICK.pad} + 4px);
  border-radius: ${PICK_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition:
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  /*
   * 좌측 세로 표식. 공개는 실선 액센트, 비공개는 **해칭 패턴**이다 —
   * 회색조로 인쇄해도 두 카드가 구분된다(색이 유일한 채널이 되지 않는다).
   */
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${({ $isPublic }) =>
      $isPublic
        ? color.accentAlt
        : `repeating-linear-gradient(135deg, ${color.borderStrong} 0 3px, transparent 3px 7px)`};
  }

  &:hover {
    ${pickLift}
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const ItemTopRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/** 글 종류(갤러리/게시판) — 중립 알약. 분류는 색이 아니라 글리프 + 글자가 진다. */
export const KindChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/**
 * 공개/비공개 배지 — **라벨 텍스트와 글리프를 항상 동반**하므로 색은 세 번째 채널일 뿐이다.
 * 비공개는 중립 톤(sunken)으로 "남에게 안 보임"을, 공개는 accentAlt 정보 배지를 쓴다.
 */
export const VisibilityBadge = styled.span<{ isPublic: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${({ isPublic }) => (isPublic ? color.accentAltSubtle : color.surface)};
  border: 1px solid ${({ isPublic }) => (isPublic ? color.accentAltBorder : color.borderStrong)};
  color: ${({ isPublic }) => (isPublic ? color.accentAltText : color.textSecondary)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/**
 * 카드에서 읽히는 유일한 이름이라 목록 본문(13px)이 아니라 **고르는 카드 제목 크기**를 쓴다
 * (16~20px). 구 화면에서 제목이 배지와 같은 무게였던 것이 위계 부재의 핵심이었다.
 */
export const ItemTitle = styled.strong`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${pickTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const ItemExcerpt = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  word-break: keep-all;
`;

/** 카드 바닥 — 시간(좌) / 반응 수치(우). 카드 높이가 달라도 바닥선은 맞는다. */
export const ItemFoot = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: auto;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}

  time {
    color: inherit;
  }
`;

export const ItemStats = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
`;

export const ItemStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${color.textMuted};
  ${font.numeric}
`;

/* ── 로딩 ─────────────────────────────────────────────────────────────────── */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

export const SkeletonList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
`;

/** 자리표시자는 **실제 카드와 같은 기하**를 쓴다 — 채워질 때 레이아웃이 튀지 않는다. */
export const SkeletonCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: ${PICK.pad};
  padding-left: calc(${PICK.pad} + 4px);
  border-radius: ${PICK_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  animation: ${pulse} 1.4s ${motion.ease} infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SkeletonBar = styled.span<{ w: string; h: string }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

/* ── 빈 상태 ──────────────────────────────────────────────────────────────── */

/**
 * 아직 아무 글도 없는 상태 = **고장이 아니라 시작 전**이다. 그래서 이 자리는 brand 면이고,
 * 마스코트가 사는 이 화면의 유일한 자리다(목록이 채워지면 사라진다).
 */
export const EmptyRoot = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[4]};
  padding: clamp(${space[8]}, 7vw, ${space[16]}) ${space[5]};
  text-align: center;
  border-radius: ${PICK_RADIUS};
  border: 1px dashed ${color.border};
  background: ${color.gradientHeroSoft};
`;

/**
 * 마스코트는 **맨몸으로** 선다 — 원형 배지에 가두지 않는다.
 * 커뮤니티 피드(`FeedStates.EmptyMark`)·포폴 빈 상태와 같은 어휘여야 한 제품으로 읽힌다.
 * (배지를 씌우면 같은 96px 마크가 이 화면에서만 작아 보인다.)
 */
export const EmptyGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  color: ${color.identity};
`;

export const EmptyTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const EmptySubtitle = styled.p`
  margin: 0;
  max-width: 36ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${space[2]};
`;

/** 빈 상태의 다음 행동. 링크지만 버튼처럼 눌러진다(이동이므로 anchor 가 옳다). */
export const EmptyAction = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$primary'
})<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[5]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ $primary }) => ($primary ? 'transparent' : color.border)};
  background: ${({ $primary }) => ($primary ? color.brand : color.surface)};
  color: ${({ $primary }) => ($primary ? color.onBrand : color.text)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition:
    background-color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $primary }) => ($primary ? color.brandHover : color.surfaceHover)};
  }
`;

/* ── 필터 무결과 (글은 있는데 이 범위에만 없다) ──────────────────────────────── */

export const FilterEmpty = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: ${space[10]} ${space[5]};
  text-align: center;
  border-radius: ${radius.lg};
  border: 1px dashed ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const RetryRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: ${space[2]};
`;
