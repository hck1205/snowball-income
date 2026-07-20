import { describe, expect, it } from 'vitest';
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import { buildSnowballReport } from '@/shared/lib/snowball';
import type { SnowballReport } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';
import {
  buildAssetGrowthNarrative,
  buildCalendarNarrative,
  buildCalendarSpanLabel,
  buildCoverNarrative,
  buildDividendNarrative,
  buildMonthlyCaption,
  buildMonthlyGrowthNarrative,
  buildPdfReportFileName,
  buildPortfolioNarrative,
  buildTaxNarrative,
  chunkIntoPairs,
  chunkYearlyRows,
  countPayingMonths,
  sanitizeScenarioNameForFile
} from '@/pages/Main/components/PdfReportDocument';

/**
 * PDF 리포트의 **문장 계층** 회귀 테스트.
 *
 * 여기서 지키려는 것은 "숫자가 맞나"가 아니라(그건 엔진 테스트의 몫) **말이 되나**이다:
 *  - 목표를 설정하지 않았는데 "목표 달성"이라고 인쇄하지 않는가
 *  - 재투자를 껐는데 재투자 문장을 붙이지 않는가
 *  - 원금 0·1년차 배당 0에서 0으로 나눈 결과(NaN·Infinity)가 종이에 나가지 않는가
 */

const profile = (
  id: string,
  ticker: string,
  dividendYield: number,
  dividendGrowth: number,
  frequency: TickerProfile['frequency'] = 'quarterly'
): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0, 'monthly');

const buildSettings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  ...overrides
});

const buildReport = (
  profiles: TickerProfile[],
  settings: Partial<PersistedInvestmentSettings> = {},
  weightByTickerId: Record<string, number> = {}
): SnowballReport => {
  const report = buildSnowballReport({
    portfolio: {
      tickerProfiles: profiles,
      includedTickerIds: profiles.map((item) => item.id),
      weightByTickerId,
      fixedByTickerId: {},
      selectedTickerId: null
    },
    investmentSettings: buildSettings(settings)
  });

  if (!report) throw new Error('테스트 픽스처가 계산 가능한 리포트를 만들지 못했습니다.');
  return report;
};

/** 문장 안에 NaN/Infinity가 새어 나오지 않았는지. */
const isCleanNumberText = (text: string | null): boolean =>
  text === null || !(/NaN|Infinity|undefined|null/.test(text));

describe('PDF 리포트 — 목표 미설정 분기', () => {
  it('목표 월배당이 0이면 표지 해설에 목표 문장을 넣지 않는다', () => {
    const report = buildReport([schd, jepi], { targetMonthlyDividend: 0 });

    expect(report.target.hasTarget).toBe(false);
    const narrative = buildCoverNarrative(report);
    expect(narrative).not.toContain('목표');
    expect(narrative).not.toContain('년차에 도달');
  });

  it('목표가 있고 달성하면 달성 연차를 말한다', () => {
    const report = buildReport([schd, jepi], { targetMonthlyDividend: 100_000 });

    expect(report.target.hasTarget).toBe(true);
    expect(report.target.reachedInYears).not.toBeNull();
    expect(buildCoverNarrative(report)).toContain(`${report.target.reachedInYears}년차에 도달`);
  });

  it('목표가 있고 기간 내 미달성이면 진행률을 말한다', () => {
    const report = buildReport([schd, jepi], { targetMonthlyDividend: 5_000_000_000, durationYears: 5 });

    expect(report.target.reachedInYears).toBeNull();
    const narrative = buildCoverNarrative(report);
    expect(narrative).toContain('도달하지 못하고');
    expect(narrative).toContain('% 수준에 머뭅니다');
  });
});

describe('PDF 리포트 — 재투자 OFF 분기', () => {
  it('재투자를 끄면 재투자 문장을 붙이지 않는다', () => {
    const report = buildReport([schd, jepi], { reinvestDividends: false });

    const narrative = buildDividendNarrative(report);
    expect(narrative).toContain('배당세로');
    expect(narrative).not.toContain('다시 주식을 사는 데');
  });

  it('재투자를 켜면 재투자 비율을 말한다', () => {
    const report = buildReport([schd, jepi], { reinvestDividends: true, reinvestDividendPercent: 70 });

    expect(buildDividendNarrative(report)).toContain('이 배당 중 70%가 다시 주식을 사는 데');
  });
});

describe('PDF 리포트 — 0 나눗셈 방어', () => {
  it('투입 원금이 0이면 자산 배수 문장을 만들지 않는다', () => {
    const report = buildReport([schd], { initialInvestment: 0, monthlyContribution: 0 });

    expect(report.outcome.totalContribution).toBe(0);
    expect(report.outcome.assetToContributionRatio).toBeNull();
    expect(buildAssetGrowthNarrative(report)).toBeNull();
  });

  it('1년차 배당이 0이면 배수 대신 첫 지급 연차를 말한다', () => {
    // 연 1회 지급 + 12월 시작 → 1년차(달력 첫 해)에는 지급이 없다.
    const annual = profile('t9', 'VIG', 2, 6, 'annual');
    const report = buildReport([annual], { investmentStartDate: '2024-12-01' });

    const narrative = buildMonthlyGrowthNarrative(report);
    expect(isCleanNumberText(narrative)).toBe(true);

    if (report.yearly[0].monthlyDividend === 0) {
      expect(narrative).toContain('년차부터');
    } else {
      expect(narrative).toContain('배 늘어납니다');
    }
  });

  it('어떤 해설에도 NaN·Infinity가 새어 나오지 않는다', () => {
    const report = buildReport([schd], { initialInvestment: 0, monthlyContribution: 0, targetMonthlyDividend: 0 });

    [
      buildCoverNarrative(report),
      buildPortfolioNarrative(report),
      buildAssetGrowthNarrative(report),
      buildDividendNarrative(report),
      buildMonthlyGrowthNarrative(report),
      buildCalendarNarrative(report),
      buildMonthlyCaption(report.finalYearCalendar)
    ].forEach((text) => {
      expect(isCleanNumberText(text)).toBe(true);
    });
  });
});

describe('PDF 리포트 — 월별 캡션', () => {
  it('캡션은 연도를 반드시 담는다 (차트 안에는 연도가 없다)', () => {
    const report = buildReport([schd, jepi]);
    const caption = buildMonthlyCaption(report.finalYearCalendar);

    expect(caption).toMatch(/\d{4}년/);
    expect(caption).toContain('실지급 기준');
    expect(caption).toContain('배당 합계');
  });
});

describe('PDF 리포트 — 12개월 캘린더 해설 (달력 1~12월이 아니라 시간 순 12칸)', () => {
  const annual = profile('t7', 'VIG', 1.9, 7.6, 'annual');
  const semi = profile('t8', 'SEMI', 4.4, 2.2, 'semiannual');

  it('7월 시작이면 캡션이 두 해에 걸친 기간을 그대로 말한다', () => {
    const report = buildReport([schd, annual, semi], {
      investmentStartDate: '2024-07-01',
      durationYears: 10
    });
    const calendar = report.finalYearCalendar;

    expect([calendar[0].year, calendar[0].month]).toEqual([2033, 7]);
    expect([calendar[11].year, calendar[11].month]).toEqual([2034, 6]);
    // 한 해로 뭉뚱그리면 "2033년"이라 거짓이 된다 — 범위 표기여야 한다.
    expect(buildMonthlyCaption(calendar)).toContain('2033년 7월 ~ 2034년 6월');
  });

  it('최다·최소 지급 달과 지급 개월 수가 실제 캘린더 값과 일치한다', () => {
    const report = buildReport([schd, annual, semi], {
      investmentStartDate: '2024-07-01',
      durationYears: 10
    });
    const paying = report.finalYearCalendar.filter((item) => item.amount > 0);
    const sorted = [...paying].sort((left, right) => right.amount - left.amount);
    const narrative = buildCalendarNarrative(report)!;

    expect(paying.length).toBeGreaterThan(1);
    expect(countPayingMonths(report.finalYearCalendar)).toBe(paying.length);
    expect(narrative).toContain(`${paying.length}개월에 나눠`);
    expect(narrative).toContain(`가장 많이 들어오는 달은 ${sorted[0].month}월`);
    expect(narrative).toContain(`가장 적은 달은 ${sorted[sorted.length - 1].month}월`);
    // 지급이 없는 달을 최소 달로 지목하면 안 된다.
    expect(narrative).not.toContain(
      `가장 적은 달은 ${report.finalYearCalendar.find((item) => item.amount === 0)?.month}월`
    );
  });

  it('연 1회 지급이면 "한 번입니다"로 문장을 바꾼다', () => {
    const report = buildReport([annual], { investmentStartDate: '2024-07-01', durationYears: 10 });

    expect(countPayingMonths(report.finalYearCalendar)).toBe(1);
    expect(buildCalendarNarrative(report)).toContain('한 번입니다');
  });

  it('매달 배당이 들어오면 "배당이 들어오지 않는 달" 문장을 쓰지 않는다', () => {
    const report = buildReport([jepi], { investmentStartDate: '2024-07-01' });

    expect(countPayingMonths(report.finalYearCalendar)).toBe(12);
    const narrative = buildPortfolioNarrative(report);
    expect(narrative).toContain('매달 배당이 들어오는 구성입니다.');
    expect(narrative).not.toContain('들어오지 않는 달');
  });

  it('지급이 비는 달이 있으면 그 개월 수를 정확히 말한다', () => {
    const report = buildReport([schd], { investmentStartDate: '2024-07-01' });
    const dryMonths = 12 - countPayingMonths(report.finalYearCalendar);

    expect(dryMonths).toBe(8);
    expect(buildPortfolioNarrative(report)).toContain(`들어오지 않는 달이 ${dryMonths}개월 있습니다`);
  });
});

describe('PDF 리포트 — 세금 해설 분기', () => {
  it('금융소득종합과세 기준을 넘지 않으면 경고 문장을 붙이지 않는다', () => {
    const report = buildReport([schd], {
      initialInvestment: 1_000_000,
      monthlyContribution: 0,
      durationYears: 3
    });

    expect(report.taxes.financialIncomeThresholdYear).toBeNull();
    expect(buildTaxNarrative(report)).not.toContain('금융소득종합과세');
  });

  it('기준을 넘으면 그 연차를 말한다', () => {
    const report = buildReport([schd, jepi]);

    expect(report.taxes.financialIncomeThresholdYear).not.toBeNull();
    expect(buildTaxNarrative(report)).toContain(
      `${report.taxes.financialIncomeThresholdYear}년차부터 세전 연 배당이`
    );
  });
});

describe('PDF 리포트 — 전제표 셀 2개씩 묶기', () => {
  it('짝수/홀수 모두 순서를 보존하며 마지막 묶음만 1개가 될 수 있다', () => {
    expect(chunkIntoPairs([1, 2, 3, 4])).toEqual([
      [1, 2],
      [3, 4]
    ]);
    expect(chunkIntoPairs([1, 2, 3])).toEqual([[1, 2], [3]]);
    expect(chunkIntoPairs([])).toEqual([]);
  });
});

describe('PDF 리포트 — 파일명 정제', () => {
  it('공백은 밑줄로 바꾸고 예약 문자는 지운다', () => {
    expect(sanitizeScenarioNameForFile('내 배당 포트폴리오')).toBe('내_배당_포트폴리오');
    expect(sanitizeScenarioNameForFile('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
  });

  it('20자를 넘으면 자른다', () => {
    expect(sanitizeScenarioNameForFile('가'.repeat(30))).toHaveLength(20);
  });

  it('정제 후 비면 기본 이름을 쓴다', () => {
    expect(sanitizeScenarioNameForFile('   ')).toBe('내포트폴리오');
    expect(sanitizeScenarioNameForFile('///')).toBe('내포트폴리오');
  });

  it('파일명은 스노우볼리포트_이름_YYYYMMDD.pdf 형식이다', () => {
    expect(buildPdfReportFileName('내 포트폴리오', new Date(2026, 6, 20, 14, 32))).toBe(
      '스노우볼리포트_내_포트폴리오_20260720.pdf'
    );
  });
});

describe('PDF 리포트 — 연도별 표 페이지 분할', () => {
  it('첫 페이지와 이후 페이지의 행 수가 다르다', () => {
    const rows = Array.from({ length: 50 }, (_unused, index) => ({
      year: 2024 + index,
      totalContribution: 0,
      assetValue: 0,
      annualDividend: 0,
      cumulativeDividend: 0,
      monthlyDividend: 0
    }));

    const chunks = chunkYearlyRows(rows, 26, 30);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(26);
    expect(chunks[1]).toHaveLength(24);
    expect(chunks.flat()).toHaveLength(rows.length);
  });

  it('행이 없으면 페이지도 없다', () => {
    expect(chunkYearlyRows([], 26, 30)).toEqual([]);
  });
});

describe('PDF 리포트 — 캡션과 해설의 기간 표기 일치', () => {
  const annual = profile('t7', 'VIG', 1.9, 7.6, 'annual');
  const semi = profile('t8', 'SEMI', 4.4, 2.2, 'semiannual');

  it('두 해에 걸친 창이면 해설도 캡션과 같은 기간을 말한다', () => {
    // 8월 시작 → 마지막 12개월은 2035-09 ~ 2036-08. 마지막 달의 연도(2036)만 뽑아 말하면
    // 같은 페이지의 캡션("2035년 9월 ~ 2036년 8월")과 서로 다른 연도를 가리키게 된다.
    const report = buildReport([schd, annual, semi], {
      investmentStartDate: '2026-08-01',
      durationYears: 10
    });
    const span = buildCalendarSpanLabel(report.finalYearCalendar);
    const narrative = buildCalendarNarrative(report)!;

    expect(report.finalYearCalendar[0].year).not.toBe(report.finalYearCalendar[11].year);
    expect(span).toContain('~');
    expect(buildMonthlyCaption(report.finalYearCalendar)).toContain(span);
    expect(narrative).toContain(span);
    // 마지막 해만 단정하는 옛 문장이 되살아나면 실패한다.
    expect(narrative).not.toContain(`${report.finalYearCalendar[11].year}년에는`);
  });

  it('한 해 안에 들어오면 해설은 그 연도를 그대로 말한다', () => {
    const report = buildReport([schd, annual, semi], {
      investmentStartDate: '2026-01-01',
      durationYears: 10
    });
    const calendar = report.finalYearCalendar;
    const narrative = buildCalendarNarrative(report)!;

    expect(calendar[0].year).toBe(calendar[11].year);
    expect(narrative).toContain(`${calendar[0].year}년에는`);
    expect(narrative).not.toContain('~');
  });
});

describe('PDF 리포트 — 평가손실 표기', () => {
  /** 성장률이 음수면 주가가 내려가 취득원가를 밑돈다(정합 모델: priceGrowth === dividendGrowth). */
  const shrinking = profile('t10', 'FALL', 3, -12);

  it('평가손실이면 "평가이익"이라 부르지 않고 양도세가 없다고 말한다', () => {
    const report = buildReport([shrinking], { durationYears: 15 });

    expect(report.taxes.unrealizedGain).toBeLessThan(0);
    const narrative = buildTaxNarrative(report);

    expect(narrative).toContain('평가손실');
    expect(narrative).toContain('양도세는 없고');
    // 손실인데 "평가이익 -약 …"으로 인쇄되던 회귀를 막는다.
    expect(narrative).not.toContain('평가이익');
    expect(narrative).not.toMatch(/-약/);
  });

  it('평가이익이면 부호를 문자로 병기해 지표 타일과 표기를 맞춘다', () => {
    const report = buildReport([schd, jepi]);

    expect(report.taxes.unrealizedGain).toBeGreaterThan(0);
    expect(buildTaxNarrative(report)).toContain('평가이익 +약');
  });
});
