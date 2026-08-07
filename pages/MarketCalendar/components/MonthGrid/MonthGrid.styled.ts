import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

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
/**
 * 달력 한 칸 — **버튼이다**(2026-08-05 사용자 지시: 날짜를 누르면 그날 일정을 드로어로).
 *
 * 🔴 `div` 가 아니라 `button` 인 이유: 이 칸은 누르면 화면이 바뀐다. div 에 onClick 을 얹으면
 * 키보드로 닿지 않고(포커스 불가) 스크린리더도 "누를 수 있는 것"으로 읽지 않는다.
 * ⚠ 버튼 기본 스타일(가운데 정렬·회색 면·테두리)은 전부 되돌려야 한다 — 아래 선언들이 그 일을 한다.
 * ⚠ 칸 안에 또 다른 버튼을 넣지 마라(버튼 안의 버튼은 유효하지 않은 HTML). 지금 칸 안은 전부 텍스트다.
 */
export const DayCell = styled.button<{ $tone: CellTone; $inMonth: boolean; $today: boolean }>`
  /* 버튼 기본값 되돌리기 — 이 요소의 모양은 아래 선언들이 전부 정한다. */
  appearance: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

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

  transition:
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  /* 누를 수 있다는 사실을 **형태 변화**로 말한다(면색을 바꾸면 그 날의 상태색과 충돌한다). */
  &:hover {
    border-color: ${color.brandBorder};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }

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

/** 일정이 걸린 날의 점 줄. 범례에서만 쓴다(칸은 `ChipList` 를 그린다). */
export const DotRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
`;

/**
 * 칸 안의 일정 칩 목록.
 *
 * 🔴 **한 줄에 하나씩 세운다**(세로). 배당 캘린더는 티커라 가로로 흘려도 읽히지만, 여기는
 * "근원 소비자물가지수" 같은 이름이 섞여서 가로로 흘리면 전부 두세 글자만 남는다.
 * 세로로 세우면 각 칩이 칸 너비를 통째로 쓴다.
 */
export const ChipList = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  margin-top: 2px;
  min-width: 0;
  max-width: 100%;

  /*
   * 🔴 **좁은 폭에서는 다시 가로로 눕고 점만 남는다**(2026-08-07 사용자 지시로 되돌림).
   *
   * 이 날 앞서 두 캘린더의 칩 문법을 통일하며 좁은 폭에서도 글자를 세로로 세웠는데, 실제 화면에서
   * 날짜 칸이 세로로 길어져 격자가 무너졌다 — 배당 캘린더의 칩은 티커 3~4글자라 한 줄에 들어가지만
   * 여기 일정 이름은 "근원 소비자물가지수" 같은 문장이라 칸마다 서너 줄을 먹는다. 같은 규칙이
   * 두 화면에서 같은 결과를 내지 않는다.
   *
   * ⚠ 점만 남아도 **색이 유일한 채널은 아니다** — 칸 전체에 title 로 일정 이름이 붙고, 칸을 누르면
   *   그 날의 드로어가 이름을 그대로 편다. 아래 범례가 색과 이름을 짝지어 두는 것도 그대로다.
   */
  ${media.down('mobileWide')} {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 3px;
  }
`;

/**
 * 일정 칩 하나 — **점 + 글자**.
 *
 * 🔴 점이 색 단독 채널이던 자리를 이 글자가 메운다. 색각 이상·흑백에서도 "FOMC"·"CPI"·"AMD"는
 * 그대로 읽힌다(칸 전체 `title` 은 그대로 남아 접힌 것까지 말한다).
 * ⚠ 좁은 폭에서는 테두리·여백을 지워 **예전의 점 줄과 같은 모습**으로 되돌아간다 — DOM 은 하나다
 *   (폭에 따라 다른 것을 렌더하면 jsdom 테스트가 두 변형을 동시에 본다 — 배당 캘린더의 교훈).
 */
export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  min-width: 0;
  /*
   * 🔴 **알약 + 흰 면**. 배당 캘린더의 DayChip 과 같은 값을 쓴다(2026-08-07 UI 통일) — 두 캘린더는
   * 같은 종류의 화면이고, 같은 자리의 같은 부품이 한쪽은 모난 사각, 한쪽은 알약이면 사용자는
   * 둘을 다른 제품으로 읽는다.
   * ⚠ 여기 칩은 버튼이 아니다(누를 것이 없다 — 칸 전체가 버튼이다). 모양만 같고 상호작용은 다르다.
   */
  padding: 1px ${space[1]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  line-height: 1.5;

  /* 좁은 폭에서는 알약 껍데기를 지운다 — 남는 것은 점뿐이라 상자가 있을 이유가 없다. */
  ${media.down('mobileWide')} {
    padding: 0;
    border-color: transparent;
    background: transparent;
  }
`;

/** 칩 안의 글자. 넘치면 말줄임 — 원문은 칸 전체 `title` 이 갖고 있다. */
export const ChipLabel = styled.span`
  overflow: hidden;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;

  /* 좁은 폭에서는 글자를 감춘다 — 이름은 칸의 title 과 날짜 드로어가 말한다(ChipList 주석). */
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 접힌 일정 수(`+3`). 🔴 접혔다는 사실을 숨기지 않는 것이 이 조각의 존재 이유다. */
export const ChipMore = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-variant-numeric: tabular-nums;

  ${media.down('mobileWide')} {
    display: none;
  }
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
