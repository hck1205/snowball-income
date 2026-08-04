import { z } from 'zod';
import { DIVIDEND_LIST_SECTOR_IDS } from './dividendLists.sectors';
import { DIVIDEND_UNIVERSE_SOURCE_ETFS } from './dividendLists.universe.types';
import type { DividendUniverseSnapshot } from './dividendLists.universe.types';

/**
 * 후보 유니버스 생성물의 **경계 검증**. 🔴 이 스키마를 통과하지 못한 값은 **파일로 쓰지 않는다** —
 * 반쯤 깨진 생성물이 커밋되면 다음 단계(큐레이션)가 조용히 틀린 숫자를 근거로 삼는다.
 *
 * 목록 스냅샷(`dividendLists.schema.ts`)과 같은 규율을 따르되, 이쪽은 **숫자**를 담으므로 범위까지 못 박는다.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 여야 한다');

/** 목록 스키마와 **같은** 티커 규칙. 두 곳이 어긋나면 같은 회사가 두 표기로 갈린다. */
const tickerSchema = z
  .string()
  .regex(/^[A-Z]{1,5}(\.[A-Z])?$/, '티커는 대문자와 클래스 접미사(.B)만 허용한다');

/** 🔴 배당률 상한. 20% 초과는 특별배당·데이터 오류이지 실제 배당률이 아니다(가드가 먼저 잡는다). */
export const MAX_PLAUSIBLE_YIELD_PERCENT = 20;

const cutSchema = z.object({
  fromYear: z.number().int().min(1900).max(2200),
  toYear: z.number().int().min(1900).max(2200),
  fromRate: z.number().nonnegative(),
  toRate: z.number().nonnegative()
});

export const dividendUniverseMetricsSchema = z.object({
  price: z.number().positive('가격은 0보다 커야 한다 — 0이면 배당률이 무한대가 된다'),
  currency: z.string().min(1).nullable(),
  latestDividend: z.number().positive(),
  latestDividendDate: isoDate,
  /** 연 1회(연배당)~52회(주배당) 밖의 값은 주기 계산이 깨진 것이다. */
  paymentsPerYear: z.number().int().min(1).max(52),
  forwardAnnualDividend: z.number().positive(),
  forwardYieldPercent: z.number().positive().max(MAX_PLAUSIBLE_YIELD_PERCENT),
  /** 성장률은 음수일 수 있다(삭감). 계산 불가는 `null` — 0 으로 대체하지 않는다(뜻이 다르다). */
  fiveYearGrowthPercent: z.number().nullable(),
  recentCut: cutSchema.nullable(),
  firstDividendYear: z.number().int().min(1900).max(2200),
  measuredAt: isoDate
});

export const dividendUniverseIssueSchema = z.object({
  ticker: tickerSchema,
  kind: z.enum([
    'fetchFailed',
    'metricsUnavailable',
    'abnormalLatestPayment',
    'staleDividend',
    'implausibleYield',
    'streakContradiction',
    'growthUnavailable',
    'sectorMissing'
  ]),
  detail: z.string().min(1),
  blocking: z.boolean()
});

export const dividendUniverseEntrySchema = z.object({
  ticker: tickerSchema,
  name: z.string().min(1, '이름 없는 종목은 실을 수 없다'),
  sector: z.enum(DIVIDEND_LIST_SECTOR_IDS as [string, ...string[]]).nullable(),
  sourceSectorLabel: z.string().min(1).nullable(),
  /** 🔴 최소 1개 — 어느 ETF 에도 없는 종목은 후보가 될 이유가 없다. */
  sourceEtfs: z.array(z.enum(DIVIDEND_UNIVERSE_SOURCE_ETFS)).min(1),
  minimumStreakYears: z.number().int().min(1).max(200),
  metrics: dividendUniverseMetricsSchema.nullable()
});

export const dividendUniverseSnapshotSchema = z.object({
  asOf: isoDate,
  sourceAsOf: z.object({ proShares: isoDate.nullable(), sdy: isoDate.nullable() }),
  memberCountByEtf: z.record(z.enum(DIVIDEND_UNIVERSE_SOURCE_ETFS), z.number().int().min(1)),
  /** 🔴 빈 유니버스를 통과시키지 않는다 — 절반쯤 실패한 수집이 0종을 쓰고 지나가면 아무도 모른다. */
  entries: z.array(dividendUniverseEntrySchema).min(1),
  issues: z.array(dividendUniverseIssueSchema),
  coverage: z.object({
    total: z.number().int().min(1),
    withMetrics: z.number().int().min(0),
    withSector: z.number().int().min(0),
    withGrowth: z.number().int().min(0)
  })
});

/** 형태가 맞으면 스냅샷, 아니면 `null`. 호출부가 "쓰지 않는다"를 결정한다. */
export const parseDividendUniverseSnapshot = (raw: unknown): DividendUniverseSnapshot | null => {
  const parsed = dividendUniverseSnapshotSchema.safeParse(raw);
  return parsed.success ? (parsed.data as DividendUniverseSnapshot) : null;
};
