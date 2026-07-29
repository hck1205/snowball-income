import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import { FinancialIncomeNotice } from '@/pages/Main/components/MainRightPanel/components';
import HelpModal from '@/pages/Main/components/HelpModal';
import {
  includedTickerIdsAtom,
  isResultCompactAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import type { TickerProfile } from '@/shared/types';

/**
 * 금융소득종합과세 안내.
 *
 * 구 결과 카드 **안**에 있던 배너를 결과 그리드의 자기 칸으로 승격했다 — "입력한 세율이 실제와
 * 달라질 수 있다"는 경고는 요약 숫자의 부속이 아니라 **전체 결과에 걸리는 사실**이기 때문이다.
 * 그래서 여기서 지키는 것은 둘이다: ①문구가 사실을 다 말하는가 ②간략히 모드에서도 남는가.
 */

const renderNotice = (thresholdYear = 25) => {
  render(
    <Provider store={createStore()}>
      <FinancialIncomeNotice thresholdYear={thresholdYear} />
      <HelpModal onBackdropClick={() => undefined} onClose={() => undefined} />
    </Provider>
  );

  return userEvent.setup();
};

const notice = () => screen.getByRole('note', { name: '금융소득종합과세 안내' });

describe('FinancialIncomeNotice — 문구', () => {
  it('연차·기준 금액·세율이 높아질 수 있다는 결론을 한 문단으로 말한다', () => {
    renderNotice(25);

    // 풀 문장 정확일치 — 부분일치로 두면 "높아질 수 있습니다"가 통째로 빠져도 초록이다.
    expect(notice()).toHaveTextContent(
      '이 시나리오는 25년차에 세전 연 배당이 2,000만원을 넘습니다. 금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다.'
    );
  });

  it('연차는 넘겨받은 값을 그대로 쓴다', () => {
    renderNotice(7);

    expect(notice()).toHaveTextContent('7년차');
  });

  it('경고 배너지만 알림(alert)이 아니라 주석(note)이다 — 낭독을 가로채지 않는다', () => {
    renderNotice();

    expect(notice()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('도움말은 "앱이 세율을 자동으로 바꾸지 않는다"를 분명히 밝힌다', async () => {
    const user = renderNotice();

    await user.click(screen.getByRole('button', { name: '금융소득종합과세 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/세율을 자동으로 바꾸지 않습니다/)).toBeInTheDocument();
  });
});

/*
 * ── 노출 조건은 배너가 아니라 **호출부(결과 패널)** 의 결정이다 ───────────────────────────────
 *
 * 배너를 그릴지 말지는 `summary.financialIncomeThresholdYear` 유무 하나로 갈리고, `isResultCompact`
 * 는 그 판단에 끼어들지 않는다(임계 돌파는 화면 밀도가 아니라 시나리오의 성질이다).
 * 그래서 실제 패널을 엔진과 함께 돌려 확인한다.
 */

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

/**
 * 초기 투자금만으로 세전 연 배당이 2,000만원을 넘는지/못 넘는지를 가른다.
 *
 * 결과 패널의 차트는 `React.lazy` 라 렌더 직후 서스펜스가 풀린다 — 로드를 기다리지 않으면
 * "not wrapped in act(...)" 경고가 새어 나온다(테스트는 통과하지만 노이즈).
 */
const renderPanel = async ({
  initialInvestment,
  isCompact = false
}: {
  initialInvestment: number;
  isCompact?: boolean;
}) => {
  const store = createStore();
  store.set(tickerProfilesAtom, [PROFILE]);
  store.set(includedTickerIdsAtom, [PROFILE.id]);
  store.set(weightByTickerIdAtom, { [PROFILE.id]: 1 });
  store.set(yieldFormAtom, (prev) => ({
    ...prev,
    initialInvestment,
    monthlyContribution: 0,
    durationYears: 3,
    reinvestDividends: false
  }));
  store.set(isResultCompactAtom, isCompact);

  render(
    <Provider store={store}>
      <MainRightPanel configDrawerId="config-drawer" />
    </Provider>
  );

  await screen.findAllByTestId('echart');
};

describe('결과 패널 — 종합과세 배너 노출 조건', () => {
  it('세전 연 배당이 임계를 넘는 시나리오에서 배너가 뜬다', async () => {
    // 3.5% × 20억 = 연 7,000만원 → 1년차부터 임계(2,000만원) 초과.
    await renderPanel({ initialInvestment: 2_000_000_000 });

    expect(screen.getByRole('note', { name: '금융소득종합과세 안내' })).toBeInTheDocument();
  });

  it('임계를 넘지 않는 시나리오에서는 배너 자체가 없다', async () => {
    // 3.5% × 1,000만원 = 연 35만원.
    await renderPanel({ initialInvestment: 10_000_000 });

    expect(screen.queryByRole('note', { name: '금융소득종합과세 안내' })).not.toBeInTheDocument();
  });

  it('간략히 모드에서도 남는다 — 임계 돌파는 화면 밀도가 아니라 시나리오의 성질이다', async () => {
    await renderPanel({ initialInvestment: 2_000_000_000, isCompact: true });

    expect(screen.getByRole('note', { name: '금융소득종합과세 안내' })).toBeInTheDocument();
    // 같은 모드에서 "전량 매도한다면" 부속 카드는 반대로 사라진다(대조군).
    expect(screen.queryByRole('heading', { name: '전량 매도한다면' })).not.toBeInTheDocument();
  });
});
