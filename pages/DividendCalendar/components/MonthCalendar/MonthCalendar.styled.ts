import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/** 시각적으로만 숨긴다 — 표의 목적·이월 날짜의 달을 AT에 남기는 텍스트다. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const CalendarTable = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: ${space[1]};
`;

export const CalendarCaption = styled.caption`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * 요일 머리. 일요일/토요일만 색을 달리한다(달력의 보편 관례라 학습 비용이 0이고, 주 경계를 눈으로 잡아 준다).
 * 색이 정보를 독점하지 않는다 — 요일 이름 자체가 텍스트로 있고, `abbr title`이 전체 이름을 준다.
 * 쓰는 색은 대비 검증 쌍(danger/surface, accent-text/surface)뿐이다.
 */
export const WeekdayHead = styled.th<{ $weekday: number }>`
  padding-bottom: ${space[2]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.02em;
  color: ${({ $weekday }) => {
    if ($weekday === 0) return color.danger;
    if ($weekday === 6) return color.accentText;
    return color.textSecondary;
  }};

  abbr {
    text-decoration: none;
  }
`;

/**
 * 날짜 칸. 폭이 좁아져도 **7열을 유지**하고(달력이 달력처럼 보여야 한다) 칸 안의 밀도만 줄인다.
 * 상태 조합은 전부 transient prop 분기다 — Emotion 컴포넌트 셀렉터는 이 레포 테스트에서 throw한다.
 */
export const DayCellRoot = styled.td<{
  $inMonth: boolean;
  $past: boolean;
  $hasPayout: boolean;
  $today: boolean;
}>`
  vertical-align: top;
  padding: ${space[2]};
  /* 격자선을 그리는 대신 칸을 카드처럼 띄운다(간격은 표의 border-spacing이 만든다). */
  border: 1px ${({ $inMonth }) => ($inMonth ? 'solid' : 'dashed')} ${color.border};
  border-color: ${({ $hasPayout, $inMonth, $today }) => {
    if ($today) return color.brand;
    if ($hasPayout && $inMonth) return color.accentBorder;
    return color.border;
  }};
  border-radius: ${radius.md};
  min-height: 104px;
  height: 104px;
  /* 지급이 있는 날은 액센트 틴트로 "여기 뭔가 있다"가 한눈에 스캔되게 한다(칩 텍스트가 내용을 말한다). */
  background: ${({ $inMonth, $past, $hasPayout, $today }) => {
    if ($today) return color.brandSubtle;
    if (!$inMonth) return 'transparent';
    if ($hasPayout) return color.accentSubtle;
    if ($past) return color.surfaceSunken;
    return color.surface;
  }};
  box-shadow: ${({ $today }) => ($today ? `inset 0 0 0 2px ${color.brand}` : 'none')};
  /* 이월 칸만 살짝 물러나게 한다 — 이 달의 실제 정보(숫자·칩)는 절대 흐리지 않는다. */
  opacity: ${({ $inMonth }) => ($inMonth ? 1 : 0.75)};
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  ${media.down('tabletSm')} {
    min-height: 88px;
    height: 88px;
    padding: ${space[1]};
  }

  ${media.down('mobile')} {
    min-height: 44px;
    height: 44px;
  }
`;

export const DayHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  flex-wrap: wrap;
`;

/** 날짜 숫자에 accent 색 금지(숫자는 데이터다). */
export const DayNumber = styled.span<{ $muted: boolean }>`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${({ $muted }) => ($muted ? color.textMuted : color.text)};
  ${font.numeric}

  ${media.down('mobile')} {
    font-size: ${font.size['2xs']};
  }
`;

/** 솔리드 브랜드 배지 — 오늘 칸의 링·틴트와 같은 색 언어로 "오늘"을 못 놓치게 한다. */
export const TodayBadge = styled.span`
  padding: 0 ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${color.onBrand};
  background: ${color.brand};
`;

/**
 * 좁은 폭에서 감춘다 — **노드는 그대로 두고 표시만 끈다**(폭에 따라 DOM이 달라지면 안 된다).
 * 감춰도 정보 손실이 없다: 같은 내용이 표 아래 아젠다 목록에 전부 있다.
 */
export const DayChipList = styled.ul`
  list-style: none;
  margin: ${space[1]} 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;

  ${media.down('mobile')} {
    display: none;
  }
`;

export const DayChipItem = styled.li`
  display: inline-flex;
  min-width: 0;
`;

/** 틴트된 칸 위에서도 뜨는 흰 카드 칩. 색 점이 종목을, 텍스트가 티커를 말한다. */
export const DayChip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 1px ${space[2]} 1px ${space[1]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: ${color.surface};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

/** 티커 왼쪽 색 점 — tickerSeriesVar가 준 CSS 변수를 인라인 background로 받는다(장식, aria-hidden). */
export const ChipDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
`;

export const MoreCount = styled.span`
  display: inline-block;
  margin-top: 2px;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  ${font.numeric}

  ${media.down('mobile')} {
    display: none;
  }
`;

/** 칩을 감추는 폭에서만 보이는 개수 배지. 칩 목록과 정확히 반대로 켜진다. */
export const CountBadge = styled.span`
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  padding: 0 ${space[1]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  background: ${color.brandSubtle};
  ${font.numeric}

  ${media.down('mobile')} {
    display: inline-flex;
  }
`;

export const SkeletonBlock = styled.span`
  display: block;
  height: 10px;
  margin-top: ${space[1]};
  border-radius: ${radius.xs};
  background: ${color.surfaceMuted};
  animation: calendar-day-pulse 1.4s ${motion.ease} infinite;

  @keyframes calendar-day-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
