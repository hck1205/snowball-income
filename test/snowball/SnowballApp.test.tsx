import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainPage } from '@/pages';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';

type User = ReturnType<typeof userEvent.setup>;

const renderFeature = (): User => {
  const store = createStore();
  render(
    <Provider store={store}>
      <MainPage />
    </Provider>
  );

  return userEvent.setup();
};

const openTickerModal = async (user: User): Promise<HTMLElement> => {
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  return screen.findByRole('dialog', { name: '티커 생성' });
};

/**
 * 프리셋 탭(모달 기본 탭)에서 티커 칩을 고른다.
 * 검색으로 목록을 좁힌 뒤 칩을 누르는, 실제 사용자와 같은 경로다.
 */
const selectPresetChip = async (user: User, dialog: HTMLElement, ticker: string): Promise<void> => {
  await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), ticker);
  await user.click(within(dialog).getByRole('option', { name: `${ticker} 선택` }));
};

/**
 * 모달의 입력 필드. `getByLabelText` 는 쓰지 않는다 — 도움말 `?` 버튼이 같은 `<label>` 안에 있어
 * 라벨 텍스트로 찾으면 버튼까지 함께 잡힌다. 접근 가능한 이름(role + name)으로 찾는 게 안전하다.
 */
const getModalField = (dialog: HTMLElement, label: string): HTMLElement =>
  within(dialog).getByRole('textbox', { name: label });

const fillField = async (user: User, dialog: HTMLElement, label: string, value: string): Promise<void> => {
  const field = getModalField(dialog, label);
  await user.clear(field);
  await user.type(field, value);
};

/** 프리셋을 골라 티커를 만든다. 프리셋 값이 그대로 들어오므로 결과가 바로 계산된다. */
const createTickerFromPreset = async (user: User, ticker: string): Promise<void> => {
  const dialog = await openTickerModal(user);
  await selectPresetChip(user, dialog, ticker);
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
};

/** 입력 탭에서 직접 값을 타이핑해 티커를 만든다. */
const createCustomTicker = async (
  user: User,
  draft: { ticker: string; initialPrice: string; dividendYield: string; dividendGrowth: string }
): Promise<void> => {
  const dialog = await openTickerModal(user);
  await user.click(within(dialog).getByRole('tab', { name: '입력' }));

  await fillField(user, dialog, '티커', draft.ticker);
  await fillField(user, dialog, '현재 주가', draft.initialPrice);
  await fillField(user, dialog, '배당률', draft.dividendYield);
  await fillField(user, dialog, '배당 성장률', draft.dividendGrowth);

  await user.click(within(dialog).getByRole('button', { name: '생성' }));
};

/** "포트폴리오 구성" 카드. 우측 결과 영역에서 포함된 티커 칩이 보이는 곳이다. */
const getPortfolioSection = (): HTMLElement => {
  const section = screen.getByRole('heading', { name: '포트폴리오 구성' }).closest('section');
  if (!section) throw new Error('포트폴리오 구성 카드를 찾지 못했습니다.');

  return section as HTMLElement;
};

/** 결과 요약 항목의 금액 문자열. 라벨과 값이 한 항목 안에 있으므로 라벨을 걷어내고 읽는다. */
const readSummaryAmount = (label: string): string => {
  const item = screen.getByText(label).closest('div');
  return (item?.textContent ?? '').replace(label, '').trim();
};

describe('SnowballAppFeature', () => {
  it('renders the empty state instead of a simulation result when no ticker is included', () => {
    renderFeature();

    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '시뮬레이션 결과 (간편)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '포트폴리오 구성' })).not.toBeInTheDocument();
  });

  it('applies preset values in ticker modal', async () => {
    const user = renderFeature();
    const preset = DIVIDEND_UNIVERSE.JEPI;

    const dialog = await openTickerModal(user);
    await selectPresetChip(user, dialog, 'JEPI');

    expect(getModalField(dialog, '티커')).toHaveValue('JEPI');
    expect(getModalField(dialog, '배당률')).toHaveValue(String(preset.dividendYield));
    expect(getModalField(dialog, '배당 성장률')).toHaveValue(String(preset.dividendGrowth));
    // 정합 모델: 총수익률(r)은 입력이 아니라 배당률(y) + 배당 성장률(g)의 파생 표시값이다.
    const expectedTotalReturn = Math.round((preset.dividendYield + preset.dividendGrowth) * 100) / 100;
    expect(getModalField(dialog, '기대 총수익율 (CAGR)')).toHaveValue(String(expectedTotalReturn));
    expect(getModalField(dialog, '기대 총수익율 (CAGR)')).toBeDisabled();
  });

  it('changes summary value when reinvest toggle changes', async () => {
    const user = renderFeature();
    await createTickerFromPreset(user, 'SCHD');

    expect(screen.getByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).toBeInTheDocument();
    const baseline = readSummaryAmount('최종 자산 가치');
    expect(baseline).toMatch(/₩/);

    await user.click(screen.getByRole('checkbox', { name: '배당 재투자' }));

    expect(readSummaryAmount('최종 자산 가치')).not.toBe(baseline);
  });

  it('opens and closes help modal when help mark is clicked', async () => {
    const user = renderFeature();

    await user.click(screen.getByRole('button', { name: 'DPS 성장 반영 설명 열기' }));
    expect(screen.getByRole('dialog', { name: 'DPS 성장 반영' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog', { name: 'DPS 성장 반영' })).not.toBeInTheDocument();
  });

  it('opens CAGR help from ticker modal question button', async () => {
    const user = renderFeature();

    const dialog = await openTickerModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'CAGR 설명 열기' }));

    expect(screen.getByRole('dialog', { name: '기대 총수익율 (CAGR)' })).toBeInTheDocument();
  });

  it('creates a ticker from modal and applies it when selected', async () => {
    const user = renderFeature();

    await createCustomTicker(user, { ticker: 'VYM', initialPrice: '100', dividendYield: '4', dividendGrowth: '6' });

    expect(screen.queryByRole('dialog', { name: '티커 생성' })).not.toBeInTheDocument();

    const tickerChip = screen.getByRole('button', { name: '티커 VYM 선택' });
    expect(tickerChip).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).toBeInTheDocument();
    expect(within(getPortfolioSection()).getByRole('button', { name: '티커 VYM 삭제' })).toBeInTheDocument();
  });

  it('combines multiple included tickers into one portfolio label', async () => {
    const user = renderFeature();

    await createTickerFromPreset(user, 'SCHD');
    await createTickerFromPreset(user, 'JEPI');

    const portfolio = within(getPortfolioSection());
    expect(portfolio.getByRole('button', { name: '티커 SCHD 삭제' })).toBeInTheDocument();
    expect(portfolio.getByRole('button', { name: '티커 JEPI 삭제' })).toBeInTheDocument();
    expect(portfolio.getByRole('slider', { name: 'SCHD 비율' })).toBeInTheDocument();
    expect(portfolio.getByRole('slider', { name: 'JEPI 비율' })).toBeInTheDocument();
  });

  it('removes ticker chip from right portfolio when x button is clicked', async () => {
    const user = renderFeature();
    await createTickerFromPreset(user, 'HDV');

    const removeButton = within(getPortfolioSection()).getByRole('button', { name: '티커 HDV 삭제' });
    await user.click(removeButton);

    // 포함 해제이므로 결과는 초기화되고, 좌측 티커는 남아 있되 선택 해제된다.
    expect(screen.queryByRole('heading', { name: '포트폴리오 구성' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '티커 HDV 선택' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows only one result mode card and toggles to quick estimate', async () => {
    const user = renderFeature();
    await createTickerFromPreset(user, 'JEPI');

    expect(screen.getByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '시뮬레이션 결과 (간편)' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '빠른 추정 보기' }));

    expect(screen.getByRole('heading', { name: '시뮬레이션 결과 (간편)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '시뮬레이션 결과 (정밀)' })).not.toBeInTheDocument();
  });

  it('opens ticker settings by gear button and updates ticker name', async () => {
    const user = renderFeature();
    await createCustomTicker(user, { ticker: 'QQQ', initialPrice: '100', dividendYield: '1', dividendGrowth: '8' });

    await user.click(screen.getByRole('button', { name: '티커 QQQ 설정' }));

    const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    await user.click(within(dialog).getByRole('tab', { name: '입력' }));
    await fillField(user, dialog, '티커', 'QQQM');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(screen.getByRole('button', { name: '티커 QQQM 선택' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '티커 QQQ 선택' })).not.toBeInTheDocument();
  });

  it('deletes a ticker from the edit modal', async () => {
    const user = renderFeature();
    await createTickerFromPreset(user, 'SCHD');

    await user.click(screen.getByRole('button', { name: '티커 SCHD 설정' }));

    const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    await user.click(within(dialog).getByRole('button', { name: '티커 삭제' }));

    expect(screen.queryByRole('button', { name: '티커 SCHD 선택' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
  });
});
