import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainPage } from '@/pages';

const renderFeature = () => {
  const store = createStore();
  return render(
    <Provider store={store}>
      <MainPage />
    </Provider>
  );
};

const createTicker = async (name: string, user = userEvent.setup()) => {
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
  const tickerInput = within(dialog).getByLabelText('티커');
  await user.clear(tickerInput);
  await user.type(tickerInput, name);
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
  return user;
};

describe('SnowballAppFeature', () => {
  it('resets simulation result when no ticker is selected', () => {
    renderFeature();

    expect(screen.getByText('결과')).toBeInTheDocument();
    expect(screen.getByText('좌측 티커 생성을 통해 포트폴리오를 구성해주세요.')).toBeInTheDocument();
    expect(screen.queryByText('시뮬레이션 결과 (정밀)')).not.toBeInTheDocument();
  });

  it('applies preset values in ticker modal', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    await user.selectOptions(within(dialog).getByLabelText('프리셋 티커'), 'JEPI');

    expect(within(dialog).getByLabelText('티커')).toHaveValue('JEPI');
    expect(within(dialog).getByLabelText('배당률')).toHaveValue('8.5');
  });

  it('changes summary value when reinvest toggle changes', async () => {
    renderFeature();
    const user = await createTicker('SCHD');

    expect(screen.getByText('시뮬레이션 결과 (정밀)')).toBeInTheDocument();
    const baseline = screen.getAllByText(/^₩/)[1]?.textContent;
    await user.click(screen.getByLabelText('배당 재투자'));
    const next = screen.getAllByText(/^₩/)[1]?.textContent;

    expect(next).not.toBe(baseline);
  });

  it('opens and closes help modal when help mark is clicked', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByLabelText('DPS 성장 반영 설명 열기'));
    expect(screen.getByRole('dialog', { name: 'DPS 성장 반영' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog', { name: 'DPS 성장 반영' })).not.toBeInTheDocument();
  });

  it('opens CAGR help from ticker modal question button', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    await screen.findByRole('dialog', { name: '티커 생성' });

    await user.click(screen.getByRole('button', { name: 'CAGR 설명 열기' }));
    expect(screen.getByRole('dialog', { name: '기대 총수익율 (CAGR)' })).toBeInTheDocument();
  });

  it('creates a ticker from modal and applies it when selected', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    const tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'VYM');
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    const tickerButton = screen.getByRole('button', { name: '티커 VYM 선택' });
    expect(tickerButton).toBeInTheDocument();
    const selectedTickerCard = screen.getByRole('heading', { name: '포트폴리오 구성' }).closest('section');
    expect(selectedTickerCard).not.toBeNull();
    expect((selectedTickerCard as HTMLElement).textContent ?? '').toContain('VYM');
  });

  it('combines multiple included tickers into one portfolio label', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    let dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    let tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'SCHD');
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'JEPI');
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    const selectedTickerCard = screen.getByRole('heading', { name: '포트폴리오 구성' }).closest('section');
    expect(selectedTickerCard).not.toBeNull();
    const text = (selectedTickerCard as HTMLElement).textContent ?? '';
    expect(text).toContain('SCHD');
    expect(text).toContain('JEPI');
  });

  it('removes ticker chip from right portfolio when x button is clicked', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    const tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'HDV');
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    expect(screen.getByRole('button', { name: '티커 HDV 삭제' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '티커 HDV 삭제' }));
    expect(screen.queryByRole('button', { name: '티커 HDV 삭제' })).not.toBeInTheDocument();
  });

  it('shows only one result mode card and toggles to quick estimate', async () => {
    const user = userEvent.setup();
    renderFeature();
    await createTicker('JEPI', user);

    expect(screen.getByText('시뮬레이션 결과 (정밀)')).toBeInTheDocument();
    expect(screen.queryByText('시뮬레이션 결과 (간편)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '빠른 추정 보기' }));

    expect(screen.getByText('시뮬레이션 결과 (간편)')).toBeInTheDocument();
    expect(screen.queryByText('시뮬레이션 결과 (정밀)')).not.toBeInTheDocument();
  });

  it('opens ticker settings by gear button and updates ticker name', async () => {
    const user = userEvent.setup();
    renderFeature();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    let dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    let tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'QQQ');
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    const tickerChip = screen.getByRole('button', { name: '티커 QQQ 선택' });
    await user.hover(tickerChip);
    const gearButton = tickerChip.closest('div')?.querySelector<HTMLButtonElement>('button[data-gear="true"]');
    expect(gearButton).not.toBeNull();
    await user.click(gearButton as HTMLButtonElement);
    dialog = await screen.findByRole('dialog', { name: '티커 생성' });
    tickerInput = within(dialog).getByLabelText('티커');
    await user.clear(tickerInput);
    await user.type(tickerInput, 'QQQM');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(screen.getByRole('button', { name: '티커 QQQM 선택' })).toBeInTheDocument();
  });
});
