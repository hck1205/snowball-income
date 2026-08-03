import { render, screen } from '@testing-library/react';
import MainResultGrid from './MainResultGrid';

/**
 * 결과 12열 그리드의 **배치 계약**.
 *
 * 여기서 지키는 것은 셋이다.
 *  1. 값이 없는 슬롯은 **칸 자체가 생기지 않는다** — 빈 셀은 그리드에 구멍을 낸다.
 *  2. 🔴 **고아 칸 방지**: 한 행을 나눠 쓰는 페어는 **짝이 함께 왔을 때만** 나뉘고, 하나만 오면
 *     그 하나가 전 폭(12)으로 펴진다. 이 규칙이 배치표 한 곳에 있어서 카드가 늘어도 새 분기가 없다.
 *  3. 🔴 **막(act) 머리띠는 그 막에 카드가 하나라도 있을 때만 선다** — 카드 없는 제목만 남으면
 *     화면에 "빈 장(章)"이 생긴다.
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
  it('월 평균 배당과 포트폴리오 구성은 같이 와도 각자 전 폭을 쓴다(한 줄에 묶지 않는다)', () => {
    render(<MainResultGrid monthlyAverageChart={card('월 평균 배당')} composition={card('포트폴리오 구성')} />);

    expect(spanOf('월 평균 배당')).toBe('span 12');
    expect(spanOf('포트폴리오 구성')).toBe('span 12');
  });

  it('🔴 월 평균 배당이 없어도 구성은 그대로 12칸이다(짝에 따라 폭이 흔들리지 않는다)', () => {
    render(<MainResultGrid composition={card('포트폴리오 구성')} />);

    expect(spanOf('포트폴리오 구성')).toBe('span 12');
  });

  it('자산 가치·누적 배당은 항상 쌍이라 6:6 이다', () => {
    render(<MainResultGrid assetValueChart={card('자산 가치')} cumulativeDividendChart={card('누적 배당')} />);

    expect(spanOf('자산 가치')).toBe('span 6');
    expect(spanOf('누적 배당')).toBe('span 6');
  });

  it('투자 종료 후 추정과 전량 매도는 한 행을 7:5 로 나눠 쓴다', () => {
    render(
      <MainResultGrid postInvestmentProjection={card('투자 종료 후 추정')} saleTax={card('전량 매도한다면')} />
    );

    expect(spanOf('투자 종료 후 추정')).toBe('span 7');
    expect(spanOf('전량 매도한다면')).toBe('span 5');
  });

  /**
   * 🔴 이 두 케이스가 이 파일의 핵심이다. "전량 매도한다면"은 **간략 모드에서 사라지는 조건부 카드**라
   * 짝이 빈 채로 서는 일이 실제로 일어난다. 예전 7:5 페어(월평균 : 구성)가 되돌려진 이유가 정확히
   * 이 고아 칸이었고, 지금은 배치표의 `pairWith` 규칙이 자동으로 전 폭을 준다.
   */
  it('짝이 없으면 남은 카드가 전 폭으로 펴진다 — 투자 종료 후', () => {
    render(<MainResultGrid postInvestmentProjection={card('투자 종료 후 추정')} />);

    expect(spanOf('투자 종료 후 추정')).toBe('span 12');
  });

  it('짝이 없으면 남은 카드가 전 폭으로 펴진다 — 자산 가치', () => {
    render(<MainResultGrid assetValueChart={card('자산 가치')} />);

    expect(spanOf('자산 가치')).toBe('span 12');
  });

  it('리드 막(요약·빠른 조정·경고)은 전부 12칸이다', () => {
    render(
      <MainResultGrid
        summary={card('요약')}
        quickAdjust={card('빠른 조정')}
        financialIncomeBanner={card('종합과세 안내')}
        monthlyCashflow={card('월별 현금흐름')}
        yearlyResult={card('연도별 결과')}
      />
    );

    ['요약', '빠른 조정', '종합과세 안내', '월별 현금흐름', '연도별 결과'].forEach((label) =>
      expect(spanOf(label)).toBe('span 12')
    );
  });
});

/**
 * 결과를 **장(章)이 있는 문서**로 읽히게 하는 유일한 장치. 2026-08-03 2차 리워크에서 들어왔다 —
 * 그 전에는 12칸 카드 여덟 장이 같은 무게로 쌓인 목록이라 어디까지가 한 이야기인지 알 수 없었다.
 */
describe('MainResultGrid — 막 머리띠', () => {
  it('막에 카드가 있으면 그 막의 제목이 선다', () => {
    render(<MainResultGrid composition={card('구성')} yearlyResult={card('연도별')} />);

    expect(screen.getByRole('heading', { name: '무엇으로 얼마를 받나' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기간이 지나면 어떻게 되나' })).toBeInTheDocument();
  });

  it('🔴 카드가 하나도 없는 막은 제목까지 통째로 사라진다(빈 장을 만들지 않는다)', () => {
    render(<MainResultGrid composition={card('구성')} />);

    expect(screen.getByRole('heading', { name: '무엇으로 얼마를 받나' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '기간이 지나면 어떻게 되나' })).toBeNull();
    expect(screen.queryByRole('heading', { name: '투자를 마친 뒤' })).toBeNull();
  });

  it('리드 막(요약·빠른 조정)과 빈 상태에는 머리띠가 없다 — 숫자와 첫인상이 곧 제목이다', () => {
    render(<MainResultGrid summary={card('요약')} quickAdjust={card('빠른 조정')} />);

    expect(screen.queryAllByRole('heading')).toEqual([]);
  });

  it('빈 상태에도 머리띠가 없다', () => {
    render(<MainResultGrid emptyState={card('프리셋 보드')} />);

    expect(screen.queryAllByRole('heading')).toEqual([]);
  });

  it('머리띠는 그리드 한 줄을 통째로 가로지른다', () => {
    render(<MainResultGrid composition={card('구성')} />);

    const band = screen.getByRole('heading', { name: '무엇으로 얼마를 받나' }).parentElement;
    expect(band).not.toBeNull();
    /* jsdom 은 `1 / -1` 을 공백 없이 정규화해 돌려준다. */
    expect(window.getComputedStyle(band as HTMLElement).gridColumn).toBe('1/-1');
  });
});

describe('MainResultGrid — DOM 순서', () => {
  /**
   * 순서는 읽기 흐름 그 자체다. 여기 고정되는 결정 둘:
   *  - **구성 → 실지급 월별 → 월 평균**(2026-07-28 사용자 지정) = 무엇으로 받나 → 실제로 언제 얼마 →
   *    장기 추이. 가까운 사실에서 먼 추정으로 내려간다.
   *  - `MonthlyCashflow` 가 `YearlyResult` 보다 앞(2026-07-25).
   *
   * 막을 나눈 뒤에도 **카드의 상대 순서는 한 칸도 바뀌지 않았다** — 막은 묶고 이름을 붙였을 뿐이다.
   */
  it('요약 → 조정 → 배너 → 구성 → 월별 → 월평균 → 연도별 → 자산 → 누적 → 투자종료후 → 전량매도', () => {
    const { container } = render(
      <MainResultGrid
        summary={card('요약')}
        quickAdjust={card('조정')}
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
      '조정',
      '배너',
      '구성',
      '월별',
      '월평균',
      '연도별',
      '자산',
      '누적',
      '투자종료후',
      '전량매도'
    ]);
  });
});
