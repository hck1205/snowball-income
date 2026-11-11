import { describe, expect, it } from 'vitest';
import {
  buildIncomeTargetFacts,
  buildTickerSpotlightFacts,
  buildWeekAheadFacts,
  checkDraft,
  composeBody,
  nextFacts,
  pickNextSpotlightTicker,
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
  analysisHtml:
    '<h3>왜 10년 뒤가 더 큰가</h3><p>지금 받는 배당은 배당률에서 나오고, 10년 뒤의 배당은 배당이 자라는 속도와 재투자에서 나옵니다. 배당을 쓰지 않고 다시 사면 보유 주식 수가 늘고, 늘어난 주식마다 배당이 다시 자랍니다. 두 효과가 겹치기 때문에 시간이 지날수록 차이가 커지는 구조죠.</p>' +
    '<h3>같이 봐야 할 것</h3><ul><li>배당 성장률은 과거 관측에서 온 가정값입니다. 앞으로도 같은 속도일지는 알 수 없습니다. 배당을 줄이거나 동결하는 해가 섞이면 평균이 내려갑니다.</li><li>세후 금액은 미국 배당소득세 원천징수를 반영한 값이고, 주가와 환율 변동은 넣지 않았습니다. 원화로 받는 금액은 환율에 따라 달라집니다.</li></ul>' +
    '<h3>다르게 보이는 경우</h3><p>배당을 재투자하지 않고 생활비로 쓰면 10년 뒤 숫자는 표보다 작아집니다. 성장률이 낮아지는 경우에도 마찬가지입니다. 반대로 적립을 더하면 숫자는 커지고요. 표는 하나의 기준선으로 보는 편이 정확합니다.</p>',
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

  it('🔴 리드가 너무 길거나, 분석이 짧거나 소제목이 없으면 거부한다(빈약한 글 방지)', () => {
    const long = `<p>${'배당이 꾸준히 들어오는 종목입니다. '.repeat(30)}</p>`;
    expect(checkDraft(goodDraft({ introHtml: long }), spotlight, EMPTY).errors.join()).toContain('리드');
    expect(checkDraft(goodDraft({ analysisHtml: '<h3>짧다</h3><p>짧은 분석.</p>' }), spotlight, EMPTY).errors.join()).toContain('분석');
    const noHeading = goodDraft().analysisHtml.replace(/<\/?h3>/g, '');
    expect(checkDraft(goodDraft({ analysisHtml: noHeading }), spotlight, EMPTY).errors.join()).toContain('소제목');
  });

  it('🔴 분석에 background 의 숫자는 쓸 수 있고, 어디에도 없는 숫자는 거부한다', () => {
    const bg = spotlight.background.find((line) => /\d/.test(line))!;
    const numberInBg = bg.match(/\d[\d,.]*/)![0];
    const withBg = goodDraft({ analysisHtml: `${goodDraft().analysisHtml}<p>근거: ${numberInBg}</p>` });
    expect(checkDraft(withBg, spotlight, EMPTY).errors.join()).not.toContain('사실 목록에 없는 숫자');
    const invented = goodDraft({ analysisHtml: `${goodDraft().analysisHtml}<p>지어낸 숫자 987654</p>` });
    expect(checkDraft(invented, spotlight, EMPTY).errors.join()).toContain('987654');
  });

  it('🔴 고쳐 쓰기(replacesPostId)는 같은 회차의 그 글과는 중복으로 보지 않는다', () => {
    const ledger: ReporterLedger = {
      entries: [{ factKey: spotlight.factKey, topic: 'ticker-spotlight', title: goodDraft().title, publishedAt: '', postId: 'p1' }]
    };
    expect(checkDraft(goodDraft(), spotlight, ledger).ok).toBe(false);
    expect(checkDraft(goodDraft({ replacesPostId: 'p1' }), spotlight, ledger)).toEqual({ ok: true, errors: [] });
    expect(checkDraft(goodDraft({ replacesPostId: 'nope' }), spotlight, ledger).errors.join()).toContain('대장에 없다');
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
  it('🔴 본문 → 표 → 링크 → 출처 순서이고, 표는 사실에서 온다. AI 고지는 본문에 없다(화면이 그린다)', () => {
    const body = composeBody(goodDraft(), spotlight);
    expect(body).not.toContain('AI 리포터가');
    expect(body).not.toContain('▇');
    const order = [goodDraft().introHtml.slice(0, 20), '<h3>', '<a href="/ticker/', '출처:'].map((part) =>
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

describe('갤러리 글 — 배당 계산 갤러리에 포트폴리오를 올린다', () => {
  it('🔴 모든 전략은 시뮬레이터가 아는 종목만 쓰고, 비중 합이 100이며, 앱 엔진으로 결과 요약이 만들어진다', async () => {
    const { GALLERY_STRATEGIES, buildGalleryPortfolioFacts } = await import('@/scripts/aiReporter');
    const { runScenarioPayload } = await import('@/shared/lib/snowball');
    for (const strategy of GALLERY_STRATEGIES) {
      expect(strategy.holdings.reduce((sum, holding) => sum + holding.weight, 0)).toBe(100);
      const facts = buildGalleryPortfolioFacts(strategy.id, AS_OF);
      expect(facts, strategy.id).not.toBeNull();
      expect(facts!.attachment?.kind).toBe('portfolio');
      expect(facts!.attachment?.simSummary).not.toBeNull();
      expect(runScenarioPayload(facts!.attachment!.payload), strategy.id).not.toBeNull();
    }
  });

  it('🔴 본문에 쓸 수 있는 숫자에 결과(최종 월 배당·자산)가 없다 — 결과는 카드가 보여 준다', async () => {
    const { buildGalleryPortfolioFacts } = await import('@/scripts/aiReporter');
    const { formatKoreanWon } = await import('@/shared/utils');
    const facts = buildGalleryPortfolioFacts('dividend-growth-trio', AS_OF)!;
    const summary = facts.attachment!.simSummary as { finalMonthlyDividend: number; finalAssetValue: number };
    expect(facts.numbers).not.toContain(formatKoreanWon(summary.finalMonthlyDividend));
    expect(facts.numbers).not.toContain(formatKoreanWon(summary.finalAssetValue));
    expect(facts.category).toBeNull();
  });

  it('🔴 갤러리 글은 kind=portfolio 로 payload·sim_summary 를 함께 올리고, 분류 키를 보내지 않는다', async () => {
    const { publishBoardPost } = await import('@/scripts/aiReporter');
    const bodies: Record<string, unknown>[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      if (url.includes('/auth/v1/token')) {
        return new Response(JSON.stringify({ access_token: 't', user: { id: 'bot' } }), { status: 200 });
      }
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify([{ id: 'p1' }]), { status: 201 });
    }) as typeof fetch;
    const env = { supabaseUrl: 'https://x', anonKey: 'a', email: 'e', password: 'p' };

    await publishBoardPost(env, { title: 't', description: 'd', body: 'b', category: null, isPublic: true, attachment: { kind: 'portfolio', payload: { a: 1 }, simSummary: { b: 2 } } }, fetchImpl);
    await publishBoardPost(env, { title: 't', description: 'd', body: 'b', category: 'insight', isPublic: true }, fetchImpl);

    expect(bodies[0]).toMatchObject({ kind: 'portfolio', payload: { a: 1 }, sim_summary: { b: 2 } });
    expect(bodies[0]).not.toHaveProperty('category');
    expect(bodies[1]).toMatchObject({ kind: 'board', category: 'insight' });
    expect(bodies[1]).not.toHaveProperty('payload');
  });

  it('🔴 다음 전략은 아직 안 쓴 것부터 고른다', async () => {
    const { pickNextGalleryStrategy, GALLERY_STRATEGIES } = await import('@/scripts/aiReporter');
    const first = GALLERY_STRATEGIES[0]!.id;
    expect(pickNextGalleryStrategy([], AS_OF)).toBe(first);
    expect(pickNextGalleryStrategy([`gallery-portfolio:${first}:${AS_OF}`], AS_OF)).toBe(GALLERY_STRATEGIES[1]!.id);
  });
});

describe('파이어족들 영상 글 — 채널 RSS 에서 프로그램이 고른다', () => {
  const feed = (entries: string) =>
    `<?xml version="1.0"?><feed><yt:channelId>x7tc</yt:channelId><title>돈워리</title>${entries}</feed>`;
  const entry = (id: string, title: string, published: string, description: string) =>
    `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><published>${published}T09:00:00+00:00</published><media:group><media:description>${description}</media:description></media:group></entry>`;

  it('🔴 RSS 를 파싱하고, 주제·기간·중복·쇼츠·홍보 영상을 거른다', async () => {
    const { parseYoutubeFeed, pickFireVideo } = await import('@/scripts/aiReporter');
    const videos = parseYoutubeFeed(
      feed(
        entry('aaaaaaaaaaa', '배당으로 월 300만원, 조기은퇴한 40대', '2026-11-05', '파이어족 인터뷰') +
          entry('bbbbbbbbbbb', '오늘의 코스피 시황', '2026-11-09', '반도체 주가') +
          entry('ccccccccccc', '은퇴 생활비 #shorts', '2026-11-10', '') +
          entry('ddddddddddd', '은퇴 현금흐름 원데이클래스', '2026-11-10', '수강 신청 방법') +
          entry('eeeeeeeeeee', '노후 배당 포트폴리오', '2026-08-01', '오래된 영상')
      )
    );
    expect(videos).toHaveLength(5);
    expect(videos[0]).toMatchObject({ videoId: 'aaaaaaaaaaa', channelName: '돈워리', published: '2026-11-05' });
    const options = { usedVideoIds: new Set<string>(), today: '2026-11-11' };
    expect(pickFireVideo(videos, options)?.videoId).toBe('aaaaaaaaaaa');
    expect(pickFireVideo(videos, { ...options, usedVideoIds: new Set(['aaaaaaaaaaa']) })).toBeNull();
  });

  it('🔴 설명란은 광고·이벤트 구간부터 버리고, 연락처·구독 유도 줄을 뺀다', async () => {
    const { cleanDescription } = await import('@/scripts/aiReporter');
    const lines = cleanDescription('빚 3억원으로 시작한 투자 이야기\n00:44 자산 공개\n구독과 좋아요 부탁\nme@example.com\n[이벤트 유의사항]\n카드 혜택 안내');
    expect(lines).toEqual(['빚 3억원으로 시작한 투자 이야기', '00:44 자산 공개']);
  });

  it('🔴 글 재료: 영상 링크 카드(kind=fire)·썸네일·근거는 설명란만, 게시는 sim_summary 없이 kind=fire', async () => {
    const { buildFireVideoFacts, publishBoardPost } = await import('@/scripts/aiReporter');
    const facts = buildFireVideoFacts({
      videoId: 'aaaaaaaaaaa',
      title: '배당으로 월 300만원',
      channelName: '돈워리',
      channelId: 'UCx',
      published: '2026-11-05',
      description: '파이어족 인터뷰\n00:00 하이라이트\n01:00 자산\n02:00 포트폴리오'
    });
    expect(facts.factKey).toBe('fire-video:aaaaaaaaaaa');
    expect(facts.attachment).toMatchObject({
      kind: 'fire',
      payload: { url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', source: '돈워리', image: 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg' }
    });
    expect(facts.tablesHtml).toContain('영상 순서');
    expect(facts.background).toContain('파이어족 인터뷰');

    const bodies: Record<string, unknown>[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      if (url.includes('/auth/v1/token')) return new Response(JSON.stringify({ access_token: 't', user: { id: 'bot' } }), { status: 200 });
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify([{ id: 'p1' }]), { status: 201 });
    }) as typeof fetch;
    const env = { supabaseUrl: 'https://x', anonKey: 'a', email: 'e', password: 'p' };
    await publishBoardPost(env, { title: 't', description: 'd', body: 'b', category: null, isPublic: true, attachment: facts.attachment! }, fetchImpl);
    expect(bodies[0]).toMatchObject({ kind: 'fire' });
    expect(bodies[0]).not.toHaveProperty('sim_summary');
  });
});
