import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioAssumptions from './PortfolioAssumptions';
import type { PortfolioAssumptionsProps } from './PortfolioAssumptions.types';

/*
 * "가정 요약" 접힘 블록의 **사용자 행동**을 잠근다 — 접기/펼치기(디스클로저), 조건 행 표시,
 * 세율 입력의 제어 계약.
 *
 * ⚠ 이 블록은 네이티브 `<details>`다. jsdom 은 닫힌 `<details>` 안의 자식을 지우지 않으므로
 * "안 보인다"를 `queryBy...` 로 확인하면 **닫혀 있어도 통과**한다. 그래서 열림 상태는
 * 접근성 계약(`<details>` 의 role=group + open 어트리뷰트)으로 판정한다 — 사용자가 삼각형을
 * 눌렀을 때 실제로 펼쳐지는지를 보는 유일하게 정직한 신호다.
 */

const baseProps: PortfolioAssumptionsProps = {
  summaryLabel: '이 계산에 쓰인 가정 · 세율 15.4%',
  rows: [
    { label: '주가 기준', value: '2026-07-30 종가 스냅샷' },
    { label: '환율 기준', value: '$1 ≈ 1,380원 · 2026-07-30' }
  ],
  isLoading: false,
  taxInput: '15.4',
  onTaxInputChange: () => {},
  onTaxInputBlur: () => {},
  goalConditionRows: []
};

const renderBlock = (overrides: Partial<PortfolioAssumptionsProps> = {}) => {
  const props = { ...baseProps, ...overrides };
  render(<PortfolioAssumptions {...props} />);
  return props;
};

/** `<details>` 는 role=group 으로 노출된다. 접힘/펼침은 open 어트리뷰트가 정본이다. */
const disclosure = () => screen.getByRole('group');

describe('PortfolioAssumptions — 가정 요약 접힘 블록', () => {
  it('접힌 채로 시작하고, 요약 줄에 세율이 섞인 라벨을 보여준다', () => {
    renderBlock();

    expect(screen.getByText('이 계산에 쓰인 가정 · 세율 15.4%')).toBeInTheDocument();
    expect(disclosure()).not.toHaveAttribute('open');
  });

  it('요약 줄을 누르면 펼쳐지고, 다시 누르면 접힌다', async () => {
    const user = userEvent.setup();
    renderBlock();

    await user.click(screen.getByText('이 계산에 쓰인 가정 · 세율 15.4%'));
    expect(disclosure()).toHaveAttribute('open');

    await user.click(screen.getByText('이 계산에 쓰인 가정 · 세율 15.4%'));
    expect(disclosure()).not.toHaveAttribute('open');
  });

  it('계산 조건을 라벨-값 쌍으로 보여준다', () => {
    renderBlock();

    expect(screen.getByText('주가 기준')).toBeInTheDocument();
    expect(screen.getByText('2026-07-30 종가 스냅샷')).toBeInTheDocument();
    expect(screen.getByText('환율 기준')).toBeInTheDocument();
    expect(screen.getByText('$1 ≈ 1,380원 · 2026-07-30')).toBeInTheDocument();
  });

  it('세율 입력은 현재 값을 보여주고, 타이핑을 원문 그대로 올려보낸다', async () => {
    const user = userEvent.setup();
    const onTaxInputChange = vi.fn();
    renderBlock({ onTaxInputChange });

    const tax = screen.getByLabelText('배당소득세');
    expect(tax).toHaveValue('15.4');

    await user.type(tax, '9');

    // 제어 컴포넌트라 화면 값은 그대로 두고, 부모가 받을 문자열만 확인한다.
    expect(onTaxInputChange).toHaveBeenCalledWith('15.49');
  });

  it('세율 입력에서 포커스를 잃으면 확정 신호를 올려보낸다', async () => {
    const user = userEvent.setup();
    const onTaxInputBlur = vi.fn();
    renderBlock({ onTaxInputBlur });

    await user.click(screen.getByLabelText('배당소득세'));
    await user.tab();

    expect(onTaxInputBlur).toHaveBeenCalledTimes(1);
  });

  it('불러오는 중에는 세율을 입력할 수 없다 — 버려질 값을 받지 않는다', async () => {
    const user = userEvent.setup();
    const onTaxInputChange = vi.fn();
    renderBlock({ isLoading: true, onTaxInputChange });

    const tax = screen.getByLabelText('배당소득세');
    expect(tax).toBeDisabled();

    await user.type(tax, '9');
    expect(onTaxInputChange).not.toHaveBeenCalled();
  });

  it('목표가 없으면 달성 시점 조건 그룹 자체를 그리지 않는다', () => {
    renderBlock({ goalConditionRows: [] });

    expect(screen.queryByRole('heading', { name: '예상 달성 시점 계산 조건' })).not.toBeInTheDocument();
  });

  it('목표가 있으면 달성 시점 조건을 제목·설명과 함께 덧붙인다', () => {
    renderBlock({
      goalConditionRows: [
        { label: '초기 투자금', value: '1,000만원' },
        { label: '월 적립액', value: '100만원' }
      ]
    });

    expect(screen.getByRole('heading', { name: '예상 달성 시점 계산 조건' })).toBeInTheDocument();
    expect(screen.getByText('시뮬레이터에 저장된 활성 시나리오의 조건입니다.')).toBeInTheDocument();
    expect(screen.getByText('초기 투자금')).toBeInTheDocument();
    expect(screen.getByText('1,000만원')).toBeInTheDocument();
  });

  it('세율 라벨이 두 그룹에 겹쳐 나와도 각 값이 자기 그룹에 남는다', () => {
    renderBlock({
      rows: [{ label: '배당소득세', value: '15.4%' }],
      goalConditionRows: [{ label: '배당소득세', value: '22.0%' }]
    });

    // 세 번(세율 입력 라벨 + 두 그룹의 행) 나온다 — 그래서 그룹 제목이 소속을 밝힌다(컴포넌트 주석의 판단).
    expect(screen.getAllByText('배당소득세')).toHaveLength(3);
    expect(screen.getByText('15.4%')).toBeInTheDocument();
    expect(screen.getByText('22.0%')).toBeInTheDocument();
  });
});
