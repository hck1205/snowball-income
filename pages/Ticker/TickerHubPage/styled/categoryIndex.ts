import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, space } from '@/shared/styles';
import { CAT_COLORS, CAT_GROUP_1, CAT_GROUP_2, CAT_VAR, anchorSelector } from './tokens';

/* ── 카테고리 색인 ────────────────────────────────────────────────────────── */

export const CategoryNav = styled.nav`
  min-width: 0;
`;

export const CategoryList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1px;

  ${media.down('layout')} {
    /* 좁은 화면: 줄바꿈 칩. sticky 바라 줄이 늘면 본문이 그만큼 영구히 밀린다 — 한 단 작게 잡는다. */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

/**
 * 색인 항목 — 상세 페이지 목차(`TocButton`)와 **같은 골격**이다: 번호 + 라벨 + 개수.
 *
 * 🔴 여전히 **해시 앵커**(`href="#high-dividend"`)다. 라우터 Link 로 바꾸지 마라 — 같은 문서 안
 * 이동이라 브라우저 기본 동작이 옳고, 목적지 섹션(`sections.ts` 의 `CategorySection`)의
 * `scroll-margin-top` 이 고정 헤더를 피한다.
 *
 * 🔴 활성/일치 표시를 **색면으로 하지 않는다**. 이 항목은 데스크톱에서 폭 232px 이라 채도 배경을
 * 깔면 tintscan 의 3번째 면이 된다(예산 여유 0). 대신 왼쪽 3px 컬러 바 + 굵기로 말한다.
 */
export const CategoryLink = styled.a<{ $dimmed: boolean }>`
  ${CAT_VAR}: ${CAT_COLORS[0]};

  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: ${space[2]};
  padding: 7px ${space[2]} 7px ${space[3]};
  border-radius: ${radius.sm};
  text-decoration: none;
  color: ${({ $dimmed }) => ($dimmed ? color.textMuted : color.text)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  opacity: ${({ $dimmed }) => ($dimmed ? 0.55 : 1)};
  transition: background ${motion.fast} ${motion.ease}, opacity ${motion.fast} ${motion.ease};

  /* 카테고리 색 바 — 3px 이라 면으로 세어지지 않는다(색면 사다리 L1). */
  &::before {
    content: '';
    position: absolute;
    inset: 6px auto 6px 0;
    width: 3px;
    border-radius: ${radius.pill};
    background: var(${CAT_VAR});
  }

  ${anchorSelector(CAT_GROUP_1)} {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  ${anchorSelector(CAT_GROUP_2)} {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  &:hover {
    background: ${color.surfaceHover};
    opacity: 1;
  }

  ${media.down('layout')} {
    /* 칩 형태 — 번호와 개수는 남기고 세로 바만 접는다(좁은 화면에서 3px 바는 칩 모서리와 싸운다). */
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px ${space[2]};
    border-radius: ${radius.pill};
    border: 1px solid ${color.border};
    font-size: ${font.size.xs};
    white-space: nowrap;

    &::before {
      inset: auto;
      position: static;
      width: 6px;
      height: 6px;
      flex: 0 0 auto;
    }
  }
`;

/** 색인 번호. 등폭이라 세로로 줄이 선다 — 번호가 곧 이 라이브러리의 뼈대다. */
export const CategoryIndex = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};

  ${media.down('layout')} {
    display: none;
  }
`;

export const CategoryLinkLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * 색인 항목 오른쪽의 개수.
 *
 * 필터가 걸리면 **일치 수 / 전체 수**로 바뀐다 — 조건을 바꿀 때마다 어느 카테고리가 줄었는지가
 * 목록을 내려가지 않아도 레일에서 읽힌다.
 */
export const CategoryLinkCount = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};
`;

/**
 * 종목 비교(`/ticker/compare`) 진입 링크 — 이 화면의 **유일한 L3 솔리드 면**이다.
 *
 * 🔴 `CategoryNav` 안에 넣지 마라. 그 nav 는 "카테고리 바로가기"라는 이름을 달고 있어, 스크린리더
 * 사용자가 목록을 훑을 때 **같은 문서 안 이동만** 나오리라 기대한다 — 다른 라우트로 나가는 링크가
 * 섞이면 그 약속이 깨진다. 구조는 테스트가 잠근다(TickerHubPage.test.tsx).
 *
 * 🔴 솔리드 채움은 **brand 축 하나만** 합법이다(accent/accentAlt/identity 를 채우면 16테마 중
 * 최소 하나가 대비를 잃는다). 폭은 레일 전체지만 높이·색이 아니라 **폭 180px 미만**이 관건이라
 * 레일 안(232px)에서는 면으로 세어질 수 있다 — 그래서 내용 폭으로만 넓어지게 둔다.
 */
export const CompareLink = styled(Link)`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid transparent;
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
    }
  }
`;
