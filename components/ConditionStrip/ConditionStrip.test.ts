import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import ConditionStrip from './ConditionStrip';
import { buildConditionStripItems } from './ConditionStrip.utils';
import type { ConditionStripInput, ConditionStripItem } from './ConditionStrip.types';

/**
 * "이 결과의 계산 조건" 한 줄.
 *
 * 이 스트립은 **결과 숫자의 전제**를 말한다 — 한 항목이 조용히 사라지면 사용자는 자기가 넣지 않은
 * 조건으로 계산된 숫자를 자기 조건의 결과로 읽는다. 그래서 "무엇을 생략하고 무엇을 사유 문구로
 * 남기는가"가 이 파일이 지키는 계약의 전부다.
 *
 * ⚠ 문구는 **정확일치**로 잡는다. 부분일치(`/재투자/`)로 두면 "재투자 안 함" → "재투자"처럼
 *   의미가 뒤집히는 축약도 초록으로 통과한다(pitfalls 2026-07-27 실측).
 */

/** 표시 통화 인식 포맷터의 자리. 스트립이 **주입받은 포맷터를 쓰는지**를 보려고 표식을 붙인다. */
const formatAmount = (won: number) => `«${won.toLocaleString()}»`;

const baseInput: ConditionStripInput = {
  durationYears: 20,
  monthlyContribution: 1_500_000,
  initialInvestment: 10_000_000,
  taxRatePercent: 15.4,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  targetMonthlyDividend: 3_000_000,
  includedTickerCount: 5,
  showQuickEstimate: false,
  formatAmount
};

const build = (overrides: Partial<ConditionStripInput> = {}): ConditionStripItem[] =>
  buildConditionStripItems({ ...baseInput, ...overrides });

const keysOf = (items: ConditionStripItem[]) => items.map((item) => item.key);
const textOf = (items: ConditionStripItem[], key: ConditionStripItem['key']) =>
  items.find((item) => item.key === key)?.text;

describe('buildConditionStripItems — 항목 구성', () => {
  it('모든 값이 채워지면 8항목이 정해진 순서로 나온다', () => {
    expect(keysOf(build())).toEqual([
      'duration',
      'monthly',
      'initial',
      'tax',
      'reinvest',
      'tickers',
      'target',
      'mode'
    ]);
  });

  it('완성 문구를 그대로 준다 — 뷰가 조각을 다시 조립하지 않는다', () => {
    const items = build();

    expect(textOf(items, 'duration')).toBe('20년');
    expect(textOf(items, 'monthly')).toBe('월 «1,500,000»');
    expect(textOf(items, 'initial')).toBe('초기 «10,000,000»');
    expect(textOf(items, 'tax')).toBe('세율 15.4%');
    expect(textOf(items, 'reinvest')).toBe('재투자 100%');
    expect(textOf(items, 'tickers')).toBe('5종목');
    expect(textOf(items, 'target')).toBe('목표 월 «3,000,000»');
    expect(textOf(items, 'mode')).toBe('정밀 계산');
  });

  it('금액은 주입받은 표시 통화 포맷터만 쓴다 — 스트립 전용 포맷터를 만들지 않는다', () => {
    const calls: number[] = [];
    const items = build({
      formatAmount: (won) => {
        calls.push(won);
        return `$${won}`;
      }
    });

    // 월 적립·초기 투자금·목표 — 금액 항목 셋 전부가 같은 포맷터를 탄다.
    expect(calls).toEqual([1_500_000, 10_000_000, 3_000_000]);
    expect(textOf(items, 'monthly')).toBe('월 $1500000');
  });
});

describe('buildConditionStripItems — 0/미설정 처리', () => {
  it('월 적립 0은 생략하지 않고 "월 적립 없음"이라고 말한다', () => {
    const items = build({ monthlyContribution: 0 });

    expect(keysOf(items)).toContain('monthly');
    expect(textOf(items, 'monthly')).toBe('월 적립 없음');
  });

  /**
   * 🔴 2026-08-14 계약 변경: 미입력은 더 이상 **0%** 가 아니다. 엔진이 종목별 세법 기준
   * (미국 상장 15.0 / 국내 상장 15.4)으로 해결하므로, 이 줄도 "세금이 빠졌다"가 아니라
   * "종목 기준으로 자동 적용됐다"고 말해야 화면과 계산이 같은 사실을 말한다.
   */
  it('세율 미입력은 "종목 기준 자동" — 세전 숫자를 세후로 오해하게 두지 않는다', () => {
    expect(textOf(build({ taxRatePercent: undefined }), 'tax')).toBe('세율 미입력 (종목 기준 자동)');
  });

  it('세율 0은 미입력과 다르다 — 사용자가 직접 넣은 값이라 그대로 말한다', () => {
    expect(textOf(build({ taxRatePercent: 0 }), 'tax')).toBe('세율 0%');
  });

  it('재투자를 끄면 비율 대신 "재투자 안 함" — 복리 여부는 결과를 통째로 바꾼다', () => {
    const items = build({ reinvestDividends: false, reinvestDividendPercent: 60 });

    expect(textOf(items, 'reinvest')).toBe('재투자 안 함');
    // 꺼져 있는데 비율이 남으면 "60% 재투자 중"으로 읽힌다.
    expect(textOf(items, 'reinvest')).not.toContain('60');
  });

  it('부분 재투자는 비율을 그대로 보여준다', () => {
    expect(textOf(build({ reinvestDividendPercent: 60 }), 'reinvest')).toBe('재투자 60%');
  });

  it('초기 투자금 0은 생략한다 — 기본값이라 상시 표시하면 소음이다', () => {
    expect(keysOf(build({ initialInvestment: 0 }))).not.toContain('initial');
  });

  it('목표 미설정(0)은 생략한다 — 요약 타일이 이미 "미설정"을 말한다', () => {
    expect(keysOf(build({ targetMonthlyDividend: 0 }))).not.toContain('target');
  });

  it('생략 대상 둘이 동시에 0이면 6항목만 남는다', () => {
    expect(keysOf(build({ initialInvestment: 0, targetMonthlyDividend: 0 }))).toEqual([
      'duration',
      'monthly',
      'tax',
      'reinvest',
      'tickers',
      'mode'
    ]);
  });

  it('종목 수는 1종목이어도 그대로 센다', () => {
    expect(textOf(build({ includedTickerCount: 1 }), 'tickers')).toBe('1종목');
  });
});

describe('buildConditionStripItems — 모드 표기', () => {
  /** 구 카드 제목("시뮬레이션 결과 (간편)/(정밀)")이 사라진 자리다 — 어느 모드의 숫자인지는 반드시 말해야 한다. */
  it('정밀 계산 / 간편 추정을 마지막 항목으로 항상 말한다', () => {
    const precise = build({ showQuickEstimate: false });
    const quick = build({ showQuickEstimate: true });

    expect(precise[precise.length - 1]).toEqual({ key: 'mode', text: '정밀 계산' });
    expect(quick[quick.length - 1]).toEqual({ key: 'mode', text: '간편 추정' });
  });
});

describe('ConditionStrip 렌더', () => {
  it('시각 숨김 프리픽스가 문단 맨 앞에 있어 낭독이 맥락을 갖는다', () => {
    render(createElement(ConditionStrip, { items: build() }));

    // aria-label 을 붙이면 항목 텍스트가 통째로 대체된다 — 프리픽스는 본문 텍스트여야 한다.
    expect(screen.getByText('이 결과의 계산 조건:')).toBeInTheDocument();
    expect(screen.getByText('20년')).toBeInTheDocument();
    expect(screen.getByText('정밀 계산')).toBeInTheDocument();
  });

  it('항목이 없으면 빈 껍데기를 남기지 않는다', () => {
    const { container } = render(createElement(ConditionStrip, { items: [] }));

    expect(container).toBeEmptyDOMElement();
  });

  it('구분점은 장식이라 낭독되지 않는다', () => {
    render(createElement(ConditionStrip, { items: build({ initialInvestment: 0, targetMonthlyDividend: 0 }) }));

    const separators = screen.getAllByText('·');
    // 항목 6개 사이의 구분점 5개.
    expect(separators).toHaveLength(5);
    separators.forEach((separator) => expect(separator).toHaveAttribute('aria-hidden'));
  });

  it('액션 슬롯("조건 수정")은 스트립 안에 함께 산다', () => {
    render(
      createElement(ConditionStrip, {
        items: build(),
        action: createElement('button', { type: 'button' }, '조건 수정')
      })
    );

    expect(screen.getByRole('button', { name: '조건 수정' })).toBeInTheDocument();
  });
});
