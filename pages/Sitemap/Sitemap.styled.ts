import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space } from '@/shared/styles';

export const PageStack = styled.div`
  display: grid;
  gap: clamp(24px, 4vw, 40px);
  padding-block: ${space[6]} ${space[10]};
`;

/**
 * 섹션 격자 — 폭에 따라 열 수가 는다. 사이트맵은 훑는 지면이라 한 줄에 여러 묶음을 나란히 놓아
 * 전체를 한눈에 보게 한다(도넛·표처럼 한 화면을 독점하지 않는다).
 */
export const SitemapGrid = styled.div`
  display: grid;
  gap: ${space[5]};
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
`;

export const Section = styled.section`
  display: grid;
  gap: ${space[2]};
  align-content: start;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 ${space[1]};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const SitemapLinkList = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** 링크 한 줄 — 아이콘 + 라벨. 색 하나에 기대지 않게 글자가 언제나 함께 선다. */
export const SitemapLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  color: ${color.textSecondary};
  text-decoration: none;
  font-size: ${font.size.sm};
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceMuted};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
