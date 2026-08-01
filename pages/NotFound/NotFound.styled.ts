import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { cardElevation, color, font, media, radius, space } from '@/shared/styles';

/**
 * 404 화면의 스타일.
 *
 * 이 화면은 **페이지 hue 를 발행하지 않는다**(`shared/hooks/usePageHue` 의 미배정 라우트 → 폴백 brand).
 * 정체성이 없는 화면에 색을 하나 더 만들면 사용자가 "여기가 어느 섹션인가"를 잘못 배운다.
 * 그래서 히어로 크롬은 폴백색 그대로 두고, 이 파일은 **길 안내 목록**의 모양만 정한다.
 *
 * 위계는 카드 3단 규칙 그대로다 — 바깥 안내 카드는 본문(`base`, 테두리), 안쪽 길 안내 칸은
 * 부속(`sunken`, 면색만)이라 테두리가 겹쳐 보이지 않는다.
 */

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/** 요청했던 주소를 그대로 보여 주는 줄. 무엇이 잘못됐는지는 주소가 가장 정확하게 말한다. */
export const RequestedPath = styled.code`
  display: inline-block;
  max-width: 100%;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

export const DestinationCard = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: clamp(16px, 3vw, 24px);
  border-radius: ${radius.xl};
  ${cardElevation('base')}
`;

export const DestinationTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const DestinationList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tablet')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const DestinationItem = styled.li`
  min-width: 0;
`;

/**
 * 길 안내 한 칸. 칸 전체가 링크라 터치 타깃이 넉넉하고, 포커스 링은 전역 규칙을 그대로 받는다
 * (여기서 `outline: none` 을 하지 않는다 — shared/styles/README.md).
 */
export const DestinationLink = styled(Link)`
  display: grid;
  gap: ${space[1]};
  height: 100%;
  padding: ${space[3]};
  border-radius: ${radius.lg};
  text-decoration: none;
  color: ${color.text};
  ${cardElevation('sunken')}

  &:hover {
    background: ${color.surfaceHover};
  }
`;

export const DestinationLabel = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const DestinationHint = styled.span`
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;
