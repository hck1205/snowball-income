import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 표 **안**의 조각들. 표 자체는 공용 `DataTable` 이 그린다 — 좁은 폭에서 행을 카드로 접는 규칙과
 * 스크롤바·서체가 앱의 다른 표와 같아야 해서, 이 화면이 표를 새로 만들지 않았다.
 *
 * ⚠ `DataTable` 은 열 정렬(오른쪽 맞춤)을 모른다(`header: string` 뿐이다). 그래서 숫자는
 *   `render` 안에서 이 `Num` 이 스스로 오른쪽에 선다 — 공용 부품을 건드리지 않고 필요한 것만 얻는다.
 */

/**
 * 숫자 칸.
 *
 * `display: block` + `text-align: right` 인 이유: 좁은 폭에서 `DataTable` 이 행을 카드로 접으면
 * 셀이 "라벨 | 값" 2단 그리드가 되고, 그때 값은 이미 오른쪽에 선다. 넓은 폭에서만 이 정렬이
 * 필요한데 블록 하나로 두 경우가 다 맞는다(자릿수 정렬은 전역 스타일이 `td` 에 이미 걸어 뒀다).
 */
export const Num = styled.span`
  display: block;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/** 티커 — 숫자·대문자가 섞인 짧은 문자열이라 데이터 서체로 세운다. */
export const Ticker = styled.span`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const TickerLink = styled(Link)`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

/** 종목 이름처럼 길고 접혀도 되는 값. 두 줄까지 보이고 그 뒤는 말줄임. */
export const Wrapped = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: ${color.textSecondary};
`;

/**
 * 매수·매도 배지.
 *
 * 🔴 **색이 유일한 채널이 되지 않는다.** 글자가 "매수"/"매도"를 그대로 말하고, 색은 그 위에
 * 얹힐 뿐이다. 색각 이상·흑백 인쇄·고대비 모드 어디서도 방향이 사라지면 안 된다.
 * ⚠ 한국 증권 관례를 따른다 — 매수(사는 쪽)가 적색 계열, 매도가 청색 계열이다.
 */
export const ActionBadge = styled.span<{ $action: 'buy' | 'sell' | 'exchange' }>`
  display: inline-block;
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${({ $action }) =>
    $action === 'buy' ? color.dataPositive : $action === 'sell' ? color.dataNegative : color.textSecondary};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
`;

/** 배우자·자녀 계좌 표시. 본인 거래면 아예 그리지 않는다. */
export const OwnerTag = styled.span`
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

/** 의원이 주로 거래한 종목 묶음. 좁은 폭에서 줄바꿈된다. */
export const TickerChips = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  justify-content: flex-end;
`;

export const TickerChip = styled.span`
  padding: 1px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

/** 지역구(`MI 9구`). 이름 아래 작게 붙는다 — 동명이인을 가르는 유일한 단서다. */
export const District = styled.span`
  display: block;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;
