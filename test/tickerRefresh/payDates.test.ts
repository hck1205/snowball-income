import { describe, expect, it, vi } from 'vitest';
import {
  buildPayDatePatch,
  createAlphaVantageProvider,
  deriveExToPayLagDays,
  ProviderError,
  redactKeys,
  toPaymentDatePayments
} from '@/scripts/tickerRefresh';
import type { DividendScheduleRecord } from '@/scripts/tickerRefresh';

/** SCHD-like: quarterly, ex→pay is a steady 5 days, pay lands in the same month. */
const SCHD_SCHEDULE: DividendScheduleRecord[] = [
  { exDate: '2026-06-24', payDate: '2026-06-29', amount: 0.2525 },
  { exDate: '2026-03-25', payDate: '2026-03-30', amount: 0.2569 },
  { exDate: '2025-12-10', payDate: '2025-12-15', amount: 0.2782 },
  { exDate: '2025-09-24', payDate: '2025-09-29', amount: 0.2604 },
  { exDate: '2025-06-25', payDate: '2025-06-30', amount: 0.2602 },
  { exDate: '2025-03-26', payDate: '2025-03-31', amount: 0.2488 },
  { exDate: '2024-12-11', payDate: '2024-12-16', amount: 0.2645 },
  { exDate: '2024-09-25', payDate: '2024-09-30', amount: 0.2545 }
];

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('deriveExToPayLagDays', () => {
  it('실측 간격의 중앙값을 낸다', () => {
    expect(deriveExToPayLagDays(SCHD_SCHEDULE)).toBe(5);
  });

  it('한 건이 크게 틀어져도 중앙값이 흔들리지 않는다 (평균이면 끌려간다)', () => {
    const withOutlier = [{ exDate: '2026-07-01', payDate: '2026-09-30', amount: 0.25 }, ...SCHD_SCHEDULE];
    expect(deriveExToPayLagDays(withOutlier)).toBe(5);
  });

  it('지급일이 배당락일보다 앞서면 버린다 (0으로 뭉개지 않는다)', () => {
    const backwards = [{ exDate: '2026-06-24', payDate: '2026-06-01', amount: 0.25 }];
    expect(deriveExToPayLagDays(backwards)).toBeNull();
  });

  it('빈 이력은 null', () => {
    expect(deriveExToPayLagDays([])).toBeNull();
  });
});

describe('buildPayDatePatch', () => {
  it('지급일 기준 월을 세우고 출처를 pay 로 표시한다', () => {
    const outcome = buildPayDatePatch('SCHD', SCHD_SCHEDULE, {
      payoutMonths: [3, 6, 9, 12],
      payoutMonthsSource: 'ex'
    });

    expect(outcome.status).toBe('updated');
    if (outcome.status !== 'updated') return;
    expect(outcome.patch.payoutMonths).toEqual([3, 6, 9, 12]);
    expect(outcome.patch.payoutMonthsSource).toBe('pay');
    expect(outcome.patch.exToPayLagDays).toBe(5);
  });

  it('ex 기준 추정이 틀렸던 달을 실제 지급월로 바로잡는다', () => {
    // 배당락일이 월말이라 ex 기준으로는 5월로 보이지만, 실제 입금은 그 다음 달이다.
    const shifted: DividendScheduleRecord[] = [
      { exDate: '2026-01-31', payDate: '2026-02-05', amount: 1 },
      { exDate: '2026-04-30', payDate: '2026-05-05', amount: 1 },
      { exDate: '2026-07-31', payDate: '2026-08-05', amount: 1 },
      { exDate: '2026-10-30', payDate: '2026-11-05', amount: 1 }
    ];
    const outcome = buildPayDatePatch('TXN', shifted, { payoutMonths: [1, 5, 7, 10], payoutMonthsSource: 'ex' });

    expect(outcome.status).toBe('updated');
    if (outcome.status !== 'updated') return;
    expect(outcome.patch.payoutMonths).toEqual([2, 5, 8, 11]);
  });

  it('이력이 없으면 건너뛴다 — 빈 값으로 기존 데이터를 덮지 않는다', () => {
    const outcome = buildPayDatePatch('SCHD', [], { payoutMonths: [3, 6, 9, 12], payoutMonthsSource: 'pay' });
    expect(outcome.status).toBe('skipped');
  });

  it('이미 같은 pay 기준 값이면 unchanged (쓸데없는 쓰기를 만들지 않는다)', () => {
    const outcome = buildPayDatePatch('SCHD', SCHD_SCHEDULE, {
      payoutMonths: [3, 6, 9, 12],
      payoutMonthsSource: 'pay',
      exToPayLagDays: 5
    });
    expect(outcome.status).toBe('unchanged');
  });
});

describe('toPaymentDatePayments', () => {
  it('지급일을 날짜로 삼아 기존 월 추론에 그대로 먹인다', () => {
    expect(toPaymentDatePayments(SCHD_SCHEDULE)[0]).toEqual({ date: '2026-06-29', amount: 0.2525 });
  });
});

describe('createAlphaVantageProvider', () => {
  const body = {
    symbol: 'SCHD',
    data: [{ ex_dividend_date: '2026-06-24', payment_date: '2026-06-29', amount: '0.2525' }]
  };

  it('응답을 스케줄 레코드로 정규화한다', async () => {
    const provider = createAlphaVantageProvider({ apiKeys: ['k1'], fetchImpl: async () => okResponse(body) });
    await expect(provider.fetchDividendSchedule('SCHD')).resolves.toEqual([
      { exDate: '2026-06-24', payDate: '2026-06-29', amount: 0.2525 }
    ]);
  });

  it('키를 번갈아 쓴다 (한 키만 소진되지 않게)', async () => {
    const urls: string[] = [];
    const provider = createAlphaVantageProvider({
      apiKeys: ['k1', 'k2'],
      fetchImpl: async (url) => {
        urls.push(url);
        return okResponse(body);
      }
    });

    await provider.fetchDividendSchedule('A');
    await provider.fetchDividendSchedule('B');
    await provider.fetchDividendSchedule('C');

    expect(urls[0]).toContain('apikey=k1');
    expect(urls[1]).toContain('apikey=k2');
    expect(urls[2]).toContain('apikey=k1');
  });

  /**
   * 이 provider 의 존재 이유에 가까운 테스트다. Alpha Vantage 는 한도 초과를 **HTTP 200 + 안내문**
   * 으로 알린다. 이걸 데이터로 오해하면 "배당 없음"으로 읽혀 멀쩡한 지급일을 지워버린다.
   */
  it('한도 초과 안내(200 응답)를 rate_limit 오류로 올린다', async () => {
    const limitBody = {
      Information: 'We have detected your API key ... 25 requests per day. Please subscribe to a premium plan.'
    };
    const provider = createAlphaVantageProvider({ apiKeys: ['k1'], fetchImpl: async () => okResponse(limitBody) });

    await expect(provider.fetchDividendSchedule('SCHD')).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'rate_limit'
    });
  });

  it('잘못된 키 안내는 auth 오류로 구분한다', async () => {
    const provider = createAlphaVantageProvider({
      apiKeys: ['bad'],
      fetchImpl: async () => okResponse({ 'Error Message': 'Invalid API KEY.' })
    });

    await expect(provider.fetchDividendSchedule('SCHD')).rejects.toMatchObject({ code: 'auth' });
  });

  it('지급일이 아직 없는 행("None")은 버리고 나머지는 살린다', async () => {
    const mixed = {
      data: [
        { ex_dividend_date: '2026-09-24', payment_date: 'None', amount: '0.26' },
        { ex_dividend_date: '2026-06-24', payment_date: '2026-06-29', amount: '0.2525' }
      ]
    };
    const provider = createAlphaVantageProvider({ apiKeys: ['k1'], fetchImpl: async () => okResponse(mixed) });

    await expect(provider.fetchDividendSchedule('SCHD')).resolves.toHaveLength(1);
  });

  it('HTTP 실패는 ProviderError 로 정규화한다', async () => {
    const provider = createAlphaVantageProvider({
      apiKeys: ['k1'],
      fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) })
    });

    await expect(provider.fetchDividendSchedule('SCHD')).rejects.toBeInstanceOf(ProviderError);
  });

  it('키가 하나도 없으면 만들 때 바로 실패한다', () => {
    expect(() => createAlphaVantageProvider({ apiKeys: ['  '], fetchImpl: vi.fn() })).toThrow();
  });
});

/**
 * 벤더 안내문에 키가 실려 온다 — 실제 응답: "We have detected your API key as XXXX and our
 * standard API rate limit is 25 requests per day". 그대로 로그에 찍으면 터미널·CI에 키가 남는다.
 */
describe('redactKeys — 벤더 메시지의 키 마스킹', () => {
  it('메시지에 박힌 키를 지운다', () => {
    const message = 'We have detected your API key as EGWACOUKU10F20YX and our standard API rate limit is 25/day';
    expect(redactKeys(message, ['EGWACOUKU10F20YX'])).not.toContain('EGWACOUKU10F20YX');
    expect(redactKeys(message, ['EGWACOUKU10F20YX'])).toContain('***');
  });

  it('여러 키를 모두 지운다', () => {
    expect(redactKeys('a=KEYAAAAAAAA b=KEYBBBBBBBB', ['KEYAAAAAAAA', 'KEYBBBBBBBB'])).toBe('a=*** b=***');
  });

  it('짧은 문자열은 건드리지 않는다 (평문을 우연히 지우지 않게)', () => {
    expect(redactKeys('rate limit of 25 per day', ['25'])).toBe('rate limit of 25 per day');
  });

  it('provider 가 던지는 한도 오류에 키가 남지 않는다', async () => {
    const provider = createAlphaVantageProvider({
      apiKeys: ['SECRETKEY123456'],
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ Information: 'your API key as SECRETKEY123456 exceeded the rate limit' })
      })
    });

    await expect(provider.fetchDividendSchedule('SCHD')).rejects.toMatchObject({
      message: expect.not.stringContaining('SECRETKEY123456')
    });
  });
});
