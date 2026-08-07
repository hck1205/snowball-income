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

/**
 * 신고한 의원 이름 나열(“신고한 의원” · “가장 많이 신고한 종목” 두 열이 함께 쓴다).
 *
 * 🔴 **한 줄 말줄임이다**(2026-08-07 사용자 지시: 엘립시스 + 툴팁). 종전에는
 * `-webkit-line-clamp: 2`(두 줄 자르기)였는데, 그 방식은 글자가 **가로로 넘치지 않는다** —
 * 줄바꿈으로 접히므로 `scrollWidth === clientWidth` 가 된다. 이 열을 감싼 `OverflowTooltip` 은
 * 그 두 값을 견줘 잘림을 판정하므로(`isTextClipped`), 눈에는 잘려 보이는데 **툴팁은 영영 안 떴다.**
 * 한 줄로 자르면 잘림이 가로 축에서 일어나 판정이 성립하고, 잘린 이름 전부를 툴팁이 되돌려준다.
 *
 * ⚠ 세로로 자르고 싶어지면 `isTextClipped` 부터 고쳐라(`scrollHeight > clientHeight` 도 보게).
 *   여기만 바꾸면 툴팁이 다시 조용히 죽는다.
 */
export const MemberSample = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/**
 * 사람 이름 한 줄 — **한 줄로 유지하고 넘치면 말줄임**.
 *
 * 🔴 이름은 두 줄로 접지 않는다(2026-08-07 사용자 신고: 카드에서 이름이 겹친다). 사람 이름은
 * 줄바꿈 지점이 없어 접으면 어색하게 갈리고, 표가 카드로 접히는 폭에서는 라벨과 겹친다.
 * 전체 문자열은 OverflowTooltip 이 준다 — 잘렸을 때만 뜨고 hover·클릭·키보드를 전부 받는다
 * (모바일은 hover 가 없어 **클릭**이 유일한 경로다).
 * ⚠ min-width 0 이 없으면 grid/flex 안에서 상자가 내용만큼 벌어져 말줄임이 아예 안 걸린다.
 */
export const PersonName = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[tabindex] {
    cursor: help;
  }
`;
