import { describe, expect, it } from 'vitest';

import { tooltipPosition } from '@/shared/lib/charts';
import { buildTooltipStyle, getChartTheme } from '@/shared/styles';
import type { TickerProfile } from '@/shared/types/snowball';
import { buildAllocationPieOption } from '@/pages/Main/utils';
import { donutOption, roseOption, sunburstOption } from '@/pages/Ledger/utils/reportCharts';
import { donutOption as tradeDonutOption } from '@/pages/HippoStats/utils';

/**
 * 모바일(좁은 화면)에서 **파이 툴팁이 좌우로 튀어나가 잘리던** 회귀를 막는다.
 *
 * 두 겹으로 막는다 — ① 툴팁 폭 상한(`buildTooltipStyle`) ② 위치 가두기(`tooltipPosition` + `confine`).
 * 둘 중 하나만으로는 뚫린다: 툴팁이 차트 컨테이너보다 넓으면 어떤 위치도 안 잘리게 못 하고,
 * 폭만 접고 위치를 안 가두면 가장자리 조각에서 여전히 넘친다.
 */

const at = (x: number, y: number, contentSize: [number, number], viewSize: [number, number]) =>
  tooltipPosition([x, y], null, null, null, { contentSize, viewSize });

describe('파이 툴팁 — 좁은 화면에서 잘리지 않는다', () => {
  it('오른쪽 끝 조각을 눌러도 툴팁 오른쪽 변이 뷰 안에 머문다', () => {
    const view: [number, number] = [340, 300];
    const content: [number, number] = [200, 60];

    const [x] = at(335, 150, content, view);

    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + content[0]).toBeLessThanOrEqual(view[0]);
  });

  it('왼쪽 끝 조각에서도 왼쪽으로 넘어가지 않는다', () => {
    const [x] = at(4, 150, [200, 60], [340, 300]);

    expect(x).toBeGreaterThanOrEqual(0);
  });

  it('내용이 뷰보다 넓어도 음수로 밀지 않는다 — 앞부분(종목명)이 먼저 잘리면 안 된다', () => {
    const [x, y] = at(180, 150, [420, 400], [340, 300]);

    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('위가 좁으면 아래로 뒤집고, 아래로도 뷰를 넘지 않는다', () => {
    const view: [number, number] = [340, 300];
    const content: [number, number] = [160, 70];

    const [, top] = at(170, 10, content, view);
    expect(top).toBeGreaterThan(10);

    const [, bottom] = at(170, 295, content, view);
    expect(bottom + content[1]).toBeLessThanOrEqual(view[1]);
  });
});

describe('파이 툴팁 옵션 — 폭 상한과 가두기가 붙어 있다', () => {
  it('공용 툴팁 스타일이 폭을 접는다 (ECharts 기본 nowrap 이면 긴 종목명이 그대로 폭이 된다)', () => {
    const css = buildTooltipStyle(getChartTheme()).extraCssText;

    expect(css).toContain('max-width');
    expect(css).toContain('white-space: normal');
  });

  it('파이·도넛·로즈·선버스트 툴팁은 모두 confine + 공용 position 을 쓴다', () => {
    const theme = getChartTheme();
    const profile: TickerProfile = {
      id: 'ticker-1',
      ticker: 'SCHD',
      name: '슈드',
      initialPrice: 100,
      dividendYield: 3.5,
      dividendGrowth: 6,
      expectedTotalReturn: 9.5,
      frequency: 'quarterly'
    };
    const slices = [
      { label: '가', value: 300, ratio: 0.5 },
      { label: '나', value: 200, ratio: 0.33 },
      { label: '다', value: 100, ratio: 0.17 }
    ];

    const options = [
      buildAllocationPieOption({
        normalizedAllocation: [{ profile, weight: 1 }],
        showPortfolioDividendCenter: false,
        centerDividend: 0
      }),
      donutOption(slices, theme),
      roseOption(
        [
          { weekday: 1, label: '월', total: 48_000, days: 4, average: 12_000 },
          { weekday: 2, label: '화', total: 36_000, days: 4, average: 9_000 }
        ],
        theme
      ),
      sunburstOption([{ name: '식비', value: 100, children: [{ name: '외식', value: 60 }] }], theme),
      tradeDonutOption([{ ticker: '005930', name: '삼성전자', count: 12 }], theme, theme.brand, '매수 상위', '건')
    ];

    for (const option of options) {
      const tooltip = option?.tooltip as { confine?: boolean; position?: unknown } | undefined;
      expect(tooltip?.confine).toBe(true);
      expect(tooltip?.position).toBe(tooltipPosition);
    }
  });
});
