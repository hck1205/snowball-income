import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { buildPortfolioViewModel } from '@/pages/Portfolio/PortfolioPage';
import { getExpectedPayoutDay } from '@/pages/DividendCalendar/utils';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import { NOW, renderPortfolioPage, resetGoalStorages, seedGoalStorages } from './portfolioGoalHarness';

/**
 * **히어로의 다음 배당 D-Day**(`/dividend/portfolio`).
 *
 * 지키는 것 셋:
 *  ① 🔴 **보유가 없으면 줄 자체가 없다.** "D-—" 를 남기면 있지도 않은 입금을 기다리게 만든다.
 *  ② 🔴 **날짜를 지어내지 않는다.** 예상 '일자'를 모르는 종목(`payoutMonthsSource: 'ex'`)만 있으면
 *     D-Day 를 만들지 않는다 — 요약 타일이 "N월 지급 예정"으로 말하는 것이 사실의 한계다.
 *  ③ 🔴 **캘린더와 같은 날짜를 말한다.** 두 화면이 다른 날을 말하면 어느 쪽도 믿을 수 없다.
 *     그래서 캘린더의 프로덕션 해석기(`getExpectedPayoutDay`)로 기대값을 만들어 맞춘다.
 *
 * '오늘'은 하네스가 고정한다(`NOW` = 2026-06-15). 자정 경계에서 흔들리지 않게 컨테이너가 한 번만
 * 시각을 읽고 순수 계층으로 내려보내는 구조이므로, 시각을 주입하면 결과가 결정적이다.
 */
const copy = PORTFOLIO_COPY;

/** 예상 지급'일'을 아는 종목(스냅샷 `payoutMonthsSource: 'pay'`). 6월 지급일이 있다. */
const DATED = 'DGRO';
/** 지급'월'만 아는 종목(배당락 기반 추정) — 같은 6월이지만 며칠인지는 모른다. */
const MONTH_ONLY = 'SCHD';

/**
 * D-Day 줄. 히어로 `notice` 슬롯이 `role="note"` 로 내보내므로 그 하나로 좁힌다 — 티커 심볼("DGRO")은
 * 요약 타일·보유 표에도 나오므로 화면 전체에서 찾으면 항상 다중 매치다.
 */
const dDayNote = () => screen.queryByRole('note');

describe('내 포트폴리오 — 다음 배당 D-Day', () => {
  beforeEach(async () => {
    await resetGoalStorages();
  });

  afterEach(async () => {
    await resetGoalStorages();
  });

  it('보유 종목이 없으면 D-Day 를 그리지 않는다', async () => {
    renderPortfolioPage();

    // 빈 상태 카드가 뜰 때까지 기다린다(그 전에는 로딩이라 어차피 아무것도 없다).
    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();

    expect(dDayNote()).not.toBeInTheDocument();
    expect(screen.queryByText(/^D-/)).not.toBeInTheDocument();
  });

  it('예상 지급일을 아는 종목을 보유하면 남은 일수와 대상 종목을 말한다', async () => {
    await seedGoalStorages({ holdings: [{ ticker: DATED, quantity: 10 }] });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { level: 1, name: copy.hero.title })).toBeInTheDocument();

    const expectedDay = getExpectedPayoutDay(DATED, NOW.getFullYear(), NOW.getMonth() + 1);
    expect(expectedDay, '픽스처 전제: 이 종목은 이번 달 예상 지급일을 갖는다').not.toBeNull();

    const daysUntil = (expectedDay as number) - NOW.getDate();
    expect(daysUntil, '픽스처 전제: 지급일이 아직 오지 않았다').toBeGreaterThan(0);

    const note = await screen.findByRole('note');

    expect(within(note).getByText(copy.hero.dDay.value(daysUntil))).toBeInTheDocument();
    expect(note).toHaveTextContent(copy.hero.dDay.label);
    /* 세 번째 줄은 종목 코드 단독이 아니라 **문장**이다(2026-08-05 카피 개편) — 그 안에 종목이
       들어 있는지까지 본다. 종목 나열 규칙 자체는 요약 타일과 같은 함수가 소유한다. */
    expect(
      within(note).getByText(copy.hero.dDay.tickerLine(copy.summary.tiles.tickerSummary(DATED, 1)))
    ).toBeInTheDocument();
  });

  it('D-Day 가 가리키는 날짜는 요약 타일의 예상 지급일과 같다', async () => {
    await seedGoalStorages({ holdings: [{ ticker: DATED, quantity: 10 }] });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { level: 1, name: copy.hero.title })).toBeInTheDocument();

    const expectedDay = getExpectedPayoutDay(DATED, NOW.getFullYear(), NOW.getMonth() + 1) as number;

    // 같은 화면의 두 자리(히어로 D-Day · 요약 타일 #7)가 같은 지급을 가리킨다.
    expect(
      await screen.findByText(copy.summary.tiles.nextPayoutDay(NOW.getMonth() + 1, expectedDay))
    ).toBeInTheDocument();
    expect(await screen.findByText(copy.hero.dDay.value(expectedDay - NOW.getDate()))).toBeInTheDocument();
  });

  it('지급 월만 아는 종목뿐이면 D-Day 를 만들지 않는다 (날짜 날조 금지)', async () => {
    await seedGoalStorages({ holdings: [{ ticker: MONTH_ONLY, quantity: 10 }] });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { level: 1, name: copy.hero.title })).toBeInTheDocument();
    // 요약 타일은 아는 만큼만 말한다 — "N월 지급 예정".
    expect(await screen.findByText(copy.summary.tiles.nextPayoutMonthOnly(NOW.getMonth() + 1))).toBeInTheDocument();

    expect(dDayNote()).not.toBeInTheDocument();
    expect(screen.queryByText(/^D-/)).not.toBeInTheDocument();
  });

  /**
   * 하이드레이션 중(A)에는 아직 **모르는 것**을 말하지 않는다.
   *
   * ⚠ 이 케이스는 **페이지 렌더로는 재현되지 않는다** — 로딩 중에는 보유 목록이 비어 있어 결과가
   * "지급 없음"과 구분되지 않기 때문이다(뮤턴트 실측: 로딩 게이트를 지워도 렌더 테스트 4건이 전부
   * 초록이었다). 그래서 이 한 줄은 순수 함수 경계에서 직접 잡는다.
   */
  it('저장소를 읽는 중이면 값이 있어도 D-Day 를 만들지 않는다', () => {
    const holdings = [{ ticker: DATED, quantity: 10 }];
    const summary = computePortfolioSummary(holdings, { today: NOW, taxRatePercent: 15.4 });

    const input = {
      items: holdings.map((row) => ({ ticker: row.ticker, quantity: row.quantity, quantityInput: '10' })),
      summary,
      fx: { status: 'success', rate: 1381, asOf: '2026-06-15T00:00:00+09:00' } as const,
      writeError: null,
      formatUsdAmount: (usd: number) => `USD:${usd.toFixed(2)}`,
      today: NOW,
      canSimulate: true,
      simulationExcludedCount: 0,
      calendarTickerCount: 1,
      calendarExcludedCount: 0,
      pendingUndo: null
    };

    expect(buildPortfolioViewModel({ ...input, status: 'ready' }).dDay).not.toBeNull();
    expect(buildPortfolioViewModel({ ...input, status: 'loading' }).dDay).toBeNull();
  });
});
