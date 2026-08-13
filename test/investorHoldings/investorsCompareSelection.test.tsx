import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InvestorsView from '@/pages/Investors/InvestorsPage/InvestorsPage.view';
import type { InvestorCardModel } from '@/pages/Investors/utils';

/**
 * 대가들의 포트폴리오 → 종목 비교 연결(기획서 연결①).
 *
 * 🔴 이 화면에는 **두 갈래 진입**이 있다. 둘 다 살아 있어야 한다.
 *   ① 카드의 "상위 종목 비교" — 우리가 골라 준다(빠르지만 사용자의 선택이 아니다)
 *   ② 보유 표(드로어)의 담기 — 사용자가 고른다(2026-08-13 신설)
 *
 * 🔴 그리고 이 화면의 종목은 13F 라 **티커를 모르는 줄이 절반 가까이 된다**(실측 48%가 매핑됨).
 *    그 줄은 체크박스를 두지 않는다 — 바로 왼쪽 칸이 이미 "자료 없음"이라고 같은 말을 하고 있다.
 *
 * ⚠ 선택은 sessionStorage 에 남는다 — 테스트마다 비우지 않으면 앞 테스트의 선택이 샌다.
 */

const holding = (
  overrides: Partial<InvestorCardModel['holdings'][number]> & { cusip: string }
): InvestorCardModel['holdings'][number] => ({
  issuer: `${overrides.cusip} INC`,
  weightPercent: 20,
  ticker: null,
  koreanName: null,
  dividendYieldPercent: null,
  kind: 'share',
  valueUsd: 1_000_000_000,
  ...overrides
});

const card = (overrides: Partial<InvestorCardModel> = {}): InvestorCardModel => ({
  cik: '0001',
  person: '워런 버핏',
  firm: '버크셔 해서웨이',
  note: '장기 보유를 원칙으로 삼는 투자자입니다.',
  reportDate: '2026-03-31',
  isStale: false,
  totalValueUsd: 263_095_703_570,
  totalHoldingCount: 40,
  holdings: [
    holding({ cusip: 'A', ticker: 'AAPL', koreanName: '애플', weightPercent: 30, dividendYieldPercent: 0.5 }),
    holding({ cusip: 'B', ticker: 'KO', koreanName: '코카콜라', weightPercent: 12, dividendYieldPercent: 3.1 }),
    /* 🔴 티커를 모르는 줄. 13F 는 CUSIP 만 주므로 이런 줄이 실제로 흔하다. */
    holding({ cusip: 'C', issuer: 'SOME PRIVATE CO', weightPercent: 5 })
  ],
  mappedCount: 2,
  ...overrides
});

const renderView = (cards: readonly InvestorCardModel[] = [card()]) =>
  render(
    <MemoryRouter>
      <InvestorsView viewModel={{ cards, generatedAt: '2026-08-01' }} />
    </MemoryRouter>
  );

/**
 * 보유 표는 **드로어 안**이라 열어야 읽힌다(닫혀 있어도 마운트되지만 접근성 트리에서는 빠진다).
 * 담기는 표에 있으므로 이 테스트들은 전부 여기서 시작한다.
 */
const openFirstCard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getAllByRole('button', { name: '보유 종목 전체 보기' })[0]);
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('대가 포트폴리오 → 종목 비교 담기', () => {
  it('티커를 아는 보유 종목에는 담기 체크박스가 있다', async () => {
    const user = userEvent.setup();
    renderView();
    await openFirstCard(user);

    expect(screen.getByRole('checkbox', { name: 'AAPL 비교에 담기' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'KO 비교에 담기' })).toBeEnabled();
  });

  it('티커를 모르는 줄에는 체크박스를 두지 않는다', async () => {
    const user = userEvent.setup();
    renderView();
    await openFirstCard(user);

    /* 그 줄에서 담기를 표현할 방법이 없다 — 무엇을 담을지 우리가 모르기 때문이다. */
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('두 종목을 고르면 그 조합을 실은 비교 링크가 나온다', async () => {
    const user = userEvent.setup();
    renderView();
    await openFirstCard(user);

    await user.click(screen.getByRole('checkbox', { name: 'AAPL 비교에 담기' }));
    await user.click(screen.getByRole('checkbox', { name: 'KO 비교에 담기' }));

    const href = screen.getByRole('link', { name: '비교하기 →' }).getAttribute('href') ?? '';
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('t')).toBe('AAPL,KO');
    expect(params.get('from')).toBe('investors');
  });

  it('하단 바는 인물이 여럿이어도 한 장만 뜬다', async () => {
    const user = userEvent.setup();
    renderView([card(), card({ cik: '0002', person: '켄 피셔', firm: '피셔 인베스트먼츠' })]);
    await openFirstCard(user);

    /*
     * 🔴 카드마다 바를 그리면 `position: fixed` 라 같은 자리에 겹쳐 마지막 것만 보인다 — 화면으로는
     *    티가 안 나고, 전체 해제 같은 동작만 조용히 어긋난다. 그래서 개수를 직접 잠근다.
     */
    await user.click(screen.getAllByRole('checkbox', { name: 'AAPL 비교에 담기' })[0]);

    expect(screen.getAllByRole('region', { name: '비교할 종목 선택' })).toHaveLength(1);
  });
});
