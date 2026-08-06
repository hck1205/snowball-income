import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  color,
  font,
  media,
  motion,
  pressTransition,
  pressableSubtle,
  radius,
  space
} from '@/shared/styles';
import { RAIL_COLUMN } from './metrics';

/* -------------------------------------------------------------------------- */
/* 페이지 레벨 내비 — 뒤로 가기 + 빵부스러기                                      */
/* -------------------------------------------------------------------------- */

/**
 * 본문 첫 줄.
 *
 *   [← 뒤로]        홈 / 가이드
 *
 * 🔴 **히어로 밖**이다(티커 상세의 Breadcrumb 과 같은 판단). 이 줄은 "이 페이지가 사이트
 * 어디에 있나"를 말하는 페이지 레벨 내비이고, 히어로는 "이 글이 무엇인가"를 말하는 콘텐츠다.
 * 둘을 한 상자에 넣으면 착지 직후 첫 시선이 제목이 아니라 경로에 닿는다.
 *
 * ⚠ 가이드는 **검색으로 바로 들어오는** 지면이다. 그래서 뒤로 가기는 브라우저 히스토리에만
 *   기댈 수 없다 — 그 분기는 뷰(GuidePage.view)가 갖는다.
 */
export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};

  a {
    color: ${color.textSecondary};
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: ${color.brandText};
      text-decoration: underline;
    }
  }
`;

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃: 목차 레일 + 본문                                                */
/* -------------------------------------------------------------------------- */

export const Layout = styled.div`
  margin-top: clamp(28px, 4vw, 48px);
  display: grid;
  grid-template-columns: ${RAIL_COLUMN} minmax(0, 1fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    /* 좁은 폭: 히어로와 sticky 목차 바 사이 여백을 줄인다(데스크톱 2단은 그대로). */
    margin-top: ${space[3]};
    gap: ${space[4]};
  }
`;

export const Content = styled.div`
  display: grid;
  gap: clamp(36px, 5vw, 64px);
  min-width: 0;
`;

/* -------------------------------------------------------------------------- */
/* 히어로 액션 — 글을 읽지 않고 바로 계산기로 가는 사람의 문                        */
/* -------------------------------------------------------------------------- */

/**
 * 히어로의 주 액션.
 *
 * 🔴 면은 `brand` 솔리드다 — 페이지 hue 파생면 위에 라벨을 얹지 않는다(색 대비 계약이 못 보는
 * 값이 된다, shared/styles/pageHue.ts 머리말). 검증된 brand/on-brand 쌍만 쓴다.
 */
export const HeroCta = styled(Link)`
  ${pressableSubtle}
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[3]} ${space[5]};
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  white-space: nowrap;
  transition:
    filter ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover,
  &:focus-visible {
    filter: brightness(0.94);
  }
`;
