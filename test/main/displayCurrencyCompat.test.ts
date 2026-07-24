import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStore } from 'jotai/vanilla';
import { compressToEncodedURIComponent } from 'lz-string';
import {
  DISPLAY_CURRENCY_STORAGE_KEY,
  displayCurrencyAtom,
  effectiveDisplayCurrencyAtom,
  fxViewAtom,
  EMPTY_INVESTMENT_SETTINGS,
  normalizePersistedAppState,
  parsePersistedAppStateJson,
  type PersistedScenarioState
} from '@/jotai';
import {
  buildDbShareUrl,
  buildShareUrl,
  decodeSharedScenario,
  encodeSharedScenario,
  readDbShareKeyFromHref,
  readShareCodeFromHref,
  S_QUERY_PARAM,
  SHARE_QUERY_PARAM,
  SHARED_SCENARIO_DECODED_NAME,
  SHARED_SCENARIO_ID,
  stripShareParams
} from '@/pages/Main/hooks/persistence';

/**
 * 표시 통화(원↔달러) **하위 호환** 계약.
 *
 * 저장 데이터와 공유 링크는 사용자 자산이다. 표시 통화는 기기별 로컬 취향(팔레트와 같은 성격)이라
 * 공유 페이로드·URL·영속 payload 어디에도 들어가면 안 된다. 여기서는 그것을
 * **"통화를 켠 상태에서 만든 산출물이 원화일 때와 바이트 단위로 같다"** 로 실증한다.
 *
 * displayCurrency.test.tsx 가 덮는 것은 클라우드 base 해시(serializeMeaningfulPayload) 불변이고,
 * 이 파일은 그 옆의 빈틈 — **공유 URL(lz-string `?share=` / DB `?s=`)과 영속 payload 마이그레이션** — 을 맡는다.
 */

const FX_RATE = { rate: 1_478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

/**
 * 스키마 동결 리터럴. 표시 통화 도입 **전** 인코더가 만들던 문자열과 같아야 한다
 * (`encodeSharedScenario` 는 이번 작업에서 한 줄도 바뀌지 않았다).
 * 공유 봉투에 필드가 하나라도 늘면 이 값이 달라져 즉시 빨개진다.
 */
const FROZEN_SHARE_CODE =
  'N4IgbiBcDMA0IAcqgC5QNrpAZQMIAkAREWAJgHYA6AVlmhtloA4GBGeQCKHAdlpAF1f4AdwzoADLFajR-eAGcoogL7wAlshABDKJKm7xIAEba9U+AGMo0E-oAmUEKVGkALAFpRrd6xIgAplEd4ADMFeABzY30AC21qSmdVUJAAKySAaySAGySAWySAO214AHsixEtFRSA';

const buildScenario = (): PersistedScenarioState => ({
  id: 'my-tab',
  name: '내 탭',
  portfolio: {
    tickerProfiles: [
      {
        id: 'ticker-1',
        ticker: 'SCHD',
        name: '슈드',
        initialPrice: 27.5,
        dividendYield: 3.5,
        dividendGrowth: 5,
        expectedTotalReturn: 8.5,
        frequency: 'quarterly'
      }
    ],
    includedTickerIds: ['ticker-1'],
    weightByTickerId: { 'ticker-1': 100 },
    fixedByTickerId: {},
    selectedTickerId: 'ticker-1'
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 10_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 3_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    taxRate: 15.4
  }
});

/** 달러 표시가 **실제로 적용된** 상태를 만든다 (선호만 켜고 환율이 없으면 원화로 떨어진다). */
const turnOnUsd = () => {
  const store = createStore();
  store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
  store.set(displayCurrencyAtom, 'USD');
  expect(store.get(effectiveDisplayCurrencyAtom)).toBe('USD');
  return store;
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('공유 링크(?share=) — 표시 통화는 인코딩에 새지 않는다', () => {
  it('달러 표시를 켠 상태에서 인코딩해도 공유 코드가 원화일 때와 바이트 단위로 같다', () => {
    const scenario = buildScenario();
    const beforeToggle = encodeSharedScenario(scenario);

    turnOnUsd();
    const afterToggle = encodeSharedScenario(scenario);

    expect(afterToggle).toBe(beforeToggle);
    // 스키마 동결 — 봉투에 통화 필드가 끼어들면 여기서 즉시 깨진다.
    expect(afterToggle).toBe(FROZEN_SHARE_CODE);
  });

  it('공유 URL 문자열도 그대로다 — 쿼리 파라미터는 여전히 share 하나뿐이다', () => {
    const code = encodeSharedScenario(buildScenario());
    const before = buildShareUrl('https://snowball.app/', code);

    turnOnUsd();
    const after = buildShareUrl('https://snowball.app/', code);

    expect(after).toBe(before);
    expect([...new URL(after).searchParams.keys()]).toEqual([SHARE_QUERY_PARAM]);
    // 통화 저장키가 URL 로 새지 않는다.
    expect(after).not.toContain(DISPLAY_CURRENCY_STORAGE_KEY);
    expect(after).not.toContain('currency');
  });

  it('달러 모드에서 만든 링크를 원화 사용자가 열어도 같은 시나리오가 복원된다 (양방향)', () => {
    const scenario = buildScenario();

    turnOnUsd();
    const url = buildShareUrl('https://snowball.app/?utm=x', encodeSharedScenario(scenario));

    // 받는 쪽(원화 기본, 저장키 없음)에서 복원.
    window.localStorage.clear();
    const decoded = decodeSharedScenario(readShareCodeFromHref(url) as string);

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(SHARED_SCENARIO_ID);
    expect(decoded?.name).toBe(SHARED_SCENARIO_DECODED_NAME);
    expect(decoded?.investmentSettings).toEqual(scenario.investmentSettings);
    expect(decoded?.portfolio.tickerProfiles).toEqual([{ ...scenario.portfolio.tickerProfiles[0], id: 'shared-0' }]);
    expect(createStore().get(effectiveDisplayCurrencyAtom)).toBe('KRW');
  });
});

describe('구 공유 링크 디코드 — 통화 도입 전과 결과가 완전히 동일하다', () => {
  const legacyV1 = compressToEncodedURIComponent(
    JSON.stringify({
      v: 1,
      scenario: {
        id: 'legacy-tab',
        name: '레거시 탭',
        portfolio: {
          tickerProfiles: [
            {
              id: 'ticker-1',
              ticker: 'SCHD',
              name: '슈드',
              initialPrice: 27.5,
              dividendYield: 3.5,
              dividendGrowth: 5,
              expectedTotalReturn: 8.5,
              frequency: 'quarterly'
            }
          ],
          includedTickerIds: ['ticker-1'],
          weightByTickerId: { 'ticker-1': 100 },
          fixedByTickerId: {},
          selectedTickerId: 'ticker-1'
        },
        investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 25, initialInvestment: 5_000_000 }
      }
    })
  );

  const legacyV2 = compressToEncodedURIComponent(
    JSON.stringify({
      v: 2,
      p: {
        t: [
          ['SCHD', 27.5, 3.5, 6, 8.5, 1, '슈드'],
          ['JEPI', 55, 7.2, 0, 7.2, 0]
        ],
        w: [
          [0, 70],
          [1, 30]
        ],
        f: [1],
        s: 0
      },
      i: { a: 5_000_000, e: 15, f: 1, h: 15.4, n: 0, p: 3 }
    })
  );

  it.each([
    ['v1', legacyV1],
    ['v2', legacyV2]
  ])('%s 봉투: 달러 표시를 켜기 전/후 디코드 결과가 deep-equal 이다', (_label, encoded) => {
    const beforeToggle = decodeSharedScenario(encoded);

    turnOnUsd();
    const afterToggle = decodeSharedScenario(encoded);

    expect(beforeToggle).not.toBeNull();
    expect(afterToggle).toEqual(beforeToggle);
  });

  it('v1 링크의 원래 id/name/티커 id 가 그대로 살아난다 (달러 모드에서)', () => {
    turnOnUsd();
    const decoded = decodeSharedScenario(legacyV1);

    expect(decoded?.id).toBe('legacy-tab');
    expect(decoded?.name).toBe('레거시 탭');
    expect(decoded?.portfolio.tickerProfiles[0].id).toBe('ticker-1');
    expect(decoded?.investmentSettings.durationYears).toBe(25);
    expect(decoded?.investmentSettings.initialInvestment).toBe(5_000_000);
  });
});

describe('DB 스냅샷 공유(?s=) — 경로 무변경', () => {
  it('키 부착·읽기·제거가 통화와 무관하게 동일하다', () => {
    const before = {
      url: buildDbShareUrl('https://snowball.app/?utm=x', 'KEY_22'),
      read: readDbShareKeyFromHref(buildDbShareUrl('https://snowball.app/', 'KEY_22')),
      stripped: stripShareParams(`https://snowball.app/?${S_QUERY_PARAM}=KEY_22&${SHARE_QUERY_PARAM}=lz&utm=x`)
    };

    turnOnUsd();

    expect(buildDbShareUrl('https://snowball.app/?utm=x', 'KEY_22')).toBe(before.url);
    expect(readDbShareKeyFromHref(buildDbShareUrl('https://snowball.app/', 'KEY_22'))).toBe(before.read);
    expect(stripShareParams(`https://snowball.app/?${S_QUERY_PARAM}=KEY_22&${SHARE_QUERY_PARAM}=lz&utm=x`)).toBe(
      before.stripped
    );
    // 공유 파라미터를 걷어낸 URL 에도 통화 흔적이 없다.
    expect(before.stripped).toBe('https://snowball.app/?utm=x');
  });
});

describe('통화 필드가 없는 기존 영속 payload', () => {
  /** 통화 도입 전 사용자의 저장 레코드(=지금 스키마와 동일하다는 것이 요점). */
  const legacyPayloadJson = JSON.stringify({
    portfolio: {
      tickerProfiles: [
        {
          id: 'ticker-1',
          ticker: 'SCHD',
          name: '슈드',
          initialPrice: 27.5,
          dividendYield: 3.5,
          dividendGrowth: 5,
          expectedTotalReturn: 8.5,
          frequency: 'quarterly'
        }
      ],
      includedTickerIds: ['ticker-1'],
      weightByTickerId: { 'ticker-1': 100 },
      fixedByTickerId: {},
      selectedTickerId: 'ticker-1'
    },
    investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 12, initialInvestment: 7_000_000 },
    scenarios: [],
    activeScenarioId: 'scenario-1',
    savedName: '내 저장본'
  });

  it('구 payload 를 그대로 열 수 있고, 정규화 왕복이 통화 여부와 무관하게 같다', () => {
    const beforeToggle = parsePersistedAppStateJson(legacyPayloadJson);

    turnOnUsd();
    const afterToggle = parsePersistedAppStateJson(legacyPayloadJson);

    expect(afterToggle).toEqual(beforeToggle);
    expect(afterToggle.investmentSettings.durationYears).toBe(12);
    expect(afterToggle.investmentSettings.initialInvestment).toBe(7_000_000);
    expect(afterToggle.savedName).toBe('내 저장본');
    // 다시 직렬화해도 통화 키가 생기지 않는다(마이그레이션 왕복).
    expect(JSON.stringify(afterToggle)).not.toContain('displayCurrency');
    expect(JSON.stringify(afterToggle)).not.toContain('USD');
  });

  it('통화 저장키가 없는 사용자는 원화로 시작하고, payload 는 통화를 담지 않는다', () => {
    expect(window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY)).toBeNull();

    const store = createStore();
    store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
    expect(store.get(effectiveDisplayCurrencyAtom)).toBe('KRW');

    const payload = parsePersistedAppStateJson(legacyPayloadJson);
    expect(Object.keys(payload).sort()).toEqual(
      ['activeScenarioId', 'investmentSettings', 'portfolio', 'savedName', 'scenarios'].sort()
    );
  });

  it('낯선 displayCurrency 필드가 섞인 payload 도 정규화가 떨궈낸다 (스키마 오염 방지)', () => {
    const polluted = normalizePersistedAppState({
      ...JSON.parse(legacyPayloadJson),
      displayCurrency: 'USD',
      investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 12, displayCurrency: 'USD' }
    });

    expect(JSON.stringify(polluted)).not.toContain('displayCurrency');
    expect(polluted.investmentSettings.durationYears).toBe(12);
  });
});
