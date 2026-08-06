/**
 * 미국 증시 캘린더의 **가까운 일정**(경제지표 · 실적 발표) 수집기.
 *
 * ```sh
 * npm run market:calendar               # 오늘부터 90일치(영업일)
 * npm run market:calendar -- --days 40  # 짧게
 * ```
 *
 * ## 🔴 이 스크립트가 만들지 **않는** 것
 * 휴장일·조기폐장·FOMC 는 여기서 만들지 않는다 — `shared/constants/marketCalendar/marketCalendar.curated.ts`
 * 가 사람의 손으로 소유한다. 그 셋은 1년 전에 확정 공시되고 거의 바뀌지 않아서, 확정된 사실을
 * 매주 긁으면 얻는 것 없이 소스 개편·차단에 매주 노출된다(같은 조사에서 BLS 는 실제로 403 을 냈다).
 *
 * ## ⚠ 앞을 보는 거리가 짧다 — 그것이 이 자료의 성질이다
 * 실측(2026-08-04): 실적은 오늘 근처가 빽빽하고(8/6 577건) 한 달 뒤면 성기며(9/10 20건) 두 달 뒤는
 * 0 이다. 기업이 발표일을 3~4주 전에야 알리기 때문이다. 그래서 90일을 돌아도 뒤쪽은 대부분 빈다 —
 * **버그가 아니다.** 스냅샷의 `rangeEnd` 가 "여기까지 물어봤다"를 말하고, 화면은 그 뒤를
 * "일정 없음"이 아니라 "아직 알려지지 않음"으로 읽어야 한다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKET_DATA } from '../../shared/constants/marketData';
import { TICKER_PAGE_INDEX } from '../../shared/constants/tickerPages';
import { businessDaysBetween, normalizeEarnings, normalizeEconomic } from './normalize';
import type { NormalizedEarnings, NormalizedEconomic } from './normalize';
import { NasdaqCalendarClient } from './sources/nasdaqCalendar';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SNAPSHOT_PATH = resolve(ROOT, 'shared/constants/marketCalendar/marketCalendar.generated.json');

/**
 * 유니버스 밖 종목을 실을 최소 시가총액 — **1,000억 달러.**
 * 이 밑을 다 실으면 하루 수백 줄이 되고, 이 위는 시장 전체가 보는 이름들이다(엔비디아·애플·테슬라…).
 */
const MIN_MARKET_CAP_USD = 100_000_000_000;

const args = process.argv.slice(2);
const readNumber = (flag: string, fallback: number): number => {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
};

const days = readNumber('--days', 90);

/** 우리가 다루는 종목 = 시장 데이터 스냅샷의 티커 + 소개 페이지가 있는 티커. */
const universe = new Set<string>([
  ...Object.keys(MARKET_DATA.entries),
  ...TICKER_PAGE_INDEX.map((entry) => entry.symbol)
]);
const tickerPages = new Set<string>(TICKER_PAGE_INDEX.map((entry) => entry.symbol));

const today = new Date();
const dates = businessDaysBetween(today, days);

const client = new NasdaqCalendarClient();
const economic: NormalizedEconomic[] = [];
const earnings: NormalizedEarnings[] = [];
let failedDays = 0;

for (const date of dates) {
  const [economicRows, earningsRows] = await Promise.all([client.economic(date), client.earnings(date)]);

  /* 🔴 `null`(못 받음)과 `[]`(받았는데 없음)을 구분해 센다 — 실패를 "일정 없음"으로 위장하지 않는다. */
  if (economicRows === null || earningsRows === null) failedDays += 1;
  if (economicRows) economic.push(...normalizeEconomic(date, economicRows));
  if (earningsRows) {
    earnings.push(...normalizeEarnings(date, earningsRows, { universe, minMarketCapUsd: MIN_MARKET_CAP_USD, tickerPages }));
  }
}

/* 🔴 둘 다 0 이면 덮어쓰지 않는다 — 소스가 죽은 것과 진짜 빈 구간을 구분할 수 없다. */
if (economic.length === 0 && earnings.length === 0) {
  console.error(`✗ 수집 결과가 0건이다(${failedDays}/${dates.length}일 실패) — 기존 스냅샷을 유지한다.`);
  process.exit(1);
}

mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
writeFileSync(
  SNAPSHOT_PATH,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      rangeStart: dates[0],
      rangeEnd: dates[dates.length - 1],
      economic,
      earnings
    },
    null,
    2
  )}\n`,
  'utf-8'
);

console.log(
  `\n✓ ${SNAPSHOT_PATH.replace(ROOT, '.')}\n` +
    `  ${dates[0]} ~ ${dates[dates.length - 1]} (영업일 ${dates.length}일${failedDays ? `, 실패 ${failedDays}일` : ''})\n` +
    `  경제지표 ${economic.length}건 · 실적 ${earnings.length}건 (우리 종목 ${earnings.filter((row) => universe.has(row.ticker)).length}건)`
);
