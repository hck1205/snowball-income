import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/**
 * 소프트 카드 피드 행(velog풍) — 각 행이 surface 면색 + 라운드 + 그림자로 배경에서 뜬다.
 * PostCard 와 같은 카드 언어를 쓴다(border 없이 shadow.e1→e3 사다리, radius.xs 콘텐츠 카드).
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

/** 분류 배지 + 제목을 한 줄에. 배지가 없으면 제목만 있는 것과 시각적으로 동일하다. */
export const RowTitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 게시판 글 분류 배지(건의사항/공지). 색만으로 구분하지 않도록 **라벨 텍스트를 반드시 동반**한다.
 * 공지(emphasis)는 브랜드 틴트로 한 단계 강조하고, 그 외는 오로라 violet 계열 정보 배지(§4.6).
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

/** 카드 제목(CardTitle)과 동일 위계 — lg/bold, 2줄 clamp. */
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
