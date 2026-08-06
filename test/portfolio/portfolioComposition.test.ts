import { describe, expect, it } from 'vitest';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import {
  COMPOSITION_MAX_SLICES,
  buildCompositionSlices,
  buildConicStops
} from '@/pages/Portfolio/components';
import type { PortfolioHoldingRowModel } from '@/pages/Portfolio/components';

/**
 * 요약 카드의 **비중 도넛**을 만드는 순수 함수 2종.
 *
 * 이 블록의 계약은 하나로 요약된다 — 🔴 **같은 종목은 화면 어디서나 같은 색이다.**
 * 도넛 조각 색이 보유 표의 종목 귀와 갈리는 순간 색은 길찾기 단서가 아니라 얼룩이 되므로,
 * 여기서 검증하는 것은 "예쁜가"가 아니라 **두 자리가 같은 값을 쓰는가**다.
 */

const row = (ticker: string, weightPercent: number | null): PortfolioHoldingRowModel => ({
  ticker,
  name: '',
  badge: null,
  quantityInput: '1',
  marketValue: '$1',
  annualNet: '$1',
  weightPercent,
  note: null
});

const copy = PORTFOLIO_COPY;

describe('비중 도넛 — 조각 만들기', () => {
  it('조각 색이 `assignSeries` 배정과 정확히 같다 (표의 종목 귀와 한 값)', () => {
    const rows = [row('SCHD', 60), row('JEPI', 40)];
    const expected = assignSeries(['SCHD', 'JEPI']);

    const slices = buildCompositionSlices(rows);

    expect(slices.map((slice) => slice.paint)).toEqual([expected.get('SCHD'), expected.get('JEPI')]);
  });

  it('비중이 큰 순서로 정렬한다 (표의 입력 순서를 따르지 않는다)', () => {
    const slices = buildCompositionSlices([row('AAA', 10), row('BBB', 70), row('CCC', 20)]);

    expect(slices.map((slice) => slice.label)).toEqual(['BBB', 'CCC', 'AAA']);
  });

  it('비중이 없는 행(수량 미입력·계산 제외)은 조각을 만들지 않는다', () => {
    const slices = buildCompositionSlices([row('SCHD', 100), row('JEPI', null), row('O', 0)]);

    expect(slices).toHaveLength(1);
    expect(slices[0]!.label).toBe('SCHD');
  });

  it('조각이 하나도 없으면 빈 배열이다 — 0% 도넛을 그리지 않는다', () => {
    expect(buildCompositionSlices([row('SCHD', null)])).toEqual([]);
  });

  it('상한을 넘는 나머지는 중립색 한 조각으로 접는다 (9번째 색을 지어내지 않는다)', () => {
    const rows = Array.from({ length: COMPOSITION_MAX_SLICES + 3 }, (_, index) =>
      row(`T${index}`, 100 / (COMPOSITION_MAX_SLICES + 3))
    );

    const slices = buildCompositionSlices(rows);

    expect(slices).toHaveLength(COMPOSITION_MAX_SLICES + 1);
    const rest = slices.at(-1)!;
    expect(rest.isRest).toBe(true);
    expect(rest.label).toBe(copy.summary.composition.others);
    // 접힌 조각의 합이 실제 나머지와 같다 — 접었다고 값이 사라지면 안 된다.
    expect(rest.percent).toBeCloseTo((100 / (COMPOSITION_MAX_SLICES + 3)) * 3, 6);
  });

  it('보유가 8종을 넘어도 배정 집합은 **표에 보이는 행 전체**다 (표와 도넛의 색이 갈리지 않는다)', () => {
    // 비중이 있는 행만 넣으면 집합이 좁아져 `assignSeries` 의 충돌 회피 결과가 달라진다.
    const rows = [row('SCHD', 50), row('JEPI', 50), row('VYM', null)];
    const expected = assignSeries(['SCHD', 'JEPI', 'VYM']);

    const slices = buildCompositionSlices(rows);

    expect(slices.map((slice) => slice.paint)).toEqual([expected.get('SCHD'), expected.get('JEPI')]);
  });
});

describe('비중 도넛 — conic 정지점', () => {
  it('조각이 없으면 빈 문자열이다 (빈 conic-gradient 는 CSS 파싱 오류다)', () => {
    expect(buildConicStops([])).toBe('');
  });

  it('정지점이 0 에서 시작해 끊김 없이 이어진다', () => {
    const stops = buildConicStops(buildCompositionSlices([row('AAA', 25), row('BBB', 75)]));

    expect(stops.startsWith('var(--sb-chart-series-')).toBe(true);
    expect(stops.split(', ')).toHaveLength(2);
  });

  it('🔴 마지막 조각은 언제나 100% 로 닫는다 (부동소수 잔여가 머리카락 틈을 만들지 않게)', () => {
    // 3등분 — 33.333…% 세 개를 그대로 더하면 99.999…% 로 끝난다.
    const third = 100 / 3;
    const stops = buildConicStops(buildCompositionSlices([row('AAA', third), row('BBB', third), row('CCC', third)]));

    expect(stops.endsWith('100%')).toBe(true);
  });
});
