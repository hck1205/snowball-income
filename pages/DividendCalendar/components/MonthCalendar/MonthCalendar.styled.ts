import styled from '@emotion/styled';
import { color, font, media, motion, outerRadius, pageHue, pageHueMix, radius, space } from '@/shared/styles';

/**
 * ── 이 격자는 **읽는 면(data)** 이다 ─────────────────────────────────────────────
 *
 * 🔴 **42칸에 색면을 깔지 마라.** 구 처방은 지급일 칸을 `accentSubtle`, 오늘 칸을 `brandSubtle` 로
 * 채웠다 — 한 화면에서 색면이 가장 많이 반복되는 자리였고, 그 결과 "무슨 색이 무슨 뜻인지"를
 * 격자가 스스로 설명해야 했다. 지금은 세 가지가 각자 **다른 채널**로 말한다:
 *
 *  | 상태 | 채널 |
 *  |---|---|
 *  | 지급 있음 | ①칸 아래 3px 레일(색) ②칩(글자) ③칩 앞 색 점 — 세 겹이라 회색조에서도 읽힌다 |
 *  | 오늘 | 2px `pageHue` **테두리 링**(면 채움 아님) + sr-only "오늘" + `aria-current` |
 *  | 지난 날 | 판으로 **가라앉는다**(면 없음) + 흐린 숫자 |
 *
 * 즉 채도는 **선·점**(L1)에만 남고 면은 전부 중립이다. 숫자의 신뢰감을 지키는 자리다.
 *
 * ── 🔴 2026-08-03 흰 캔버스 전환 — **판 위의 타일**로 다시 세웠다 ────────────────────
 *
 * 라이트 `bg` 가 순백이 되면서 이 표를 담는 지도 카드도 `surface`(= 흰색)가 됐다. 그때까지 칸은
 * "흰 카드 + 1px 테두리"였는데, 카드도 흰색이라 **칸의 면과 배경이 같은 값**이 된다 — 격자가
 * 오로지 1px 헤어라인 하나에 매달렸고(실측 1.49:1), 지도 전체가 종이에 연필로 그은 선처럼 물러났다.
 *
 * 그래서 격을 말하는 채널을 하나 되돌린다: **표 자신이 침강면(판)이 되고 칸이 그 위의 흰 타일**이다.
 * ```
 *   판(CalendarTable)   surface-sunken  #f1f3f5   ← 이 달 전체
 *   앞으로 올 날         surface         #ffffff   1.112:1 로 판 위에 뜬다
 *   지난 날 · 이월       면 없음(투명)              판으로 가라앉는다
 * ```
 * 뒤집힌 것이 핵심이다 — 예전에는 "지난 날"이 침강면을 **가졌지만**, 이제는 침강면이 판의 기본값이라
 * 지난 날은 **아무것도 안 하는 것으로** 물러난다. 남는 것은 여전히 두 채널이다(테두리 실선/점선 · 숫자 색).
 *
 * ⚠ 이 판은 `surface-sunken`(중립)이라 `tintscan` 의 틴트 면 예산과 무관하다(NEUTRAL_VARS).
 * 🔴 판을 `surface-muted` 로 내리지 마라 — 흰 타일과의 대비가 1.03:1 이라 판이 보이지 않는다
 *    (그 토큰은 더 어둡게 내릴 수도 없다 — `shared/styles/surfaces.ts` 머리말).
 */

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

/**
 * 표 루트가 이 격자의 **밀도 변수를 소유한다**.
 *
 * 🔴 밀도를 transient prop 으로 6개 부품에 각각 흘리지 않는 이유: 칸·숫자·칩·요일머리가 각자
 * 분기를 들면 한 곳만 고쳤을 때 조용히 어긋난다. CSS 커스텀 속성은 DOM 을 타고 내려가므로
 * **한 자리에서 선언하고 아래는 읽기만** 한다.
 *
 * `compact` 는 2026-08-03 리워크로 생겼다 — 이 달력은 이제 본문 전폭이 아니라 **개관 열**
 * (360~500px) 안에 산다. 같은 112px 칸을 그대로 쓰면 6주 격자만 700px 을 넘어 sticky 지도가
 * 뷰포트보다 커진다(따라붙는 의미가 사라진다). 좁은 뷰포트의 밀도는 여전히 아래 미디어 쿼리가
 * 잡는다 — 그쪽이 나중에 선언되므로 이 변수를 이긴다.
 *
 * 🔴 아래 소비처는 `var(--x)` 를 **폴백 없이** 읽는다. 두 이유다:
 *  ① 이 표가 유일한 조상이고 두 분기 모두 값을 전부 선언한다 — 폴백은 절대 쓰이지 않는 죽은 값이다.
 *  ② `var(--r, 16px)` 의 쉼표는 소스 스캐너(test/shared/radiusShape.test.ts)에 **두 값**으로 읽혀
 *     "얇은 요소의 비균일 반경"으로 오탐된다. 가드를 무디게 만드는 대신 죽은 폴백을 뺐다.
 */
export const CalendarTable = styled.table<{ $compact?: boolean }>`
  --cal-cell-height: ${({ $compact }) => ($compact ? '64px' : '112px')};
  --cal-cell-pad: ${({ $compact }) => ($compact ? '3px' : space[2])};
  --cal-cell-radius: ${({ $compact }) => ($compact ? radius.md : radius.lg)};
  --cal-day-size: ${({ $compact }) => ($compact ? font.size['2xs'] : font.size.xs)};
  --cal-head-pad: ${({ $compact }) => ($compact ? space[1] : space[2])};
  /*
   * 좁은 열의 칩은 **껍데기를 벗는다**(테두리·면·좌우 패딩 0). 실측: 개관 열 430px 에서 칸 폭이
   * 51px 이고 칩 껍데기가 12px 을 먹어 "SCHD" 가 "SC…" 로 잘렸다. 껍데기는 장식이고 글자는
   * 정보다 — 부딪히면 장식을 뺀다. **색 점은 남긴다**: 그것이 목록·범례와 이 격자를 잇는 유일한
   * 단서고, 옆의 글자가 언제나 같은 말을 하므로 색 단독 채널이 되지 않는다.
   */
  --cal-chip-pad: ${({ $compact }) => ($compact ? '0' : `1px ${space[2]} 1px ${space[1]}`)};
  --cal-chip-border: ${({ $compact }) => ($compact ? 'transparent' : color.border)};
  --cal-chip-bg: ${({ $compact }) => ($compact ? 'transparent' : color.surface)};
  --cal-chip-gap: ${({ $compact }) => ($compact ? '3px' : '4px')};
  /*
   * 칸 사이 간격. 이 값 하나가 **칸과 칸 사이 · 판 가장자리와 칸 사이**를 동시에 정한다 —
   * border-collapse 가 separate 이면 border-spacing 이 표 테두리와 가장자리 칸 사이에도 들어가기
   * 때문이다(CSS Tables §17.6.1). 🔴 그래서 판에 padding 을 **따로 주지 마라**: 주는 순간
   * 가장자리 여백만 두 배가 되어 판이 칸보다 크게 부풀어 보인다(실측 후 padding 을 도로 뺐다).
   */
  --cal-board-pad: ${({ $compact }) => ($compact ? '2px' : space[1])};

  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: var(--cal-board-pad);
  /* 🔴 판. 위 머리말 참고 — 흰 카드 위 흰 칸이 1px 헤어라인 하나에 매달리지 않게 하는 유일한 장치다. */
  background: ${color.surfaceSunken};
  /* 판의 반경 = 칸의 반경 + 가장자리 여백. 동심이라 모서리에서 칸과 판의 곡률이 어긋나지 않는다. */
  border-radius: ${outerRadius('var(--cal-cell-radius)', 'var(--cal-board-pad)')};

  /*
   * 🔴 좁은 폭의 칸 라운드도 **여기서** 정한다(2026-08-03 검증). 구 코드는 이 값을 소비처 두 곳
   * (DayCellRoot · DayJumpButton)에 radius.sm 을 각각 손으로 적었는데, 그러면 위의 판 반경만
   * 변수를 따라 넓은 폭 값(12px)에 머문다 — 실측 결과 390px 에서 판 14px vs
   * 칸 8px+여백 2px = 10px 으로 **동심이 깨져** 모서리에서 판의 회색 띠만 굵어졌다(16배 확대 확인).
   * 변수 하나만 갈아 끼우면 칸·덮개 버튼·판이 함께 따라온다 — 이 파일 머리말이 말하는
   * "한 자리에서 선언하고 아래는 읽기만"이 바로 이 경우다.
   */
  ${media.down('tabletSm')} {
    --cal-cell-radius: ${radius.sm};
  }
`;

/**
 * 요일 머리 줄.
 *
 * 🔴 **면을 갖지 않는다**(2026-08-03). 구 처방은 여기에 침강면 띠를 깔아 "이 표의 머리"를 말했는데,
 * 그건 42칸이 각자 흰 카드로 떠 있고 그 사이가 카드 면색이던 시절의 값이다. 이제는 **판 자신이
 * 침강면**이라 같은 색을 한 번 더 칠하면 아무 일도 일어나지 않는다(1.00:1).
 * 요일 축은 이제 반대로 읽힌다 — 아래 날짜 칸만 흰 타일로 떠 있으므로 **면이 없다는 사실**이
 * "여기는 날짜가 아니다"를 말한다.
 */
export const WeekdayRow = styled.tr`
  th {
    background: transparent;
  }
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
  padding: var(--cal-head-pad) 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
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
  padding: var(--cal-cell-pad);
  /* 격자선을 그리는 대신 칸을 카드처럼 띄운다(간격은 표의 border-spacing이 만든다). */
  border: 1px ${({ $inMonth }) => ($inMonth ? 'solid' : 'dashed')} ${color.border};
  border-color: ${({ $hasPayout, $inMonth, $today }) => {
    /* 오늘 칸의 테두리는 아래 링이 대신 그린다 — 두 겹이 겹치면 2px 링이 3px 로 보인다. */
    if ($today) return 'transparent';
    if ($hasPayout && $inMonth) return color.borderStrong;
    return color.border;
  }};
  border-radius: var(--cal-cell-radius);
  height: var(--cal-cell-height);
  /*
   * 🔴 면은 **중립뿐이다.** 지급 여부를 면색으로 가르지 않는다(위 머리말 표 참고) —
   * 색은 아래 3px 레일과 칩 앞 점에만 남는다.
   *
   * 흰 캔버스 전환(2026-08-03) 이후 **면을 갖는 칸은 "앞으로 올 날" 하나뿐이다.** 지난 날과 이월은
   * 판(침강면) 위에 아무것도 칠하지 않아 그대로 가라앉는다 — 예전처럼 지난 날에 침강면을 칠하면
   * 판과 같은 값이라 아무 일도 일어나지 않고, 대신 "앞으로 올 날"이 흰 타일로 떠오르는 것이
   * 이 격자가 답해야 하는 질문("언제 들어오나")과 방향이 같다.
   */
  background: ${({ $inMonth, $past }) => ($inMonth && !$past ? color.surface : 'transparent')};
  /*
   * 두 종류의 inset 그림자를 한 선언에 합친다:
   *  ①오늘  = 2px pageHue **링**(네 변 · 원색). 면 채움이 아니라 테두리다.
   *  ②지급일 = 칸 아래 3px **레일**(한 변 · 55% 로 흐림). 높이 3px 이라 틴트 면 판정(≥8px) 밖이다.
   *
   * ⚠ 둘 다 같은 hue 를 쓰므로 **모양과 농도로 갈라 둔다** — 링(사방·원색) vs 밑줄(한 변·연함).
   *   같은 굵기·같은 농도로 두면 "오늘"과 "지급일"이 한눈에 구분되지 않는다(실측 확인 2026-08-03).
   */
  box-shadow: ${({ $today, $hasPayout, $inMonth }) => {
    const layers: string[] = [];
    if ($today) layers.push(`inset 0 0 0 2px ${pageHue}`);
    if ($hasPayout && $inMonth) layers.push(`inset 0 -3px 0 ${pageHueMix(55, 'transparent')}`);
    return layers.length > 0 ? layers.join(', ') : 'none';
  }};
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
  /* 좁은 칸에 16px 라운드는 과하다 — 칸이 작아질수록 모서리도 각지게(실기기 피드백 2026-07-26).
     그 값은 위 CalendarTable 이 --cal-cell-radius 로 내린다(판까지 함께 따라와야 동심이 유지된다). */
  ${media.down('tabletSm')} {
    height: 72px;
    padding: ${space[1]};
  }

  ${media.down('mobile')} {
    /* 터치 타깃 하한이자 실기기(375px) 확인 값 — 64px는 격자가 세로로 늘어져 48px로 확정(2026-07-26). */
    height: 48px;
  }
`;

/**
 * 날짜 숫자 줄. 배지("오늘"·개수)는 폐기됐다(사용자 결정 2026-07-26) —
 * 오늘은 칸 보더(브랜드 링+틴트)가, 개수는 칩 나열 자체가 말한다.
 */
export const DayHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[1]};
`;

/** 날짜 숫자에 accent 색 금지(숫자는 데이터다). */
export const DayNumber = styled.span<{ $muted: boolean }>`
  font-size: var(--cal-day-size);
  font-weight: ${font.weight.semibold};
  color: ${({ $muted }) => ($muted ? color.textMuted : color.text)};
  ${font.numeric}

  ${media.down('mobile')} {
    font-size: ${font.size['2xs']};
  }
`;

/* "오늘" 텍스트 배지는 전 폭에서 폐기됐다(사용자 결정 2026-07-26) — 시각 신호는 칸의 2px
   pageHue **링**이 전담하고(2026-08-03 부터 면 채움은 없다), "오늘"이라는 말은
   VisuallyHidden으로 접근성 트리에만 남긴다. */

/**
 * 어느 폭에서든 티커 칩을 그대로 보여준다(좁으면 ellipsis로 줄인다 — 사용자 결정 2026-07-26,
 * 구 설계의 "점 축약"과 "모바일 전체 숨김+개수 배지"를 폐기). 전체 이름은 아젠다 목록·툴팁이 말한다.
 */
export const DayChipList = styled.ul<{ $preview?: boolean }>`
  list-style: none;
  margin: ${space[1]} 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  /* 칸을 덮는 이동 버튼(DayJumpButton) 위로 올린다 — 칩이 hover·클릭(툴팁)을 직접 받아야 한다.
     칩 영역 밖(칸의 나머지)은 여전히 이동 버튼이 받는다. */
  position: relative;
  z-index: 1;

  /*
   * 예시(미리보기) 칩 — 흐리게 깔아 "여기 이런 게 뜬다"만 말하고 실제 데이터와 무게를 겨루지 않는다.
   * ⚠ 이 흐림은 **보조 신호일 뿐**이다. 예시라는 사실 자체는 라벨 텍스트와 표의 접근명이 말한다
   *   (카피의 preview 묶음) — 색·투명도만으로 구분하면 고대비 모드와 스크린리더에서 통째로 사라진다.
   */
  ${({ $preview }) =>
    $preview
      ? `
    opacity: 0.45;
    filter: saturate(0.5);
    pointer-events: none;
  `
      : ''}

  /* 좁은 폭의 칩은 표시 전용 — 포인터를 뚫어 칸 탭이 이동 버튼(아젠다 점프)에 가게 한다. */
  ${media.down('tabletSm')} {
    pointer-events: none;
  }
`;

export const DayChipItem = styled.li`
  display: inline-flex;
  min-width: 0;
`;

/**
 * 중립 칸 위에 뜨는 흰 카드 칩. **텍스트가 티커를 말한다** — 앞에 붙는 색 점(`ChipDot`)은 장식이라
 * 좁은 폭에서 가장 먼저 빠진다(개수 배지는 폐기 — 사용자 결정 2026-07-26: 어느 폭에서든 티커
 * 텍스트를 ellipsis로 보여준다).
 * 버튼인 이유: hover + 클릭으로 커스텀 툴팁을 여는 트리거라 키보드 포커스가 필요하다.
 */
export const DayChip = styled.button`
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--cal-chip-gap);
  max-width: 100%;
  min-width: 0;
  padding: var(--cal-chip-pad);
  border: 1px solid var(--cal-chip-border);
  border-radius: ${radius.pill};
  font: inherit;
  font-size: ${font.size['2xs']};
  /* 🔴 bold 로 올리지 마라 — 390px 칸에서 칩에 쓸 수 있는 폭이 35px 남짓이라 굵기 한 단이
     보이는 글자 수를 깎는다. 칩의 무게는 알약 모양과 색 점이 이미 만든다. */
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: var(--cal-chip-bg);
  cursor: pointer;
  ${font.numeric}

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }

  /*
   * 🔴 좁은 폭에서는 **글자가 이긴다**(사용자 결정 2026-07-26 — 어느 폭에서든 티커 텍스트를
   * ellipsis 로 보여준다). 390px 에서 칩에 쓸 수 있는 폭은 35px 남짓이라, 색 점(6px)과 그 간격(4px)이
   * 들어가면 티커가 **한 글자**까지 잘린다(실측 2026-08-03: "JEP" → "J"). 점은 장식이고 글자는
   * 정보다 — 둘이 부딪히면 장식을 뺀다. 색 언어는 바로 아래 아젠다 목록이 그대로 잇는다.
   */
  ${media.down('tabletSm')} {
    cursor: default;
    gap: 0;
    padding: 1px ${space[1]};

    > span:first-of-type[aria-hidden='true'] {
      display: none;
    }
  }
`;

/**
 * 칩 앞의 **종목 색 점**(장식, aria-hidden).
 *
 * 이 점 하나가 달력 칩 · 아젠다 막대 · 미정 칩 · 범례 표를 **한 색 언어**로 잇는다 — 같은 종목이
 * 네 자리에서 같은 색이라, 달을 넘기며 눈으로 좇을 수 있다. 색은 인라인 style 로 들어온다
 * (호출부가 화면 전체 집합으로 배정한 시리즈 변수) — 여기서 색을 정하지 마라.
 *
 * ⚠ 점은 **혼자 말하지 않는다.** 바로 옆 글자가 티커를 말하므로 색각이상·회색조에서도 정보가 남는다.
 */
export const ChipDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
`;

/** 칩 안의 티커 글자 — 칸 폭보다 길면 ellipsis로 줄인다(전체 이름은 툴팁·아젠다 목록이 말한다). */
export const ChipLabel = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MoreCount = styled.span`
  display: inline-block;
  margin-top: 2px;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  ${font.numeric}
`;

/* 개수 배지(CountBadge)는 폐기됐다(사용자 결정 2026-07-26) — 어느 폭에서든 칩이 직접 나열되므로
   "몇 건"은 칩 개수 자체가 말하고, 넘침은 MoreCount(+N)가 말한다. */

/**
 * 날짜 칸 전체를 덮는 투명 버튼(stretched-link) — 누르면 아래 아젠다의 그 날짜로 간다.
 *
 * `<td>`에 핸들러를 얹지 않고 버튼을 까는 이유: 셀은 버튼이 아니다. 선언하는 계약은 "버튼 하나"뿐이고
 * 포커스·Enter/Space·역할 전달을 전부 브라우저가 이행한다(`role="grid"` 금지 결정과 정합).
 * 지급이 있는 칸에만, 그리고 콜백이 배선됐을 때만 렌더한다.
 *
 * 휴지 상태에 **아무것도 그리지 않는다** → 데스크톱 기본 화면의 픽셀 변화가 0이다.
 * 호버·포커스가 채움이 아니라 **안쪽 링**인 이유: 채우면 그 아래 칩·숫자를 덮어 정보가 가려진다.
 */
export const DayJumpButton = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  /* 칸과 같은 라운드 — 좁은 폭 값까지 변수를 그대로 따라가므로 링이 모서리에서 칸 밖으로 비어지지 않는다. */
  border-radius: var(--cal-cell-radius);
  background: transparent;
  appearance: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    box-shadow: inset 0 0 0 2px ${pageHueMix(60, 'transparent')};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

`;

/**
 * 날짜 칸 안의 로딩 자리표시.
 *
 * reduced-motion 에서 **일부러 되찾지 않는다**(2026-07-30 판정, ExchangeRateWidget·MarketIndexStrip 과
 * 같은 근거): 스켈레톤이 말하는 것은 "아직 살아 있다"가 아니라 **"이 칸에 올 값이 아직 없다"**이고,
 * 그건 회색 막대의 *모양*이 통째로 말한다. 펄스의 쉬는 프레임이 `opacity: 1` 이라 정지가 가장 잘
 * 보이는 프레임이기도 하다. 되찾는 쪽은 **스피너**뿐이다(모양만으로 "멈췄다/일한다"를 못 가른다).
 */
export const SkeletonBlock = styled.span`
  display: block;
  height: 10px;
  margin-top: ${space[1]};
  border-radius: ${radius.xs};
  /* 🔴 surface-muted 로 되돌리지 마라 — 이 막대는 **흰 타일 위**에 앉는데 그 조합은 1.03:1 이라
     로딩 자리표시가 통째로 안 보인다(그래서 "빈 칸"으로 읽힌다). 침강면이 최소한의 계단이다. */
  background: ${color.surfaceSunken};
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
