import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import { formatApproxKRW, formatSummaryKRW } from '@/shared/utils';
import SimSummaryStats from './SimSummaryStats';

const summary = (overrides: Partial<ScenarioSimSummary> = {}): ScenarioSimSummary => ({
  version: 1,
  durationYears: 20,
  tickerCount: 4,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  totalContribution: 250_000_000,
  finalAssetValue: 920_000_000,
  finalMonthlyDividend: 1_870_000,
  targetMonthlyDividend: 3_000_000,
  targetReachedInYears: 8,
  ...overrides
});

describe('SimSummaryStats — card variant (카드 프리뷰 §E)', () => {
  it('hero(월 배당)·보조(최종 자산·투입 대비)·달성 배지를 보여준다', () => {
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary() }));

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('9.2억')).toBeInTheDocument();
    // 배수는 저장 필드가 아니라 표시 시점 파생(§H): 9.2억 / 2.5억 = 3.68 → ×3.7
    expect(screen.getByText('투입 대비')).toBeInTheDocument();
    expect(screen.getByText('×3.7')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
  });

  it('기간 내 목표 미달성(null)이면 배지를 그리지 않는다', () => {
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary({ targetReachedInYears: null }) }));

    expect(screen.queryByText(/목표 달성/)).not.toBeInTheDocument();
  });

  it('투입 원금이 0이면 배수 항목을 통째로 뺀다(나눗셈 불성립)', () => {
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary({ totalContribution: 0 }) }));

    expect(screen.queryByText('투입 대비')).not.toBeInTheDocument();
  });
});

describe('SimSummaryStats — card 조건 컨텍스트 줄 (§2·§5, 정보 확장)', () => {
  it('달성 카드: 초기·월·기간·티커를 컨텍스트로 보여주고 목표치는 넣지 않는다(배지가 말함)', () => {
    // 기본 픽스처 = 달성(targetReachedInYears: 8)
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary() }));

    expect(screen.getByText('초기 1,000만원 · 월 100만원 · 20년 · 티커 4개')).toBeInTheDocument();
    // 목표치는 컨텍스트에 없다 — 달성은 배지가 상위 정보(중복 회피)
    expect(screen.queryByText(/목표 월/)).not.toBeInTheDocument();
  });

  it('미달성 카드: 목표 월배당을 컨텍스트로 보여주고 티커는 생략한다', () => {
    render(
      createElement(SimSummaryStats, {
        variant: 'card',
        summary: summary({ targetReachedInYears: null, targetMonthlyDividend: 3_000_000 })
      })
    );

    expect(screen.getByText('초기 1,000만원 · 월 100만원 · 20년 · 목표 월 300만원')).toBeInTheDocument();
    // 미달성 카드는 티커 수 대신 목표치를 노출(줄 길이 관리)
    expect(screen.queryByText(/티커/)).not.toBeInTheDocument();
  });

  it('목표 미설정(targetMonthlyDividend=0)이면 달성/미달성 무관 목표 항목이 없다', () => {
    render(
      createElement(SimSummaryStats, {
        variant: 'card',
        summary: summary({ targetReachedInYears: null, targetMonthlyDividend: 0 })
      })
    );

    // 목표가 없으니 컨텍스트는 초기·월·기간만
    expect(screen.getByText('초기 1,000만원 · 월 100만원 · 20년')).toBeInTheDocument();
    expect(screen.queryByText(/목표 월/)).not.toBeInTheDocument();
  });

  it('컨텍스트는 한 줄(단일 요소)로 렌더된다 — CSS 2줄 clamp가 이 요소에 걸린다(§5)', () => {
    // jsdom은 레이아웃/-webkit-line-clamp를 평가하지 않는다(pitfalls) → 시각적 잘림 대신
    // "모든 컨텍스트 필드가 하나의 클램프 대상 요소에 담긴다"는 구조를 검증한다.
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary() }));

    const line = screen.getByText(/초기 1,000만원/);
    // 같은 요소가 뒤 필드까지 전부 포함 = 필드가 여러 강조 요소로 흩어지지 않았다(가장 약한 위계·clamp 단위)
    expect(line).toHaveTextContent('초기 1,000만원 · 월 100만원 · 20년 · 티커 4개');
  });

  it('컨텍스트 값은 보조(강조) 값과 별개다 — 자산(9.2억)은 보조에만, 컨텍스트엔 없다', () => {
    render(createElement(SimSummaryStats, { variant: 'card', summary: summary() }));

    // 보조 값은 여전히 한 번만(컨텍스트가 값을 중복 강조하지 않는다)
    expect(screen.getAllByText('9.2억')).toHaveLength(1);
    const line = screen.getByText(/초기 1,000만원/);
    expect(line).not.toHaveTextContent('9.2억');
  });
});

describe('SimSummaryStats — attach variant (글쓰기 첨부 §B2)', () => {
  it('월 배당 · 자산 · 기간 한 줄을 보여준다 (배수 없음)', () => {
    render(createElement(SimSummaryStats, { variant: 'attach', summary: summary() }));

    expect(screen.getByText('월 배당')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('자산')).toBeInTheDocument();
    expect(screen.getByText('9.2억')).toBeInTheDocument();
    expect(screen.getByText('20년')).toBeInTheDocument();
    expect(screen.queryByText('투입 대비')).not.toBeInTheDocument();
  });
});

describe('SimSummaryStats — row variant (리스트 행 숫자 클러스터 §B안)', () => {
  it('hero(월 배당 세후)·보조(최종 자산·투입 대비)·달성 배지를 클러스터로 보여준다', () => {
    render(createElement(SimSummaryStats, { variant: 'row', summary: summary() }));

    expect(screen.getByText('월 배당(세후)')).toBeInTheDocument();
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('최종 자산')).toBeInTheDocument();
    expect(screen.getByText('9.2억')).toBeInTheDocument();
    // 배수는 표시 시점 파생(§H): 9.2억 / 2.5억 = 3.68 → ×3.7
    expect(screen.getByText('투입 대비')).toBeInTheDocument();
    expect(screen.getByText('×3.7')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
    // 카드와 달리 조건 컨텍스트 줄은 없다(밀도 유지) — 기간은 노출하지 않는다
    expect(screen.queryByText('20년')).not.toBeInTheDocument();
  });

  it('기간 내 목표 미달성(null)이면 배지를 그리지 않는다', () => {
    render(createElement(SimSummaryStats, { variant: 'row', summary: summary({ targetReachedInYears: null }) }));

    expect(screen.queryByText(/목표 달성/)).not.toBeInTheDocument();
  });

  it('투입 원금이 0이면 배수 항목을 통째로 뺀다(나눗셈 불성립)', () => {
    render(createElement(SimSummaryStats, { variant: 'row', summary: summary({ totalContribution: 0 }) }));

    expect(screen.queryByText('투입 대비')).not.toBeInTheDocument();
  });
});

describe('SimSummaryStats — 3변형 숫자 일치 (§G "글쓰기에서 본 숫자 = 카드 숫자")', () => {
  it('같은 요약이면 세 변형이 같은 월 배당·자산 문자열을 보여준다', () => {
    const data = summary();
    render(
      createElement(
        'div',
        null,
        createElement(SimSummaryStats, { variant: 'card', summary: data }),
        createElement(SimSummaryStats, { variant: 'attach', summary: data }),
        createElement(SimSummaryStats, { variant: 'row', summary: data })
      )
    );

    expect(screen.getAllByText('187만원')).toHaveLength(3);
    expect(screen.getAllByText('9.2억')).toHaveLength(3);
  });
});

describe('formatSummaryKRW — formatApproxKRW와 같은 구간·반올림 규칙 (§F3, 승격 무파괴 확인)', () => {
  it.each([
    [920_000_000, '9.2억', '약 9.2억'],
    [900_000_000, '9억', '약 9억'],
    [1_870_000, '187만원', '약 187만'],
    [9_900, '9,900원', '약 9,900원']
  ])('%d원 → 요약 "%s" / 대시보드 "%s"', (value, summaryText, approxText) => {
    expect(formatSummaryKRW(value)).toBe(summaryText);
    expect(formatApproxKRW(value)).toBe(approxText);
  });
});
