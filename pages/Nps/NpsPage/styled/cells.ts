import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 표 **안**의 조각들. 표 자체는 공용 `DataTable` 이, 섹션 조판은 `DataSection` 이 그린다 —
 * 이 파일이 갖는 것은 이 화면에만 필요한 셀 표현뿐이다.
 */

/** 숫자 칸. 좁은 폭에서 행이 카드로 접히면 이미 오른쪽에 서므로 블록 하나로 두 경우가 다 맞는다. */
export const Num = styled.span`
  display: block;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/**
 * 직전 분기 대비 변화율.
 *
 * 🔴 **색이 유일한 채널이 되지 않는다** — 부호(`+`/`−`)를 글자가 먼저 말하고 색은 그 위에 얹힌다.
 * ⚠ 한국 증권 관례를 따른다(오름=적색, 내림=청색).
 */
export const ChangeValue = styled.span<{ $direction: 'up' | 'down' | 'flat' }>`
  display: block;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-weight: ${font.weight.medium};
  color: ${({ $direction }) =>
    $direction === 'up' ? color.dataPositive : $direction === 'down' ? color.dataNegative : color.textSecondary};
`;

/** 이번 분기에 처음 들어온 종목 표시. 변화율 자리가 비는 이유를 대신 말한다. */
export const NewBadge = styled.span`
  display: inline-block;
  padding: 1px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/** 발행사 이름. 길면 두 줄까지 보이고 그 뒤는 말줄임. */
export const Issuer = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-weight: ${font.weight.medium};
`;

/**
 * 합병·본사 이전으로 종목 식별번호가 바뀐 이름 옆의 단서.
 *
 * 🔴 이 표시가 없으면 같은 회사가 "청산 + 신규"로 나란히 보여 사용자가 자료를 의심한다.
 * 실측(2026-03-31 분기): AMCOR PLC 가 양쪽에 동시에 나왔다.
 */
export const ReclassMark = styled.span`
  margin-left: ${space[1]};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  border-bottom: 1px dotted ${color.border};
  cursor: help;
`;

/** 신규·청산 두 목록을 나란히. 좁은 폭에서는 위아래로 쌓인다. */
export const MoveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(${space[4]}, 3vw, ${space[6]});
  min-width: 0;
`;

export const MoveColumn = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;
`;

export const MoveHeading = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
`;

export const EmptyNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
