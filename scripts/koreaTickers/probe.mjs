/**
 * 한국 상장 종목 후보를 **야후 chart API 로 실측**한다(수집 전 검증용 · 일회성 도구).
 *
 * 이 레포의 미국 갱신 파이프라인(`scripts/tickerRefresh/provider/yahooProvider.ts`)이 쓰는 것과
 * 같은 엔드포인트다. 여기서는 프리셋에 넣을 값(현재가·TTM 배당률·지급주기)을 뽑고, 동시에
 * **접미사 오타**를 걸러 낸다.
 *
 * 🔴 야후는 틀린 접미사도 200 으로 답한다(005930.KQ 실측) — 그때 `longName` 이 비었거나 티커
 * 문자열을 그대로 담고 있으므로, 그 모양을 문제로 올린다(korea-listing-feasibility §3-3).
 * ⚠ 이름은 믿지 않는다. 낡거나 틀린 이름이 온다(161510: ARIRANG→PLUS 개명 미반영). 한글명은 사람이 채운다.
 *
 * ```sh
 * node scripts/koreaTickers/probe.mjs 458730.KS 161510.KS ...
 * ```
 */

const CHART = (symbol) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1d&events=div`;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** 지급 간격의 중앙값으로 주기를 고른다(미국 파이프라인의 inferFrequency 와 같은 판정). */
const inferFrequency = (times) => {
  if (times.length < 2) return 'unknown';
  const gaps = [];
  for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1]);
  gaps.sort((a, b) => a - b);
  const medianDays = gaps[Math.floor(gaps.length / 2)] / (24 * 60 * 60);
  if (medianDays <= 45) return 'monthly';
  if (medianDays <= 135) return 'quarterly';
  if (medianDays <= 250) return 'semiannual';
  return 'annual';
};

const probe = async (symbol) => {
  const res = await fetch(CHART(symbol), { headers: { 'user-agent': UA } });
  if (!res.ok) return { symbol, error: `http ${res.status}` };

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return { symbol, error: 'empty' };

  const meta = result.meta ?? {};
  const name = meta.longName ?? meta.shortName ?? '';
  const price = meta.regularMarketPrice ?? null;
  const currency = meta.currency ?? null;

  /* 🔴 접미사 오타 검증 — 이름이 없거나 티커 문자열을 담고 있으면 그 심볼은 신뢰하지 않는다. */
  const nameLooksBogus = !name || name.includes(symbol) || name.includes(symbol.split('.')[0]);

  const events = result.events?.dividends ?? {};
  const payments = Object.values(events)
    .map((entry) => ({ time: entry.date, amount: entry.amount }))
    .filter((entry) => Number.isFinite(entry.time) && Number.isFinite(entry.amount) && entry.amount > 0)
    .sort((a, b) => a.time - b.time);

  const cutoff = Date.now() / 1000 - YEAR_MS / 1000;
  const ttm = payments.filter((p) => p.time >= cutoff).reduce((sum, p) => sum + p.amount, 0);
  const yieldPct = price ? Number(((ttm / price) * 100).toFixed(2)) : null;

  return {
    symbol,
    name,
    nameLooksBogus,
    currency,
    price,
    payments: payments.length,
    ttm: Number(ttm.toFixed(2)),
    yieldPct,
    frequency: inferFrequency(payments.map((p) => p.time)),
    latest: payments.at(-1) ? new Date(payments.at(-1).time * 1000).toISOString().slice(0, 10) : null
  };
};

const symbols = process.argv.slice(2);
if (symbols.length === 0) {
  console.error('사용법: node scripts/koreaTickers/probe.mjs <symbol...>');
  process.exit(1);
}

for (const symbol of symbols) {
  try {
    const row = await probe(symbol);
    console.log(JSON.stringify(row));
  } catch (error) {
    console.log(JSON.stringify({ symbol, error: String(error?.message ?? error) }));
  }
  /* 야후에 예의 — 미국 파이프라인과 같은 간격. */
  await new Promise((resolve) => setTimeout(resolve, 250));
}
