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
});
