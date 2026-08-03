import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvestorsView from '@/pages/Investors/InvestorsPage/InvestorsPage.view';
import type { InvestorCardModel } from '@/pages/Investors/utils';

/**
 * `/portfolio/investors` 의 **기능 보존 가드**.
 *
 * 2026-08-03 개편에서 인물 카드가 공용 `PickCard`(고르는 면)로 바뀌면서 카드의 DOM 구조가 통째로
 * 달라졌다. 그때 잃기 가장 쉬운 것들을 여기서 잠근다 — 사용자가 보는 것과 누를 수 있는 것 기준이고,
 * className·Emotion 내부 구현은 보지 않는다.
 *
 * 🔴 특히 두 가지는 이 화면의 **정정 장치**라 사라지면 화면이 거짓말을 한다:
 *   ① 지연 경고("지금 보유가 아닙니다") — 없으면 이 화면이 "현재 보유"로 읽힌다.
 *   ② 풋·콜 배지 — 없으면 하락 베팅이 "최대 보유 종목"으로 읽힌다.
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
    holding({ cusip: 'B', ticker: 'KO', koreanName: '코카콜라', weightPercent: 12, dividendYieldPercent: 3.1 })
  ],
  mappedCount: 2,
  ...overrides
});

const renderView = (cards: readonly InvestorCardModel[]) =>
  render(
    <MemoryRouter>
      <InvestorsView viewModel={{ cards, generatedAt: '2026-08-01' }} />
    </MemoryRouter>
  );

describe('대가들의 포트폴리오 화면', () => {
  it('지연 경고를 접지 않고 상시로 보여준다', () => {
    renderView([card()]);
    expect(screen.getByText('지금 보유가 아닙니다')).toBeInTheDocument();
    expect(screen.getByText(/45일/)).toBeInTheDocument();
  });

  it('한계 고지 세 항목을 전부 보여준다', () => {
    renderView([card()]);
    expect(screen.getByRole('heading', { name: '이 자료를 읽기 전에' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').some((item) => item.textContent?.includes('공매도'))).toBe(true);
  });

  it('인물 카드가 이름·운용사·기준일·신고 금액을 말한다', () => {
    renderView([card()]);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('워런 버핏');
    expect(screen.getByText('버크셔 해서웨이')).toBeInTheDocument();
    expect(screen.getByText('2026-03-31 기준')).toBeInTheDocument();
    expect(screen.getByText('$263.1B')).toBeInTheDocument();
  });

  it('보유 표 드로어를 버튼으로 연다', () => {
    renderView([card()]);
    const open = screen.getByRole('button', { name: '보유 종목 전체 보기' });
    expect(open).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('카드 전체를 눌러도 같은 드로어가 열린다 — 스트레치 컨트롤이 인물 이름을 이름으로 갖는다', () => {
    renderView([card()]);
    const stretch = screen.getByRole('button', { name: '워런 버핏의 보유 종목 전체 보기' });

    fireEvent.click(stretch);
    expect(screen.getByRole('button', { name: '보유 종목 전체 보기' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('매핑된 종목이 2종 이상이면 비교 링크를 남긴다', () => {
    renderView([card()]);
    expect(screen.getByRole('link', { name: '상위 종목 비교' })).toHaveAttribute(
      'href',
      '/ticker/compare?t=AAPL,KO'
    );
  });

  it('매핑된 종목이 1종뿐이면 비교 링크를 걸지 않는다 — 비교는 2종부터 성립한다', () => {
    renderView([card({ holdings: [holding({ cusip: 'A', ticker: 'AAPL', weightPercent: 30 })] })]);
    expect(screen.queryByRole('link', { name: '상위 종목 비교' })).not.toBeInTheDocument();
  });

  it('🔴 풋 포지션은 배지로 종류를 밝힌다 — 없으면 하락 베팅이 최대 보유로 읽힌다', () => {
    renderView([
      card({
        holdings: [holding({ cusip: 'P', ticker: 'PLTR', weightPercent: 66, kind: 'put' })]
      })
    ]);
    expect(screen.getAllByText('풋').length).toBeGreaterThan(0);
  });

  it('옵션이 섞이면 카드에 글자로 표시하고, 드로어에 문장을 남긴다', () => {
    renderView([
      card({
        holdings: [
          holding({ cusip: 'P', ticker: 'PLTR', weightPercent: 66, kind: 'put' }),
          holding({ cusip: 'B', ticker: 'KO', weightPercent: 12 })
        ]
      })
    ]);
    expect(screen.getByText('옵션 포함')).toBeInTheDocument();
    expect(screen.getByText(/기초자산 금액으로 신고됩니다/)).toBeInTheDocument();
  });

  /**
   * 배지(색)와 문장(사실)을 나눠 놓았다 — 색 예산 때문이다. 🔴 둘 중 하나만 남기면 안 된다:
   * 배지만 남으면 "무엇이 오래됐는지"를 색으로만 말하게 되고, 문장만 남으면 눈에 안 걸린다.
   */
  it('오래된 공시는 배지와 문장으로 함께 말한다 — "청산"이 아니라 "확인되지 않는다"까지만', () => {
    renderView([card({ isStale: true })]);
    expect(screen.getByText('공시 오래됨')).toBeInTheDocument();
    expect(screen.getByText(/확인되지 않아 자료가 오래되었습니다/)).toBeInTheDocument();
  });

  it('최근 공시가 있는 인물에게는 오래됨 표시를 붙이지 않는다', () => {
    renderView([card({ isStale: false })]);
    expect(screen.queryByText('공시 오래됨')).not.toBeInTheDocument();
  });

  it('합산 정렬 토글이 두 기준을 오간다 — 기본은 담은 인원이다', () => {
    renderView([card(), card({ cik: '0002', person: '켄 피셔', firm: '피셔 인베스트먼츠' })]);
    const group = screen.getByRole('group', { name: '정렬 기준' });
    const holders = within(group).getByRole('button', { name: '담은 인원' });
    const value = within(group).getByRole('button', { name: '신고 금액' });

    expect(holders).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(value);
    expect(value).toHaveAttribute('aria-pressed', 'true');
    expect(holders).toHaveAttribute('aria-pressed', 'false');
  });

  it('출처·수집일과 면책 문구를 화면에 남긴다', () => {
    renderView([card()]);
    expect(screen.getByText(/수집일 2026-08-01/)).toBeInTheDocument();
    expect(screen.getByText(/투자 자문이 아닙니다/)).toBeInTheDocument();
  });
});
