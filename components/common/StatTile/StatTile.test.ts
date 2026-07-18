import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import StatTile from './StatTile';

describe('StatTile', () => {
  it('renders label and value', () => {
    render(createElement(StatTile, { label: '최종 자산 가치', value: '1,200만원' }));

    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
    expect(screen.getByText('1,200만원')).toBeInTheDocument();
  });

  it('renders the optional hint', () => {
    render(createElement(StatTile, { label: '누적 세금', value: '120만원', hint: '세후 기준' }));

    expect(screen.getByText('세후 기준')).toBeInTheDocument();
  });

  it('renders the action slot (help button)', () => {
    render(
      createElement(StatTile, {
        label: '평가이익',
        value: '300만원',
        action: createElement('button', { type: 'button', 'aria-label': '평가이익 설명' }, '?')
      })
    );

    expect(screen.getByRole('button', { name: '평가이익 설명' })).toBeInTheDocument();
  });

  /**
   * 강조는 **시각적**일 뿐이다. hero라고 해서 읽히는 텍스트가 달라지면 안 된다.
   * (스크린리더 사용자에게는 크기 차이가 존재하지 않는다)
   */
  it('exposes the same text regardless of emphasis', () => {
    const { rerender } = render(createElement(StatTile, { label: '자산', value: '10', emphasis: 'default' }));
    expect(screen.getByText('자산')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    rerender(createElement(StatTile, { label: '자산', value: '10', emphasis: 'hero' }));
    expect(screen.getByText('자산')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders signed values with a tone without changing the text', () => {
    render(createElement(StatTile, { label: '평가이익', value: '-40만원', tone: 'negative' }));

    expect(screen.getByText('-40만원')).toBeInTheDocument();
  });

  /**
   * 진행률(§4.4)은 색(오로라 바)만으로 전달하면 안 된다 — progressbar 롤/값과
   * 병기 문구("목표의 N% 도달")가 함께 나와야 한다.
   */
  it('renders an accessible progress bar with a textual hint', () => {
    render(
      createElement(StatTile, {
        label: '목표 월배당 도달 (300만원)',
        value: '2038년',
        progress: 0.72,
        progressLabel: '목표 월배당 달성률'
      })
    );

    const bar = screen.getByRole('progressbar', { name: '목표 월배당 달성률' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '72');
    expect(screen.getByText('목표의 72% 도달')).toBeInTheDocument();
  });

  it('announces completion when the goal is reached', () => {
    render(
      createElement(StatTile, {
        label: '목표 월배당 도달 (300만원)',
        value: '2031년',
        progress: 1,
        progressLabel: '목표 월배당 달성률'
      })
    );

    expect(screen.getByRole('progressbar', { name: '목표 월배당 달성률' })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('목표 달성')).toBeInTheDocument();
  });

  /**
   * 반올림 경계: 0.995~0.999는 반올림하면 100이지만 아직 미달성이다.
   * "목표의 100% 도달"이라는 모순 대신 99%로 캡한다 — 100%는 진짜 달성(≥1)에만.
   */
  it('caps unreached progress at 99% instead of rounding up to 100%', () => {
    render(
      createElement(StatTile, {
        label: '목표 월배당 도달 (300만원)',
        value: '미도달',
        progress: 0.997,
        progressLabel: '목표 월배당 달성률'
      })
    );

    expect(screen.getByRole('progressbar', { name: '목표 월배당 달성률' })).toHaveAttribute('aria-valuenow', '99');
    expect(screen.getByText('목표의 99% 도달')).toBeInTheDocument();
    expect(screen.queryByText('목표 달성')).not.toBeInTheDocument();
  });

  /** 달성률이 목표를 넘어도(150%) 바와 문구는 100%에서 멈춘다 — 표시용 비율의 계약. */
  it('clamps out-of-range progress to the 0-100 range', () => {
    render(
      createElement(StatTile, {
        label: '목표 월배당 도달',
        value: '2029년',
        progress: 1.5,
        progressLabel: '목표 월배당 달성률'
      })
    );

    expect(screen.getByRole('progressbar', { name: '목표 월배당 달성률' })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('목표 달성')).toBeInTheDocument();
  });

  it('does not render a progress bar when progress is not given', () => {
    render(createElement(StatTile, { label: '누적 순배당', value: '4,200만원' }));

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
