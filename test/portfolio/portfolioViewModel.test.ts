// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  buildPortfolioAsOfLine,
  buildPortfolioLiveMessage,
  buildPortfolioViewModel,
  formatPortfolioFxDate,
  formatPortfolioSnapshotDate
} from '@/pages/Portfolio/PortfolioPage';
import type { PortfolioFxView, PortfolioViewModelInput } from '@/pages/Portfolio/PortfolioPage';
import type { PortfolioHoldingRow } from '@/pages/Portfolio/hooks';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import { fixtureResolver, localDate } from './portfolioFixtures';

/**
 * 화면 모델(순수 함수)의 **경계 계약**.
 *
 * 페이지 행동 테스트로는 만들기 어려운 조합을 여기서 만든다: 분기 배당만 보유해 "월 평균은 있는데
 * 이번 달은 0"인 달, 지급 일정 데이터가 아예 없는 구성, 환율 4상태. 이 경계에서 화면이
 * `₩0` 을 그리거나 없는 날짜를 지어내면 사용자는 숫자를 오해한다.
 */

const copy = PORTFOLIO_COPY;

/** 시세 스냅샷 기준일이 있는 픽스처(FIXTURE_*)와 같은 날짜. */
const SNAPSHOT_AS_OF = '2026-07-25';

/** 표시 문자열이 아니라 **어떤 값이 흘러갔는지**를 보려고 통화 기호 대신 원값을 찍는다. */
const formatUsdAmount = (usd: number) => `USD:${usd.toFixed(2)}`;

const row = (ticker: string, quantityInput: string, manual?: { price: number; dividendYield: number }): PortfolioHoldingRow => ({
  ticker,
  quantity: quantityInput === '' ? null : Number(quantityInput),
  quantityInput,
  ...(manual ? { manual } : {})
});

const successFx: PortfolioFxView = { status: 'success', rate: 1381, asOf: '2026-07-27T00:00:00+09:00' };
const errorFx: PortfolioFxView = { status: 'error', rate: null, asOf: null };

const buildModel = (
  items: PortfolioHoldingRow[],
  overrides: Partial<PortfolioViewModelInput> = {},
  today: Date = localDate(2026, 7, 27)
) => {
  const summary = computePortfolioSummary(
    items.map((item) => ({
      ticker: item.ticker,
      quantity: item.quantity ?? 0,
      ...(item.manual ? { manual: item.manual } : {})
    })),
    { today, taxRatePercent: 15.4, resolve: fixtureResolver }
  );

  return buildPortfolioViewModel({
    status: 'ready',
    items,
    summary,
    fx: successFx,
    writeError: null,
    formatUsdAmount,
    today,
    canSimulate: true,
    simulationExcludedCount: 0,
    calendarTickerCount: items.length,
    calendarExcludedCount: 0,
    pendingUndo: null,
    ...overrides
  });
};

const tileByLabel = (tiles: { label: string; value: string; hint?: string }[], label: string) => {
  const found = tiles.find((tile) => tile.label === label);
  if (!found) throw new Error(`타일을 찾지 못했다: ${label}`);
  return found;
};

describe('요약 타일', () => {
  it('수량이 하나도 없으면 금액 자리를 0 이 아니라 —로 두고 다음 행동을 안내한다', () => {
    const model = buildModel([row('MONTHLY', '')]);

    expect(model.heroTile.value).toBe(copy.summary.tiles.empty);
    expect(model.heroTile.hint).toBe(copy.summary.tiles.monthlyNetHintEmpty);
    expect(tileByLabel(model.tiles, copy.summary.tiles.marketValue).value).toBe(copy.summary.tiles.empty);
    // 들고 갈 값이 없으므로 두 CTA 는 전부 비활성이고, 그 사유가 화면에 남는다(무음 비활성 금지).
    expect(model.simulateCta.disabled).toBe(true);
    expect(model.calendarCta.disabled).toBe(true);
    expect(model.simulateCta.hint).toBe(copy.cta.simulateDisabledEmpty);
  });

  it('분기 배당만 보유해 이번 달 지급이 없으면 문장으로 말하고 개념 차이를 덧붙인다', () => {
    // FIXTURE_QUARTERLY 의 지급월은 3·6·9·12 — 7월에는 들어오는 돈이 없다.
    const model = buildModel([row('QUARTERLY', '100')]);
    const thisMonth = tileByLabel(model.tiles, copy.summary.tiles.thisMonth);

    expect(thisMonth.value).toBe(copy.summary.tiles.thisMonthNone);
    expect(thisMonth.hint).toBe(copy.summary.tiles.thisMonthNoneHint);
    // 월 평균(#3)은 0 이 아니다 — 그래서 "왜 다른가"를 설명하는 줄이 필요하다.
    expect(model.heroTile.value).not.toBe(copy.summary.tiles.empty);
    expect(model.showMonthlyVsThisMonthNote).toBe(true);
  });

  it('지급월 데이터가 없는 종목만 보유하면 이번 달을 0 이 아니라 "계산할 수 없음"으로 말한다', () => {
    const model = buildModel([row('NOSCHED', '10')]);

    expect(tileByLabel(model.tiles, copy.summary.tiles.thisMonth).value).toBe(copy.summary.tiles.thisMonthUnknown);
    expect(tileByLabel(model.tiles, copy.summary.tiles.nextPayout).value).toBe(copy.summary.tiles.nextPayoutNone);
    // 빠진 사실은 요약 하단에서 한 번 더 말한다(무음 제외 금지).
    expect(model.summaryNotes).toContain(copy.summary.missingScheduleNote(1));
  });

  it('예상 지급일을 아는 종목은 날짜를, 모르는 종목은 "날짜 미정"을 표시한다', () => {
    // MONTHLY 는 매월 지급 + 예상일(8월 5일)을 알고, QUARTERLY 는 9월 지급이지만 날짜를 모른다.
    const dated = buildModel([row('MONTHLY', '10')]);
    expect(tileByLabel(dated.tiles, copy.summary.tiles.nextPayout).value).toBe(
      copy.summary.tiles.nextPayoutDay(8, 5)
    );

    const monthOnly = buildModel([row('QUARTERLY', '10')]);
    expect(tileByLabel(monthOnly.tiles, copy.summary.tiles.nextPayout).value).toBe(
      copy.summary.tiles.nextPayoutMonthOnly(9)
    );
  });

  it('직접 추가한 종목은 값 계산에는 들어가되 지급 계산 제외를 명시한다', () => {
    const model = buildModel([row('CUSTOM', '10', { price: 50, dividendYield: 4 })]);

    expect(model.rows[0].badge).toBe('manual');
    expect(model.rows[0].note).toBe(copy.holdings.rowManualExcluded);
    expect(model.rows[0].marketValue).toBe(formatUsdAmount(500));
    expect(model.summaryNotes).toContain(copy.summary.manualExcludedNote(1));
  });

  it('시세 스냅샷 밖 종목은 "시세 미갱신" 배지와 요약 경고를 함께 받는다', () => {
    const model = buildModel([row('NOSCHED', '10')]);

    expect(model.rows[0].badge).toBe('stale-price');
    expect(model.summaryNotes).toContain(copy.summary.staleTickerNote(1));
  });

  it('수량 미입력 행은 에러가 아니라 안내 문구를 달고 금액 자리를 비운다', () => {
    const model = buildModel([row('MONTHLY', '10'), row('QUARTERLY', '')]);

    expect(model.rows[1].note).toBe(copy.holdings.rowNeedsQuantity);
    expect(model.rows[1].marketValue).toBe(copy.summary.tiles.empty);
    expect(model.rows[1].annualNet).toBe(copy.summary.tiles.empty);
  });
});

describe('CTA 사유', () => {
  it('프리필을 만들 수 없으면(환율 없음) 비활성 + 사유를 남긴다', () => {
    const model = buildModel([row('MONTHLY', '10')], { fx: errorFx, canSimulate: false });

    expect(model.simulateCta.disabled).toBe(true);
    expect(model.simulateCta.hint).toBe(copy.cta.simulateDisabledFx);
    expect(model.fxError).toBe(copy.error.fxFailed);
  });

  it('환율을 아직 불러오는 중이면 실패가 아니라 로딩이라고 말한다', () => {
    const loadingFx: PortfolioFxView = { status: 'loading', rate: null, asOf: null };
    const model = buildModel([row('MONTHLY', '10')], { fx: loadingFx, canSimulate: false });

    expect(model.simulateCta.disabled).toBe(true);
    expect(model.simulateCta.hint).toBe(copy.cta.simulateDisabledFxLoading);
    // 아직 실패하지 않았다 — 실패 문구("복구되면")와 배너를 미리 띄우지 않는다.
    expect(model.simulateCta.hint).not.toBe(copy.cta.simulateDisabledFx);
    expect(model.fxError).toBeNull();
  });

  it('유니버스 밖 종목이 비중에서 빠지면 활성 상태에서도 먼저 알린다', () => {
    const model = buildModel([row('MONTHLY', '10')], { simulationExcludedCount: 2 });

    expect(model.simulateCta.disabled).toBe(false);
    expect(model.simulateCta.hint).toBe(copy.cta.simulateExcluded(2));
    // 비중에서만 빠지고 **금액은 초기 투자금에 실린다**는 사실을 같은 줄에서 말한다(왜곡 무음 금지).
    expect(model.simulateCta.hint).toContain('초기 투자금에 포함');
  });

  it('달력에 실을 수 없는 종목이 있으면 제외 사실을 말한다', () => {
    const model = buildModel([row('MONTHLY', '10')], { calendarTickerCount: 1, calendarExcludedCount: 1 });

    expect(model.calendarCta.disabled).toBe(false);
    expect(model.calendarCta.hint).toBe(copy.cta.calendarManualExcluded);
  });
});

describe('기준일 줄', () => {
  const summaryOf = (asOf: string | null) => ({
    asOf,
    // 이 함수가 읽는 필드는 asOf 뿐이라 나머지는 형태만 맞춘다.
    holdings: [],
    exclusions: [],
    counts: { total: 0, included: 0, scheduled: 0 }
  });

  it('환율 상태 4종을 각각 다른 문장으로 말한다(가짜 환율 금지)', () => {
    const summary = summaryOf(SNAPSHOT_AS_OF) as never;

    expect(buildPortfolioAsOfLine(summary, successFx)).toContain(copy.hero.asOfFx('1,381', '7월 27일'));
    expect(buildPortfolioAsOfLine(summary, { ...successFx, status: 'stale' })).toContain(copy.hero.asOfFxStale);
    expect(buildPortfolioAsOfLine(summary, { status: 'loading', rate: null, asOf: null })).toContain(
      copy.hero.asOfFxLoading
    );
    expect(buildPortfolioAsOfLine(summary, errorFx)).toContain(copy.hero.asOfFxMissing);
  });

  it('시세 기준일이 없으면 그 조각을 아예 넣지 않는다', () => {
    const line = buildPortfolioAsOfLine(summaryOf(null) as never, successFx);

    expect(line).not.toContain('시세 기준일');
  });

  it('날짜 포맷은 로컬 기준으로 읽는다', () => {
    expect(formatPortfolioSnapshotDate('2026-07-25')).toBe('2026년 7월 25일');
    expect(formatPortfolioSnapshotDate('알 수 없음')).toBe('알 수 없음');
    expect(formatPortfolioFxDate(null)).toBeNull();
    expect(formatPortfolioFxDate('망가진 값')).toBeNull();
  });
});

describe('라이브 리전 기본 문구', () => {
  const base = {
    holdingsCount: 0,
    hasIncludedRows: false,
    monthlyText: 'USD:0.00',
    fxFailed: false,
    goalProgressPercent: null
  };

  it('로딩·빈 목록·요약을 구분해 말한다', () => {
    expect(buildPortfolioLiveMessage({ ...base, status: 'loading' })).toBe(copy.live.loading);
    expect(buildPortfolioLiveMessage({ ...base, status: 'read-error' })).toBe(copy.error.readFailed);
    expect(buildPortfolioLiveMessage({ ...base, status: 'ready' })).toBe(copy.live.empty);
    expect(
      buildPortfolioLiveMessage({ ...base, status: 'ready', holdingsCount: 2, hasIncludedRows: true })
    ).toBe(copy.live.summary('USD:0.00', 2));
  });

  it('목표 카드가 값과 함께 떠 있으면 달성률 조각을 요약 문장 뒤에 잇는다 (새 리전을 만들지 않는다)', () => {
    const message = buildPortfolioLiveMessage({
      ...base,
      status: 'ready',
      holdingsCount: 3,
      hasIncludedRows: true,
      goalProgressPercent: 27
    });

    expect(message).toBe(`${copy.live.summary('USD:0.00', 3)} ${copy.goal.live.progress(27)}`);
  });

  it('목표 카드가 없으면(달성률 null) 조각을 붙이지 않는다', () => {
    const message = buildPortfolioLiveMessage({
      ...base,
      status: 'ready',
      holdingsCount: 3,
      hasIncludedRows: true
    });

    expect(message).not.toContain('달성률');
  });

  it('환율 실패 문구는 달성률 조각 **뒤**에 온다 (읽는 순서 = 요약 → 목표 → 문제)', () => {
    const message = buildPortfolioLiveMessage({
      ...base,
      status: 'ready',
      holdingsCount: 1,
      hasIncludedRows: true,
      fxFailed: true,
      goalProgressPercent: 40
    });

    expect(message).toBe(
      `${copy.live.summary('USD:0.00', 1)} ${copy.goal.live.progress(40)} ${copy.live.fxFailed}`
    );
  });
});
