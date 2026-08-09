import type { ChartTheme } from '@/shared/styles';
import { buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { TensionAxis } from '@/shared/lib/marketPulse';
import type { TradeRank } from './tradeRanking';

/**
 * 히포 통계 화면의 그림 둘 — **레이더**(지표 긴장도)와 **도넛 파이**(매수·매도 상위).
 *
 * ⚠ 색은 토큰(ChartTheme)에서만 가져온다. 하드코딩 hex 0개가 이 레포의 규칙이다.
 */

/**
 * 지표 긴장도 레이더 (ECharts `radar` 예제 구조).
 *
 * 🔴 축의 최대가 **100 고정**이다. 데이터에 맞춰 자동으로 잡으면 축마다 눈금이 달라져,
 *    "이 축이 저 축보다 높다"가 그림에서 거짓이 된다. 0~100 은 `tensionOf` 가 보장한다.
 * ⚠ 축 이름 옆에 값을 적지 않는다 — 여섯 개를 다 적으면 그림이 표가 된다. 값은 툴팁이 말한다.
 */
export const radarOption = (axes: TensionAxis[], theme: ChartTheme) => ({
  animation: false,
  tooltip: { ...buildTooltipStyle(theme) },
  radar: {
    indicator: axes.map((axis) => ({ name: axis.label, max: 100 })),
    shape: 'polygon' as const,
    radius: '68%',
    center: ['50%', '54%'] as [string, string],
    axisName: { color: theme.textMuted, fontSize: 11, fontFamily: theme.fontFamily },
    splitLine: { lineStyle: { color: theme.splitLine } },
    axisLine: { lineStyle: { color: theme.splitLine } },
    /* 바탕을 옅게 한 겹씩 깔면 "가운데가 낮고 바깥이 높다"가 눈으로 읽힌다. */
    splitArea: { areaStyle: { color: [hexToRgba(theme.series[0], 0.04), hexToRgba(theme.series[0], 0.09)] } }
  },
  series: [
    {
      type: 'radar' as const,
      symbolSize: 5,
      lineStyle: { width: 2, color: theme.series[0] },
      itemStyle: { color: theme.series[0] },
      areaStyle: { color: hexToRgba(theme.series[0], 0.25) },
      data: [{ value: axes.map((axis) => Math.round(axis.value)), name: '긴장도' }]
    }
  ]
});

/**
 * 매수·매도 상위 도넛 (ECharts `pie-padAngle` 예제 구조).
 *
 * 예제에서 가져온 것: `padAngle` 로 조각 사이를 띄우고 `borderRadius` 로 모서리를 굴린다.
 * 조각 수가 10개라 라벨은 **티커만** 쓴다 — 종목 전체 이름은 툴팁이 맡는다.
 */
/**
 * 도넛의 중심 좌표.
 *
 * 🔴 **파이와 가운데 제목이 같은 값을 봐야 한다.** 둘이 각자 좌표를 들면 미세하게 어긋나는데,
 *    그 어긋남이 도넛 구멍 안에서는 유난히 눈에 띈다(2026-08-09 사용자 지적: 파이는 52%,
 *    제목은 50% 였다).
 * ⚠ 세로가 50%가 아니라 52%인 이유: 조각 라벨이 위쪽으로 뻗어서, 정확히 가운데 두면 위 라벨이
 *   상자 밖으로 나간다.
 */
const DONUT_CENTER: [string, string] = ['50%', '52%'];

export const donutOption = (
  rows: TradeRank[],
  theme: ChartTheme,
  tone: string,
  centerLabel: string,
  /* 🔴 단위를 인자로 받는다. 하드코딩하면 대가들 파이(명·억 달러)까지 "건"으로 말한다. */
  unit: string
) => {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return {
  animation: false,
  /*
   * 🔴 도넛 **한가운데에 합계**를 놓는다(2026-08-09 사용자 요청). 위 제목을 다시 쓰지 않는 이유는
   *    중복이기 때문이고, 합계를 쓰는 이유는 **두 도넛을 견줄 수 있게** 하기 위해서다 —
   *    파이 두 개는 원래 서로 비교가 안 되는 그림인데, 가운데 합계가 그 한계를 메운다.
   */
  title: {
    text: `${total.toLocaleString('ko-KR')}${unit}`,
    subtext: centerLabel,
    /*
     * 🔴 `left: 'center'` 와 `textAlign: 'center'` 를 **같이 쓰면 안 된다.** ECharts 는 먼저
     *    블록을 가운데로 배치한 뒤 textAlign 으로 한 번 더 앵커를 옮겨서 글자가 왼쪽으로 밀린다
     *    (2026-08-09 사용자 지적). 좌표를 `'50%'` 로 주고 정렬로만 중심을 잡는다.
     * ⚠ 세로도 같다 — `textVerticalAlign` 이 있어야 두 줄 블록의 **가운데**가 50% 에 온다.
     *   `top` 만 주면 블록의 윗변이 그 자리에 놓여 도넛 구멍보다 아래로 내려간다.
     */
    left: DONUT_CENTER[0],
    top: DONUT_CENTER[1],
    /*
     * 🔴 `padding: 0` 이 없으면 **글자가 오른쪽으로 밀린다**(2026-08-09 사용자 지적).
     *    ECharts `title` 의 기본 패딩은 5 이고, `textAlign` 을 쓰면 앵커가 패딩 **안쪽**에서
     *    잡혀 왼쪽 패딩만큼 통째로 오른쪽으로 이동한다. 도넛 구멍 안에서는 그 5px 가 눈에 띈다.
     */
    padding: 0,
    /* 제목과 부제 사이 — 기본값(10)은 도넛 구멍 안에서 둘을 남남처럼 벌려 놓는다. */
    itemGap: 2,
    textAlign: 'center' as const,
    textVerticalAlign: 'middle' as const,
    textStyle: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      fontFamily: theme.fontFamily,
      color: theme.text
    },
    subtextStyle: { fontSize: 11, fontFamily: theme.fontFamily, color: theme.textMuted }
  },
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'item' as const,
    formatter: (params: unknown) => {
      const point = params as { data?: { fullName?: string; ticker?: string; value?: number }; percent?: number };
      const data = point.data;
      if (!data) return '';
      return `${data.ticker ?? ''} · ${data.fullName ?? ''}<br/><b>${(data.value ?? 0).toLocaleString('ko-KR')}${unit}</b> (${point.percent ?? 0}%)`;
    }
  },
  series: [
    {
      type: 'pie' as const,
      radius: ['38%', '70%'],
      center: DONUT_CENTER,
      padAngle: 3,
      itemStyle: { borderRadius: 8, borderColor: theme.sliceBorder, borderWidth: 1 },
      label: {
        color: theme.text,
        fontSize: 11,
        fontFamily: theme.fontFamily,
        /*
         * 🔴 종목과 **비중**을 함께 적는다(2026-08-09 사용자 지시). 조각 크기만으로는 "이게 몇
         *    퍼센트인가"를 눈으로 못 읽는다 — 특히 하위 조각들은 서로 비슷해 보인다.
         * ⚠ `{d}` 는 ECharts 가 **이 파이 안에서의 비중**으로 채운다. 상위 10종목만 담았으므로
         *   "전체 거래 중 몇 %"가 아니라 **"상위 10종목 중 몇 %"** 다 — 화면 문구가 그 범위를 말한다.
         */
        formatter: '{b} {d}%'
      },
      labelLine: { length: 8, length2: 8, lineStyle: { color: theme.axisLine } },
      /*
       * 조각 색은 같은 계열의 진하기 단계다 — 열 종목에 열 색을 주면 무지개가 되고,
       * 순위(1위가 가장 진함)라는 정보도 사라진다.
       */
      data: rows.map((row, index) => ({
        name: row.ticker,
        ticker: row.ticker,
        fullName: row.name,
        value: row.count,
        itemStyle: { color: hexToRgba(tone, 1 - index * 0.075) }
      }))
    }
  ]
  };
};
