import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';

/**
 * AI 리포터 **근거 문장**(2026-11-11) — 본문을 구체적으로 쓰되 지어내지 않게 하는 재료.
 *
 * 사용자 피드백: "AI 글 본문이 너무 빈약하다." 본문을 늘리려면 LLM 이 쓸 사실이 더 있어야 하는데,
 * LLM 의 바깥 지식(운용 방식·뉴스·전망)은 검증할 수 없다. 그래서 **저장소에 이미 검증돼 있는 것**만 문장으로
 * 만들어 넘긴다 — 종목 소개 페이지의 참고 정보(추종 지수·운용보수·상장 연도·연속 증배·과거 배당 성장·
 * 상위 업종·관계 종목), 경제지표 설명(아래 사전), 실적 발표 회사의 영문 이름.
 *
 * 이 문장들의 숫자는 본문에 써도 된다(`rules.ts` 가 `background` 의 숫자도 허용 목록에 넣는다).
 * 근사치는 "약"을 붙여 그대로 근사치로 넘긴다 — 소개 페이지가 근사치라고 밝힌 값이다.
 */

const contentOf = (ticker: string) => TICKER_CONTENT_LIST.find((entry) => entry.ticker === ticker);

/** 종목 하나의 근거 문장들. 소개 페이지가 없는 종목은 빈 배열. */
export const tickerBackground = (ticker: string): string[] => {
  const content = contentOf(ticker);
  if (!content) return [];
  const ref = content.reference;
  const lines: string[] = [`${ticker} 한 줄 소개: ${content.heroTagline}`];
  if (ref.trackedIndex) lines.push(`${ticker} 추종 지수: ${ref.trackedIndex}`);
  if (ref.inceptionYear) lines.push(`${ticker} 상장: ${ref.inceptionYear}년`);
  if (ref.expenseRatioPercent !== undefined) lines.push(`${ticker} 운용보수: 연 ${ref.expenseRatioPercent}%`);
  if (ref.holdingsCountApprox) lines.push(`${ticker} 보유 종목 수: 약 ${ref.holdingsCountApprox}개`);
  if (ref.paymentMonthsNote) lines.push(`${ticker} 배당 지급: ${ref.paymentMonthsNote}`);
  if (ref.consecutiveGrowthYearsApprox) lines.push(`${ticker} 연속 배당 증가: 약 ${ref.consecutiveGrowthYearsApprox}년`);
  if (ref.historicalDividendCagrPercent !== undefined) {
    lines.push(`${ticker} 과거 배당 성장률(연평균, 근사치): 약 ${ref.historicalDividendCagrPercent}%`);
  }
  if (ref.topSectors?.length) lines.push(`${ticker} 비중이 큰 업종: ${ref.topSectors.slice(0, 5).join(', ')}`);
  if (ref.topHoldings?.holdings.length) {
    const top = ref.topHoldings.holdings
      .slice(0, 5)
      .map((holding) => `${holding.symbol} ${holding.weightPercent}%`)
      .join(', ');
    lines.push(`${ticker} 상위 보유 종목(${ref.topHoldings.asOfDate} 기준): ${top}`);
  }
  for (const related of content.relatedTickers.slice(0, 4)) {
    lines.push(`${ticker} 와 같이 보는 종목: ${related.ticker} — ${related.relationLabel}`);
  }
  return lines;
};

/** 소개 페이지의 관계 종목(비교 표에 쓴다). */
export const relatedTickersOf = (ticker: string): readonly { ticker: string; relationLabel: string }[] =>
  contentOf(ticker)?.relatedTickers ?? [];

/**
 * 주요 경제지표 설명(사람이 쓴 정의, 영문명 키). 지표의 **정의와 발표 주체**만 담는다 —
 * 시장 반응 같은 해석은 넣지 않는다(검증할 수 없다).
 */
export const ECONOMIC_INDICATOR_NOTES: Readonly<Record<string, string>> = {
  CPI: '소비자물가지수(CPI)는 미국 노동통계국(BLS)이 매달 발표하는 소비자 구매 품목의 가격 변화 지표다. 전년 대비·전월 대비 상승률로 본다.',
  'Core CPI': '근원 CPI는 CPI에서 변동이 큰 식품과 에너지를 뺀 값이다. 물가의 기조적인 흐름을 볼 때 쓴다.',
  PPI: '생산자물가지수(PPI)는 BLS가 발표하는 생산자 판매 가격의 변화 지표다. 소비자 물가보다 앞서 움직이는 경우가 있다.',
  'Nonfarm Payrolls': '비농업 고용은 BLS 고용보고서의 핵심 숫자로, 농업을 제외한 일자리가 한 달 동안 몇 개 늘었는지를 보여 준다.',
  'Unemployment Rate': '실업률은 BLS 고용보고서에 함께 나오는 경제활동인구 중 실업자 비율이다.',
  'Retail Sales': '소매판매는 미국 상무부가 발표하는 소매 업체 매출 합계의 월간 변화다. 미국 경제에서 소비 비중이 커 주목받는다.',
  GDP: '국내총생산(GDP)은 상무부 경제분석국(BEA)이 분기마다 발표하는 경제 전체의 생산 규모다. 보통 전 분기 대비 연율로 말한다.',
  'PCE Price Index': '개인소비지출(PCE) 물가는 BEA가 발표하는 물가 지표로, 연준이 물가 목표(2%)의 기준으로 삼는다.',
  'Core PCE Price Index': '근원 PCE 물가는 PCE 물가에서 식품과 에너지를 뺀 값으로, 연준이 가장 중시하는 물가 지표로 알려져 있다.'
};
