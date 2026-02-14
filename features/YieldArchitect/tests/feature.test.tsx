import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YieldArchitectFeature from '@/features/YieldArchitect';

const renderFeature = () => {
  const store = createStore();
  return render(
    <Provider store={store}>
      <YieldArchitectFeature />
    </Provider>
  );
};

describe('YieldArchitectFeature', () => {
  it('renders summary on valid input', () => {
    renderFeature();

    expect(screen.getByText('요약')).toBeInTheDocument();
    expect(screen.getByText('연도별 결과')).toBeInTheDocument();
  });

  it('shows validation error when ticker is empty', async () => {
    const user = userEvent.setup();
    renderFeature();

    const tickerInput = screen.getByLabelText('티커');
    await user.clear(tickerInput);

    expect(screen.getByText('티커를 입력하세요.')).toBeInTheDocument();
    expect(screen.getByText('입력값 오류를 수정하면 결과가 표시됩니다.')).toBeInTheDocument();
  });

  it('changes summary value when reinvest toggle changes', async () => {
    const user = userEvent.setup();
    renderFeature();

    const baseline = screen.getAllByText(/^₩/)[1]?.textContent;
    await user.click(screen.getByLabelText('배당 재투자'));
    const next = screen.getAllByText(/^₩/)[1]?.textContent;

    expect(next).not.toBe(baseline);
  });
});
