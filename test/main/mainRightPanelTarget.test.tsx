import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, forwardRef } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';

/**
 * 목표 월배당 시각화의 **노출 조건**과 목표 요청 배선을 실제 결과 패널에서 확인한다.
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
import {
  FOCUS_TARGET_MONTHLY_DIVIDEND_STATE,
  TARGET_MONTHLY_DIVIDEND_INPUT_ID,
  TARGET_MONTHLY_DIVIDEND_QUICK_VALUES,
  buildFocusTargetMonthlyDividendState
} from '@/shared/constants';
import { createChartCompactFormatter } from '@/pages/Main/utils';
import { restoreMatchMedia, stubViewportWidth } from '@/test';
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
      <MainRightPanel configDrawerId="config-drawer" />
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

afterEach(() => {
  restoreMatchMedia();
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

/**
 * 설정 패널 + 결과 패널을 한 트리에 둔 하네스.
 *
 * 목표 요청은 **다른 컬럼에 있는 입력**을 고정 id로 지목한다 — 결과 패널만 렌더하면 그 대상이
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
        reinvestRouting={{
          includedProfiles: [],
          percentByTickerId: {},
          targetByTickerId: {},
          onSetPercent: () => undefined,
          onSetTarget: () => undefined
        }}
        values={values}
        showQuickEstimate={false}
        showSplitGraphs={false}
        display={display}
        validationErrors={[]}
      validationFields={[]}
        onSetField={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
        onToggleQuickEstimate={() => undefined}
        onToggleSplitGraphs={() => undefined}
        onChangeCurrency={() => undefined}
        onHelpResultMode={() => undefined}
        onHelpReinvestTiming={() => undefined}
        onHelpDpsGrowthMode={() => undefined}
      />
      <MainRightPanel configDrawerId="config-drawer" />
    </>
  );
}

const targetInput = (): HTMLInputElement => screen.getByLabelText('목표 월배당 (원)') as HTMLInputElement;

/** 내 포트폴리오(`/dividend/portfolio`)의 목표 달성 카드가 실어 보내는 요청 그대로(라우터 state) 시뮬레이터를 연다. */
const renderWithTargetRequest = (store: ReturnType<typeof seedStore>, state: unknown) => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
      <Provider store={store}>
        <SettingsAndResults />
      </Provider>
    </MemoryRouter>
  );
};

/**
 * 내 포트폴리오(`/dividend/portfolio`)의 목표 달성 카드 → 시뮬레이터 **전체 경로**.
 *
 * 결과 카드의 목표 CTA가 사라진 뒤 이 계약을 밟는 유일한 진입로다 — 여기가 끊기면 목표 카드의
 * 칩·직접 입력·[목표 수정]이 전부 무음 no-op이 된다. 고정 id(`TARGET_MONTHLY_DIVIDEND_INPUT_ID`)가
 * 조준점이라 라벨 카피에서 id를 다시 파생시키면 조용히 끊긴다.
 */
describe('목표 요청(location.state) → 설정 드로어의 목표 월배당 입력 (전체 경로)', () => {
  it('요청이 실려 오면 설정 드로어의 목표 입력이 포커스를 받는다', async () => {
    const store = seedStore({ targetMonthlyDividend: 0 });
    renderWithTargetRequest(store, FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);

    expect(targetInput().id).toBe(TARGET_MONTHLY_DIVIDEND_INPUT_ID);

    // 포커스 이동은 rAF 뒤라 한 프레임 기다린다.
    await waitFor(() => expect(targetInput()).toHaveFocus());
    // 값 없는 요청은 값을 대신 정해주지 않는다.
    expect(store.get(yieldFormAtom).targetMonthlyDividend).toBe(0);
  });

  it('값이 실려 오면 그 값이 설정 드로어 입력에 그대로 들어간다', async () => {
    const store = seedStore({ targetMonthlyDividend: 0 });
    /*
     * 칩 값의 정본은 `shared/constants/targets`다(로드맵 v2: 50/100/200/300만원) —
     * 목표 달성 카드의 설정 패널(`pages/Portfolio/components/GoalSetupPanel`)이 같은 상수를 쓴다.
     * 여기서 리터럴을 적으면 두 화면이 갈렸을 때 이 테스트가 그 사실을 못 잡는다.
     */
    const [, , , highest] = TARGET_MONTHLY_DIVIDEND_QUICK_VALUES;
    renderWithTargetRequest(store, buildFocusTargetMonthlyDividendState(highest));

    // 숫자 입력은 자릿수 구분 기호가 붙은 텍스트로 표시된다 — 표기 형식이 아니라 값을 본다.
    const shownAmount = (): number => Number((targetInput().value || '0').replace(/[^\d.-]/g, ''));
    await waitFor(() => expect(shownAmount()).toBe(highest));
    expect(store.get(yieldFormAtom).targetMonthlyDividend).toBe(highest);
  });

  it('좁은 화면이면 설정 드로어를 먼저 연다(입력이 DOM에 없으면 포커스가 무음 실패한다)', async () => {
    stubViewportWidth(360);
    const store = seedStore({ targetMonthlyDividend: 0 });
    renderWithTargetRequest(store, FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);

    await waitFor(() => expect(store.get(isConfigDrawerOpenAtom)).toBe(true));
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
