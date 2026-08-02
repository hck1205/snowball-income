import { MARKET_INDICES } from '@/shared/lib/marketIndices';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { MARKET_INDICES_ENDPOINT } from '@/shared/lib/marketIndices';
import { useMarketIndicesSync } from '@/jotai';
import MarketIndexStrip from '@/components/MarketIndexStrip';

/**
 * `/api/market-indices` **조회 드라이버** 통합 — 응답 → atom → 화면까지 한 번에 구동한다.
 *
 * 왜 따로 필요한가: `MarketIndexStrip.test.tsx` 는 atom 을 직접 심어 표시만 보고,
 * `test/shared/marketIndices.test.ts` 는 파서만 본다. 그 사이의 `useMarketIndicesSync`
 * (엔드포인트·비200 처리·stale 승격·throttle·무음 실패 금지)는 어느 쪽도 실행하지 않아
 * 배선이 끊겨도 두 스위트가 초록이었다. 환율은 `ExchangeRateWidget.test.tsx` 가 같은 배선을
 * 실제로 구동하므로, 지수도 같은 수준으로 맞춘다.
 *
 * ⚠ 드라이버는 실패 계측을 **동적 import** (`await import('@/shared/lib/analytics')`)로 한다 —
 *   그 경로가 실제로 실행되는지 여기서만 확인된다(정적 import 로 되돌리면 og 번들이 죽는다).
 */

// 무음 실패 금지 검증용. ANALYTICS_EVENT 는 실물 유지(상수 표류를 이 목이 가려서는 안 된다).
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

const TITLE = '주요 지수';

/** 서버(`server/handlers/MarketIndices`)가 실제로 만드는 형태 그대로. */
const FULL_BODY = {
  asOf: '2026-07-27T21:05:00.000Z',
  requested: ['^GSPC', '^IXIC', '^KS11', '^KQ11', '^N225'],
  indices: [
    { symbol: '^GSPC', price: 7419.65, previousClose: 7408.54, currency: 'USD', asOf: '2026-07-27T20:00:00.000Z' },
    { symbol: '^IXIC', price: 24953.08, previousClose: 25136.58, currency: 'USD' },
    { symbol: '^KS11', price: 6755.75, previousClose: 7097.12, currency: 'KRW' },
    { symbol: '^KQ11', price: 764.86, previousClose: 790.31, currency: 'KRW' },
    { symbol: '^N225', price: 64931.19, previousClose: 64608.15, currency: 'JPY' }
  ]
};

/** 5심볼 중 3개만 성공한 부분 실패 응답(서버가 200 으로 준다). */
const PARTIAL_BODY = { ...FULL_BODY, indices: FULL_BODY.indices.slice(0, 3) };

/** 코스피만 전일 종가가 빠진 응답 — 그 지수만 변동률을 생략해야 한다. */
const NO_PREVIOUS_BODY = {
  ...FULL_BODY,
  indices: FULL_BODY.indices.map((quote) =>
    quote.symbol === '^KS11' ? { symbol: quote.symbol, price: quote.price } : quote
  )
};

const okResponse = (body: object = FULL_BODY) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const strip = () => screen.getByRole('region', { name: TITLE });

/** 프로덕션 배선 그대로: 드라이버는 **페이지**가, 표시는 부품이. 매 테스트 새 store 로 격리한다. */
const MarketIndicesDriver = () => {
  useMarketIndicesSync();
  return null;
};

const renderStrip = () =>
  render(
    <Provider store={createStore()}>
      <MarketIndicesDriver />
      <MarketIndexStrip />
    </Provider>
  );

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useMarketIndicesSync — 조회 드라이버 배선', () => {
  it('마운트하면 /api/market-indices 를 한 번 부르고 받은 값을 그대로 그린다', async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal('fetch', fetchMock);

    renderStrip();

    // 첫 페인트는 로딩 — 아직 값이 없으니 숫자를 지어내지 않는다.
    expect(strip()).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => expect(screen.getByText('7,419.65')).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // 엔드포인트 + 취소 신호(언마운트 시 중단). 둘 다 배선이 끊기면 프로덕션에서만 드러난다.
    expect(fetchMock).toHaveBeenCalledWith(
      MARKET_INDICES_ENDPOINT,
      expect.objectContaining({ signal: expect.anything() })
    );
    expect(strip()).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByText('+0.15%')).toBeInTheDocument();
    expect(screen.getByText('-4.81%')).toBeInTheDocument();
    expect(strip()).not.toHaveTextContent('업데이트 실패');
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('서버가 502(market_indices_unavailable)를 주면 가짜 시세 없이 실패로 처리하고 계측한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'market_indices_unavailable' }), { status: 502 }))
    );

    renderStrip();

    expect(await screen.findByText('지수 시세를 불러오지 못했습니다.')).toBeInTheDocument();
    // 값이 없으면 목록 자체를 그리지 않는다(0 이나 대시를 실제 수치처럼 쓰지 않는다).
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(strip()).not.toHaveTextContent('%');
    /*
     * 무음 실패 금지 — 동적 import 로 미룬 계측이 실제로 발화한다.
     * `reason` 까지 단정하는 이유: 비200 가드를 지워도 파서가 뒤에서 null 을 내 **같은 화면**이 되므로
     * operation 만 보면 그 회귀를 못 잡는다(실측: 가드 제거 뮤테이션이 초록이었다). GA 에서
     * "서버가 502" 와 "응답 형태 표류" 를 가르는 것도 이 문자열이다.
     */
    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.OPERATION_ERROR,
      expect.objectContaining({ operation: 'market_indices_fetch', reason: 'market_indices_http_502' })
    );
  });

  it('형태가 어긋난 200 응답도 실패로 처리한다(파서가 null 이면 값을 짓지 않는다)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse({ asOf: '2026-07-27T21:05:00.000Z', indices: [] })));

    renderStrip();

    expect(await screen.findByText('지수 시세를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.OPERATION_ERROR,
      expect.objectContaining({ operation: 'market_indices_fetch', reason: 'market_indices_bad_payload' })
    );
  });

  it('네트워크가 끊기면 실패로 처리한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('network down'))));

    renderStrip();

    expect(await screen.findByText('지수 시세를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
  });

  it('부분 실패 응답이면 빠진 지수의 자리를 유지하고 결손을 말한다 — 전체 실패로 만들지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(PARTIAL_BODY)));

    renderStrip();

    await waitFor(() => expect(screen.getByText('6,755.75')).toBeInTheDocument());

    expect(screen.getAllByRole('listitem')).toHaveLength(MARKET_INDICES.length);
    // 결손 개수도 파생시킨다 — 응답에 3종만 담겨 있으므로 나머지 전부가 결손이다.
    const missingCount = MARKET_INDICES.length - 3;
    expect(screen.getAllByText('불러오지 못함')).toHaveLength(missingCount);
    expect(screen.getAllByText('시세를 불러오지 못했습니다')).toHaveLength(missingCount);
    // 🔴 날조 금지: 빠진 지수를 0 이나 0.00% 로 채우지 않는다.
    expect(strip()).not.toHaveTextContent('0.00%');
    expect(screen.queryByText('0.00')).not.toBeInTheDocument();
    // 부분 실패는 실패가 아니다 — stale 표식을 붙이지 않는다.
    expect(strip()).not.toHaveTextContent('업데이트 실패');
  });

  it('전일 종가만 빠진 지수는 값은 그대로 두고 변동률만 "정보 없음"으로 비운다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(NO_PREVIOUS_BODY)));

    renderStrip();

    await waitFor(() => expect(screen.getByText('6,755.75')).toBeInTheDocument());

    expect(screen.getByText('전일 대비 정보가 없습니다')).toBeInTheDocument();
    expect(strip()).not.toHaveTextContent('0.00%');
    // 다른 지수의 변동률은 멀쩡하다.
    expect(screen.getByText('+0.15%')).toBeInTheDocument();
  });

  it('표시 정밀도에서 0 인 미세 변동은 부호 없는 "0.00%" 로만 말한다 (-0.00% 거짓말 금지)', async () => {
    /*
     * 🔴 `IndexChange.percent` 는 **반올림되지 않은 원값**이라(`FxChange` 도 같은 규칙), 소비자가 숫자에서
     * 부호를 뽑으면 하락 쪽 미세 변동이 화면에 `-0.00%` 로 찍힌다 — 보합인데 하락이라고 말하는 거짓말이다.
     * 부호를 `direction` 에서만 뽑는 계약(`formatChangePercent`)이 화면 끝까지 지켜지는지 여기서 본다.
     */
    const microBody = {
      ...FULL_BODY,
      indices: [
        { symbol: '^GSPC', price: 7419.65, previousClose: 7419.63 }, // +0.00027% → 보합
        { symbol: '^IXIC', price: 24953.08, previousClose: 24953.12 }, // -0.00016% → 보합
        ...FULL_BODY.indices.slice(2)
      ]
    };
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(microBody)));

    renderStrip();

    await waitFor(() => expect(screen.getByText('7,419.65')).toBeInTheDocument());

    const flatCells = screen.getAllByText('0.00%');
    expect(flatCells).toHaveLength(2);
    for (const cell of flatCells) expect(cell.textContent).toBe('0.00%');
    expect(strip()).not.toHaveTextContent('-0.00%');
    expect(strip()).not.toHaveTextContent('+0.00%');
    // 스크린리더에도 방향을 말하지 않는다.
    expect(screen.getAllByText('전일 대비 변동 없음')).toHaveLength(2);
  });

  it('탭 복귀 갱신이 실패하면 직전 값을 유지하고 "업데이트 실패" 표식만 붙인다 (stale)', async () => {
    const realNow = Date.now.bind(Date);
    let extra = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + extra);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => okResponse())
      .mockImplementationOnce(async () => Promise.reject(new TypeError('down')));
    vi.stubGlobal('fetch', fetchMock);

    renderStrip();
    await waitFor(() => expect(screen.getByText('7,419.65')).toBeInTheDocument());

    // throttle(5분) 창을 넘긴 뒤 탭 복귀 → 조용한 갱신 시도(실패)
    extra = 6 * 60 * 1000;
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(strip()).toHaveTextContent('업데이트 실패'));
    expect(screen.getByText('7,419.65')).toBeInTheDocument(); // 값 유지
    expect(screen.getByText('+0.15%')).toBeInTheDocument(); // 변동률도 유지
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throttle 창(5분) 안의 탭 복귀는 재조회하지 않는다', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal('fetch', fetchMock);

    renderStrip();
    await waitFor(() => expect(screen.getByText('7,419.65')).toBeInTheDocument());

    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
