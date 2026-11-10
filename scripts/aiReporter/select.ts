import { MARKET_DATA_AS_OF as RAW_AS_OF } from '@/shared/constants/marketData';
import {
  buildIncomeTargetFacts,
  buildTickerSpotlightFacts,
  buildWeekAheadFacts,
  pickNextIncomeTarget,
  pickNextSpotlightTicker
} from './facts';
import { REPORTER_TOPICS, type ReporterFacts, type ReporterLedger, type ReporterTopic } from './types';

/** 시세 기준일. 없으면(데이터 미생성) 'unknown' — 사실 키가 매일 바뀌어 중복 판정이 무너지지 않게. */
const MARKET_DATA_AS_OF = RAW_AS_OF ?? 'unknown';

/** 주제의 사실을 만든다. 쓸 게 없으면 null(그 회차는 건너뛴다). */
export const buildFactsFor = (topic: ReporterTopic, ledger: ReporterLedger, today: Date): ReporterFacts | null => {
  const used = ledger.entries.map((entry) => entry.factKey);
  if (topic === 'week-ahead') return buildWeekAheadFacts(today);
  if (topic === 'income-target') return buildIncomeTargetFacts(pickNextIncomeTarget(used), MARKET_DATA_AS_OF);
  const ticker = pickNextSpotlightTicker(used);
  return ticker ? buildTickerSpotlightFacts(ticker, MARKET_DATA_AS_OF) : null;
};

/** 직전 주제와 다른 주제부터, 쓸 사실이 있는 첫 주제. */
export const nextFacts = (ledger: ReporterLedger, today: Date, requested?: ReporterTopic): ReporterFacts | null => {
  const last = ledger.entries[ledger.entries.length - 1]?.topic;
  const order = requested ? [requested] : [...REPORTER_TOPICS.filter((topic) => topic !== last), ...(last ? [last] : [])];
  const done = new Set(ledger.entries.map((entry) => entry.factKey));
  for (const topic of order) {
    const facts = buildFactsFor(topic, ledger, today);
    if (facts && !done.has(facts.factKey)) return facts;
  }
  return null;
};

/**
 * 초안의 회차 키로 **바로 그 회차**의 사실을 다시 만든다(발행 시점 검증용).
 * - `week-ahead:<날짜>` → 그 날짜 기준 일정
 * - `income-target:<만원>:<기준일>` / `ticker-spotlight:<티커>:<기준일>` → 지금 시세 기준일이 키와 같을 때만
 * 시세가 그 사이에 갱신됐으면 숫자가 달라졌으므로 null — 그 초안은 발행하지 않는다(다음 회차에 새로 쓴다).
 */
export const factsFromKey = (factKey: string): ReporterFacts | null => {
  const [topic, first, second] = factKey.split(':');
  if (topic === 'week-ahead' && first) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(first);
    if (!match) return null;
    return buildWeekAheadFacts(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  if (second !== MARKET_DATA_AS_OF) return null;
  if (topic === 'income-target' && first) return buildIncomeTargetFacts(Number(first), MARKET_DATA_AS_OF);
  if (topic === 'ticker-spotlight' && first) return buildTickerSpotlightFacts(first, MARKET_DATA_AS_OF);
  return null;
};
