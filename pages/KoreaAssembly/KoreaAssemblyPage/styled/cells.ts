import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 표 **안**의 조각들. 표 자체는 공용 `DataTable` 이 그린다 — 미국 화면과 같은 이유로
 * 새로 만들지 않았다(좁은 폭에서 행을 카드로 접는 규칙이 이미 있다).
 */

/** 숫자 칸. 미국 화면의 `Num` 과 같은 규칙이라 모양을 맞춘다. */
export const Num = styled.span`
  display: block;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/** 종목 이름. 한글이 대부분이라 본문 서체를 쓴다(티커처럼 데이터 서체로 세우지 않는다). */
export const Issuer = styled.span`
  font-weight: ${font.weight.semibold};
`;

/** 우리 앱에 소개 페이지가 있는 종목만 링크가 된다. */
export const IssuerLink = styled(Link)`
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

/** 티커 배지 — 종목 이름 옆에 작게. 미국 종목에만 붙는다. */
export const TickerBadge = styled.span`
  margin-left: ${space[1]};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

/** 신고한 의원 이름 나열. 길어서 두 줄까지 보이고 그 뒤는 말줄임. */
export const MemberSample = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: ${color.textSecondary};
`;

/**
 * 명의(본인·배우자·장남…) 배지.
 *
 * 🔴 이 화면에서 **가장 오해받기 쉬운 값**이다 — "의원이 샀다"가 아니라 "그 집에 있다"이다.
 * 그래서 색이 아니라 **글자 그대로** 관계를 적는다.
 */
export const RelationTag = styled.span`
  padding: 1px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

/** 배지 묶음. 좁은 폭에서 줄바꿈된다. */
export const TagRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  justify-content: flex-end;
`;

/** 직위(국회의장·부의장). 일반 의원이면 그리지 않는다. */
export const Position = styled.span`
  display: block;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;
