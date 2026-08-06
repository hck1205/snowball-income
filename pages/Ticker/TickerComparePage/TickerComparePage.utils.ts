import { CHART_SERIES_VARS } from '@/shared/styles';
import { MAX_COMPARE_TICKERS, MIN_COMPARE_TICKERS, buildTickerCompareModel } from '../utils';
import type { CompareBasis, ComparePreset, CompareRow } from '../utils';

/**
 * `/ticker/compare` **화면 전용** 파생 — 계산이 아니라 **배치**를 위한 순수 값들이다.
 *
 * 🔴 여기서 숫자를 만들지 않는다. 전부 `pages/Ticker/utils` 의 모델을 다시 묶거나 세는 것뿐이고,
 * 값 자체는 그 파일이 단일 원천으로 소유한다(그래서 표시값이 두 곳에서 갈릴 수 없다).
 *
 * ⚠ 개편으로 새로 생긴 문구도 여기 산다(별도 `X.copy.ts` 를 만들지 않는다) —
 *   `.cursor/rules` §3 의 컴포넌트 폴더 파일 세트에 `.copy.ts` 접미사가 없고,
 *   그 계약은 `test/shared/structureRules.test.ts` 가 잠근다.
 */

/* ── 문구 ──────────────────────────────────────────────────────────────────── */

/**
 * 레이아웃 개편으로 **새로 생긴 자리**의 문구.
 *
 * 기존 문구는 `pages/Ticker/copy/tickerCompareCopy.ts`(`TICKER_COMPARE_COPY`)가 그대로 소유한다 —
 * 이 상수는 그것을 대체하지 않고, 개편에서 새로 생긴 자리(선택 덱 · 결론 블록 · 행 묶음 머리 ·
 * 예시 카드 · 1종만 고른 중간 상태)만 담는다. 이미 있는 문장은 여기서 다시 쓰지 않는다
 * (두 곳에 같은 문장이 있으면 한쪽만 고쳐지는 날이 반드시 온다).
 *
 * 🔴 카피 규율은 같다 — 격식체, 사실 진술만("가장 높음"은 사실 · "가장 좋음"은 판단),
 * 가정치를 관측치처럼 부르지 않는다, "눈덩이/스노우볼" 비유 금지.
 */
export const TICKER_COMPARE_LAYOUT_COPY = {
  /** 선택 덱 — 고른 종목이 **자리(슬롯)** 로 보이는 영역. */
  deck: {
    /** 남은 자리를 문장이 아니라 숫자로도 말한다. */
    count: (selected: number) => `${selected} / ${MAX_COMPARE_TICKERS}`,
    countLabel: '고른 종목',
    /** 빈 슬롯의 글자. 장식이라 스크린리더에서는 감춘다(개수는 위 숫자가 말한다). */
    emptySlot: '빈 자리',
    slotsLabel: '고른 종목 목록'
  },

  /**
   * 결론 블록 — 이 화면이 답하는 질문("이 조합이면 매달 들어오는가")을 **표보다 먼저** 말한다.
   * 종전에는 같은 내용이 표 아래 세 번째 카드의 작은 회색 문장이었다.
   */
  verdict: {
    eyebrow: '지급월 커버리지',
    value: (covered: number) => `${covered}/12`,
    unit: '개월',
    valueLabel: (covered: number) => `12개월 중 ${covered}개월에 지급월이 있습니다.`,
    trackLabel: '월별 지급 종목',
    /** 지급 종목이 없는 달의 표식. 🔴 색이 아니라 글자·모양이 먼저 말한다. */
    gapMark: '없음'
  },

  /** 표의 행 묶음 머리. 제목·설명은 `TICKER_COMPARE_COPY.basis` 에서 가져와 이 틀에 넣는다. */
  table: {
    groupTitle: (basisLabel: string) => `${basisLabel} 지표`,
    /** 가로 스크롤이 필요한 좁은 폭에서 표의 조작법을 알린다. */
    scrollHint: '표를 좌우로 밀어 나머지 종목을 보실 수 있습니다.'
  },

  /** 빈 상태 — 예시 조합이 목록이 아니라 **고르는 카드 격자**가 됐다. */
  empty: {
    suggestionHint: '카드를 누르면 그 조합으로 비교표가 바로 열립니다.',
    /** 조합이 1년 중 몇 달을 덮는지. 예시를 고르는 실제 근거라 카드에 함께 싣는다. */
    coverBadge: (covered: number) => `${covered}/12`,
    coverCaption: (covered: number) => `12개월 중 ${covered}개월 지급`
  },

  /**
   * 1종만 고른 중간 상태. 종전에는 이 경우에도 "종목을 골라 주세요" 빈 상태가 그대로 떠서,
   * **이미 고른 것이 없는 것처럼** 보였다.
   */
  partial: {
    title: (ticker: string) => `${ticker} 한 종목을 골랐습니다`,
    body: `${MIN_COMPARE_TICKERS}종부터 비교표가 열립니다. 한 종목만 더 고르시면 됩니다.`,
    /** 예시 카드는 선택을 **덮어쓴다** — 누르기 전에 알려 준다. */
    replaceHint: '아래 예시를 누르시면 지금 고른 종목이 그 조합으로 바뀝니다.'
  }
} as const;

/* ── 행 묶음 ───────────────────────────────────────────────────────────────── */

/**
 * 표의 행을 **출처(basis)로 묶는 순서**. 실측 → 참고 → 계산 가정.
 *
 * 🔴 이 순서가 이 화면의 정직성 장치를 **레이아웃으로** 옮긴 것이다. 종전에는 일곱 행이
 * 한 덩어리로 이어져 배지를 읽어야만 출처가 갈렸다 — 즉 정보는 있었지만 **위계는 없었다.**
 * 확인한 값을 먼저, 우리가 정한 값을 나중에 두면 읽는 순서 자체가 신뢰도 순서가 된다.
 *
 * ⚠ 행 **안쪽 순서**는 모델이 준 그대로 유지한다(현재가 → 배당률 → … 의 의미 순서).
 */
export const COMPARE_BASIS_ORDER: readonly CompareBasis[] = ['observed', 'reference', 'assumed'];

export type CompareRowGroup = {
  readonly basis: CompareBasis;
  readonly rows: readonly CompareRow[];
};

/** 행을 출처별로 묶는다. 비어 있는 묶음은 머리만 남지 않도록 아예 뺀다. */
export const groupRowsByBasis = (rows: readonly CompareRow[]): readonly CompareRowGroup[] =>
  COMPARE_BASIS_ORDER.map((basis) => ({ basis, rows: rows.filter((row) => row.basis === basis) })).filter(
    (group) => group.rows.length > 0
  );

/* ── 예시 조합 미리보기 ────────────────────────────────────────────────────── */

/**
 * 예시 카드의 레일 색이 될 CSS 변수 **이름**(`var()` 를 벗긴 형태 — `PickCard` 의 `scopedVar` 계약).
 *
 * ⚠ 여기 색은 **종목 정체성이 아니다.** 예시 카드는 한 종목이 아니라 조합을 가리키므로
 * `assignSeries`(종목 → 색)를 쓰지 않고 **목록 안 순서**로 돌린다. 랜딩 프리셋 배분 막대가
 * `index % 8` 을 유지하는 것과 같은 이유다 — 역할이 다른 것을 통일하면 오히려 틀린다.
 */
export const presetRailVar = (index: number): string =>
  `--sb-chart-series-${index % Math.max(1, CHART_SERIES_VARS.length)}`;

/**
 * 예시 카드 한 장이 그리는 것.
 *
 * 🔴 `coveredCount` / `monthFlags` 는 **실제 모델에서 센 값**이다(라벨을 뒷받침하지 않는 장식이
 * 아니다). 카드가 "12개월 중 몇 달을 덮는가"를 미리 보여 주면, 열 개 중 무엇을 누를지가
 * 라벨만 읽을 때보다 훨씬 빨리 정해진다 — 이 화면이 답하는 질문이 바로 그것이기 때문이다.
 */
export type ComparePresetPreview = {
  readonly id: string;
  readonly label: string;
  readonly tickers: readonly string[];
  /** 1~12월 중 한 종목이라도 지급하는 달의 수. */
  readonly coveredCount: number;
  /** 인덱스 0 = 1월. 그 달에 지급 종목이 있는가. */
  readonly monthFlags: readonly boolean[];
  /** 카드 레일·미니 트랙이 쓸 CSS 변수 **이름**(아래 `presetRailVar`). */
  readonly railVar: string;
};

export const buildPresetPreviews = (presets: readonly ComparePreset[]): readonly ComparePresetPreview[] =>
  presets.map((preset, index) => {
    const { coverage } = buildTickerCompareModel(preset.tickers);
    return {
      id: preset.id,
      label: preset.label,
      tickers: preset.tickers,
      coveredCount: coverage.coveredMonths.length,
      monthFlags: coverage.tickersByMonth.map((tickers) => tickers.length > 0),
      railVar: presetRailVar(index)
    };
  });
