import type { ReactNode } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EChartsOption } from 'echarts';
import {
  displayCurrencyAtom,
  fxViewAtom,
  includedTickerIdsAtom,
  tickerProfilesAtom,
  useDisplayCurrencyViewAtomValue,
  type DisplayCurrencyView
} from '@/jotai';
import { useMainComputed } from '@/pages/Main/hooks';
import CurrencyToggleField, { buildCurrencyCaption } from '@/components/CurrencyToggleField';
import { DISPLAY_CURRENCY_COPY } from '@/shared/constants';
import { formatApproxUSD, formatUSD } from '@/shared/utils';
import type { YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 표시 통화(원↔달러) **화면** 계약.
 *
 * 상태 계층(선호 vs 적용)은 displayCurrency.test.tsx 가 맡고, 여기서는 그 값이 실제 화면
 * — 포맷터·차트 옵션·통화 전환 행 — 으로 어떻게 흘러가는지를 본다. 계산은 어디서도 다시 하지 않는다.
 */

const FX_RATE = { rate: 1_000, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

describe('달러 포맷터 — 원화 억/만/원 3층과 1:1 동형', () => {
  it('정밀 표기: 10달러 미만만 센트까지 남긴다 (소액이 $0 으로 사라지지 않게)', () => {
    expect(formatUSD(270_636)).toBe('$270,636');
    expect(formatUSD(0)).toBe('$0');
    expect(formatUSD(3.42)).toBe('$3.42');
    expect(formatUSD(-2_030)).toBe('-$2,030');
  });

  it('간략 표기: M / K / 무단위 3층 + sign-first 부호', () => {
    expect(formatApproxUSD(1_400_000)).toBe('약 $1.4M');
    expect(formatApproxUSD(2_000_000)).toBe('약 $2M');
    expect(formatApproxUSD(270_636)).toBe('약 $271K');
    expect(formatApproxUSD(812)).toBe('약 $812');
    expect(formatApproxUSD(0.34)).toBe('약 $0.34');
    expect(formatApproxUSD(0)).toBe('약 $0');
    expect(formatApproxUSD(-2_030)).toBe('-약 $2K');
  });

  /** 원화가 `99,999,999원 → 약 10,000만` 인 것과 같은 경계 quirk — 의도적으로 미러링한다. */
  it('경계 quirk: $999,999 는 "약 $1,000K" 로 나온다 (원화 동작과 동형)', () => {
    expect(formatApproxUSD(999_999)).toBe('약 $1,000K');
  });
});

describe('buildCurrencyCaption — 환율 상태 × 선호 상태표', () => {
  const base = { rate: null, asOf: null } as const;

  it('로딩 중에는 선호와 무관하게 로딩 사유를 말한다', () => {
    expect(buildCurrencyCaption({ ...base, status: 'loading', currency: 'KRW', preferred: 'KRW' })).toBe(
      DISPLAY_CURRENCY_COPY.reasonLoading
    );
    expect(buildCurrencyCaption({ ...base, status: 'loading', currency: 'KRW', preferred: 'USD' })).toBe(
      DISPLAY_CURRENCY_COPY.reasonLoading
    );
  });

  it('환율 실패: 선호가 원화면 "못 쓴다", 선호가 달러면 "원화로 폴백 중"이다', () => {
    expect(buildCurrencyCaption({ ...base, status: 'error', currency: 'KRW', preferred: 'KRW' })).toBe(
      DISPLAY_CURRENCY_COPY.reasonUnavailable
    );
    expect(buildCurrencyCaption({ ...base, status: 'error', currency: 'KRW', preferred: 'USD' })).toBe(
      DISPLAY_CURRENCY_COPY.reasonFallback
    );
  });

  it('기본(원화) 모드에는 캡션이 없다 — 노이즈를 두지 않는다', () => {
    expect(
      buildCurrencyCaption({ status: 'success', currency: 'KRW', preferred: 'KRW', rate: 1_478.49, asOf: FX_RATE.asOf })
    ).toBe('');
  });

  it('달러 모드는 환산 근거를 환율 위젯과 같은 표기로 말한다', () => {
    expect(
      buildCurrencyCaption({ status: 'success', currency: 'USD', preferred: 'USD', rate: 1_478.49, asOf: FX_RATE.asOf })
    ).toBe('달러 표시 · 1달러 = 1,478원 (2026-07-23 기준)');
  });

  it('stale(갱신 실패, 옛 값 유지)이면 그 사실을 함께 밝힌다', () => {
    expect(
      buildCurrencyCaption({ status: 'stale', currency: 'USD', preferred: 'USD', rate: 1_478.49, asOf: FX_RATE.asOf })
    ).toContain('최신 환율 업데이트 실패');
  });
});

describe('CurrencyToggleField — 투자 설정 카드 안의 표시 통화 행', () => {
  const view = (overrides: Partial<DisplayCurrencyView> = {}): DisplayCurrencyView => ({
    currency: 'KRW',
    preferred: 'KRW',
    canUseUsd: true,
    rate: 1_478.49,
    asOf: FX_RATE.asOf,
    status: 'success',
    ...overrides
  });

  it('환율이 아직 없으면 스위치를 켤 수 없고 이유를 말한다', () => {
    render(
      <CurrencyToggleField
        display={view({ canUseUsd: false, rate: null, asOf: null, status: 'loading' })}
        onChangeCurrency={vi.fn()}
      />
    );

    expect(screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(DISPLAY_CURRENCY_COPY.reasonLoading);
  });

  /**
   * 같은 카드의 "빠른 추정 보기"/"그래프 나누어 보기"와 **같은 컨트롤**로 보여야 한다(사용자 요청).
   * 그 둘은 `ToggleField` 에 보이는 라벨을 주므로, 여기서도 보이는 라벨이 있어야 한다 —
   * 다만 스위치의 접근명은 켜짐=달러임이 드러나는 문장으로 따로 유지한다.
   */
  it('보이는 라벨은 "표시 통화", 스위치 접근명은 "결과를 달러로 표시"다', () => {
    render(<CurrencyToggleField display={view()} onChangeCurrency={vi.fn()} />);

    expect(screen.getByText(DISPLAY_CURRENCY_COPY.label)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.label })).toBeNull();
  });

  it('스위치를 켜면 달러 선호를 올린다', async () => {
    const onChangeCurrency = vi.fn();
    const user = userEvent.setup();
    render(<CurrencyToggleField display={view()} onChangeCurrency={onChangeCurrency} />);

    await user.click(screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName }));
    expect(onChangeCurrency).toHaveBeenCalledWith('USD');
  });

  it('달러 적용 중이면 스위치가 켜져 있고 환산 근거가 보인다', () => {
    render(<CurrencyToggleField display={view({ currency: 'USD', preferred: 'USD' })} onChangeCurrency={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1달러 = 1,478원');
  });

  /** 폴백 상태에서도 선호는 남는다 — 다만 스위치는 **적용** 통화를 보여주므로 꺼진 채다. */
  it('환율 실패 + 선호 달러: 스위치는 꺼진 채 비활성이고 폴백 사유를 말한다', () => {
    render(
      <CurrencyToggleField
        display={view({ preferred: 'USD', canUseUsd: false, rate: null, asOf: null, status: 'error' })}
        onChangeCurrency={vi.fn()}
      />
    );

    const toggle = screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName });
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(DISPLAY_CURRENCY_COPY.reasonFallback);
  });
});

/* ── 차트 옵션 재빌드 (캔버스는 옛 라벨을 스스로 다시 계산하지 않는다) ───────────────── */

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

const values: YieldFormValues = {
  ticker: 'SCHD',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly',
  initialInvestment: 10_000_000,
  monthlyContribution: 500_000,
  targetMonthlyDividend: 1_000_000,
  investmentStartDate: '2026-01-01',
  durationYears: 10,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'annualStep'
};

const visibleYearlySeries: Record<YearlySeriesKey, boolean> = {
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
};

/** 연간 결과 바 차트의 y축 라벨 포맷터를 꺼내 실제로 호출해 본다. */
const yAxisLabel = (option: EChartsOption, value: number): string => {
  const yAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
  const formatter = (yAxis as { axisLabel?: { formatter?: (v: number) => string } } | undefined)?.axisLabel?.formatter;
  return formatter ? formatter(value) : '';
};

/** 파이 중앙 월배당 텍스트(graphic 안 두 번째 자식). */
const pieCenterText = (option: EChartsOption | null): string | undefined => {
  const graphic = option?.graphic as Array<{ children?: Array<{ style?: { text?: string } }> }> | undefined;
  return graphic?.[0]?.children?.[1]?.style?.text;
};

describe('표시 통화 전환 → 차트 옵션 리빌드', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('통화를 바꾸면 축 라벨과 파이 중앙 금액이 즉시 달러로 다시 그려진다', () => {
    const store = createStore();
    store.set(tickerProfilesAtom, [profile]);
    store.set(includedTickerIdsAtom, [profile.id]);
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    // 앱과 같은 배선: 표시 통화 atom을 읽어 차트 빌더에 넘긴다(MainRightPanel).
    const { result } = renderHook(
      () => {
        const display = useDisplayCurrencyViewAtomValue();
        return useMainComputed({
          isValid: true,
          values,
          visibleYearlySeries,
          isYearlyAreaFillOn: false,
          postInvestmentProjectionYears: 10,
          displayCurrency: display.currency,
          fxRate: display.rate
        });
      },
      { wrapper }
    );

    expect(yAxisLabel(result.current.yearlyResultBarOption, 1_000_000)).toBe('₩1,000,000');
    expect(pieCenterText(result.current.allocationPieOption)).toMatch(/^약 /);
    expect(pieCenterText(result.current.allocationPieOption)).not.toContain('$');

    act(() => {
      store.set(displayCurrencyAtom, 'USD');
    });

    // 1 USD = 1,000 KRW 로 뒀으므로 100만원 = $1,000.
    expect(yAxisLabel(result.current.yearlyResultBarOption, 1_000_000)).toBe('$1,000');
    expect(pieCenterText(result.current.allocationPieOption)).toContain('$');
    expect(result.current.formatChartValue(1_000_000)).toBe('$1,000');
  });

  /** 통화는 그대로인데 **환율만** 갱신되는 전이(stale→success) — deps 에서 rate 가 빠지면 옛 값이 남는다. */
  it('환율만 갱신돼도 축 라벨이 새 환율로 다시 계산된다', () => {
    const store = createStore();
    store.set(tickerProfilesAtom, [profile]);
    store.set(includedTickerIdsAtom, [profile.id]);
    store.set(displayCurrencyAtom, 'USD');
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => {
        const display = useDisplayCurrencyViewAtomValue();
        return useMainComputed({
          isValid: true,
          values,
          visibleYearlySeries,
          isYearlyAreaFillOn: false,
          postInvestmentProjectionYears: 10,
          displayCurrency: display.currency,
          fxRate: display.rate
        });
      },
      { wrapper }
    );

    expect(yAxisLabel(result.current.yearlyResultBarOption, 1_000_000)).toBe('$1,000');

    act(() => {
      store.set(fxViewAtom, { status: 'success', rate: { ...FX_RATE, rate: 2_000 } });
    });

    expect(yAxisLabel(result.current.yearlyResultBarOption, 1_000_000)).toBe('$500');
  });
});
