import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import {
  includedTickerIdsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';
import MainOverflowMenu from '@/pages/Main/components/MainOverflowMenu';

/**
 * 시뮬레이터 "더보기" 메뉴의 **PDF 리포트 게이트** — 실제 atom 상태에서 사유가 갈리는지 본다.
 *
 * `pdfReportMenu.test.tsx`가 프레젠테이션(사유 문자열을 받으면 어떻게 보이나)을 고정한다면,
 * 여기서는 그 사유를 **누가 정하는가**(usePdfReport)를 고정한다. 두 사유는 사용자가 취해야 할
 * 행동이 다르므로(종목을 담아라 vs 입력을 고쳐라) 절대 하나로 뭉뚱그려지면 안 된다.
 *
 * 생성 파이프라인은 돌리지 않는다 — jsdom에는 캔버스가 없다.
 */

const profile: TickerProfile = {
  id: 't1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
};

type StoreSeed = {
  hasPortfolio: boolean;
  isFormValid: boolean;
};

const renderMenu = ({ hasPortfolio, isFormValid }: StoreSeed) => {
  const store = createStore();

  if (hasPortfolio) {
    store.set(tickerProfilesAtom, [profile]);
    store.set(includedTickerIdsAtom, ['t1']);
    store.set(weightByTickerIdAtom, { t1: 100 });
  }

  store.set(yieldFormAtom, {
    ...defaultYieldFormValues,
    // 무효 시작일은 폼 검증(validateFormValues)을 확실히 실패시킨다.
    ...(isFormValid ? {} : { investmentStartDate: '2026-02-31' })
  });

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return render(<MainOverflowMenu />, { wrapper });
};

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '더보기' }));
  return user;
};

describe('PDF 리포트 게이트 — 비활성 사유는 뭉뚱그려지지 않는다', () => {
  it('포트폴리오가 비어 있으면 "포트폴리오를 구성하면" 사유로 비활성이다', async () => {
    renderMenu({ hasPortfolio: false, isFormValid: true });
    await openMenu();

    expect(screen.getByRole('menuitem', { name: /PDF 리포트 저장/ })).toBeDisabled();
    expect(screen.getByText('포트폴리오를 구성하면 리포트를 만들 수 있어요')).toBeInTheDocument();
    expect(screen.queryByText('입력값 오류를 수정하면 리포트를 만들 수 있어요')).not.toBeInTheDocument();
  });

  it('종목은 있는데 입력값이 잘못되면 "입력값 오류를 수정하면" 사유로 비활성이다', async () => {
    renderMenu({ hasPortfolio: true, isFormValid: false });
    await openMenu();

    expect(screen.getByRole('menuitem', { name: /PDF 리포트 저장/ })).toBeDisabled();
    expect(screen.getByText('입력값 오류를 수정하면 리포트를 만들 수 있어요')).toBeInTheDocument();
    expect(screen.queryByText('포트폴리오를 구성하면 리포트를 만들 수 있어요')).not.toBeInTheDocument();
  });

  it('둘 다 문제면 먼저 해야 할 일(포트폴리오 구성)을 말한다', async () => {
    renderMenu({ hasPortfolio: false, isFormValid: false });
    await openMenu();

    expect(screen.getByText('포트폴리오를 구성하면 리포트를 만들 수 있어요')).toBeInTheDocument();
    expect(screen.queryByText('입력값 오류를 수정하면 리포트를 만들 수 있어요')).not.toBeInTheDocument();
  });

  it('포트폴리오가 있고 입력이 유효하면 활성이고 사유 문구가 없다', async () => {
    renderMenu({ hasPortfolio: true, isFormValid: true });
    await openMenu();

    expect(screen.getByRole('menuitem', { name: /PDF 리포트 저장/ })).toBeEnabled();
    expect(screen.queryByText(/리포트를 만들 수 있어요/)).not.toBeInTheDocument();
  });
});
