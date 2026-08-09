import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_INVESTMENT_SETTINGS, tickerProfilesAtom, yieldFormAtom, type PersistedScenarioState } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * **이미 나간 `?s=` 공유 링크가 계속 열리는지**를 동작으로 증명한다.
 *
 * ## 왜 이 파일이 생겼나 (2026-08-09)
 *
 * 공유 링크의 DB **쓰기** 경로를 닫았다 — 로그인 없이 누구나 부를 수 있는데 횟수 제한도 만료도
 * 없어서, 반복 호출만으로 무료 용량을 채울 수 있었기 때문이다. 대신 URL 에 다 담는 lz-string
 * `?share=` 한 길만 남겼다(실측상 73종목까지 담긴다 — `test/share/shareLengthCensus.test.ts`).
 *
 * 🔴 그런데 **읽기는 닫으면 안 된다.** 이미 카톡·메모·블로그에 나가 있는 `?s=` 링크는 사용자
 *    자산이고, 그게 안 열리면 **링크를 받은 사람에게만** 고장이 보인다. 우리 화면에서는 영원히
 *    안 보이고, 오류 로그도 안 남는다(코드가 그냥 그 분기를 안 타게 될 뿐이다).
 *
 * ⚠ 소스에 `?s=` 를 읽는 코드가 남아 있는지는 `test/share/sharedSnapshotWriteClosed.test.ts` 가
 *   본다. 여기서는 **실제로 시나리오가 복원되는지**를 본다 — 코드가 남아 있는 것과 동작하는 것은
 *   다르다. 쓰기를 들어내면서 읽기 쪽 배선을 같이 끊어도 문자열 검사는 통과할 수 있다.
 */

const SHARED_TAB_NAME = '공유된 탭';
const SHARED_KEY = 'AbCdEfGhIjKlMnOpQrStUv';

const schd: TickerProfile = {
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '슈드',
  initialPrice: 27.5,
  dividendYield: 3.5,
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
};

const sharedScenario: PersistedScenarioState = {
  id: 'someone-elses-tab',
  name: '남이 공유한 탭',
  portfolio: {
    tickerProfiles: [schd],
    includedTickerIds: ['ticker-1'],
    weightByTickerId: { 'ticker-1': 100 },
    fixedByTickerId: {},
    selectedTickerId: 'ticker-1'
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 12_340_000,
    durationYears: 15,
    visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
  }
};

/*
 * ⚠ `{}` 만으로는 부족하다. 같은 client 를 커뮤니티 로그인 provider 도 받아서 `auth.getSession` ·
 *   `auth.onAuthStateChange` 를 부른다 — 빈 객체면 렌더 도중 TypeError 로 죽는다(실측).
 *   공유 복원과 무관한 배선이지만 같은 화면에 함께 살아 있으므로 최소한으로 채워 준다.
 */
const stubClient = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
};

/*
 * 🔴 쓰기 RPC 는 **일부러 목에 넣지 않는다.** 이 시나리오는 읽기만 쓴다 — 목에 넣어 두면 나중에
 * 쓰기 경로가 되살아나도 이 테스트가 조용히 통과해 버린다.
 */
vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => stubClient as unknown),
    fetchSharedSnapshot: vi.fn(async (_client: unknown, key: string) =>
      key === SHARED_KEY ? { v: 1, scenario: sharedScenario } : null
    )
  };
});

const { MainPage } = await import('@/pages');

const renderAt = (search: string) => {
  const store = createStore();
  window.history.replaceState(null, '', search);
  render(
    <Provider store={store}>
      <MainPage />
    </Provider>
  );
  return store;
};

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('🔴 기존 ?s= 공유 링크는 쓰기를 닫은 뒤에도 열린다', () => {
  it('⭐ 링크를 열면 공유된 시나리오가 탭으로 붙는다', async () => {
    renderAt(`?s=${SHARED_KEY}`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: SHARED_TAB_NAME })).toBeInTheDocument();
    });
  });

  it('⭐ 복원된 내용이 공유한 사람의 것이다 — 탭만 생기고 값이 비면 고친 게 아니다', async () => {
    const store = renderAt(`?s=${SHARED_KEY}`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: SHARED_TAB_NAME })).toBeInTheDocument();
    });

    /*
     * 값은 **화면 문구가 아니라 복원된 상태**로 본다(같은 파일 계열의 `?share=` 테스트와 같은 규율).
     * 티커 심볼과 투자 설정 둘 다 봐야 한다 — 포트폴리오만 오고 설정이 기본값으로 덮이는 종류의
     * 회귀가 실제로 있을 수 있는 자리다.
     */
    expect(store.get(tickerProfilesAtom).map((profile) => profile.ticker)).toEqual(['SCHD']);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(12_340_000);
    expect(store.get(yieldFormAtom).durationYears).toBe(15);

    /* 빈 화면(프리셋 고르개)이 아니라 실제 결과가 그려졌다. */
    expect(screen.queryByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).not.toBeInTheDocument();
  });

  it('없는 key 는 조용히 무시되지 않는다 — 빈 화면만 주면 "내 것이 사라졌다"로 읽힌다', async () => {
    renderAt('?s=ZzZzZzZzZzZzZzZzZzZzZz');

    expect(await screen.findByText(/공유된 시나리오를 찾지 못했습니다/)).toBeInTheDocument();
  });
});
