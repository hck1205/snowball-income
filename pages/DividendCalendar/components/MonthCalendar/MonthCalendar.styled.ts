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
  /* 칸을 덮는 이동 버튼(DayJumpButton)의 컨테이닝 블록. */
  position: relative;
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

  /*
   * ⚠ 표 셀에는 min-height가 적용되지 않는다(CSS2.1 — display:table-cell에서 min/max-height는
   * undefined, 브라우저가 무시한다. 375px 실기기에서 min-height 하한이 안 먹는 것 확인, 2026-07-26).
   * 대신 td의 height가 정확히 "최소 높이"로 동작한다(내용이 넘치면 늘어난다) — 그래서 height를 쓴다.
   */
  ${media.down('tabletSm')} {
    height: 72px;
    padding: ${space[1]};
    /* 좁은 칸에 12px 라운드는 과하다 — 칸이 작아질수록 모서리도 각지게(실기기 피드백 2026-07-26). */
    border-radius: ${radius.xs};
  }

  ${media.down('mobile')} {
    /* 터치 타깃 하한이자 실기기(375px) 확인 값 — 64px는 격자가 세로로 늘어져 48px로 확정(2026-07-26). */
    height: 48px;
  }
`;

/**
 * 날짜 숫자 + 배지 줄.
 *
 * 모바일에서 `flex-wrap: wrap`은 ~41px 칸에서 요소를 3줄로 흩어 격자를 부풀렸다 →
 * **세로 스택 1행=날짜, 2행=개수 배지**로 줄 수를 우리가 정한다(줄바꿈을 폭에 맡기지 않는다).
 */
export const DayHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  flex-wrap: wrap;

  ${media.down('mobile')} {
    flex-direction: column;
    align-items: flex-start;
    flex-wrap: nowrap;
    gap: 2px;
  }
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

/**
 * 솔리드 브랜드 배지 — 오늘 칸의 링·틴트와 같은 색 언어로 "오늘"을 못 놓치게 한다.
 *
 * ≤560px에서는 **시각적으로만** 숨긴다(`display: none`이 아니다): 칸 폭이 ~41px라 nowrap 배지가
 * 가로로 넘쳐 잘려 보이던 것이 실제 증상이었다. 오늘의 시각 신호는 칸의 브랜드 링+틴트가 이미
 * 담당하고, "오늘"이라는 **말**은 접근성 트리에 남아야 한다(오늘 = `aria-current="date"` + "오늘" 배지).
 * `display: none`은 그 말을 지울 뿐 아니라 jsdom이 실제로 평가하는 속성이라 테스트 기준까지 갈린다.
 */
export const TodayBadge = styled.span`
  padding: 0 ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${color.onBrand};
  background: ${color.brand};

  ${media.down('mobile')} {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
    /* 브랜드 채움이 1px 점으로 남지 않게. */
    background: none;
  }
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

  /* 칩이 점으로 줄어드는 폭 — 점끼리는 조금 더 벌려야 개수가 눈으로 세어진다. */
  ${media.down('tabletSm')} {
    gap: 3px;
  }

  ${media.down('mobile')} {
    display: none;
  }
`;

export const DayChipItem = styled.li`
  display: inline-flex;
  min-width: 0;
`;

/**
 * 틴트된 칸 위에서도 뜨는 흰 카드 칩. 색 점이 종목을, 텍스트가 티커를 말한다.
 *
 * ≤760px에서는 **칩 껍데기를 벗고 점만 남긴다** — 이 폭에서 티커 텍스트를 담은 칩 3개는 칸 폭을
 * 넘겨 잘려 보였다. 잃는 정보(어느 종목)는 아래 아젠다 목록에 그대로 있고, "몇 건"은 CountBadge가 말한다.
 */
export const DayChip = styled.span`
  position: relative;
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

  ${media.down('tabletSm')} {
    padding: 0;
    border-color: transparent;
    background: transparent;
  }
`;

/**
 * 칩 안의 티커 글자. 좁은 폭에서 **시각적으로만** 감춘다 — `display: none`으로 지우면
 * 칸에 색점만 남아 스크린리더에서 종목명이 사라진다(표 셀은 여전히 선형으로 읽힌다).
 */
export const ChipLabel = styled.span`
  ${media.down('tabletSm')} {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
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

  /* 텍스트가 빠진 폭에서는 점 자체가 칩이다 — 조금 키우고 오른쪽 여백을 없앤다. */
  ${media.down('tabletSm')} {
    width: 8px;
    height: 8px;
    margin-right: 0;
  }
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

/**
 * 개수 배지.
 *
 * 노출 시작이 **칩이 점으로 줄어드는 폭(≤760px)** 이다(구: 칩이 완전히 사라지는 ≤560px).
 * 점은 색뿐이라 "몇 건인가"를 못 나른다 — 개수는 숫자 텍스트가 말해야 한다.
 */
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

  ${media.down('tabletSm')} {
    display: inline-flex;
  }
`;

/**
 * 날짜 칸 전체를 덮는 투명 버튼(stretched-link) — 누르면 아래 아젠다의 그 날짜로 간다.
 *
 * `<td>`에 핸들러를 얹지 않고 버튼을 까는 이유: 셀은 버튼이 아니다. 선언하는 계약은 "버튼 하나"뿐이고
 * 포커스·Enter/Space·역할 전달을 전부 브라우저가 이행한다(`role="grid"` 금지 결정과 정합).
 * 지급이 있는 칸에만, 그리고 콜백이 배선됐을 때만 렌더한다.
 *
 * 휴지 상태에 **아무것도 그리지 않는다** → 데스크톱 기본 화면의 픽셀 변화가 0이다.
 * 호버·포커스가 채움이 아니라 **안쪽 링**인 이유: 채우면 그 아래 색점·숫자를 덮어 정보가 가려진다.
 */
export const DayJumpButton = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  border-radius: ${radius.md};
  background: transparent;
  appearance: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    box-shadow: inset 0 0 0 2px ${color.brandBorder};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

  /* 칸의 좁은 폭 라운드(radius.xs)와 맞춘다 — 링이 모서리에서 칸 밖으로 비어져 보이지 않게. */
  ${media.down('tabletSm')} {
    border-radius: ${radius.xs};
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
