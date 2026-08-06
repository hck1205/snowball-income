import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, radius, space } from '@/shared/styles';

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
/**
 * 종목명 셀.
 *
 * 🔴 두 줄에서 자른다(`line-clamp: 2`) — 13F 의 발행사 이름은 길다("ALPHABET INC CLASS C CAPITAL
 * STOCK"). 자르지 않으면 한 줄이 표 전체의 행 높이를 정한다.
 * 🔴 **잘렸을 때만** 전체 이름을 띄운다 — 셀을 `OverflowTooltip` 이 감싼다(2026-08-05 사용자 지시:
 * "ellipsis 처리되면 hover·click 에 툴팁"). 잘리지 않은 이름에까지 툴팁을 달면 표 전체가
 * 마우스만 올려도 반응하는 화면이 된다.
 */
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

/**
 * 변동 한 덩어리(새로 편입 / 전량 정리) — **카드로 세운다**(2026-08-05 사용자 지시).
 *
 * 종전에는 제목 + 표가 배경 없이 나란히 놓여 있었다. 두 표가 같은 면 위에 붙어 있으니
 * "어디까지가 새로 편입이고 어디부터가 정리인지"를 제목 글자에만 의존해 읽어야 했고, 좁은 폭에서
 * 두 표가 세로로 이어지면 그 경계가 아예 사라졌다. 면과 경계를 주면 덩어리가 형태로 갈린다.
 *
 * ⚠ 중립 면이다. 신규를 초록 면, 정리를 빨간 면으로 칠하지 않는다 — 이 화면에서 색은 **손익**을
 *   뜻하는데(변화율 열), 편입·정리는 손익이 아니다. 방향은 아래 머리줄의 글자와 아이콘이 진다.
 */
export const MoveColumn = styled.section`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;
  padding: clamp(16px, 2vw, 24px);
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
`;

/** 카드 머리줄 — 제목 + 건수 배지가 양 끝으로 벌어진다. */
export const MoveHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  padding-bottom: ${space[2]};
  border-bottom: 1px solid ${color.border};
`;

export const MoveHeading = styled.h3`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
`;

/**
 * 건수 배지. 🔴 숫자가 **제목과 같은 줄**에 서야 "몇 종이 움직였나"가 표를 세지 않고 읽힌다.
 * 폭이 짧아(<180px) 틴트 면 예산 밖이다.
 */
export const MoveCount = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/** 종목명 + 재편입 표시를 한 칸에 담는 셀. 툴팁은 이름에만 붙는다. */
export const MoveIssuerCell = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  min-width: 0;
`;

export const EmptyNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
