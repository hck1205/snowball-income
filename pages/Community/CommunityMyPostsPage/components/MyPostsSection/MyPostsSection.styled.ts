import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * "내 글" 섹션 — 커뮤니티의 다른 카드(프로필 설정의 Section 등)와 같은 토큰 세트
 * (surface + border + radius.lg)를 쓴다. 페이지 styled 파일을 가로질러 import 하지 않고
 * 여기서 자기 스타일을 소유한다(컴포넌트 폴더 자기완결).
 */
export const Section = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: ${space[5]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

/** 카운트만 담는 줄 — 제목은 페이지 h1 이 맡는다(섹션 제목 중복 제거). 비어 있을 땐 높이를 만들지 않는다. */
export const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: ${space[2]};

  &:empty {
    display: none;
  }
`;

export const Count = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const Hint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const List = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** 행 전체가 상세로 가는 링크. 포커스 링은 전역 `a:focus-visible` 상속. */
export const ItemLink = styled(Link)`
  display: grid;
  gap: ${space[1]};
  padding: ${space[3]} ${space[2]};
  border-radius: ${radius.sm};
  color: inherit;
  text-decoration: none;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }
`;

export const TitleRow = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 공개/비공개 배지 — **라벨 텍스트를 항상 동반**하므로 색은 보조 신호일 뿐이다.
 * 비공개는 중립 톤(sunken)으로 "남에게 안 보임"을, 공개는 green 정보 배지(피드 분류 배지와 동일 토큰)를 쓴다.
 * 컴포넌트 셀렉터 대신 prop 분기(이 레포 관례).
 */
export const VisibilityBadge = styled.span<{ isPublic: boolean }>`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${({ isPublic }) => (isPublic ? color.accentAltSubtle : color.surfaceSunken)};
  border: 1px solid ${({ isPublic }) => (isPublic ? color.accentAltBorder : color.border)};
  color: ${({ isPublic }) => (isPublic ? color.accentAltText : color.textSecondary)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const ItemTitle = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const MetaRow = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  ${font.numeric}

  time {
    color: inherit;
  }
`;

/** 로딩 자리표시자 — 목록 높이를 미리 잡아 카드가 튀지 않게 한다. */
export const SkeletonRow = styled.div`
  height: 40px;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[1]};
`;

export const RetryRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: ${space[2]};
`;
