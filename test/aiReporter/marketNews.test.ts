import { describe, expect, it } from 'vitest';
import {
  changeOn,
  checkMarketNewsDraft,
  composeMarketNews,
  sentencesOf,
  verifyPriceMoves,
  type MarketNewsDraft
} from '@/scripts/aiReporter';

/**
 * AI 리포터 시장 기사(2026-11-24) — 사람 검토 없이 자동 공개되므로(사용자 결정) 검사가 유일한 문이다. 잠그는 것:
 * ① 출처 3개 이상 · 매체 2곳 이상 · 최근 보도 ② 문단마다, 숫자 문장마다 출처 번호
 * ③ 주가 등락은 일봉으로 다시 계산해 대조 ④ 분위기·반응은 인용 꼴 + 출처일 때만 ⑤ 권유 표현 금지.
 */
const TODAY = '2026-11-24';

const para = (text: string) => `<p>${text}</p>`;
const filler = '관련 발표 내용은 회사 보도자료와 공시에 자세히 나와 있습니다 [1]. 시장에서도 같은 날 관련 보도가 이어졌습니다 [2]. ';

const goodDraft = (patch: Partial<MarketNewsDraft> = {}): MarketNewsDraft => ({
  factKey: `market-news:${TODAY}:nvidia-earnings`,
  title: '엔비디아 실적 발표 뒤 주가가 크게 올랐다',
  description: '엔비디아가 분기 실적을 발표한 다음 날 주가가 올랐습니다. 무슨 일이 있었는지 정리합니다.',
  introHtml: para(
    '엔비디아가 분기 실적을 발표했고 다음 거래일 주가는 12.3% 올랐습니다. 회사는 데이터센터 매출이 크게 늘었다고 밝혔습니다 [1]. 시장은 실적 발표 직후 시간외 거래에서부터 반응했습니다 [2]. 이번 발표의 내용과 시장의 움직임, 회사 안팎의 말을 출처와 함께 차례로 짚습니다 [3].'
  ),
  bodyHtml: [
    '<h3>무슨 일이 있었나</h3>',
    para(`회사 발표에 따르면 데이터센터 매출이 전년보다 크게 늘었습니다 [1]. ${filler}`),
    '<h3>시장은 어떻게 반응했나</h3>',
    para(`로이터 보도에 따르면 투자자들의 기대감이 커졌다고 전했습니다 [2]. ${filler}`),
    '<h3>회사 안팎의 말</h3>',
    para(`젠슨 황 최고경영자는 실적 발표에서 수요가 이어지고 있다고 말했습니다 [3]. ${filler}`),
    para(`업계 분석가들은 공급 일정이 변수라고 평가했습니다 [3]. ${filler}${filler}`),
    para(`${filler}${filler}${filler}`),
    para(`${filler}${filler}${filler}`)
  ].join(''),
  sources: [
    { id: 1, url: 'https://nvidianews.nvidia.com/news/q3', publisher: 'NVIDIA', title: '분기 실적 발표', publishedAt: '2026-11-20' },
    { id: 2, url: 'https://www.reuters.com/technology/nvidia', publisher: 'Reuters', title: 'Nvidia shares jump', publishedAt: '2026-11-21' },
    { id: 3, url: 'https://www.cnbc.com/nvidia-call', publisher: 'CNBC', title: 'Huang on demand', publishedAt: '2026-11-21' }
  ],
  priceMoves: [{ ticker: 'NVDA', date: '2026-11-21', changePercent: 12.3 }],
  tickers: ['NVDA'],
  ...patch
});

const errorsOf = (draft: MarketNewsDraft) => checkMarketNewsDraft(draft, { entries: [] }, TODAY).errors;

describe('검사 — 통과하는 초안', () => {
  it('출처·번호·인용·길이를 다 지키면 통과', () => {
    expect(errorsOf(goodDraft())).toEqual([]);
  });
});

describe('검사 — 출처', () => {
  it('출처가 3개 미만이면 거부', () => {
    const draft = goodDraft({ sources: goodDraft().sources.slice(0, 2) });
    expect(errorsOf(draft).some((error) => error.startsWith('출처 2개'))).toBe(true);
  });

  it('한 매체뿐이면 거부 — 서로 다른 매체 2곳 이상', () => {
    const sources = goodDraft().sources.map((source) => ({ ...source, url: `https://www.reuters.com/a${source.id}` }));
    expect(errorsOf(goodDraft({ sources })).some((error) => error.includes('매체가 1곳'))).toBe(true);
  });

  it('오래된 보도 · 미래 날짜 · https 아님은 거부', () => {
    const sources = [
      { ...goodDraft().sources[0]!, publishedAt: '2026-10-01' },
      { ...goodDraft().sources[1]!, publishedAt: '2026-12-30' },
      { ...goodDraft().sources[2]!, url: 'http://www.cnbc.com/x' }
    ];
    const errors = errorsOf(goodDraft({ sources }));
    expect(errors.some((error) => error.includes('10일 안의 보도만'))).toBe(true);
    expect(errors.some((error) => error.includes('미래'))).toBe(true);
    expect(errors.some((error) => error.includes('https 가 아니다'))).toBe(true);
  });
});

describe('검사 — 출처 번호', () => {
  it('🔴 출처 번호 없는 문단은 거부', () => {
    const bodyHtml = goodDraft().bodyHtml + para('엔비디아는 앞으로도 계속 성장할 회사입니다.');
    expect(errorsOf(goodDraft({ bodyHtml })).some((error) => error.startsWith('출처 번호가 없는 문단'))).toBe(true);
  });

  it('🔴 숫자가 든 문장은 그 문장 안에 출처 번호 — 검증된 주가 등락률은 예외', () => {
    const bodyHtml = goodDraft().bodyHtml + para('매출은 351억 달러였습니다. 회사가 발표했습니다 [1].');
    expect(errorsOf(goodDraft({ bodyHtml })).some((error) => error.includes('숫자가 있는데 출처 번호가 없는 문장'))).toBe(true);
    // 리드의 "12.3% 올랐습니다" 는 priceMoves 로 검증되므로 번호 없이도 통과한다(통과 초안이 증명).
  });

  it('없는 번호 · 안 쓴 출처는 거부', () => {
    const bodyHtml = goodDraft().bodyHtml.replace(/\[3\]/g, '[9]');
    const introHtml = goodDraft().introHtml.replace(/\[3\]/g, '[9]');
    const errors = errorsOf(goodDraft({ bodyHtml, introHtml }));
    expect(errors).toContain('없는 출처 번호 [9]');
    expect(errors).toContain('본문에서 한 번도 쓰지 않은 출처 [3]');
  });
});

describe('검사 — 분위기·반응', () => {
  it('🔴 단정한 분위기 서술은 거부 — "직원들이 들떠 있다"', () => {
    const bodyHtml = goodDraft().bodyHtml + para('회사 안 분위기는 들떠 있습니다 [1].');
    expect(errorsOf(goodDraft({ bodyHtml })).some((error) => error.startsWith('분위기·반응 표현'))).toBe(true);
  });

  it('인용 꼴 + 출처면 허용 — "~에 따르면 … 기대감이 커졌다고 전했다 [2]"', () => {
    expect(errorsOf(goodDraft()).some((error) => error.startsWith('분위기·반응 표현'))).toBe(false);
  });
});

describe('검사 — 표현 · 형식 · 중복', () => {
  it('권유 표현은 거부', () => {
    const bodyHtml = goodDraft().bodyHtml + para('지금이 기회이니 사세요 [1].');
    expect(errorsOf(goodDraft({ bodyHtml })).some((error) => error.startsWith('투자 권유 표현'))).toBe(true);
  });

  it('factKey 형식 · 날짜', () => {
    expect(errorsOf(goodDraft({ factKey: 'market-news:2026-11-24:Nvidia Earnings' })).some((error) => error.startsWith('factKey 형식'))).toBe(true);
    expect(errorsOf(goodDraft({ factKey: 'market-news:2026-11-10:nvidia' })).some((error) => error.includes('2일 넘게'))).toBe(true);
  });

  it('이미 발행한 회차 · 비슷한 제목은 거부', () => {
    const ledger = {
      entries: [{ factKey: goodDraft().factKey, topic: 'market-news' as const, title: goodDraft().title, publishedAt: '', postId: 'x' }]
    };
    const errors = checkMarketNewsDraft(goodDraft(), ledger, TODAY).errors;
    expect(errors.some((error) => error.startsWith('이미 발행한 회차'))).toBe(true);
    expect(errors.some((error) => error.startsWith('기존 글과 제목이 비슷하다'))).toBe(true);
  });
});

describe('주가 대조', () => {
  const closes = [
    { date: '2026-11-19', close: 100 },
    { date: '2026-11-20', close: 100 },
    { date: '2026-11-21', close: 112.3 }
  ];

  it('전일 종가 대비 등락률', () => {
    expect(changeOn(closes, '2026-11-21')?.change).toBeCloseTo(12.3, 6);
    expect(changeOn(closes, '2026-11-19')).toBeNull(); // 전일 기록 없음
  });

  it('🔴 ±0.3%p 안이면 통과, 넘으면 거부, 확인할 수 없으면 거부', () => {
    expect(verifyPriceMoves([{ ticker: 'NVDA', date: '2026-11-21', changePercent: 12.5 }], { NVDA: closes }).errors).toEqual([]);
    expect(verifyPriceMoves([{ ticker: 'NVDA', date: '2026-11-21', changePercent: 15 }], { NVDA: closes }).errors[0]).toContain('불일치');
    expect(verifyPriceMoves([{ ticker: 'NVDA', date: '2026-11-22', changePercent: 1 }], { NVDA: closes }).errors[0]).toContain('확인 불가');
    expect(verifyPriceMoves([{ ticker: 'XYZ', date: '2026-11-21', changePercent: 1 }], { XYZ: null }).errors[0]).toContain('확인 불가');
  });
});

describe('조립', () => {
  it('리드 → 검증된 주가 표 → 본문 → 종목 링크(절대 주소) → 출처 목록', () => {
    const verified = verifyPriceMoves(goodDraft().priceMoves, {
      NVDA: [
        { date: '2026-11-20', close: 100 },
        { date: '2026-11-21', close: 112.3 }
      ]
    }).verified;
    const html = composeMarketNews(goodDraft(), verified, new Map([['NVDA', 'nvda']]));
    const order = ['엔비디아가 분기', '<h3>주가 반응</h3>', '<h3>무슨 일이 있었나</h3>', 'https://hungry-hippo.xyz/ticker/nvda', '<h3>출처</h3>'].map((part) =>
      html.indexOf(part)
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('<td>+12.30%</td>');
    expect(html).toContain('[1] <a href="https://nvidianews.nvidia.com/news/q3">NVIDIA — 분기 실적 발표</a> (2026-11-20)');
  });
});

describe('문장 나누기', () => {
  it('소수점에서 자르지 않는다', () => {
    expect(sentencesOf('주가는 12.3% 올랐습니다 [1]. 회사는 밝혔습니다 [2].')).toEqual(['주가는 12.3% 올랐습니다 [1].', '회사는 밝혔습니다 [2].']);
  });
});

describe('주제 후보 — 무엇이 얼마나 움직였는지는 코드가 정한다', () => {
  const series = (...closes: number[]) => closes.map((close, index) => ({ date: `2026-11-${String(17 + index).padStart(2, '0')}`, close }));

  it('최근 사흘 중 종목마다 가장 큰 하루, 절댓값 큰 순, 기준(4%) 미만은 뺀다', async () => {
    const { pickMoveCandidates } = await import('@/scripts/aiReporter');
    const picked = pickMoveCandidates(
      {
        NVDA: series(100, 100, 100, 101, 132.8), // 마지막 날 +31.49%
        AVGO: series(100, 100, 100, 88, 88), // 넷째 날 -12%
        KO: series(100, 100, 101, 102, 103), // 작다
        OLD: series(100, 150, 150, 150, 150), // 큰 움직임이 사흘보다 앞이다
        GONE: null
      },
      new Set()
    );
    expect(picked.map((row) => [row.ticker, row.date, row.changePercent])).toEqual([
      ['NVDA', '2026-11-21', 31.49],
      ['AVGO', '2026-11-20', -12]
    ]);
  });

  it('최근 30일 안에 기사로 다룬 종목은 후보에서 뺀다', async () => {
    const { pickMoveCandidates, recentlyCoveredTickers } = await import('@/scripts/aiReporter');
    const ledger = {
      entries: [
        { factKey: 'market-news:2026-11-10:nvda', topic: 'market-news' as const, title: 't', publishedAt: '2026-11-10T00:00:00Z', postId: 'a', tickers: ['NVDA'] },
        { factKey: 'market-news:2026-09-01:avgo', topic: 'market-news' as const, title: 't', publishedAt: '2026-09-01T00:00:00Z', postId: 'b', tickers: ['AVGO'] }
      ]
    };
    const covered = recentlyCoveredTickers(ledger, '2026-11-24');
    expect([...covered]).toEqual(['NVDA']);
    expect(pickMoveCandidates({ NVDA: series(100, 100, 100, 100, 130) }, covered)).toEqual([]);
  });
});

describe('끝난 거래일만 — 장중 마지막 줄을 빼야 한다', () => {
  // 실측(2026-11-24 15:23 UTC, 미국 장중): 마지막 줄 11/24 가 "지금까지" 값이라 그대로 쓰면 미완성 하루가 후보가 된다.
  const start = 1795530600; // 11/24 정규장 시작
  const end = 1795554000; // 11/24 정규장 마감
  const result = (lastQuote: number) => ({
    timestamp: [start - 86_400, start],
    meta: { regularMarketTime: lastQuote, currentTradingPeriod: { regular: { start, end } } },
    indicators: { quote: [{ close: [165.05, 153.03] }] }
  });

  it('장중이면 오늘 줄을 뺀다', async () => {
    const { completedSessions } = await import('@/scripts/aiReporter');
    expect(completedSessions(result(start + 3000))).toEqual({ stamps: [start - 86_400], closes: [165.05] });
  });

  it('장이 끝났으면 오늘 줄을 남긴다', async () => {
    const { completedSessions } = await import('@/scripts/aiReporter');
    expect(completedSessions(result(end)).closes).toEqual([165.05, 153.03]);
  });

  it('메타가 없으면 손대지 않는다', async () => {
    const { completedSessions } = await import('@/scripts/aiReporter');
    expect(completedSessions({ timestamp: [1, 2], indicators: { quote: [{ close: [1, 2] }] } }).closes).toEqual([1, 2]);
  });
});
