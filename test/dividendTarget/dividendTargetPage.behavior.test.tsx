import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom';
import { routes } from '@/router/routes';
import DividendTargetPage from '@/pages/DividendTarget/DividendTargetPage';
import { DIVIDEND_TARGET_COPY } from '@/pages/DividendTarget/copy';
import { formatKoreanWon, formatPercentPoints } from '@/pages/DividendTarget/utils';
import { DIVIDEND_TARGET_PATH, SIMULATOR_PATH } from '@/shared/constants/routes';
import { buildDividendTargetModel, findTickerRequirement } from '@/shared/lib/dividendTarget';
import * as analytics from '@/shared/lib/analytics';

/**
 * `/dividend/how-much` 의 **사용자 행동** 계약 (2026-11-01).
 *
 * 잠그는 것:
 *  ① 질문 문장에 고른 금액이 박혀 있고, 답(필요 원금)이 순수 계층과 **같은 숫자**다.
 *  ② 금액·종목·물가를 바꾸면 화면과 주소(`?m=&t=&i=`)가 함께 바뀐다 — 공유 링크가 상태를 싣는다.
 *  ③ 남의 링크로 들어오면 그 조합이 열리고, 깨진 파라미터는 조용히 기본값이 된다.
 *  ④ "계산하기"는 그 종목을 프리필 state 로 실어 시뮬레이터로 보낸다(종목 비교와 같은 계약).
 *
 * ⚠ 기대값은 화면 문자열을 손으로 적지 않고 **모델에서 뽑아 화면과 같은 포맷터로** 만든다 —
 *   시장 데이터가 갱신돼도 테스트가 낡지 않는다. 포맷터 자체는 아래 별도 블록이 고정값으로 잠근다.
 */

const principalOf = (monthlyMan: number, ticker: string, inflation = 2): string => {
  const model = buildDividendTargetModel(monthlyMan * 10_000, inflation);
  return formatKoreanWon(findTickerRequirement(model, ticker)!.requirement!.requiredPrincipal);
};

let lastSimulatorState: unknown = undefined;

function SimulatorProbe() {
  const location = useLocation();
  lastSimulatorState = location.state;
  return <p>simulator-probe</p>;
}

const renderPage = (entry = DIVIDEND_TARGET_PATH) => {
  const router = createMemoryRouter(
    [
      { path: DIVIDEND_TARGET_PATH, element: <DividendTargetPage /> },
      { path: SIMULATOR_PATH, element: <SimulatorProbe /> }
    ],
    { initialEntries: [entry] }
  );
  render(<RouterProvider router={router} />);
  return router;
};

const detailCard = () => screen.getByRole('region', { name: /자세히 보기/ });

afterEach(() => {
  lastSimulatorState = undefined;
  vi.restoreAllMocks();
});

describe('/dividend/how-much — 첫 화면', () => {
  it('🔴 실제 라우터에 배선돼 있다 (404 로 가지 않는다)', async () => {
    const router = createMemoryRouter(routes, { initialEntries: [DIVIDEND_TARGET_PATH] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: /250만원/ })).toBeInTheDocument();
  });

  it('기본은 월 250만원 · SCHD 이고, 답이 순수 계층과 같은 숫자다', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 250만원 받으려면');
    const detail = detailCard();
    expect(within(detail).getByText('SCHD')).toBeInTheDocument();
    expect(within(detail).getAllByText(principalOf(250, 'SCHD')).length).toBeGreaterThan(0);
  });

  it('12 종 카드가 전부 있다', () => {
    renderPage();

    const compare = screen.getByRole('region', { name: DIVIDEND_TARGET_COPY.compare.title });
    expect(within(compare).getAllByRole('button', { pressed: false })).toHaveLength(11);
    expect(within(compare).getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('🔴 월 250만원이면 금융소득종합과세 기준을 넘는다고 알린다', () => {
    renderPage();
    expect(screen.getByText(/금융소득종합과세 기준\(연 2,000만원\)을 넘습니다/)).toBeInTheDocument();
  });

  it('월 100만원이면 기준 아래라고 알린다 (경고를 상시 띄우지 않는다)', () => {
    renderPage(`${DIVIDEND_TARGET_PATH}?m=100`);
    expect(screen.getByText(DIVIDEND_TARGET_COPY.notes.financialIncomeUnder)).toBeInTheDocument();
  });
});

describe('/dividend/how-much — 바꾸기', () => {
  it('금액 칩을 누르면 제목·답·주소가 함께 바뀐다', async () => {
    const user = userEvent.setup();
    const track = vi.spyOn(analytics, 'trackEvent');
    const router = renderPage();

    await user.click(screen.getByRole('button', { name: '300만원' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 300만원 받으려면');
    expect(within(detailCard()).getAllByText(principalOf(300, 'SCHD')).length).toBeGreaterThan(0);
    expect(router.state.location.search).toBe('?m=300');
    expect(track).toHaveBeenCalledWith(analytics.ANALYTICS_EVENT.DIVIDEND_TARGET_INTERACTION, {
      action: 'amount',
      value: '300',
      input_method: 'chip'
    });
  });

  it('비교 카드를 누르면 위 상세가 그 종목으로 바뀐다', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    const compare = screen.getByRole('region', { name: DIVIDEND_TARGET_COPY.compare.title });
    await user.click(within(compare).getByRole('button', { name: /JEPI\b(?!Q)/ }));

    expect(within(detailCard()).getByText('JEPI')).toBeInTheDocument();
    expect(within(detailCard()).getAllByText(principalOf(250, 'JEPI')).length).toBeGreaterThan(0);
    expect(within(compare).getByRole('button', { name: /JEPI\b(?!Q)/ })).toHaveAttribute('aria-pressed', 'true');
    expect(router.state.location.search).toBe('?t=JEPI');
  });

  it('직접 입력은 범위 밖이면 받지 않고, 범위 안이면 적용한다', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    const input = screen.getByRole('textbox');
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: DIVIDEND_TARGET_COPY.picker.customApply }));
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(router.state.location.search).toBe('');

    await user.clear(input);
    await user.type(input, '180');
    await user.click(screen.getByRole('button', { name: DIVIDEND_TARGET_COPY.picker.customApply }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 180만원 받으려면');
    expect(router.state.location.search).toBe('?m=180');
  });

  it('물가 가정을 올리면 판정 문구가 그 가정으로 다시 계산된다', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    const group = screen.getByRole('group', { name: DIVIDEND_TARGET_COPY.inflation.assumptionLabel });
    await user.click(within(group).getByRole('button', { name: '3%' }));

    const model = buildDividendTargetModel(250 * 10_000, 3);
    const schd = findTickerRequirement(model, 'SCHD')!;
    expect(within(detailCard()).getByRole('status')).toHaveTextContent(formatPercentPoints(schd.inflation.gapPercentPoints!));
    expect(router.state.location.search).toBe('?i=3');
  });
});

describe('/dividend/how-much — 링크로 들어오기', () => {
  it('남의 공유 링크 조합 그대로 열린다', () => {
    renderPage(`${DIVIDEND_TARGET_PATH}?m=100&t=QYLD`);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 100만원 받으려면');
    expect(within(detailCard()).getByText('QYLD')).toBeInTheDocument();
    expect(within(detailCard()).getAllByText(principalOf(100, 'QYLD')).length).toBeGreaterThan(0);
  });

  it('🔴 깨진 파라미터는 오류 없이 기본값이 된다', () => {
    renderPage(`${DIVIDEND_TARGET_PATH}?m=abc&t=NOPE&i=9`);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 250만원 받으려면');
    expect(within(detailCard()).getByText('SCHD')).toBeInTheDocument();
  });

  it('🔴 자료 없는 배당 인상률은 "자료 없음"이지 0% 가 아니다', () => {
    const model = buildDividendTargetModel(250 * 10_000, 2);
    const unknown = model.all.find((item) => item.dividendCagrPercent === null);
    if (!unknown) return; // 스냅샷이 전 종목을 채우게 되면 이 시나리오는 성립하지 않는다.

    renderPage(`${DIVIDEND_TARGET_PATH}?t=${unknown.ticker}`);
    expect(within(detailCard()).getByRole('status')).toHaveTextContent(DIVIDEND_TARGET_COPY.inflation.verdict.unknown);
  });
});

describe('/dividend/how-much — 계산기로', () => {
  it('그 종목을 프리필 state 로 실어 시뮬레이터로 보내고, 클릭을 센다', async () => {
    const user = userEvent.setup();
    const track = vi.spyOn(analytics, 'trackEvent');
    renderPage(`${DIVIDEND_TARGET_PATH}?t=O`);

    await user.click(screen.getByRole('button', { name: DIVIDEND_TARGET_COPY.breakdown.simulateCta }));

    expect(await screen.findByText('simulator-probe')).toBeInTheDocument();
    expect(lastSimulatorState).toMatchObject({
      portfolioSimulationPrefill: { holdings: [{ ticker: 'O', weightPercent: 100 }] },
      scenarioName: 'O'
    });
    expect(track).toHaveBeenCalledWith(analytics.ANALYTICS_EVENT.CONTENT_TO_SIMULATOR, {
      surface: 'how_much',
      slot: 'detail',
      ticker: 'O'
    });
  });
});

describe('금액 표기 — 이 화면은 통장 잔고처럼 읽힌다', () => {
  it('억·만 단위로 끊고, 만원 아래는 버린다', () => {
    expect(formatKoreanWon(1_127_610_000)).toBe('11억 2,761만원');
    expect(formatKoreanWon(2_500_000)).toBe('250만원');
    expect(formatKoreanWon(300_000_000)).toBe('3억원');
    expect(formatKoreanWon(5_299)).toBe('1만원');
  });
});
