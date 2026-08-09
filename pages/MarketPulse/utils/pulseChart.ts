import type { ChartTheme } from '@/shared/styles';
import { buildAxisStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import { PULSE_SCALES, PULSE_THRESHOLDS, type PulseIndicator } from '@/shared/lib/marketPulse';

/**
 * 지표마다 **다른 그림**을 만든다.
 *
 * ## 🔴 왜 전부 꺾은선이면 안 되나
 *
 * 처음에는 여덟 장이 전부 같은 스파크라인이었다(2026-08-09 사용자 지적). 그런데 이 지표들이
 * 말하는 것은 서로 다른 종류다:
 *
 *  · **금리차**는 부호가 전부다. 0 아래로 내려가는 것(역전)이 사건이라, 0을 기준으로 위아래로
 *    뻗는 **막대**가 꺾은선보다 그 사실을 훨씬 크게 말한다.
 *  · **공포탐욕지수**는 0~100 사이 한 점이고 구간이 이미 정해져 있다 — **게이지**가 정본이다
 *    (출처인 CNN 도 다이얼로 그린다).
 *  · **VIX** 는 값의 크기 자체가 구간을 뜻한다 — 선 하나를 **값에 따라 색이 바뀌게**(visualMap)
 *    그리면 "지금 어느 띠에 있는가"가 눈으로 바로 들어온다.
 *  · **기간구조**는 1.0 이 경계다 — 그 위아래로 색이 갈려야 한다.
 *  · **S&P 500** 은 수준보다 200일선과의 관계가 읽을거리라 **두 선**이 필요하다.
 *
 * ⚠ 색은 **토큰(ChartTheme)** 에서만 가져온다. 하드코딩 hex 0개가 이 레포의 규칙이고,
 *   테마를 바꾸면 이 화면도 함께 바뀌어야 한다.
 * ⚠ 손익색(dataPositive/dataNegative)은 쓰지 않는다 — 여기서 재는 것은 가격의 방향이 아니라
 *   긴장도다. 같은 색을 쓰면 "VIX 가 빨강 = 올랐다"로 읽힌다.
 */

/**
 * 카드 안 그래프 높이.
 *
 * 🔴 한 줄에 하나씩 깔리면서(2026-08-09) 카드가 전폭이 됐다 — 그래서 **축을 보여줄 수 있다.**
 *    종전 92px 에서는 눈금도 기준선 라벨도 들어갈 자리가 없어 그림이 장식에 가까웠다.
 */
export const chartHeightOf = (indicator: PulseIndicator): number => (indicator.id === 'fear-greed' ? 360 : 200);

const dates = (indicator: PulseIndicator) => indicator.series.map((point) => point.date);
const values = (indicator: PulseIndicator) => indicator.series.map((point) => point.value);

/** 위아래 5% 여유 — 선이 상자에 닿아 잘려 보이는 것을 막는다. */
const paddedRange = (nums: number[]) => {
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pad = (max - min) * 0.08 || Math.abs(max) * 0.08 || 1;
  return { min: min - pad, max: max + pad };
};

/**
 * 격자 여백.
 *
 * 🔴 `containLabel` 은 **축 라벨만** 계산에 넣는다 — `markLine`·`markPoint` 의 라벨은 모른다.
 *    그래서 기준선 이름을 격자 **밖**(`position: 'end'`)에 두면 오른쪽 여백이 아무리 커도
 *    긴 이름은 잘린다(2026-08-09 사용자 지적: "text 짤리는 구간이 너무 많다").
 *    처방은 여백을 늘리는 것이 아니라 **라벨을 격자 안으로 넣는 것**이다 — 아래 두 곳 참고.
 * ⚠ `top` 이 26인 이유: 최고점 핀(markPoint)이 맨 위 데이터 위에 뜨므로 그만큼 비워야 잘리지 않는다.
 */
const baseGrid = { left: 6, right: 10, top: 26, bottom: 6, containLabel: true };

const tooltipOf = (indicator: PulseIndicator, theme: ChartTheme) => ({
  ...buildTooltipStyle(theme),
  trigger: 'axis' as const,
  /*
   * ⚠ ECharts 는 `trigger: 'axis'` 여도 콜백 인자를 단건∪배열로 준다. 배열로 단정하면 타입이 막고,
   *   억지로 캐스팅하면 단건이 온 날 런타임에서 터진다 — 여기서 갈라 받는다.
   */
  formatter: (params: unknown) => {
    const first = Array.isArray(params) ? params[0] : params;
    if (!first || typeof first !== 'object') return '';
    const point = first as { name?: string; value?: unknown };
    const value = Number(point.value);
    if (!Number.isFinite(value)) return '';
    return `${point.name ?? ''}<br/><b>${value.toFixed(indicator.precision)}${indicator.unit}</b>`;
  }
});

/**
 * 보이는 축.
 *
 * 🔴 축을 숨겼던 것을 되돌렸다(2026-08-09 사용자 지적). 설명이 "20 언저리가 오랜 평균"이라고
 *    말하는데 그래프에 눈금이 없으면 **글로 말한 숫자를 그림에서 대조할 수 없다.**
 * ⚠ x축은 날짜가 260개라 전부 찍으면 뭉갠다 — ECharts 가 알아서 솎게 두고(`interval: 'auto'`)
 *   연-월만 남긴다.
 */
const visibleAxes = (indicator: PulseIndicator, range: { min: number; max: number }, theme: ChartTheme) => ({
  xAxis: {
    type: 'category' as const,
    data: dates(indicator),
    boundaryGap: false,
    axisLine: { lineStyle: { color: theme.axisLine } },
    axisTick: { show: false },
    axisLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontFamily: theme.fontFamily,
      hideOverlap: true,
      /* `2026-08-07` → `26.08` — 260점 위에 날짜를 다 적을 수는 없다. */
      formatter: (value: string) => `${value.slice(2, 4)}.${value.slice(5, 7)}`
    }
  },
  yAxis: {
    type: 'value' as const,
    min: range.min,
    max: range.max,
    splitNumber: 3,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.splitLine, type: 'dashed' as const } },
    axisLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontFamily: theme.fontFamily,
      /*
       * 🔴 **소수점을 지표가 정한 자리수로 자른다**(2026-08-09 사용자 지적: 세 자리 이상이 보인다).
       *    ECharts 는 min/max 가 딱 떨어지지 않으면 눈금을 `0.7234` 처럼 만든다 — 우리가 min·max 에
       *    8% 여유를 주고 있으니 거의 항상 그렇게 된다. 값 자체가 두 자리인데 축만 네 자리면
       *    같은 화면에서 정밀도가 갈린다.
       */
      formatter: (value: number) => value.toFixed(indicator.precision)
    }
  }
});

/**
 * 설명에서 말한 숫자를 **그래프에도 긋는다**(2026-08-09 사용자 지적).
 *
 * 라벨은 `이름 값` 형태다 — 선만 그으면 그게 무슨 선인지 알 수 없고, 숫자만 적으면 왜 거기
 * 그었는지 알 수 없다. 정본은 `shared/lib/marketPulse/thresholds.ts` 이고, 같은 숫자를
 * `zones.ts` 가 구간 판정에 쓴다(한 화면 안에서 두 말이 갈리지 않게).
 */
const thresholdMarkLine = (indicator: PulseIndicator, theme: ChartTheme) => {
  const thresholds = PULSE_THRESHOLDS[indicator.id];
  if (!thresholds || thresholds.length === 0) return undefined;

  return {
    silent: true,
    symbol: 'none',
    data: thresholds.map((threshold) => ({
      yAxis: threshold.value,
      lineStyle: {
        color: threshold.primary ? theme.text : theme.textMuted,
        type: 'dashed' as const,
        width: threshold.primary ? 1.4 : 1,
        opacity: threshold.primary ? 0.7 : 0.45
      },
      label: {
        show: true,
        /*
         * 🔴 격자 **안**이다. `'end'` 는 라벨을 격자 밖 오른쪽에 두는데, containLabel 이
         *    그 폭을 모르므로 긴 이름이 그대로 잘린다. 안쪽이면 잘릴 자리가 없다.
         */
        position: 'insideEndTop' as const,
        distance: 2,
        formatter: `${threshold.name} ${threshold.value}${indicator.unit}`,
        /*
         * 🔴 배경·테두리를 둔 **칩**으로 그린다(2026-08-09 사용자 지적: 잘 안 보인다).
         *    구간 배경(markArea) 위에 글자가 놓이는 자리라, 배경 없이는 색끼리 뭉개져 읽히지 않는다.
         */
        fontSize: 11,
        fontWeight: 'bold' as const,
        fontFamily: theme.fontFamily,
        backgroundColor: theme.sliceBorder,
        borderColor: theme.axisLine,
        borderWidth: 1,
        padding: [3, 6],
        borderRadius: 4,
        color: theme.text
      }
    }))
  };
};

/**
 * 지표 하나의 ECharts 옵션. `null` 이면 그릴 것이 없다(시계열이 비었다).
 *
 * 반환 타입을 `EChartsOption` 으로 좁히지 않는다 — visualMap·gauge 까지 한 함수에서 만들면
 * 유니온이 폭발해 타입이 도움이 되기보다 방해가 된다(소비처가 하나뿐이라 얻는 것도 없다).
 */
export const buildPulseChartOption = (indicator: PulseIndicator, theme: ChartTheme): Record<string, unknown> | null => {
  const points = indicator.series;

  /* 🔴 공포탐욕지수는 시계열이 없어도 그린다 — 값 하나로 성립하는 유일한 그림이다. */
  if (indicator.id === 'fear-greed') {
    const score = indicator.observation?.value;
    if (score === undefined) return null;
    return gaugeOption(score, theme);
  }

  if (points.length === 0) return null;

  switch (indicator.id) {
    /* 셋 다 **이름 붙은 구간** 위의 값이다 — 선 + 구간 배경(markArea) + 기준선(markLine). */
    case 'vix':
    case 'vix-term':
      return bandedLineOption(indicator, theme);

    /* 금리차만 막대다 — 0 아래로 내려가는 모양 자체가 사건이라 선보다 크게 말한다. */
    case 'curve-10y2y':
    case 'curve-10y3m':
      return divergingBarOption(indicator, theme);

    case 'sp500':
      return withMovingAverageOption(indicator, theme, 200);

    case 'hy-spread':
      return gradientAreaOption(indicator, theme, theme.series[5]);

    default:
      return gradientAreaOption(indicator, theme, theme.series[1]);
  }
};

/**
 * 값의 크기에 따라 **선 색이 바뀌는** 꺾은선(visualMap piecewise).
 *
 * 구간 경계는 `zones.ts` 가 판정에 쓰는 것과 **같은 숫자**여야 한다 — 카드의 글자 배지가
 * "긴장"이라 말하는데 선은 평시 색이면 화면 안에서 두 말이 갈린다.
 */
const bandedLineOption = (indicator: PulseIndicator, theme: ChartTheme) => {
  const nums = values(indicator);
  const thresholds = PULSE_THRESHOLDS[indicator.id] ?? [];
  const range = paddedRange([...nums, ...thresholds.map((threshold) => threshold.value)]);

  return {
    animation: false,
    grid: baseGrid,
    ...visibleAxes(indicator, range, theme),
    tooltip: tooltipOf(indicator, theme),
    series: [
      {
        type: 'line' as const,
        data: nums,
        showSymbol: false,
        lineStyle: { width: 2.2, color: theme.text },
        /* 🔴 **구간 배경**(markArea) — 값이 어느 띠에 있는지를 배경이 말한다. 종전에는 선 색이
           값에 따라 바뀌었는데(visualMap), 배경 띠가 생기면 선까지 색이 변해 눈이 두 곳을 본다.
           선은 한 색으로 두고 띠에게 색을 맡긴다(2026-08-09 사용자 제안). */
        markArea: bandMarkArea(indicator, theme),
        /* 설명에서 말한 숫자를 그림에도 긋는다 — 정본은 thresholds.ts. */
        markLine: thresholdMarkLine(indicator, theme)
      }
    ]
  };
};

/**
 * 구간을 **배경 띠**로 깐다.
 *
 * `PULSE_SCALES` 가 정본이라, 카드의 밴드 스케일(가로 띠)과 그래프 배경이 **같은 경계·같은 색**을
 * 쓴다. 둘이 갈리면 한 화면에서 같은 지표가 다른 구간에 있는 것처럼 보인다.
 */
const bandMarkArea = (indicator: PulseIndicator, theme: ChartTheme) => {
  const scale = PULSE_SCALES[indicator.id];
  if (!scale) return undefined;

  const toneOf = (tone: string) =>
    tone === 'calm'
      ? theme.series[2]
      : tone === 'normal'
        ? theme.series[0]
        : tone === 'elevated'
          ? theme.warning
          : theme.series[4];

  let lower = scale.min;
  const areas = scale.bands.map((band) => {
    const upper = Number.isFinite(band.upTo) ? band.upTo : scale.max;
    const pair = [
      { yAxis: lower, itemStyle: { color: hexToRgba(toneOf(band.tone), 0.1) } },
      { yAxis: upper }
    ];
    lower = upper;
    return pair;
  });

  return { silent: true, data: areas };
};

/**
 * 0을 기준으로 위아래로 뻗는 막대.
 *
 * 🔴 금리차에서 **음수(역전)는 사건**이다. 꺾은선은 그 사실을 다른 값과 똑같은 굵기로 그리지만,
 *    막대는 0선 아래로 내려가는 모양 자체가 눈에 걸린다. 색도 갈라 두 채널로 말한다.
 */
const divergingBarOption = (indicator: PulseIndicator, theme: ChartTheme) => {
  const nums = values(indicator);
  const range = paddedRange([...nums, 0]);

  return {
    animation: false,
    grid: baseGrid,
    ...visibleAxes(indicator, range, theme),
    tooltip: tooltipOf(indicator, theme),
    series: [
      {
        type: 'bar' as const,
        data: nums,
        barCategoryGap: '0%',
        itemStyle: {
          /* 음수만 경고색 — 색 하나에 기대지 않게 0선(markLine)도 함께 그린다. */
          color: (params: { value: number }) => (params.value < 0 ? theme.series[4] : theme.series[0]),
          opacity: 0.55
        },
        markLine: thresholdMarkLine(indicator, theme)
      },
      {
        /*
         * 🔴 막대 위에 **선을 겹친다**(2026-08-09 사용자 지시). 막대만 있으면 부호(역전)는
         *    잘 보이지만 **추세**가 안 보인다 — 260개 막대는 덩어리로 읽힌다. 선이 그 위를
         *    지나면 "지금 좁아지는 중인가 벌어지는 중인가"가 함께 읽힌다.
         * ⚠ 막대를 흐리게(opacity 0.55) 깐 뒤 선을 진하게 얹는다. 둘 다 진하면 서로를 가린다.
         */
        type: 'line' as const,
        data: nums,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 1.8, color: theme.text },
        z: 3
      }
    ]
  };
};

/**
 * 그라디언트 면 + **기간 평균선**.
 *
 * 🔴 평균선이 핵심이다. 스프레드나 금리는 절대 수준만 봐서는 "지금이 높은 건가"를 알 수 없다 —
 *    같은 창의 평균을 함께 그으면 그 답이 눈으로 바로 나온다(ECharts `line-marker` 패턴).
 * ⚠ 평균은 **화면에 그린 구간의 평균**이다. 카드의 구간 배지는 10년 분포로 판정하므로 둘이
 *    다른 창을 본다 — 그래서 평균선에 "평균" 이상의 라벨을 붙이지 않는다.
 */
const gradientAreaOption = (indicator: PulseIndicator, theme: ChartTheme, tone: string) => {
  const nums = values(indicator);
  const average = nums.reduce((sum, item) => sum + item, 0) / nums.length;

  return {
    animation: false,
    grid: baseGrid,
    ...visibleAxes(indicator, paddedRange([...nums, average]), theme),
    tooltip: tooltipOf(indicator, theme),
    series: [
      {
        type: 'line' as const,
        data: nums,
        showSymbol: false,
        smooth: 0.2,
        lineStyle: { width: 2.4, color: tone },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(tone, 0.36) },
              { offset: 1, color: hexToRgba(tone, 0.02) }
            ]
          }
        },
        /*
         * ECharts `line-markline` 예제 형태 — **최고·최저 지점**에 핀을 꽂고 평균선을 긋는다
         * (2026-08-09 사용자 지시). 스프레드는 절대 수준만 봐서는 "지금이 높은 건가"를 알 수
         * 없는데, 이 창의 최고·최저·평균 셋이 그 답을 한 번에 준다.
         */
        markPoint: {
          /* ⚠ 핀 안에 숫자가 들어간다 — 40 아래로 줄이면 소수점 두 자리가 잘린다(실측). */
          symbolSize: 42,
          data: [
            { type: 'max' as const, name: '최고' },
            { type: 'min' as const, name: '최저' }
          ],
          itemStyle: { color: tone },
          label: {
            fontSize: 9,
            fontFamily: theme.fontFamily,
            color: theme.onBrand,
            /* 핀은 데이터 **위**에 뜬다 — 격자 top 여백(26)이 그 높이를 감당한다. */
            formatter: (params: { value: number }) => `${params.value.toFixed(indicator.precision)}`
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ type: 'average' as const, name: '평균' }],
          lineStyle: { color: theme.textMuted, type: 'dashed' as const, width: 1.2 },
          label: {
            show: true,
            position: 'insideStartTop' as const,
            distance: 2,
            formatter: (params: { value: number }) => `평균 ${params.value.toFixed(indicator.precision)}${indicator.unit}`,
            fontSize: 11,
            fontWeight: 'bold' as const,
            color: theme.text,
            fontFamily: theme.fontFamily,
            backgroundColor: theme.sliceBorder,
            borderColor: theme.axisLine,
            borderWidth: 1,
            padding: [3, 6],
            borderRadius: 4
          }
        }
      }
    ]
  };
};

/** 지수 + 이동평균 두 선. 점이 모자라면 평균선은 빠진다(짧은 창으로 계산한 값을 그리지 않는다). */
const withMovingAverageOption = (indicator: PulseIndicator, theme: ChartTheme, window: number) => {
  const nums = values(indicator);
  const average = nums.map((_value, index) => {
    if (index + 1 < window) return null;
    const slice = nums.slice(index + 1 - window, index + 1);
    return slice.reduce((sum, item) => sum + item, 0) / window;
  });
  const known = average.filter((item): item is number => item !== null);

  return {
    animation: false,
    grid: baseGrid,
    ...visibleAxes(indicator, paddedRange([...nums, ...known]), theme),
    tooltip: tooltipOf(indicator, theme),
    series: [
      {
        type: 'line' as const,
        data: nums,
        showSymbol: false,
        lineStyle: { width: 2.4, color: theme.series[0] },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(theme.series[0], 0.3) },
              { offset: 1, color: hexToRgba(theme.series[0], 0.02) }
            ]
          }
        }
      },
      {
        type: 'line' as const,
        data: average,
        showSymbol: false,
        /* 점선 — 관측값(실선)과 계산값(평균)을 굵기·형태로도 가른다. */
        lineStyle: { width: 1.6, color: theme.textMuted, type: 'dashed' as const }
      }
    ]
  };
};

/**
 * 공포탐욕지수 게이지.
 *
 * 구간 색은 **CNN 자신의 다섯 구간**을 따른다(극단적 공포 0~24 · 공포 25~44 · 중립 45~55 ·
 * 탐욕 56~75 · 극단적 탐욕 76~100). 🔴 양끝이 같은 무게로 칠해져야 한다 — 탐욕 쪽만 초록으로
 * 칠하면 화면이 "지금이 가장 좋다"고 말하는 셈이다.
 */


/**
 * 등급형 게이지 — 바늘이 가리키는 곳에 **등급 이름**이 함께 선다.
 *
 * 🔴 눈금 숫자를 지우고 등급 이름을 쓴다. 숫자(64)는 카드가 이미 크게 쓰고 있어서, 게이지가
 *    또 쓰면 같은 값이 두 번이다. 사람이 궁금한 것은 "64가 어느 쪽이냐"이고 그 답이 등급이다.
 * 🔴 **양끝이 같은 색이다.** 탐욕 쪽만 초록으로 칠하면 화면이 "지금이 가장 좋다"고 말하는 셈이다.
 *    구간 이름이 색과 함께 서므로 색 단독 채널도 아니다.
 */



/**
 * 칸 색 배열 + **칸 사이의 얇은 틈**.
 *
 * 🔴 ECharts 게이지에는 띠를 나누는 기능이 없다. 경계마다 **조각 구분색 슬라이스**를 아주 얇게
 *    (0.004 ≈ 0.7°) 끼워 넣으면 틈처럼 보인다 — 색 배열이 `[누적비율, 색]` 이라 순서가 곧 위치다.
 * ⚠ 틈 색은 `sliceBorder` 다. 파이 조각 사이를 가르라고 있는 색이라 카드 면색과 맞는다.
 *   투명으로 두면 그 아래 것이 비쳐 틈이 아니라 구멍처럼 보인다.
 * ⚠ 마지막 칸 뒤에는 틈을 두지 않는다 — 링이 거기서 끝난다.
 */
const bandColorsWithGaps = (stops: readonly number[], theme: ChartTheme): [number, string][] => {
  const GAP = 0.004;
  const colors: [number, string][] = [];

  stops.forEach((stop, index) => {
    const isLast = index === stops.length - 1;
    colors.push([isLast ? stop : stop - GAP, theme.series[index]]);
    if (!isLast) colors.push([stop, theme.sliceBorder]);
  });

  return colors;
};

/** 칸 이름. 아래 `fearGreedNameAt` 이 눈금 값에 따라 골라 쓴다. */
const FEAR_GREED_NAMES = ['극단적 공포', '공포', '중립', '탐욕', '극단적 탐욕'] as const;

/**
 * 다섯 칸의 **기하학적 중심**(0~1 축 기준).
 *
 * 칸 경계가 0.25 · 0.45 · 0.56 · 0.76 이므로 중심은 각각 그 사이의 한가운데다.
 * 🔴 이 값들이 **라벨 시리즈의 `splitNumber` 눈금 위에 정확히 떨어져야** 이름이 그려진다.
 *    0.005 간격(=`splitNumber: 200`)이면 다섯 개가 전부 맞는다 — 눈금 간격을 바꾸면
 *    이름이 **통째로 사라진다**(오류도 없이 그냥 빈 링이 된다). 가드: test/marketPulse.
 */
export const FEAR_GREED_LABEL_SPLIT_NUMBER = 200;
export const FEAR_GREED_CENTERS = [0.125, 0.35, 0.505, 0.66, 0.88] as const;

/**
 * 눈금 값 → 칸 이름. 일치하지 않으면 빈 문자열(그 눈금엔 이름을 안 붙인다).
 *
 * 🔴 **정확히 일치**하는 눈금에만 붙인다. 종전에는 허용 범위(±10.5)로 골랐는데 눈금 간격이 그보다
 *    좁아 **눈금 두 개가 같은 이름에 걸렸고, 이름이 두 번씩 찍혔다**(2026-08-09 사용자 지적).
 * ⚠ 긴 이름 둘은 두 줄로 접는다. ECharts 는 글자를 곡선을 따라 휘게 하지 못해서(`rotate:
 *   'tangential'` 은 덩어리를 기울일 뿐이다), 다이얼 양끝에서 여섯 글자가 한 줄이면 칸을 넘는다.
 * ⚠ 부동소수 누적(0.35000000000000003)을 피해 소수 셋째 자리에서 반올림해 찾는다.
 */
export const fearGreedNameAt = (tick: number): string => {
  const at = Math.round(tick * 1000) / 1000;
  const index = FEAR_GREED_CENTERS.findIndex((center) => center === at);
  if (index < 0) return '';

  if (index === 0) return '극단적\n공포';
  if (index === FEAR_GREED_CENTERS.length - 1) return '극단적\n탐욕';
  return FEAR_GREED_NAMES[index];
};

/**
 * 공포탐욕 다이얼 — ECharts **`gauge-grade` 예제의 코드 그대로**다(2026-08-09 사용자 제공).
 *
 * ## 🔴 수치를 손대지 마라
 *
 * 그 전까지 반지름·거리·부호를 **감으로 찍어 고치고 있었다.** 렌더 결과를 볼 수 없는 채로
 * 추측한 값을 내놓으니 고칠 때마다 한 발씩 어긋났고, 결국 사용자가 원본 코드를 그대로 주었다.
 * 아래에서 예제와 **다른 것은 넷뿐**이다:
 *
 *   ① 칸이 4개 → **5개**(경계는 CNN 의 것: 0.25 / 0.45 / 0.56 / 0.76)
 *   ② 색을 공포↔탐욕 배색으로. ⚠ 하드코딩 hex 대신 **토큰**을 쓴다(이 레포 규칙).
 *   ③ 라벨 문구를 한국어 다섯 개로. 글자가 길어 `fontSize` 20 → 12.
 *   ④ `data.value` 가 0~1 이라 점수를 100 으로 나눠 넣고, 이름은 지금 칸의 이름을 쓴다.
 *
 * 각도·중심·반지름·`splitNumber`·바늘·눈금·`distance: -60` 은 **예제 값 그대로**다.
 *
 * ⚠ 배색이 공포(따뜻한 쪽) → 탐욕(초록 쪽)으로 간다. 이는 **출처(CNN)의 표기를 따른 것**이지
 *   초록이 좋다는 뜻이 아니다 — 우리 판정은 카드 위 구간 배지가 따로 말하고, 거기서는
 *   **극단적 탐욕도 '경계'** 다(zones.ts `fearGreedZone`).
 */
const gaugeOption = (score: number, theme: ChartTheme) => {
  /* 예제의 축이 0~1 이라 점수를 그 좌표로 옮긴다. */
  const value = Math.min(1, Math.max(0, score / 100));
  const STOPS = [0.25, 0.45, 0.56, 0.76, 1] as const;
  const activeIndex = Math.max(0, STOPS.findIndex((stop) => value < stop));

  return {
    series: [
      {
        type: 'gauge' as const,
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'] as [string, string],
        radius: '90%',
        min: 0,
        max: 1,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            /* 예제는 6이다 — 칸이 눈에 들어오도록 키웠다(2026-08-09 사용자 지시로 6 → 18 → 36). */
            width: 36,
            /*
             * 테마의 카테고리 팔레트 5색을 **그대로** 쓴다(2026-08-09 사용자 지시).
             * ⚠ 알파를 씌우지 않는다 — 배경이 비쳐 색이 자리마다 달라지고 글자 대비가 무보장이 된다.
             *   옅게 가야 할 때는 `theme.tint`(원래부터 옅게 설계된 시맨틱 틴트)를 쓴다.
             * ⚠ 색의 순서가 "나쁨→좋음"을 뜻하지 않는다 — 칸을 구별하려는 것뿐이고, 우리 판정은
             *   카드 위 구간 배지가 따로 말한다(극단적 탐욕도 '경계'다).
             */
            color: bandColorsWithGaps(STOPS, theme)
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          /* 예제는 12%/20 이다 — 링 위에 얹히는 표시자라 그 크기면 칸을 덮는다(2026-08-09 사용자 지적). */
          length: '8%',
          width: 12,
          /*
           * 중심에서 얼마나 바깥인가 — 값이 클수록 링 쪽, 작을수록 가운데 숫자 쪽이다.
           * 숫자(detail)가 `-35%` 에 있어서, 그쪽으로 조금 당겼다(2026-08-09 사용자 지시).
           */
          offsetCenter: [0, '-52%'],
          /* ⚠ 예제는 `'auto'`(칸 색)다. 칸을 옅게 깔면서 바늘까지 옅어져 안 보이므로 본문색으로 고정한다. */
          itemStyle: { color: theme.text }
        },
        /*
         * 눈금은 `'auto'` 대신 흐린 본문색 — 옅은 칸 위에서 형태가 남는다.
         * ⚠ 길이·굵기는 **링 두께에 딸려 보인다.** 링을 36 으로 키우자 같은 길이의 눈금이 링을
         *   가로지르는 큰 홈처럼 읽혀서(2026-08-09 사용자 지적) 다시 줄였다 — 링을 바꾸면
         *   여기도 함께 봐야 한다.
         */
        axisTick: { length: 4, lineStyle: { color: theme.textMuted, width: 1 } },
        splitLine: { length: 7, lineStyle: { color: theme.textMuted, width: 2 } },
        /*
         * 🔴 이름은 **이 시리즈가 그리지 않는다.** 라벨은 눈금 위에만 놓을 수 있는데,
         *    `splitNumber: 8` 의 눈금은 0.125 간격이라 칸의 진짜 중심(0.35 · 0.66)에 닿지 못한다.
         *    그래서 공포와 탐욕이 자기 칸에서 한쪽으로 치우쳐 있었다(2026-08-09 사용자 지적).
         *    이름은 아래 **두 번째 시리즈**가 촘촘한 눈금 위에서 정확한 중심에 그린다.
         */
        axisLabel: { show: false },
        title: { offsetCenter: [0, '-10%'], fontSize: 14, fontFamily: theme.fontFamily, color: theme.textMuted },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '-35%'],
          valueAnimation: true,
          fontFamily: theme.fontFamily,
          formatter: (raw: number) => String(Math.round(raw * 100)),
          /* ⚠ 예제는 `'inherit'`(칸 색)이다. 칸이 옅어지면 숫자까지 옅어져 안 읽힌다 — 본문색으로 고정. */
          color: theme.text
        },
        data: [{ value, name: FEAR_GREED_NAMES[activeIndex] }]
      },
      /*
       * 이름 전용 시리즈 — 링도 바늘도 눈금도 그리지 않고 **라벨만** 그린다.
       *
       * 🔴 `splitNumber: 200`(0.005 간격)이면 다섯 칸의 중심이 전부 눈금 위에 정확히 떨어진다:
       *    0.125 · 0.35 · 0.505 · 0.66 · 0.88. 그래서 이름이 칸 한가운데에 선다.
       * ⚠ 눈금이 200개이므로 `axisTick`·`splitLine` 을 반드시 꺼야 한다 — 켜면 링을 뭉갠다.
       * ⚠ 기하(각도·중심·반지름)는 위 시리즈와 **똑같아야** 이름이 같은 자리에 얹힌다.
       */
      {
        type: 'gauge' as const,
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'] as [string, string],
        radius: '90%',
        min: 0,
        max: 1,
        splitNumber: FEAR_GREED_LABEL_SPLIT_NUMBER,
        axisLine: { lineStyle: { width: 0, color: [[1, 'rgba(0,0,0,0)']] as [number, string][] } },
        axisTick: { show: false },
        splitLine: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: { show: false },
        axisLabel: {
          color: theme.textMuted,
          fontSize: 14,
          fontFamily: theme.fontFamily,
          distance: -60,
          rotate: 'tangential' as const,
          /* 두 줄짜리 이름이 있으므로 줄 간격을 정해 준다 — 기본값은 폰트에 따라 들쭉날쭉하다. */
          lineHeight: 16,
          formatter: fearGreedNameAt
        },
        data: []
      }
    ]
  };
};

/** 축 눈금 스타일이 필요할 때 쓰라고 남겨 둔다(현재 카드 그래프는 축을 숨긴다). */
export const pulseAxisStyle = buildAxisStyle;
