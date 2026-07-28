import { render, screen } from '@testing-library/react';
import MainResultGrid from './MainResultGrid';

/**
 * 결과 12열 그리드의 **배치 계약**.
 *
 * 여기서 지키는 것은 둘이다.
 *  1. 값이 없는 슬롯은 **칸 자체가 생기지 않는다** — 빈 셀은 그리드에 구멍을 낸다.
 *  2. 🔴 **고아 칸 방지**: "월 평균 배당"(조건부)이 없으면 짝인 "포트폴리오 구성"은 5칸이 아니라
 *     12칸으로 펴진다. 이걸 놓치면 넓은 화면에서 우측 7칸이 영구히 빈 채로 남는다.
 *
 * ⚠ 폭은 사용자에게 "보이는" 것이지만 텍스트가 아니라 **레이아웃**이라 역할·라벨로는 관측할 수 없다.
 *   그래서 예외적으로 계산된 `grid-column` 값을 읽는다 — emotion 클래스명이나 내부 구현이 아니라
 *   **CSS 결과값**이므로 스타일 구현을 바꿔도(예: 커스텀 프로퍼티) 계약이 유지되는 한 통과한다.
 *   (jsdom 은 `@media` 를 평가하지 않으므로 여기서 보이는 값은 항상 **넓은 화면(≥981) 규칙**이다.
 *   좁은 폭의 1열 붕괴는 자동 검증 불가 — 실브라우저 육안 항목.)
 */

/** 카드를 담은 그리드 셀 = 카드 노드의 부모(배치 전용 래퍼라 중간 요소가 없다). */
const cellOf = (label: string): HTMLElement => {
  const cell = screen.getByText(label).parentElement;
  if (!cell) throw new Error(`"${label}" 을 담은 셀을 찾지 못했다.`);
  return cell;
};

const spanOf = (label: string): string => window.getComputedStyle(cellOf(label)).gridColumn;

const card = (label: string) => <span>{label}</span>;

describe('MainResultGrid — 슬롯이 비면 칸도 없다', () => {
  it('넘긴 슬롯만 칸이 된다', () => {
    render(<MainResultGrid summary={card('요약')} monthlyCashflow={card('월별 현금흐름')} />);

    expect(screen.getByText('요약')).toBeInTheDocument();
    expect(screen.getByText('월별 현금흐름')).toBeInTheDocument();
    expect(screen.queryByText('연도별 결과')).not.toBeInTheDocument();
  });

  it('전부 비면 빈 그리드조차 그리지 않는다', () => {
    const { container } = render(<MainResultGrid />);

    expect(container).toBeEmptyDOMElement();
  });

  it('결과가 없을 때는 빈 상태 화면 한 칸이 전폭을 쓴다', () => {
    render(<MainResultGrid emptyState={card('프리셋 보드')} />);

    expect(spanOf('프리셋 보드')).toBe('span 12');
  });
});

describe('MainResultGrid — 고아 칸 방지(span 규칙)', () => {
  it('월 평균 배당이 있으면 [월평균 7 : 구성 5] 로 한 행을 채운다', () => {
    render(<MainResultGrid monthlyAverageChart={card('월 평균 배당')} composition={card('포트폴리오 구성')} />);

    expect(spanOf('월 평균 배당')).toBe('span 7');
    expect(spanOf('포트폴리오 구성')).toBe('span 5');
  });

  it('🔴 월 평균 배당이 없으면 구성이 5칸이 아니라 12칸으로 펴진다', () => {
    render(<MainResultGrid composition={card('포트폴리오 구성')} />);

    // `span 5` 로 고정하면 우측 7칸이 빈 채로 남는다 — 이 한 줄이 그 회귀를 막는다.
    expect(spanOf('포트폴리오 구성')).toBe('span 12');
  });

  it('자산 가치·누적 배당은 항상 쌍이라 6:6 고정이다', () => {
    render(
      <MainResultGrid assetValueChart={card('자산 가치')} cumulativeDividendChart={card('누적 배당')} />
    );

    expect(spanOf('자산 가치')).toBe('span 6');
    expect(spanOf('누적 배당')).toBe('span 6');
  });

  it('전폭 카드들은 12칸이다', () => {
    render(
      <MainResultGrid
        summary={card('요약')}
        financialIncomeBanner={card('종합과세 안내')}
        monthlyCashflow={card('월별 현금흐름')}
        yearlyResult={card('연도별 결과')}
        postInvestmentProjection={card('투자 종료 후 추정')}
        saleTax={card('전량 매도한다면')}
      />
    );

    ['요약', '종합과세 안내', '월별 현금흐름', '연도별 결과', '투자 종료 후 추정', '전량 매도한다면'].forEach(
      (label) => expect(spanOf(label)).toBe('span 12')
    );
  });
});

describe('MainResultGrid — DOM 순서', () => {
  /**
   * 순서는 읽기 흐름 그 자체다(§Q6-4). 특히 "월평균 → 구성"(얼마 받나 → 무엇으로 받나)과
   * `MonthlyCashflow` 가 `YearlyResult` 보다 앞이라는 2026-07-25 결정이 여기 고정된다.
   */
  it('요약 → 배너 → 월평균 → 구성 → 월별 → 연도별 → 자산 → 누적 → 투자종료후 → 전량매도', () => {
    const { container } = render(
      <MainResultGrid
        summary={card('요약')}
        financialIncomeBanner={card('배너')}
        monthlyAverageChart={card('월평균')}
        composition={card('구성')}
        monthlyCashflow={card('월별')}
        yearlyResult={card('연도별')}
        assetValueChart={card('자산')}
        cumulativeDividendChart={card('누적')}
        postInvestmentProjection={card('투자종료후')}
        saleTax={card('전량매도')}
      />
    );

    const rendered = Array.from(container.querySelectorAll('span')).map((node) => node.textContent);
    expect(rendered).toEqual([
      '요약',
      '배너',
      '월평균',
      '구성',
      '월별',
      '연도별',
      '자산',
      '누적',
      '투자종료후',
      '전량매도'
    ]);
  });
});
