import styled from '@emotion/styled';
import { color, container, font, iconSwapIn, media, motion, radius, shadow, space } from '@/shared/styles';

export const SelectedChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};

  ${media.down('drawer')} {
    margin-top: ${space[4]};
  }
`;

export const AllocationChartLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 16px);
  align-items: start;
  contain: layout style;
`;

export const AllocationLegend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  container-type: inline-size;
`;

const stackedLegendItem = `
  grid-template-columns: 16px 40px minmax(0, 1fr) 60px;
  grid-template-areas:
    'dot name name value'
    'dot slider slider fix'
    'sub sub sub sub';
  gap: ${space[2]};
`;

export const AllocationLegendItem = styled.li`
  display: grid;
  /*
   * 고정 버튼은 행의 **맨 우측**이다. 한때 슬라이더 앞(name 다음)으로 옮겼던 이유는
   * 모바일에서 슬라이더를 쓸다가 오른쪽 끝의 고정을 잘못 누르는 사고였는데,
   * 카드 헤더의 "비율 조절 잠금" 토글이 그 오조작을 원천 차단하면서 근거가 사라졌다.
   */
  grid-template-columns: 16px 72px minmax(120px, 1fr) 52px 60px;
  /* 2행: 주식 수·금액·월 배당. 슬라이더 행과 같은 값을 다른 단위로 읽은 것이라 같은 행 묶음 안에 산다. */
  grid-template-areas:
    'dot name slider value fix'
    'sub sub sub sub sub';
  gap: ${space[2]};
  row-gap: ${space[1]};
  align-items: center;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};

  ${container.down('mobile')} {
    ${stackedLegendItem};
  }

  ${media.down('mobile')} {
    ${stackedLegendItem};
  }
`;

export const AllocationColorDot = styled.span<{ color: string }>`
  grid-area: dot;
  width: 12px;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${({ color: dotColor }) => dotColor};
`;

export const AllocationLegendName = styled.span`
  grid-area: name;
  min-width: 0;
  color: ${color.text};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 비중 슬라이더. **채워진 트랙 색 = 도넛 조각 색**(`$seriesColor` = `var(--sb-chart-series-N)`).
 *
 * 종전에는 전 행의 트랙이 똑같은 브랜드색이고 왼쪽 점만 색이 달라서, "이 슬라이더가 도넛의 어느
 * 조각인가"가 화면에서 연결되지 않았다. 면적이 큰 트랙에 같은 색을 넣으면 그 대응이 즉시 읽힌다.
 *
 * 규율 셋:
 *  - 색이 붙는 곳은 **트랙(면)과 손잡이뿐**이다. 비중 % 숫자에는 색을 넣지 않는다(데이터에 색 금지).
 *  - **색이 유일한 단서가 아니다** — 같은 행에 티커명(AllocationLegendName)이 항상 함께 선다.
 *  - 트랙 위에 텍스트를 얹지 않는다(8프리셋 × 라이트/다크에서 시리즈 색 명암이 갈린다).
 *
 * 색표를 여기서 따로 갖지 않는다 — 호출부가 캔버스(파이)와 **같은 인덱스 규칙**으로 넘긴다.
 */
export const AllocationLegendSlider = styled.input<{ $seriesColor: string }>`
  grid-area: slider;
  width: 100%;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  background: ${({ $seriesColor }) => `linear-gradient(
    to right,
    ${$seriesColor} 0%,
    ${$seriesColor} var(--slider-progress),
    ${color.surfaceSunken} var(--slider-progress),
    ${color.surfaceSunken} 100%
  )`};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  --slider-progress: 0%;
  margin: 0;
  padding: 0;
  cursor: pointer;

  /*
   * 활성 슬라이더만 가로 제스처를 소유한다(pan-y = 세로 스크롤은 브라우저가 유지, 가로 드래그는 썸으로).
   * 모바일 드로어에서 슬라이더를 쓸다가 세로 스크롤에 드래그를 뺏기던 문제 보정.
   * disabled는 어차피 드래그가 안 되므로 제외한다.
   */
  &:not(:disabled) {
    touch-action: pan-y;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  /*
   * 손잡이 깊이는 토큰으로만 말한다(DESIGN.md §6). 종전 생 리터럴 '0 1px 3px rgba(15,25,35,0.3)' 는
   * 어느 테마에서도 같은 값이라 **다크에서 어두운 면 위에 어두운 그림자**로 사라졌다.
   * 손잡이의 구조적 경계는 여전히 'border: 2px solid color.surface' 가 만든다 — 그림자는 높이만.
   */
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${({ $seriesColor }) => $seriesColor};
    box-shadow: ${shadow.e1};
  }

  &::-moz-range-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-progress {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${({ $seriesColor }) => $seriesColor};
    box-shadow: ${shadow.e1};
  }
`;

const stackedFixButton = `
  justify-self: end;
`;

export const AllocationFixButton = styled.button<{ active: boolean }>`
  grid-area: fix;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[1]};
  width: 60px;
  height: 28px;
  border: 1px solid ${({ active }) => (active ? color.brand : color.borderStrong)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  border-radius: ${radius.xs};
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
  }

  ${container.down('mobile')} {
    ${stackedFixButton};
  }

  ${media.down('mobile')} {
    ${stackedFixButton};
  }
`;

export const AllocationLegendValue = styled.span`
  grid-area: value;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  justify-self: end;
  ${font.numeric};
`;

/**
 * 범례 하단 단일 힌트 줄 — 슬라이더가 왜 비활성인지(무음 비활성 금지) 우선순위로 하나만 안내한다.
 * 아이콘+문장을 함께 두어(색각 대비) inline-flex로 정렬하고, 필요 시 '고정 전체 해제' 버튼을 옆에 인라인으로 편다.
 */
export const AllocationHint = styled.p`
  margin: ${space[2]} 0 0;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};

  /*
   * 이 줄의 글리프는 사유가 바뀔 때마다 갈린다(잠금 Lock ↔ 한 칸만 조정 가능 Pin ↔ 단일 종목 Info).
   * 글자는 그대로인데 아이콘만 바뀌면 눈치채기 어려워서, 새 글리프가 들어올 때만 한 번 커진다.
   */
  svg {
    flex: 0 0 auto;
    ${iconSwapIn}
  }
`;

/**
 * '고정 전체 해제' 단축 액션 — secondary 텍스트 버튼 톤(brand 채움 금지, 크롬에 데이터색/accent 금지).
 */
export const AllocationClearFixedButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  border: none;
  background: none;
  padding: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: ${font.leading.normal};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  touch-action: manipulation;
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }
`;

/* ────────────────────────────────────────────────────────────────────────────
 * 보유 줄 — 비중 슬라이더 바로 아래에서 같은 배분을 "몇 주 · 얼마 · 월 얼마"로 읽는다.
 *
 * 슬라이더 위에 얹지 않고 **아래 줄**로 뺀 이유: 트랙 위에 텍스트를 얹지 않는다는 이 파일의
 * 규율(AllocationLegendSlider 머리말)과, 8프리셋 × 라이트/다크에서 시리즈 색 위 명암이 갈리는 문제.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * 범례 열. `AllocationLegend`(ul) 아래에 합계 줄(p)을 세우려면 둘을 한 칸에 묶어야 한다 —
 * 차트 레이아웃이 auto-fit 그리드라 자식을 하나 더 두면 세 번째 칸이 생긴다.
 */
export const AllocationLegendColumn = styled.div`
  min-width: 0;
`;

export const AllocationHoldingRow = styled.div`
  grid-area: sub;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  /* 색 점 폭 + 열 간격 — 위 줄의 티커명과 같은 세로선에서 시작한다. */
  padding-left: calc(16px + ${space[2]});
  min-width: 0;
  color: ${color.textMuted};
`;

/**
 * 수량 입력 자리. 크기는 `QuantityInput` 의 `size="sm"` 이 정하고(28px·100px), 여기서는 그 칸이
 * 줄어들거나 늘어나지 않게만 잡는다 — 행의 다른 값들이 같은 세로선에서 시작해야 위아래가 읽힌다.
 * ⚠ 여기서 input 을 CSS 로 다시 키우지 마라. 크기는 그 컴포넌트가 소유한다.
 */
export const AllocationHoldingField = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
`;

/** 평가 금액 — 참고 값이라 강조하지 않는다(강조는 월 배당 하나만 받는다). */
export const AllocationHoldingAmount = styled.span`
  color: ${color.textSecondary};
  ${font.numeric};
`;

/**
 * 이 종목이 **지금 기준 매달 주는 돈**. 행에서 유일하게 강조되는 숫자다 —
 * 사용자가 수량을 치는 이유가 이 값을 보기 위해서다.
 */
export const AllocationHoldingDividend = styled.span`
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  ${font.numeric};
`;

/** 값 사이 구분점. 장식이라 낭독에서 뺀다(호출부가 aria-hidden 을 붙인다). */
export const AllocationHoldingDivider = styled.span`
  color: ${color.borderStrong};
`;

/**
 * 합계 줄. 종목 행과 같은 항목을 같은 순서로 읽되, 왼쪽 라벨이 '합계'로 바뀐다.
 * 기준(시작 시점·세후)을 여기 한 번만 적는다 — 행마다 반복하면 숫자가 안 읽힌다.
 */
export const AllocationHoldingTotal = styled.p`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  margin: ${space[2]} 0 0;
  padding: ${space[2]} 0 0;
  padding-left: calc(16px + ${space[2]});
  border-top: 1px solid ${color.border};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const AllocationHoldingTotalLabel = styled.span`
  color: ${color.textSecondary};
  font-weight: ${font.weight.medium};
`;

/** 기준 표기. 값이 아니라 조건이라 오른쪽 끝으로 밀어 숫자 흐름과 섞이지 않게 한다. */
export const AllocationHoldingBasis = styled.span`
  margin-left: auto;
  color: ${color.textMuted};
`;

/**
 * 수량 입력이 잠긴 사유 줄. 합계 아래에 한 번만 선다 — 행마다 반복하면 정작 숫자가 안 읽힌다.
 * 슬라이더 비활성 사유(AllocationHint)와 **다른 줄**이다: 저쪽은 비중 조절, 이쪽은 주식 수다.
 */
export const AllocationHoldingNotice = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${space[1]};
  margin: ${space[1]} 0 0;
  padding-left: calc(16px + ${space[2]});
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};
`;

/** 낭독 전용 라벨 — 화면에서는 열/맥락이 대신하지만 스크린리더는 셀만 읽는다. */
export const AllocationSrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
