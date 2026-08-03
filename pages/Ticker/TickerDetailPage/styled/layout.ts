import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';
import { RAIL_COLUMN } from './metrics';

/* -------------------------------------------------------------------------- */
/* 빵부스러기 — 히어로 **밖**의 페이지 레벨 내비                                  */
/* -------------------------------------------------------------------------- */

/**
 * 🔴 히어로 안에 두지 않는다. 빵부스러기는 "이 페이지가 사이트 어디에 있나"를 말하는 **페이지 레벨**
 * 내비이고, 히어로는 "이 티커가 무엇인가"를 말하는 콘텐츠다. 둘을 한 상자에 넣으면 히어로의 첫 줄이
 * 티커가 아니라 경로가 되어, 착지 직후 0.3초의 시선이 가장 덜 중요한 정보에 먼저 닿는다.
 */
export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};

  a {
    color: ${color.textSecondary};
    text-decoration: none;

    &:hover {
      color: var(--tk-text);
      text-decoration: underline;
    }
  }
`;

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃: 리더 레일 + 본문                                                */
/* -------------------------------------------------------------------------- */

export const Layout = styled.div`
  margin-top: clamp(28px, 4vw, 48px);
  display: grid;
  grid-template-columns: ${RAIL_COLUMN} minmax(0, 1fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    /* 모바일: 히어로와 sticky 목차 가로바 사이 상단 여백 축소. 데스크톱 2단은 그대로. */
    margin-top: ${space[3]};
    gap: ${space[4]};
  }
`;

export const Content = styled.div`
  display: grid;
  gap: clamp(36px, 5vw, 64px);
  min-width: 0;
`;
