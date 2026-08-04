import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 월간 달력 격자.
 *
 * ## 🔴 상태를 **색만으로** 말하지 않는다
 * 휴장·조기폐장은 면색이 다르지만, 그것만으로는 색각 이상·흑백 인쇄에서 사라진다. 그래서 칸 안에
 * **이름이 글자로** 들어간다("추수감사절"·"조기 폐장"). 색은 훑어볼 때의 보조 신호일 뿐이다.
 *
 * ## 좁은 폭에서 7열을 유지하는 이유
 * 달력을 목록으로 접는 선택지도 있었지만, 그러면 "이번 주 목요일"처럼 **주 단위로 읽는** 능력이
 * 사라진다. 대신 칸 안 내용을 줄인다 — 좁은 폭에서는 날짜 숫자와 점 표시만 남고, 이름은
 * 아래 "다가오는 일정" 목록이 말한다.
 */
export const CalendarRoot = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const MonthTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const ToolbarButtons = styled.div`
  display: flex;
  gap: ${space[2]};
`;

export const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${space[1]};
`;

/** 요일 머리. 주말은 흐리게 — 그 자체가 "장이 없는 날"이라는 신호다. */
export const WeekdayCell = styled.div<{ $weekend: boolean }>`
  padding: ${space[1]} 0;
  text-align: center;
  color: ${({ $weekend }) => ($weekend ? color.textMuted : color.textSecondary)};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${space[1]};
  min-width: 0;
`;

export type CellTone = 'open' | 'early' | 'closed' | 'weekend' | 'unknown';

/**
 * 칸의 면색.
 *
 * ⚠ 조기폐장에 `warningSurface` 를 쓰는 것은 **경고가 아니라 "평소와 다르다"** 는 뜻이다.
 *   그 구분은 색이 아니라 칸 안의 글자("조기 폐장")가 한다.
 * ⚠ 휴장(sunken)과 주말(muted)을 다른 면으로 둔다 — 주말은 규칙이고 휴장은 이유가 있는 날이라
 *   같은 회색으로 뭉치면 그 구분이 사라진다.
 */
const TONE_BACKGROUND: Record<CellTone, string> = {
  open: color.surface,
  early: color.warningSurface,
  closed: color.surfaceSunken,
  weekend: color.surfaceMuted,
  unknown: color.surfaceMuted
};

/**
 * 하루 칸.
 *
 * ⚠ `min-height` 로 높이를 잡는다 — 6주 고정 격자에서 내용이 있는 칸만 커지면 표가 덜컹거린다.
 *   좁은 폭에서는 내용을 줄이므로 높이도 함께 준다.
 */
export const DayCell = styled.div<{ $tone: CellTone; $inMonth: boolean; $today: boolean }>`
  display: grid;
  align-content: start;
  gap: 2px;
  min-height: 82px;
  padding: ${space[2]};
  border: 1px solid ${({ $today }) => ($today ? color.brand : color.border)};
  /* 오늘은 테두리 하나로는 약하다 — 안쪽에 한 겹 더 그려 두 겹으로 만든다(면색을 바꾸지 않는다). */
  box-shadow: ${({ $today }) => ($today ? `inset 0 0 0 1px ${color.brand}` : 'none')};
  border-radius: ${radius.md};
  background: ${({ $tone }) => TONE_BACKGROUND[$tone]};
  opacity: ${({ $inMonth }) => ($inMonth ? 1 : 0.4)};
  min-width: 0;

  ${media.down('mobileWide')} {
    min-height: 56px;
    padding: ${space[1]};
  }
`;

export const DayNumber = styled.span<{ $weekend: boolean }>`
  color: ${({ $weekend }) => ($weekend ? color.textMuted : color.text)};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

/** 칸 안의 상태 이름("휴장 · 추수감사절"). 🔴 이 글자가 색의 백업이다 — 지우지 마라. */
export const DayLabel = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  line-height: 1.35;
  overflow-wrap: anywhere;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 일정이 걸린 날의 점 줄. 좁은 폭에서는 이것만 남는다. */
export const DotRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
`;

export type DotKind = 'fomc' | 'economic' | 'earnings';

const DOT_COLOR: Record<DotKind, string> = {
  fomc: color.brand,
  economic: color.accent,
  earnings: color.accentAlt
};

/**
 * 일정 표시 점.
 *
 * 🔴 점은 **색이 유일한 채널**이 되기 쉬운 자리다. 그래서 두 가지를 함께 한다:
 *  ① 아래 범례가 색과 이름을 짝지어 보여 주고, ② 칸 전체에 `title` 로 일정 이름이 붙는다.
 * ⚠ 지름 6px 이라 면 판정(폭 ≥180px) 밖이다 — 대비 기준의 대상이 아니다.
 */
export const Dot = styled.span<{ $kind: DotKind }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $kind }) => DOT_COLOR[$kind]};
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[4]};
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/** 범례의 면 견본. 칸 배경과 같은 색을 쓴다 — 견본과 실제가 다르면 범례가 거짓말이 된다. */
export const LegendSwatch = styled.span<{ $tone: CellTone }>`
  width: 12px;
  height: 12px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${({ $tone }) => TONE_BACKGROUND[$tone]};
`;
