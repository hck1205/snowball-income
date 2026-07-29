import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { parseFxRate } from '@/shared/lib/fx';
import { useFxRateSync } from '@/jotai';
import ExchangeRateWidget from './ExchangeRateWidget';
import { formatAsOfDate, formatKrwRate } from './ExchangeRateWidget.utils';

// AC10: 실패가 무음이면 안 된다 — trackEvent 발화를 검증하려고 목으로 잡는다(ANALYTICS_EVENT 는 실물 유지).
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

const WIDGET_LABEL = '오늘의 원 달러 환율';
const WIDGET_TITLE = '원↔달러 환율';
const DISCLAIMER = '계산은 원화 기준입니다 · 결과 표시만 달러로 바꿀 수 있습니다';
const FAILURE_MESSAGE = '환율을 불러오지 못했습니다';

/** 전일 종가 1,473.78 → 원값 +0.3196% → 표시 `+0.32%`. */
const SUCCESS_BODY = {
  rate: 1478.49,
  base: 'USD',
  quote: 'KRW',
  asOf: '2026-07-23T00:02:31.000Z',
  previousClose: 1473.78
};

/** 전일 종가를 안 주는 공급자가 이겼을 때(정상 경로) — 환율만 온다. */
const NO_PREVIOUS_BODY = { rate: 1478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' };

/** 전일 종가 == 당일 환율 → 보합. */
const FLAT_BODY = { ...NO_PREVIOUS_BODY, previousClose: 1478.49 };

const okResponse = (body: object = SUCCESS_BODY) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const region = () => screen.getByLabelText(WIDGET_LABEL);

/**
 * 조회는 위젯이 아니라 상태 계층 드라이버(`useFxRateSync`, 프로덕션에선 `pages/Main`에서 1회)가 한다.
 * 테스트는 그 배선을 그대로 재현하고, **매 테스트 새 store**로 atom 값이 파일 내에서 새지 않게 격리한다.
 */
const FxRateDriver = () => {
  useFxRateSync();
  return null;
};

const renderWidget = () =>
  render(
    <Provider store={createStore()}>
      <FxRateDriver />
      <ExchangeRateWidget />
    </Provider>
  );

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ExchangeRateWidget — 표시 전용 환율 (Option A)', () => {
  it('로딩 중엔 aria-busy 로 스켈레톤을 보이고, 성공하면 값·as-of·참고용 안내를 그린다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse()));

    renderWidget();

    // 위젯 정체성: 아이콘 배지 + 타이틀 heading 은 로딩부터 항상 보인다("환율 위젯"임을 한눈에).
    expect(screen.getByRole('heading', { name: WIDGET_TITLE })).toBeInTheDocument();

    // 첫 페인트 = 로딩(스켈레톤). 안내는 로딩 중에도 상시 노출.
    expect(region()).toHaveAttribute('aria-busy', 'true');
    expect(region()).toHaveTextContent(DISCLAIMER);

    await waitFor(() => expect(region()).toHaveTextContent('$1 ≈ 1,478원'));

    expect(region()).toHaveAttribute('aria-busy', 'false');
    expect(region()).toHaveTextContent('2026-07-23 기준'); // API 실값의 달력 날짜(오늘 위장 아님)
    expect(region()).toHaveTextContent(DISCLAIMER); // AC3: 상시 노출
    expect(region()).not.toHaveTextContent('업데이트 실패');
  });

  it('전일 종가가 함께 오면 "전일 대비 +0.32%" 를 값 옆에 그리고 방향을 문장으로도 말한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse()));

    renderWidget();

    await waitFor(() => expect(region()).toHaveTextContent('$1 ≈ 1,478원'));

    // 라벨이 없으면 "무엇 대비"인지 화면만 봐서는 알 수 없다.
    expect(screen.getByText('전일 대비')).toBeInTheDocument();
    // 부호는 색과 무관하게 언제나 남는다(색 단독 채널 금지).
    expect(screen.getByText('+0.32%')).toBeInTheDocument();
    // 색·부호를 못 읽는 사용자를 위한 문장.
    expect(screen.getByText('전일 대비 0.32% 상승')).toBeInTheDocument();
  });

  it('전일 종가가 없는 응답이면 환율만 그리고 변동률은 흔적 없이 생략한다 (0% 위장 금지)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(NO_PREVIOUS_BODY)));

    renderWidget();

    await waitFor(() => expect(region()).toHaveTextContent('$1 ≈ 1,478원'));

    expect(region()).not.toHaveTextContent('전일 대비');
    expect(region()).not.toHaveTextContent('%');
    // 전일값 부재는 정상 경로라 실패 표식을 붙이지 않는다.
    expect(region()).not.toHaveTextContent('업데이트 실패');
  });

  it('전일 종가와 같으면 보합(0.00%)이라 부호를 붙이지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(FLAT_BODY)));

    renderWidget();

    await waitFor(() => expect(region()).toHaveTextContent('$1 ≈ 1,478원'));

    // 부호 유무는 접근명이 아니라 실제 문자열로 단정한다(jsdom 접근명은 조각 사이 공백에 관대하다).
    expect(screen.getByText('0.00%').textContent).toBe('0.00%');
    expect(screen.getByText('전일 대비 변동 없음')).toBeInTheDocument();
  });

  it('네트워크 실패면 중립 안내를 보이고 OPERATION_ERROR 를 계측한다 (무음 실패 금지, AC10)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('network down'))));

    renderWidget();

    expect(await screen.findByText(FAILURE_MESSAGE)).toBeInTheDocument();
    // 값이 없어도 위젯 정체성(타이틀)은 유지된다.
    expect(screen.getByRole('heading', { name: WIDGET_TITLE })).toBeInTheDocument();
    // 값이 없으니 가짜 환율·참고용 문구를 그리지 않는다.
    expect(region()).not.toHaveTextContent('≈');
    expect(region()).not.toHaveTextContent(DISCLAIMER);
    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.OPERATION_ERROR,
      expect.objectContaining({ operation: 'fx_fetch' })
    );
  });

  it('서버가 502(fx_unavailable)를 주면 실패로 처리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'fx_unavailable' }), { status: 502 }))
    );

    renderWidget();

    expect(await screen.findByText(FAILURE_MESSAGE)).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.OPERATION_ERROR,
      expect.objectContaining({ operation: 'fx_fetch' })
    );
  });

  it('형식이 깨진 200 응답(환율 없음)도 가짜 값 없이 실패로 처리한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ base: 'USD' }), { status: 200 })));

    renderWidget();

    expect(await screen.findByText(FAILURE_MESSAGE)).toBeInTheDocument();
    expect(region()).not.toHaveTextContent('≈');
  });

  it('갱신 실패 시 직전 성공값을 실제 as-of 와 함께 유지하고 옅은 "업데이트 실패" 표식을 붙인다 (stale, AC5)', async () => {
    // 실시간을 유지하되(RTL waitFor 가 Date.now 를 씀) throttle 창을 넘기려고 오프셋만 제어한다.
    const realNow = Date.now.bind(Date);
    let extra = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + extra);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => okResponse()) // 마운트 조회 성공
      .mockImplementationOnce(async () => Promise.reject(new TypeError('down'))); // 탭 복귀 갱신 실패
    vi.stubGlobal('fetch', fetchMock);

    renderWidget();
    await waitFor(() => expect(region()).toHaveTextContent('$1 ≈ 1,478원'));

    // throttle(10분) 창을 넘긴 뒤 탭 복귀 → 조용한 갱신 시도(실패)
    extra = 11 * 60 * 1000;
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(region()).toHaveTextContent('업데이트 실패'));
    expect(region()).toHaveTextContent('$1 ≈ 1,478원'); // 값 유지
    expect(region()).toHaveTextContent('2026-07-23 기준'); // 실제 as-of 유지(오늘 위장 아님)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('ExchangeRateWidget.utils — 순수 포매팅/파싱', () => {
  it('formatKrwRate: 원 단위 반올림 + ko-KR 콤마', () => {
    expect(formatKrwRate(1478.49)).toBe('1,478');
    expect(formatKrwRate(1478.5)).toBe('1,479');
    expect(formatKrwRate(1300000)).toBe('1,300,000');
  });

  it('formatAsOfDate: ISO 의 달력 날짜만 잘라 타임존 드리프트를 피한다', () => {
    expect(formatAsOfDate('2026-07-23T00:02:31.000Z')).toBe('2026-07-23');
    expect(formatAsOfDate('2026-07-23')).toBe('2026-07-23');
    expect(formatAsOfDate('not-a-date')).toBe('');
  });

  it('parseFxRate: 형태가 어긋난 응답은 null (가짜 값 금지)', () => {
    expect(parseFxRate(SUCCESS_BODY)).toEqual({
      rate: 1478.49,
      base: 'USD',
      quote: 'KRW',
      asOf: '2026-07-23T00:02:31.000Z',
      previousClose: 1473.78
    });
    // 전일 종가가 없어도 환율 자체는 멀쩡하므로 버리지 않는다.
    expect(parseFxRate(NO_PREVIOUS_BODY)).toEqual({
      rate: 1478.49,
      base: 'USD',
      quote: 'KRW',
      asOf: '2026-07-23T00:02:31.000Z'
    });
    expect(parseFxRate({ rate: 0, asOf: 'x' })).toBeNull();
    expect(parseFxRate({ rate: -5, asOf: 'x' })).toBeNull();
    expect(parseFxRate({ rate: Number.NaN, asOf: 'x' })).toBeNull();
    expect(parseFxRate({ asOf: 'x' })).toBeNull();
    expect(parseFxRate({ rate: 1478 })).toBeNull();
    expect(parseFxRate(null)).toBeNull();
    expect(parseFxRate('nope')).toBeNull();
  });
});
