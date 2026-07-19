import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import type { PostPayload } from '@/shared/lib/supabase';
import type { TickerProfile } from '@/shared/types/snowball';
import { getChartTheme } from '@/shared/styles';
import { ScenarioPreview } from '@/pages/Community/CommunityDetailPage/components/ScenarioPreview';
import {
  buildAllocationSummaryText,
  buildPreviewNormalizedAllocation,
  buildPreviewPieOption
} from '@/pages/Community/CommunityDetailPage/components/ScenarioPreview/ScenarioPreview.utils';

/**
 * ECharts는 캔버스라 jsdom에서 렌더 의미가 없고 lazy 청크라 비결정적이다 —
 * 반응형 파이 래퍼를 스텁으로 갈아 끼워 미리보기 컴포넌트의 **아코디언·숫자·aria 계약**만 검증한다.
 * 파이 옵션(시뮬레이터 빌더 재사용)의 채색/정규화는 순수 함수로 별도 단정한다.
 */
vi.mock('@/pages/Main/components/ResponsiveEChart', () => ({
  ResponsiveEChart: () => <div data-testid="pie-canvas" />
}));

/** 정합 프로필: dividendYield + dividendGrowth === expectedTotalReturn. */
const profile = (id: string, ticker: string, name: string): TickerProfile => ({
  id,
  ticker,
  name,
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
});

const schd = profile('t1', 'SCHD', '슈드');
const jepi = profile('t2', 'JEPI', '제피');
const vig = profile('t3', 'VIG', ''); // name 비움 → aria는 ticker(VIG)로 폴백

const buildSettings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  ...overrides
});

const buildPayload = (
  profiles: TickerProfile[],
  weightByTickerId: Record<string, number> = {},
  includedTickerIds: string[] = profiles.map((item) => item.id)
): PostPayload => ({
  portfolio: {
    tickerProfiles: profiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: buildSettings()
});

const expandPreview = () => fireEvent.click(screen.getByRole('button', { name: '시나리오 미리보기' }));

describe('buildPreviewNormalizedAllocation — 시뮬레이터와 동일 정규화', () => {
  it('가중치를 합 1로 비례 정규화한다(순서 보존)', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 }));

    expect(items.map((item) => item.profile.id)).toEqual(['t1', 't2', 't3']);
    expect(items.map((item) => item.weight)).toEqual([0.5, 0.3, 0.2]);
  });

  it('음수 가중치는 0으로 클램프한다', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi], { t1: -10, t2: 10 }));

    expect(items.map((item) => item.weight)).toEqual([0, 1]);
  });

  it('가중치 합이 0이면 균등 분배한다', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi], { t1: 0, t2: 0 }));

    expect(items.map((item) => item.weight)).toEqual([0.5, 0.5]);
  });

  it('포함된 티커만 고른다(includedTickerIds 밖은 제외)', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi, vig], { t1: 1, t3: 1 }, ['t1', 't3']));

    expect(items.map((item) => item.profile.id)).toEqual(['t1', 't3']);
  });

  it('포함된 티커가 없으면 빈 배열', () => {
    expect(buildPreviewNormalizedAllocation(buildPayload([schd], { t1: 1 }, []))).toEqual([]);
  });
});

describe('buildAllocationSummaryText — 파이 aria 본문', () => {
  it('이름(폴백 포함) + 정수 %를 쉼표로 잇는다', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 }));

    expect(buildAllocationSummaryText(items)).toBe('슈드 50%, 제피 30%, VIG 20%');
  });
});

describe('buildPreviewPieOption — 시뮬레이터 파이 빌더 재사용', () => {
  it('항목이 없으면 null(파이 미렌더)', () => {
    expect(buildPreviewPieOption([], 1_000_000)).toBeNull();
  });

  it('조각 색은 getChartTheme().series를 % 길이 인덱스로 매핑한다(캔버스=프리셋 시리즈)', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 }));
    const option = buildPreviewPieOption(items, 1_000_000);
    const series = Array.isArray(option?.series) ? option?.series[0] : option?.series;
    const data = (series as { data?: Array<{ name?: string; value?: number; itemStyle?: { color?: string } }> }).data ?? [];
    const theme = getChartTheme();

    expect(data.map((slice) => slice.name)).toEqual(['슈드', '제피', 'VIG']);
    expect(data.map((slice) => slice.itemStyle?.color)).toEqual([theme.series[0], theme.series[1], theme.series[2]]);
  });

  it('요약 월배당이 있으면 중앙 표시(graphic), 없으면 끈다', () => {
    const items = buildPreviewNormalizedAllocation(buildPayload([schd], { t1: 1 }));

    expect(buildPreviewPieOption(items, 1_000_000)?.graphic).toBeDefined();
    expect(buildPreviewPieOption(items, null)?.graphic).toBeUndefined();
  });
});

describe('ScenarioPreview — 아코디언(기본 접힘)', () => {
  it('접힘 상태로 시작한다 — 헤더는 aria-expanded=false, 숫자·파이는 렌더되지 않는다', () => {
    render(<ScenarioPreview payload={buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 })} />);

    const header = screen.getByRole('button', { name: '시나리오 미리보기' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveAttribute('aria-controls');
    // 접혀 있으면 숫자·파이(무거운 ECharts)를 마운트하지 않는다
    expect(screen.queryByText('월 배당(세후)')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('헤더를 누르면 펼쳐져 숫자와 파이(레전드·슬라이더 없이)만 보여준다', () => {
    render(<ScenarioPreview payload={buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 })} />);
    expandPreview();

    const header = screen.getByRole('button', { name: '시나리오 미리보기' });
    expect(header).toHaveAttribute('aria-expanded', 'true');

    // 숫자: 카드와 같은 SimSummaryStats 포맷
    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();

    // 파이 한 가지만 — 시뮬레이터의 슬라이더/티커 태그/범례 행은 없다
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByText('고정')).not.toBeInTheDocument();
  });

  it('파이는 role=img + 비중 요약 aria-label을 가진다(색만으로 말하지 않음)', () => {
    render(<ScenarioPreview payload={buildPayload([schd, jepi], { t1: 60, t2: 40 })} />);
    expandPreview();

    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '포트폴리오 비중: 슈드 60%, 제피 40%');
  });

  it('펼친 패널은 헤더가 이름 붙인 region이다(aria-controls ↔ aria-labelledby)', () => {
    render(<ScenarioPreview payload={buildPayload([schd], { t1: 1 })} />);
    expandPreview();

    const header = screen.getByRole('button', { name: '시나리오 미리보기' });
    const region = screen.getByRole('region');
    expect(header.getAttribute('aria-controls')).toBe(region.getAttribute('id'));
    expect(region.getAttribute('aria-labelledby')).toBe(header.getAttribute('id'));
  });

  it('포함 티커가 없어 숫자·비중이 모두 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<ScenarioPreview payload={buildPayload([schd], { t1: 1 }, [])} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('시나리오 미리보기')).not.toBeInTheDocument();
  });
});
