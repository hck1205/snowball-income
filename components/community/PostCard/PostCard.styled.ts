import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, shadow, space } from '@/shared/styles';
import {
  FEED_INNER_RADIUS,
  FEED_PADDING,
  FEED_RADIUS,
  FEED_SHADOW,
  feedHeroHover,
  feedRail
} from '@/components/community/FeedSurface';

/**
 * velog 글 카드 — 프리뷰 없이 제목부터 시작하는 콘텐츠 카드.
 * border 없이 그림자 + 서피스 밝기 사다리로 뜬다(전 프리셋 bg≠surface 실측 검증).
 * focus 링은 전역 a:focus-visible 규칙을 그대로 쓴다(여기서 outline을 건드리지 않는다).
 *
 * 반경·평상시 그림자는 `FeedSurface` 에서 온다 — **리스트 행(PostRow)과 같은 재질을 쓰기 위해서다**
 * (갤러리 우상단 토글이 이 둘을 왕복한다). 구 주석의 "radius.xs(4px)는 의도적 — 도구 카드와
 * 구분되는 콘텐츠 카드 형태"는 2026-07-30 사용자 신고("프리뷰 면이 직각으로 읽힌다")로 폐기됐고,
 * 지금은 동심 규칙에서 역산한 24px 이다(`FeedSurface.ts` 의 `FEED_RADIUS`).
 */
export const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: ${FEED_PADDING} ${FEED_PADDING} 0; /* 하단 0 — 푸터가 자체 패딩을 갖는다 */
  border-radius: ${FEED_RADIUS};
  background: ${color.surface};
  box-shadow: ${FEED_SHADOW};
  overflow: hidden;
  text-decoration: none;
  color: inherit;

  /* 모션 축소 사용자에게도 hover 피드백은 남긴다 — 이동 없이 그림자 변화만. */
  &:hover {
    box-shadow: ${shadow.e3};
  }

  /* 숫자 판의 hover 반응(면색 + 캡슐 두께). 캡슐이 없는 안에서는 전부 no-op 이다. */
  ${feedHeroHover}

  /*
   * 들어올림은 **진짜 포인터가 있을 때만**.
   *
   * 터치에서는 탭이 :hover 를 발화시키고 그 상태가 **다른 곳을 누를 때까지 남는다** — 카드가
   * 들린 채로 굳고, 뒤로가기로 돌아와도 여전히 들려 있다. 색·그림자 hover 는 남아도 무해하지만
   * 이동은 눈에 띄게 잘못돼 보인다.
   *
   * 이동량도 8px → 2px 로 줄인다. 8px 은 힌트가 아니라 점프고, 카드 격자를 훑으면 화면이
   * 출렁인다. 형제 컴포넌트(PostRow · TickerHubPage)는 이미 2px 이라 이쪽이 예외였다.
   */
  @media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) {
    transition: transform ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease};

    &:hover {
      transform: translateY(-2px);
    }
  }
`;

/**
 * 시뮬 프리뷰 블록(스펙 §E2) — velog 썸네일 슬롯에 숫자를 얹는다. 조용한 판(surfaceSunken) 위에
 * 숫자가 색 없이 서게 한다 — **그라데이션·brand 채움 금지**(확정 규칙, 여기 색을 넣지 마라).
 *
 * **카드 패딩 안의 인셋 타일**이다(구 full-bleed 폐기). DESIGN.md §6 동심 라운드가 이 형태를
 * 정한다: 타일이 자기 반경 8px(`FEED_INNER_RADIUS`)을 갖고, 바깥(카드)이 `8 + 16 = 24px` 로
 * 커진다. 인셋되면 카드 여백이 본문과의 분리를 대신하므로 **하단 hairline 은 없다** —
 * 남기면 여백과 선이 두 겹으로 읽힌다.
 *
 * `position: relative` 는 좌측 오로라 캡슐(`feedRail`)의 기준면이다.
 */
export const PreviewBlock = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 132px;
  margin: 0 0 ${space[3]};
  padding: ${space[3]} ${space[4]};
  border-radius: ${FEED_INNER_RADIUS};
  background: ${color.surfaceSunken};
  ${feedRail}
`;

export const CardTitle = styled.h3`
  margin: 0 0 ${space[2]};
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardSummary = styled.p`
  margin: 0 0 ${space[3]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 서브 정보 한 줄: "3일 전 · 댓글 2 · 조회수 41" | (있으면) 시뮬 배지. */
export const SubInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin-top: auto; /* 요약이 짧아도 서브 정보~푸터를 카드 바닥에 고정 */
  padding-bottom: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const SubInfoText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

/** 푸터 — 구분선을 카드 전폭으로 그리기 위해 좌우 패딩을 음수 마진으로 상쇄한다. */
export const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin: 0 -${space[4]};
  padding: ${space[3]} ${space[4]};
  border-top: 1px solid ${color.border};
`;

/** 푸터 작성자 — 아바타·"by" 접두어 없이 닉네임만(사용자 지시, 2026-07-17). */
export const FooterAuthor = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};

  b {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/** 푸터 우측 액션 묶음 — 좋아요 스탯(표시) + 공유 버튼(상호작용)을 한 그룹으로 오른쪽에 둔다. */
export const FooterActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
`;

/** ♥ + 좋아요 수 — 중립 텍스트 색 유지(데이터 방향색·danger 아님). */
export const LikeStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  ${font.numeric}

  svg {
    flex: 0 0 auto;
  }
`;
