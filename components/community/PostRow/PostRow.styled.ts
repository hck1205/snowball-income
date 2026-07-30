import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';
import {
  FEED_INNER_RADIUS,
  FEED_PADDING,
  FEED_RADIUS,
  FEED_SHADOW,
  feedHeroHover,
  feedRail
} from '@/components/community/FeedSurface';

/**
 * 소프트 카드 피드 행(velog풍) — 각 행이 surface 면색 + 라운드 + 그림자로 배경에서 뜬다.
 * 좌 텍스트 열(RowBody)과 우 숫자 칩(RowStats)의 2열이며, 모바일(≤640)에서 숫자 칩이 아래로
 * 떨어져 1열로 리플로우한다. 행 사이 간격은 리스트 컨테이너(InlineList)의 gap 이 준다.
 * focus-visible은 전역 a:focus-visible(globalStyles) 상속 — 자체 override 없음(카드와 톤 일치).
 *
 * **반경·그림자는 `FeedSurface`(= PostCard 와 같은 값)**. 같은 데이터의 두 밀도이고 갤러리
 * 우상단 토글이 이 둘을 왕복하므로 "재질"은 공유해야 한다 — 대신 패딩·글자 크기(밀도)는 각자 갖는다.
 */
export const RowLink = styled(Link)`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${space[2]} ${space[4]};
  padding: ${FEED_PADDING};
  border-radius: ${FEED_RADIUS};
  background: ${color.surface};
  box-shadow: ${FEED_SHADOW};
  text-decoration: none;
  color: inherit;

  &:hover {
    box-shadow: ${shadow.e3};
  }

  /* 숫자 칩의 hover 반응(면색 + 캡슐 두께) — 카드와 같은 순간을 리스트에서도 준다. */
  ${feedHeroHover}

  /* 이동 hover 는 진짜 포인터에서만 — 터치는 탭 뒤 :hover 가 남아 행이 들린 채로 굳는다. */
  @media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) {
    transition:
      transform ${motion.base} ${motion.ease},
      box-shadow ${motion.base} ${motion.ease};

    &:hover {
      transform: translateY(-2px);
    }
  }
`;

/** 좌측 텍스트 열 — 제목 → 요약 → 서브 정보. flex-grow로 폭을 채운다. */
export const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  flex: 1 1 300px;
  min-width: 0;
`;

/**
 * 우측 숫자 칩(B안 §3-1) — 숫자 존을 surfaceSunken 칩으로 감싸 국소 색감·스캔 앵커를 만든다
 * (카드 PreviewBlock의 리스트 축약판, 그라데이션·brand 채움 없음).
 * 모바일에서는 flex-basis 100%로 아래로 떨어져 세로 1열이 된다.
 *
 * 반경 8px(`FEED_INNER_RADIUS`)이 동심 규칙(DESIGN.md §6)의 '안쪽'이다 — 행 패딩이 16px 이라
 * 바깥(행)이 8+16=24px 로 역산된다. 카드의 인셋 프리뷰 타일과 같은 값을 쓴다.
 * `position: relative` 는 좌측 오로라 캡슐(`feedRail`)의 기준면이다.
 */
export const RowStats = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 1 240px;
  min-width: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${FEED_INNER_RADIUS};
  background: ${color.surfaceSunken};
  ${feedRail}

  ${media.down('mobileWide')} {
    flex-basis: 100%;
  }
`;

/** 분류 배지 + 제목을 한 줄에. 배지가 없으면 제목만 있는 것과 시각적으로 동일하다. */
export const RowTitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 게시판 글 분류 배지(건의사항/공지). 색만으로 구분하지 않도록 **라벨 텍스트를 반드시 동반**한다.
 * 공지(emphasis)는 브랜드 틴트로 한 단계 강조하고, 그 외는 오로라 green 계열 정보 배지(§4.6).
 * 컴포넌트 셀렉터 대신 prop 분기 — 이 레포 테스트 변환은 컴포넌트 셀렉터에서 런타임 throw한다.
 */
export const CategoryBadge = styled.span<{ emphasis?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${({ emphasis }) => (emphasis ? color.brandSubtle : color.accentAltSubtle)};
  border: 1px solid ${({ emphasis }) => (emphasis ? color.brandBorder : color.accentAltBorder)};
  color: ${({ emphasis }) => (emphasis ? color.brandText : color.accentAltText)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  flex: 0 0 auto;
`;

/**
 * 카드 제목(CardTitle)과 동일 위계 — lg/bold, 2줄 clamp.
 *
 * 제목에는 측정 폭을 걸지 않는다(요약만 건다) — 제목까지 자르면 행 위쪽이 함께 좁아져
 * 넓은 화면에서 **행 오른쪽 절반이 통째로 비어 보인다**(실측: 1,280px 게시판). 제목은 훑는
 * 대상이라 길어도 앞부분만 읽히고, 전폭으로 뻗은 제목이 행의 가로 앵커가 된다.
 */
export const RowTitle = styled.h3`
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
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

/**
 * 요약(description) — 없으면 미렌더(§I I3).
 *
 * `max-width` 가 있는 이유: 게시판(`/community/board`)은 숫자 칩이 없어 요약이 **행 전폭
 * 1,130px**(한글 80자)로 늘어나 눈이 줄 끝에서 다음 줄 머리를 못 찾는다. 68ch ≈ 500px ≈
 * 한글 38자로, 본문 조판의 통상 상한 안에 든다. **제목에는 걸지 않는다**(위 RowTitle 주석).
 */
export const RowSummary = styled.p`
  margin: 0;
  min-width: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * 서브 정보 한 줄(§I I5): 좌 텍스트 체인(닉네임 · 시간 · 댓글 · 조회 · ♥) / 우 시뮬 배지(폴백).
 * 모바일에서도 숨기지 않는다 — 폭 부담이 적고, 좁으면 wrap만 허용(§I I6).
 */
export const RowSubInfo = styled.span`
  display: flex;
  align-items: center;
  /*
   * flex-start 인 이유: 구 space-between 은 공유 버튼을 **행 오른쪽 끝**(게시판에서 메타
   * 텍스트로부터 900px)까지 밀어냈다 — 어느 글의 버튼인지 눈으로 잇기 어렵고 포인터 이동도
   * 그만큼 길다. 메타 옆에 붙인다.
   */
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const RowSubText = styled.span`
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  ${font.numeric}

  b {
    font-weight: ${font.weight.semibold};
  }

  time {
    color: inherit;
  }
`;

/** 서브 정보 우측 액션 묶음 — 시뮬 배지(폴백)와 공유 버튼을 오른쪽 끝에 모은다. */
export const RowActions = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
`;

/** ♥ + 좋아요 수 — 카드 푸터와 같은 중립 표기(데이터 방향색 아님). 아이콘 정렬용 inline-flex. */
export const LikeInline = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: text-bottom;

  svg {
    flex: 0 0 auto;
  }
`;
