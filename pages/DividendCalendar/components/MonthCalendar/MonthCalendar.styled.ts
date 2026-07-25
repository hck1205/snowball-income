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

/** 일·토를 색으로 구분하지 않는다 — 주말 강조는 이 화면에서 정보가 아니다. */
export const WeekdayHead = styled.th`
  padding-bottom: ${space[1]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};

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
  border: 1px ${({ $inMonth }) => ($inMonth ? 'solid' : 'dashed')} ${color.border};
  border-color: ${({ $hasPayout, $inMonth }) => ($hasPayout && $inMonth ? color.brandBorder : color.border)};
  border-radius: ${radius.sm};
  min-height: 104px;
  height: 104px;
  background: ${({ $inMonth, $past, $today }) => {
    if ($today) return color.brandSubtle;
    if (!$inMonth) return color.surfaceMuted;
    if ($past) return color.surfaceSunken;
    return color.surface;
  }};
  box-shadow: ${({ $today }) => ($today ? `inset 0 0 0 2px ${color.brand}` : 'none')};
  transition: background ${motion.fast} ${motion.ease};

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

export const TodayBadge = styled.span`
  padding: 0 ${space[1]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  color: ${color.brandText};
  background: ${color.surface};
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

export const DayChip = styled.span`
  display: inline-block;
  max-width: 100%;
  padding: 1px ${space[1]};
  border-radius: ${radius.xs};
  font-size: ${font.size['2xs']};
  color: ${color.textSecondary};
  background: ${color.surfaceHover};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
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
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
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
