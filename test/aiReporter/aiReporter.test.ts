import { describe, expect, it } from 'vitest';
import {
  buildIncomeTargetFacts,
  buildTickerSpotlightFacts,
  buildWeekAheadFacts,
  checkDraft,
  composeBody,
  nextFacts,
  pickNextSpotlightTicker,
  REPORTER_DISCLAIMER,
  titleSimilarity,
  type ReporterDraft,
  type ReporterLedger
} from '@/scripts/aiReporter';
import { buildTickerIncomeAnswer, formatIncomeWon } from '@/shared/lib/tickerIncome';

/**
 * AI 리포터 파이프라인(2026-11-10). 잠그는 것:
 * ① 숫자는 스크립트가 뽑는다 — 표는 엔진 값과 같고, 본문엔 사실 목록 밖의 숫자를 쓸 수 없다
 * ② 권유 표현·AI 지문·지어낸 경험·금지 비유를 거부한다 ③ 짧게(표가 주인공)
 * ④ 중복 없음 — 같은 회차·같은 주제 연속·비슷한 제목 거부, 다음 회차는 안 쓴 것을 고른다
 * ⑤ 표·출처·고지는 조립이 붙인다(LLM 이 건드릴 수 없다)
 */
const EMPTY: ReporterLedger = { entries: [] };
const AS_OF = '2026-11-08';

const spotlight = buildTickerSpotlightFacts('SCHD', AS_OF)!;
const head = buildTickerIncomeAnswer('SCHD')!.headline;

const goodDraft = (overrides: Partial<ReporterDraft> = {}): ReporterDraft => ({
  factKey: spotlight.factKey,
  title: 'SCHD 1억원, 매달 얼마가 들어올까',
  description: '투자금별 세후 월 배당과 10년 재투자 뒤의 차이',
  introHtml: `<p>SCHD에 1억원을 넣으면 세후로 매달 ${formatIncomeWon(head.monthlyAfterTax)}이 들어옵니다.</p><p>배당을 10년 동안 다시 사 모으면 같은 돈이 월 ${formatIncomeWon(head.monthlyAfterReinvest)}까지 늘어나죠. 배당률보다 배당이 자라는 속도가 이 차이를 만듭니다.</p>`,
  ...overrides
});

describe('사실 — 숫자는 엔진에서', () => {
  it('🔴 종목 분석의 표 숫자가 티커 답 계산과 같다', () => {
    expect(spotlight.tablesHtml).toContain(formatIncomeWon(head.monthlyAfterTax));
    expect(spotlight.tablesHtml).toContain('data-chart="bar"');
    expect(spotlight.numbers).toContain(formatIncomeWon(head.monthlyAfterReinvest));
  });

  it('월 배당 목표는 금액별 주소가 있는 금액만, 표는 차트용 숫자 열 하나', () => {
    expect(buildIncomeTargetFacts(77, AS_OF)).toBeNull();
    const facts = buildIncomeTargetFacts(100, AS_OF)!;
    expect(facts.tablesHtml).toContain('<th>종목(배당률)</th><th>필요 원금</th>');
    expect(facts.links[0]!.href).toBe('/dividend/how-much/100');
  });

  it('이번 주 일정은 날짜를 받는다(시계를 읽지 않는다) — 같은 날짜면 같은 결과', () => {
    const day = new Date(2026, 10, 9);
    expect(buildWeekAheadFacts(day)?.factKey).toBe(buildWeekAheadFacts(day)?.factKey);
  });
});

describe('검사', () => {
  it('좋은 초안은 통과한다', () => {
    expect(checkDraft(goodDraft(), spotlight, EMPTY)).toEqual({ ok: true, errors: [] });
  });

  it('🔴 사실 목록에 없는 숫자를 거부한다 (지어낸 숫자 0)', () => {
    const result = checkDraft(goodDraft({ introHtml: '<p>SCHD 1억원이면 세후 월 37만원이 들어옵니다. 생각보다 많은 금액이죠.</p>' }), spotlight, EMPTY);
    expect(result.errors.join()).toContain('사실 목록에 없는 숫자: 37');
  });

  it.each([
    ['투자 권유', '<p>지금 SCHD를 매수하세요. 배당이 꾸준히 들어오는 종목이고 오래 들고 가기 좋습니다.</p>'],
    ['AI 지문', '<p>오늘은 SCHD를 정리해 봤습니다. 배당이 꾸준히 들어오는 종목이고 오래 들고 가기 좋습니다.</p>'],
    ['지어낸 경험', '<p>제가 직접 SCHD를 사 보니 배당이 꾸준히 들어왔습니다. 오래 들고 가기 좋은 종목입니다.</p>'],
    ['금지 비유', '<p>SCHD는 눈덩이처럼 불어납니다. 배당이 꾸준히 들어오는 종목이고 오래 들고 가기 좋습니다.</p>']
  ])('🔴 %s 를 거부한다', (label, introHtml) => {
    const result = checkDraft(goodDraft({ introHtml }), spotlight, EMPTY);
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain(label === '투자 권유' ? '투자 권유 표현' : label);
  });

  it('본문이 길면 거부한다 — 표가 주인공', () => {
    const long = `<p>${'배당이 꾸준히 들어오는 종목입니다. '.repeat(30)}</p>`;
    expect(checkDraft(goodDraft({ introHtml: long }), spotlight, EMPTY).errors.join()).toContain('표가 주인공');
  });

  it('본문에 표·링크 태그를 넣으면 거부한다 (표는 조립이 붙인다)', () => {
    const result = checkDraft(goodDraft({ introHtml: `${goodDraft().introHtml}<table><tr><td>1</td></tr></table>` }), spotlight, EMPTY);
    expect(result.errors.join()).toContain('<table>');
  });

  it('🔴 이미 발행한 회차·같은 주제 연속·비슷한 제목을 거부한다', () => {
    const ledger: ReporterLedger = {
      entries: [{ factKey: spotlight.factKey, topic: 'ticker-spotlight', title: 'SCHD 1억원, 매달 얼마가 들어올까', publishedAt: '', postId: null }]
    };
    const errors = checkDraft(goodDraft(), spotlight, ledger).errors.join('\n');
    expect(errors).toContain('이미 발행한 회차');
    expect(errors).toContain('같은 주제 연속');
    expect(errors).toContain('제목이 비슷하다');
  });

  it('제목 유사도는 단어 겹침으로 잰다', () => {
    expect(titleSimilarity('SCHD 1억원 월 배당', 'SCHD 1억원 월 배당')).toBe(1);
    expect(titleSimilarity('SCHD 1억원 월 배당', '이번 주 미국 증시 일정')).toBe(0);
  });
});

describe('다음 회차 고르기 — 중복 없이', () => {
  it('🔴 이미 다룬 종목은 건너뛴다', () => {
    const first = pickNextSpotlightTicker([]);
    const second = pickNextSpotlightTicker([`ticker-spotlight:${first}:${AS_OF}`]);
    expect(first).not.toBeNull();
    expect(second).not.toBe(first);
  });

  it('직전 주제와 다른 주제를 먼저 고른다', () => {
    const ledger: ReporterLedger = {
      entries: [{ factKey: 'ticker-spotlight:SCHD:x', topic: 'ticker-spotlight', title: 't', publishedAt: '', postId: null }]
    };
    expect(nextFacts(ledger, new Date(2026, 10, 9))?.topic).not.toBe('ticker-spotlight');
  });
});

describe('조립', () => {
  it('🔴 본문 → 표 → 링크 → 출처 → 고지 순서이고, 표·고지는 사실에서 온다', () => {
    const body = composeBody(goodDraft(), spotlight);
    const order = [goodDraft().introHtml.slice(0, 20), '<h3>', '<a href="/ticker/', '출처:', REPORTER_DISCLAIMER.slice(0, 10)].map((part) =>
      body.indexOf(part)
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('factsFromKey — 발행 시점에 바로 그 회차를 다시 만든다', () => {
  it('🔴 같은 키 → 같은 표, 시세 기준일이 다른 키 → null(숫자가 바뀌었으니 발행하지 않는다)', async () => {
    const { factsFromKey } = await import('@/scripts/aiReporter');
    const { MARKET_DATA_AS_OF } = await import('@/shared/constants/marketData');
    const key = `ticker-spotlight:SCHD:${MARKET_DATA_AS_OF}`;
    expect(factsFromKey(key)?.tablesHtml).toBe(buildTickerSpotlightFacts('SCHD', MARKET_DATA_AS_OF!)!.tablesHtml);
    expect(factsFromKey('ticker-spotlight:SCHD:1999-01-01')).toBeNull();
    expect(factsFromKey('week-ahead:2026-11-09')?.factKey).toBe('week-ahead:2026-11-09');
  });
});
