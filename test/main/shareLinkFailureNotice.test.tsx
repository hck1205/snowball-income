import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { encodeSharedScenario } from '@/pages/Main/hooks/persistence';
import { EMPTY_INVESTMENT_SETTINGS, tickerProfilesAtom, yieldFormAtom, type PersistedScenarioState } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 🔴 **잘못된 공유 코드로 앱 전체가 죽던 사고의 방어선**(실측 `/?share=zz`).
 *
 * lz-string 은 사전 밖 문자를 만나면 `charAt` 에서 TypeError 를 던지는데, 그 예외가 복원 effect →
 * 렌더 트리 꼭대기까지 올라가 **라우터 에러 화면이 앱을 통째로 대체**했다. 공유 링크는 메신저가 끝을
 * 자르거나 사용자가 일부만 복사하기 쉬운 값이라, 이 경로는 반드시 살아남아야 한다.
 *
 * 여기서 잠그는 계약은 둘이다.
 *  ① 잘못된 코드로 들어와도 **앱이 계속 그려진다**(빈 시뮬레이터).
 *  ② 그리고 **왜 비었는지 말한다** — 조용히 무시하면 "내 시나리오가 사라졌다"로 읽힌다.
 * 그리고 ③ **정상 링크는 그대로 열린다**(방어를 넣다 공유를 망가뜨리지 않았다는 증거).
 */

const INVALID_NOTICE = '공유 링크가 손상되었거나';
const UNAVAILABLE_NOTICE = '공유된 시나리오를 찾지 못했습니다';
/** 공유 링크로 열린 시나리오가 붙는 탭 이름(usePortfolioPersistence). */
const SHARED_TAB_NAME = '공유된 탭';

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

const validScenario: PersistedScenarioState = {
  id: 'my-tab',
  name: '내 탭',
  portfolio: {
    tickerProfiles: [schd],
    includedTickerIds: ['ticker-1'],
    weightByTickerId: { 'ticker-1': 100 },
    fixedByTickerId: {},
    selectedTickerId: 'ticker-1'
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 10_000_000,
    durationYears: 20,
    visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
  }
};

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

/** 안내가 **라이브 리전(role=status)** 안에 있는지까지 본다 — 화면에 글자만 있으면 보조기기는 모른다. */
const expectLiveNotice = (fragment: string) => {
  const regions = screen.getAllByRole('status');
  expect(regions.some((region) => region.textContent?.includes(fragment))).toBe(true);
};

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('잘못된 공유 링크 — 앱이 죽지 않고 이유를 말한다', () => {
  // lz-string 이 실제로 던지는 값. 방어를 빼면 render 자체가 예외로 실패한다.
  it.each([
    ['사전 밖 문자만 있는 코드', '?share=zz'],
    ['한 글자짜리 코드', '?share=z'],
    ['한글이 섞인 코드', '?share=%EC%95%88%EB%85%95']
  ])('%s 로 들어와도 화면이 그려지고 안내가 뜬다', (_label, search) => {
    expect(() => renderAt(search)).not.toThrow();

    expectLiveNotice(INVALID_NOTICE);
    // 앱이 살아 있다는 증거: 시뮬레이터 본문이 그대로 있다.
    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
  });

  it('메신저가 앞 절반만 보낸 링크도 같은 안내로 떨어진다', () => {
    const valid = encodeSharedScenario(validScenario);
    const truncated = valid.slice(0, Math.floor(valid.length / 2));

    expect(() => renderAt(`?share=${truncated}`)).not.toThrow();
    expectLiveNotice(INVALID_NOTICE);
  });

  /**
   * 뒤에 붙은 쓰레기는 **실패가 아니다** — lz-string 은 EOF 마커에서 멈추므로 꼬리를 무시하고
   * 원래 시나리오를 그대로 돌려준다(실측). 여기서 잠그는 것은 "죽지 않는다 + 헛된 경고를 띄우지 않는다".
   */
  it('뒤에 쓰레기가 붙은 링크는 꼬리를 무시하고 정상 복원된다(헛경고 없음)', async () => {
    const valid = encodeSharedScenario(validScenario);

    expect(() => renderAt(`?share=${valid}zzzz`)).not.toThrow();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: SHARED_TAB_NAME })).toBeInTheDocument();
    });
    expect(screen.queryByText(new RegExp(INVALID_NOTICE))).not.toBeInTheDocument();
  });

  /**
   * 값이 빈 `?share=` 는 **공유 링크가 아니다**(코드가 없다) — 복원 자체를 시도하지 않으므로
   * 안내도 뜨지 않는 것이 맞다. 안내가 뜨면 평범한 방문자에게 없던 사고를 알리는 셈이 된다.
   */
  it('빈 ?share= 는 아무 일도 일어나지 않는다(안내도 없다)', () => {
    expect(() => renderAt('?share=')).not.toThrow();
    expect(screen.queryByText(new RegExp(INVALID_NOTICE))).not.toBeInTheDocument();
  });

  /** `?s=`(DB key) 경로도 조용히 사라지지 않는다 — 스냅샷을 못 가져오면 다른 문장으로 알린다. */
  it('?s= 스냅샷을 가져오지 못하면 별도 안내가 뜬다', async () => {
    expect(() => renderAt('?s=nonexistent-key')).not.toThrow();

    expect(await screen.findByText(new RegExp(UNAVAILABLE_NOTICE))).toBeInTheDocument();
  });
});

describe('정상 공유 링크 왕복 — 방어가 공유를 망가뜨리지 않는다', () => {
  it('유효한 ?share= 코드는 시나리오를 그대로 복원하고 안내를 띄우지 않는다', async () => {
    const store = renderAt(`?share=${encodeSharedScenario(validScenario)}`);

    // 공유 시나리오가 "공유된 탭"으로 붙는다.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: SHARED_TAB_NAME })).toBeInTheDocument();
    });

    // 값 자체가 살아 돌아왔는가 — 화면 문구가 아니라 복원된 상태로 확인한다.
    expect(store.get(tickerProfilesAtom)).toEqual([
      { ...schd, id: 'shared-0' }
    ]);
    expect(store.get(yieldFormAtom).initialInvestment).toBe(10_000_000);
    expect(store.get(yieldFormAtom).durationYears).toBe(20);

    // 빈 화면(프리셋 고르개)이 아니라 실제 결과가 그려졌다.
    expect(screen.queryByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).not.toBeInTheDocument();

    // 실패 안내는 없다.
    expect(screen.queryByText(new RegExp(INVALID_NOTICE))).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(UNAVAILABLE_NOTICE))).not.toBeInTheDocument();
  });
});
