import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';
import { overflowTooltipTarget } from '@/components/common';
import { brandPillLink } from '@/shared/styles';

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

/**
 * 티커 — 숫자·대문자가 섞인 짧은 문자열이라 데이터 서체로 세운다.
 *
 * 🔴 소개 페이지가 **없는** 티커다(있으면 아래 `TickerLink`). 누를 수 없다는 차이는 모양이
 * 말하지만(칩이 아니다), **자리는 같아야 한다** — 같은 열의 값이 링크 여부에 따라 좌우로
 * 튀면 표가 들쭉날쭉해진다(2026-08-07 사용자 지시).
 */
export const Ticker = styled.span`
  display: inline-block;
  /* 카드 모드의 칸은 그리드다 — 링크 쪽과 같은 규칙으로 오른쪽에 선다. */
  justify-self: end;
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/**
 * 소개 페이지가 있는 티커 — **누를 수 있는 것처럼 생겨야 한다**.
 *
 * 🔴 2026-08-07 사용자 신고: "카드에서 종목이 clickable 한 아이템인지 인지하기 어렵다".
 * 종전에는 브랜드색 글자 + **호버에만** 나타나는 밑줄이었다. 모바일에는 호버가 없으므로
 * 쉴 때의 모습이 전부인데, 그 모습은 색이 조금 다른 글자일 뿐이었다 — 색 단독 채널이라
 * 색각 이상에서는 아예 표시가 없는 것과 같다.
 *
 * 이제 **쉴 때부터 알약 칩**이다: 옅은 브랜드 면 + 테두리 + 둥근 모서리. 이 레포에서 알약은
 * 이미 "누르는 것"의 모양이고(캘린더 칩·필터 칩), 손가락 목표로도 충분한 크기가 된다.
 * 호버·포커스에서는 면이 진해져 상태가 한 단 더 올라간다.
 */
export const TickerLink = styled(Link)`
  ${brandPillLink}
  /*
   * 카드 모드에서 칸은 그리드다 — 기본 stretch 를 막지 않으면 칩이 카드 폭만큼 늘어난다.
   * 🔴 **end 다**(2026-08-07 사용자 확정). 카드로 접히면 칸은 "라벨 | 값" 2단이 되고 값은 전부
   * 오른쪽에 선다 — 티커만 왼쪽에 두면 그 줄 하나가 다른 규칙으로 읽힌다. 넓은 폭의 첫 열
   * 왼쪽 정렬과 어긋나 보이지만, 그때는 라벨이 열머리에 따로 서 있어 축이 다르다.
   */
  justify-self: end;
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/**
 * 사람 이름 한 줄 — **한 줄로 유지하고 넘치면 말줄임**.
 *
 * 🔴 이름은 두 줄로 접지 않는다(2026-08-07 사용자 신고: 카드에서 이름이 겹친다). 사람 이름은
 * 줄바꿈 지점이 없어 두 줄로 접으면 성과 이름이 어색하게 갈리고, 카드 모드에서는 라벨과 겹친다.
 * 전체 문자열은 화면이 툴팁으로 준다(OverflowTooltip — 잘렸을 때만 뜨고 hover·클릭·키보드 전부 받는다).
 * ⚠ min-width 0 이 없으면 grid/flex 안에서 이 상자가 자기 내용만큼 벌어져 말줄임이 아예 안 걸린다.
 */
export const PersonName = styled.span`
  ${overflowTooltipTarget}
`;

/**
 * **이름 칸 한 덩어리** — 이름 + 뒤에 붙는 꼬리표(명의 태그·지역구)를 하나로 묶는다.
 *
 * 🔴 묶지 않으면 좁은 폭에서 **두 줄로 떨어진다**(2026-08-07 사용자 신고: "의원 이름 + 자녀일 때
 * 두 줄로 나온다"). 카드 모드의 칸은 2열 그리드이고 라벨이 첫 칸을 쓰므로, 이름과 꼬리표가
 * 형제로 놓이면 **아이템이 셋**이 되어 꼬리표가 다음 줄로 밀린다. 상자 하나로 감싸면 아이템이
 * 둘로 유지된다.
 *
 * 🔴 **왼쪽 정렬이다**(사용자 지시). 칸의 기본은 오른쪽이지만 사람 이름은 값이 아니라 **누구**라서,
 * 눈이 세로로 훑는 축이 왼쪽에 있어야 한다. 세로 가운데는 그리드가 이미 맞춘다(align-items: center).
 */
export const NameCell = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
  text-align: left;
`;

/** 이름 아래에 한 줄이 더 붙는 경우(지역구). 세로로 쌓되 역시 **한 아이템**으로 묶인다. */
export const NameStack = styled(NameCell)`
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
`;

/** 종목 이름처럼 긴 값. 🔴 이름이라 왼쪽에서 시작한다(위 NameCell 과 같은 근거). */
export const Wrapped = styled.span`
  text-align: left;
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
  /*
   * 🔴 **늘어나지 않는다**(2026-08-07 사용자 신고: 반응형에서 매수·매도 배지가 100% 로 커진다).
   *
   * 좁은 폭에서 표는 행 카드로 접히고 각 칸이 "auto minmax(0, 1fr)" 두 트랙의
   * 그리드가 된다. 그리드 아이템의 기본 정렬은 **stretch** 라, inline-block 이어도 값 트랙을
   * 통째로 채워 "매수" 두 글자짜리 알약이 카드 폭만큼 부풀었다.
   * ⚠ 넓은 폭에서는 부모가 td 라 그리드가 아니고, 이 선언은 조용히 무시된다 — 한 줄로 두 폭을 다 덮는다.
   */
  justify-self: end;
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
