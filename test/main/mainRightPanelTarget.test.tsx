import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, forwardRef } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';

/**
 * 목표 월배당 시각화의 **노출 조건**과 CTA 배선을 실제 결과 패널에서 확인한다.
 *
 * 여기서만 잡히는 회귀가 둘 있다: ①"월 평균 배당" 차트가 분할 보기 전용이던 시절로 되돌아가
 * 목표선·도달 마커가 기본 화면에서 사라지는 것 ②분할 보기를 켠 순간 같은 차트가 **두 번** 그려지는 것
 * (조건을 `showSplitGraphs || hasTarget`로 옮기면서 옛 자리를 안 지우면 바로 이렇게 된다).
 *
 * 캔버스는 텍스트로 안 잡히므로 `echarts-for-react`를 목표선/도달마커 라벨만 흘려보내는 프로브로
 * 갈아끼운다 — 옵션 객체 스냅샷이 아니라 사용자가 차트에서 읽게 될 **문자열**을 본다.
 */
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: forwardRef<HTMLDivElement, { option?: unknown }>(({ option }, ref) => {
    const series = ([] as any[]).concat((option as any)?.series ?? []);
    const parts: string[] = [];
    for (const item of series) {
      const markLineLabel = item?.markLine?.label?.formatter;
      if (typeof markLineLabel === 'string') parts.push(`markLine=${markLineLabel}`);
      const markPointLabel = item?.markPoint?.label?.formatter;
      if (typeof markPointLabel === 'string') parts.push(`markPoint=${markPointLabel}`);
    }
    return createElement('div', { 'data-testid': 'chart-probe', ref }, parts.join(' | '));
  })
}));

import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import InvestmentSettings from '@/components/InvestmentSettings';
import {
  displayCurrencyAtom,
  fxViewAtom,
  includedTickerIdsAtom,
  isConfigDrawerOpenAtom,
  showSplitGraphsAtom,
  tickerProfilesAtom,
  useDisplayCurrencyViewAtomValue,
  useSetYieldFormWrite,
  useYieldFormAtomValue,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import { TARGET_MONTHLY_DIVIDEND_INPUT_ID } from '@/shared/constants';
import { createChartCompactFormatter } from '@/pages/Main/utils';
import type { TickerProfile } from '@/shared/types/snowball';

const FX_RATE = { rate: 1_000, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

const PROFILE: TickerProfile = {
  id: 'p1',
  ticker: 'SCHD',
  name: '슈드',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly'
};

type SeedOptions = {
  targetMonthlyDividend?: number;
  showSplitGraphs?: boolean;
  usd?: boolean;
};

const seedStore = ({ targetMonthlyDividend = 3_000_000, showSplitGraphs = false, usd = false }: SeedOptions = {}) => {
  const store = createStore();
  store.set(tickerProfilesAtom, [PROFILE]);
  store.set(includedTickerIdsAtom, [PROFILE.id]);
  store.set(weightByTickerIdAtom, { [PROFILE.id]: 1 });
  store.set(yieldFormAtom, (prev) => ({ ...prev, targetMonthlyDividend }));
  store.set(showSplitGraphsAtom, showSplitGraphs);
  if (usd) {
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
    store.set(displayCurrencyAtom, 'USD');
  }
  return store;
};

const renderPanel = (store: ReturnType<typeof seedStore>) => {
  render(
    <Provider store={store}>
      <MainRightPanel />
    </Provider>
  );
  return userEvent.setup();
};

const chartTitles = (): string[] =>
  screen.getAllByRole('img', { name: /차트/ }).map((node) => node.getAttribute('aria-label') ?? '');

/** 차트(role=img)의 프로브 텍스트. lazy 청크라 로드될 때까지 기다린다. */
const chartProbeText = async (name: string | RegExp): Promise<string> => {
  const wrap = await screen.findByRole('img', { name });
  return waitFor(() => {
    const text = within(wrap).getByTestId('chart-probe').textContent ?? '';
    expect(text.length).toBeGreaterThan(0);
    return text;
  });
};

const realMatchMedia = window.matchMedia;

/** ≤960px(설정 패널이 드로어) 상태를 흉내낸다 — jsdom은 @media를 평가하지 못한다. */
const stubDrawerViewport = () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(max-width: 960px)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: realMatchMedia });
});

describe('"월 평균 배당" 차트 노출 조건', () => {
  it('목표가 있으면 분할 보기를 끈 기본 화면에도 그린다', () => {
    renderPanel(seedStore({ targetMonthlyDividend: 3_000_000, showSplitGraphs: false }));

    expect(screen.getByRole('heading', { name: '월 평균 배당' })).toBeInTheDocument();
    // 자산 가치·누적 배당은 그대로 분할 보기 전용이다(기본 화면 길이 유지).
    expect(screen.queryByRole('heading', { name: '자산 가치' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '누적 배당' })).not.toBeInTheDocument();
  });

  it('목표가 없고 분할 보기도 꺼져 있으면 그리지 않는다', () => {
    renderPanel(seedStore({ targetMonthlyDividend: 0, showSplitGraphs: false }));

    expect(screen.queryByRole('heading', { name: '월 평균 배당' })).not.toBeInTheDocument();
    expect(chartTitles()).not.toContain('월 평균 배당 차트');
  });

  it('목표가 없어도 분할 보기를 켜면 세 차트가 모두 나온다(기존 동작 유지)', () => {
    renderPanel(seedStore({ targetMonthlyDividend: 0, showSplitGraphs: true }));

    expect(screen.getByRole('heading', { name: '월 평균 배당' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '자산 가치' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '누적 배당' })).toBeInTheDocument();
  });

  it('목표 + 분할 보기가 겹쳐도 같은 차트를 두 번 그리지 않는다', () => {
    renderPanel(seedStore({ targetMonthlyDividend: 3_000_000, showSplitGraphs: true }));

    expect(screen.getAllByRole('heading', { name: '월 평균 배당' })).toHaveLength(1);
    expect(chartTitles().filter((title) => title === '월 평균 배당 차트')).toHaveLength(1);
  });
});

describe('목표 미설정 CTA가 결과 패널에 배선돼 있다', () => {
  it('빠른 설정 칩을 누르면 폼의 목표가 원 단위로 채워지고 목표 차트가 나타난다', async () => {
    const store = seedStore({ targetMonthlyDividend: 0, showSplitGraphs: false });
    const user = renderPanel(store);

    const group = screen.getByRole('group', { name: '목표 월배당 빠른 설정' });
    await user.click(within(group).getByRole('button', { name: '월 300만원' }));

    expect(store.get(yieldFormAtom).targetMonthlyDividend).toBe(3_000_000);
    // 막다른 길이었던 서사가 실제 결과로 이어진다 — 목표선이 붙은 차트가 그 자리에서 나타난다.
    expect(await screen.findByRole('heading', { name: '월 평균 배당' })).toBeInTheDocument();
    // 목표가 생겼으니 빠른 설정 행은 물러난다.
    expect(screen.queryByRole('group', { name: '목표 월배당 빠른 설정' })).not.toBeInTheDocument();
    // 누른 칩이 사라져도 포커스는 body로 떨어지지 않고, 바뀐 서사 문장 위에 남는다(다음 프레임).
    await waitFor(() => expect(screen.getByText(/달성해요|닿지 못해요/)).toHaveFocus());
  });

  it('좁은 화면에서 "직접 입력"을 누르면 설정 드로어를 먼저 연다', async () => {
    stubDrawerViewport();
    const store = seedStore({ targetMonthlyDividend: 0 });
    const user = renderPanel(store);

    await user.click(screen.getByRole('button', { name: '직접 입력' }));

    expect(store.get(isConfigDrawerOpenAtom)).toBe(true);
    // 값을 대신 정해주지는 않는다.
    expect(store.get(yieldFormAtom).targetMonthlyDividend).toBe(0);
  });

  it('넓은 화면에서는 드로어를 열지 않는다(설정 패널이 이미 보인다)', async () => {
    const store = seedStore({ targetMonthlyDividend: 0 });
    const user = renderPanel(store);

    await user.click(screen.getByRole('button', { name: '직접 입력' }));

    expect(store.get(isConfigDrawerOpenAtom)).toBe(false);
  });
});

/**
 * 설정 패널 + 결과 패널을 한 트리에 둔 하네스.
 *
 * "직접 입력" CTA는 **다른 컬럼에 있는 입력**을 고정 id로 지목한다 — 결과 패널만 렌더하면 그 대상이
 * 아예 없어 계약이 증명되지 않는다(무음 no-op와 구분이 안 된다). 실제 앱의 좌패널(MainLeftPanel)은
 * IndexedDB 하이드레이션·클라우드 동기화까지 끌고 오므로, 프레젠테이셔널한 InvestmentSettings만
 * 폼 atom에 물려 같은 DOM 상황을 만든다.
 */
function SettingsAndResults() {
  const values = useYieldFormAtomValue();
  const setValues = useSetYieldFormWrite();
  const display = useDisplayCurrencyViewAtomValue();

  return (
    <>
      <InvestmentSettings
        values={values}
        showQuickEstimate={false}
        showSplitGraphs={false}
        display={display}
        validationErrors={[]}
        onSetField={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
        onToggleQuickEstimate={() => undefined}
        onToggleSplitGraphs={() => undefined}
        onChangeCurrency={() => undefined}
        onHelpResultMode={() => undefined}
        onHelpReinvestTiming={() => undefined}
        onHelpDpsGrowthMode={() => undefined}
      />
      <MainRightPanel />
    </>
  );
}

const targetInput = (): HTMLInputElement => screen.getByLabelText('목표 월배당 (원)') as HTMLInputElement;

describe('"직접 입력" → 목표 월배당 입력으로 이동 (전체 경로)', () => {
  it('클릭하면 좌측 설정의 목표 입력이 포커스를 받는다', async () => {
    const store = seedStore({ targetMonthlyDividend: 0 });
    render(
      <Provider store={store}>
        <SettingsAndResults />
      </Provider>
    );
    const user = userEvent.setup();

    // 고정 id가 곧 CTA의 조준점이다 — 라벨 카피에서 파생되면 카피 수정에 조용히 끊긴다.
    expect(targetInput().id).toBe(TARGET_MONTHLY_DIVIDEND_INPUT_ID);

    await user.click(screen.getByRole('button', { name: '직접 입력' }));

    // 포커스 이동은 rAF 뒤라 한 프레임 기다린다.
    await waitFor(() => expect(targetInput()).toHaveFocus());
  });

  it('빠른 설정 칩이 정한 값이 좌측 설정 입력에 그대로 들어간다', async () => {
    const store = seedStore({ targetMonthlyDividend: 0 });
    render(
      <Provider store={store}>
        <SettingsAndResults />
      </Provider>
    );
    const user = userEvent.setup();

    // 숫자 입력은 자릿수 구분 기호가 붙은 텍스트로 표시된다 — 표기 형식이 아니라 값을 본다.
    const shownAmount = (): number => Number((targetInput().value || '0').replace(/[^\d.-]/g, ''));
    expect(shownAmount()).toBe(0);

    await user.click(screen.getByRole('button', { name: '월 500만원' }));

    expect(shownAmount()).toBe(5_000_000);
  });
});

describe('목표선 라벨은 축과 같은 통화를 쓴다', () => {
  it('원화 모드: 목표선 라벨이 원화 축약 표기다', async () => {
    const expected = createChartCompactFormatter('KRW', null)(3_000_000);
    renderPanel(seedStore({ targetMonthlyDividend: 3_000_000 }));

    expect(await chartProbeText('월 평균 배당 차트')).toContain(`markLine=목표 ${expected}`);
  });

  it('달러 모드: 목표선 라벨도 달러로 환산된다(축만 달러, 목표선만 원화인 혼선 금지)', async () => {
    const expected = createChartCompactFormatter('USD', FX_RATE.rate)(3_000_000);
    renderPanel(seedStore({ targetMonthlyDividend: 3_000_000, usd: true }));

    const probe = await chartProbeText('월 평균 배당 차트 (달러 표시)');
    expect(probe).toContain(`markLine=목표 ${expected}`);
    expect(probe).toContain('$');
    expect(probe).not.toContain('₩');
    expect(probe).not.toContain('만원');
  });

  it('목표에 실제로 닿는 시나리오면 도달 연도 칩이 차트에 붙는다', async () => {
    // 아주 낮은 목표라 첫 해에 도달한다 — 연도 자체는 엔진 결과라 정규식으로만 계약을 본다.
    renderPanel(seedStore({ targetMonthlyDividend: 1 }));

    expect(await chartProbeText('월 평균 배당 차트')).toMatch(/markPoint=\d{4}년 도달/);
  });

  it('목표가 없으면 목표선 자체가 없다', async () => {
    renderPanel(seedStore({ targetMonthlyDividend: 0, showSplitGraphs: true }));

    const wrap = await screen.findByRole('img', { name: '월 평균 배당 차트' });
    await waitFor(() => expect(within(wrap).getByTestId('chart-probe')).toBeInTheDocument());
    expect(within(wrap).getByTestId('chart-probe').textContent ?? '').toBe('');
  });
});
