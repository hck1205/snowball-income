import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/**
 * 소프트 카드 피드 행(velog풍) — 각 행이 surface 면색 + 라운드 + 그림자로 배경에서 뜬다.
 * ScenarioCard 와 같은 카드 언어를 쓴다(border 없이 shadow.e1→e3 사다리, radius.xs 콘텐츠 카드).
 * 좌 텍스트 열(RowBody)과 우 숫자 칩(RowStats)의 2열이며, 모바일(≤640)에서 숫자 칩이 아래로
 * 떨어져 1열로 리플로우한다. 행 사이 간격은 리스트 컨테이너(InlineList)의 gap 이 준다.
 * focus-visible은 전역 a:focus-visible(globalStyles) 상속 — 자체 override 없음(카드와 톤 일치).
 */
export const RowLink = styled(Link)`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${space[2]} ${space[4]};
  padding: ${space[4]};
  border-radius: ${radius.xs};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
  text-decoration: none;
  color: inherit;

  &:hover {
    box-shadow: ${shadow.e3};
  }

  @media (prefers-reduced-motion: no-preference) {
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
 * 우측 숫자 칩(B안 §3-1) — 카드 surface가 없는 피드에서 숫자 존을 surfaceSunken 칩으로 감싸
 * 국소 색감·스캔 앵커를 만든다(카드 PreviewBlock의 리스트 축약판, 그라데이션·brand 채움 없음).
 * 모바일에서는 flex-basis 100%로 아래로 떨어져 세로 1열이 된다.
 */
export const RowStats = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 1 240px;
  min-width: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};

  ${media.down('mobileWide')} {
    flex-basis: 100%;
  }
`;

/** 카드 제목(CardTitle)과 동일 위계 — lg/bold, 2줄 clamp. */
export const RowTitle = styled.h3`
  margin: 0;
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

/** 요약(description) — 없으면 미렌더(§I I3). */
export const RowSummary = styled.p`
  margin: 0;
  min-width: 0;
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
  justify-content: space-between;
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
