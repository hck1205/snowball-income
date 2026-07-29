import type { UserPortfolioCloudPayload } from '@/shared/lib/supabase';
import type { PortfolioHolding } from '@/shared/lib/portfolio';
import { PORTFOLIO_RECORD_VERSION, buildPortfolioRecord } from './portfolioStorage';
import type { PortfolioPersistedRecord } from './portfolioStorage';

/**
 * 내 포트폴리오 ↔ 클라우드 동기화 **정책**. 순수 함수(IO·React 비의존).
 *
 * 🔴 시뮬레이터와 정책이 **다르다.** 시뮬레이터는 탭 단위 3-way 로 양쪽 편집을 모두 살리지만
 * (`cloudWorkspaceThreeWay`), 포트폴리오는 **클라우드가 이긴다**(사용자 결정 2026-07-29).
 *
 * 왜 다른가: 보유 종목은 "여러 기기에서 동시에 다르게 편집"할 일이 드물고, 사용자가 기대하는 것은
 * "어느 기기에서 열어도 내 포트폴리오가 그대로"다. 병합은 그 기대를 배신한다(합쳐진 적 없는
 * 조합이 나온다).
 *
 * ⚠ 대가를 분명히 한다 — **다른 기기에서 방금 추가한 종목이 사라질 수 있다.** 그래서
 * `outcome` 으로 "덮어썼다"를 돌려주고, 화면이 그 사실을 말한다(무음 덮어쓰기 금지).
 */

/** 클라우드 payload 스키마 버전. 모양이 바뀌면 올리고 `parseCloudPayload` 가 마이그레이션한다. */
export const PORTFOLIO_CLOUD_VERSION = 1;

export type PortfolioSyncOutcome =
  /** 클라우드에 저장된 것이 있어 그것으로 맞췄다(로컬을 덮었다). */
  | { readonly type: 'applied-cloud'; readonly record: PortfolioPersistedRecord; readonly calendarTickers: string[] }
  /** 클라우드가 비어 있어 로컬을 올렸다(첫 로그인·첫 저장). */
  | { readonly type: 'pushed-local' }
  /** 양쪽이 같아 할 일이 없다. */
  | { readonly type: 'noop' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * 서버 payload 를 앱 모양으로 되돌린다. **서버는 이 모양을 검증하지 않으므로**(jsonb)
 * 여기서 막지 않으면 구버전·손상된 값이 그대로 화면에 온다.
 * 못 믿을 값이면 `null` — 호출부는 "클라우드에 없는 것"으로 취급한다(로컬을 지우지 않는다).
 */
export const parseCloudPayload = (
  raw: unknown
): { record: PortfolioPersistedRecord; calendarTickers: string[] } | null => {
  if (!isRecord(raw)) return null;
  if (raw.v !== PORTFOLIO_CLOUD_VERSION) return null;
  if (!Array.isArray(raw.holdings)) return null;

  const taxPercent = typeof raw.taxPercent === 'number' && Number.isFinite(raw.taxPercent) ? raw.taxPercent : 0;
  const updatedAt = typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0;

  // 보유 목록의 각 행 검증은 buildPortfolioRecord 의 정규화에 맡긴다 — 저장 경로와 같은 규칙을 쓴다.
  const record = buildPortfolioRecord(raw.holdings as PortfolioHolding[], taxPercent, updatedAt);

  const calendarTickers = Array.isArray(raw.calendarTickers)
    ? raw.calendarTickers.filter((ticker): ticker is string => typeof ticker === 'string' && ticker.length > 0)
    : [];

  return { record, calendarTickers };
};

/** 앱 상태를 클라우드 payload 로 만든다. */
export const toCloudPayload = (
  record: PortfolioPersistedRecord,
  calendarTickers: readonly string[]
): UserPortfolioCloudPayload => ({
  v: PORTFOLIO_CLOUD_VERSION,
  holdings: record.holdings,
  taxPercent: record.taxPercent,
  ...(calendarTickers.length > 0 ? { calendarTickers: [...calendarTickers] } : {}),
  updatedAt: record.updatedAt
});

/** 두 기록이 의미상 같은가(저장 시각은 뺀다 — 시각만 다른 것은 올릴 이유가 없다). */
const isSameMeaning = (a: PortfolioPersistedRecord, b: PortfolioPersistedRecord): boolean =>
  a.taxPercent === b.taxPercent && JSON.stringify(a.holdings) === JSON.stringify(b.holdings);

/**
 * 로그인 직후 한 번 도는 판정.
 *
 * | 클라우드 | 로컬 | 결과 |
 * |---|---|---|
 * | 있음 | 무엇이든 | **applied-cloud** — 클라우드가 이긴다(내용이 같으면 noop) |
 * | 없음 | 있음 | **pushed-local** — 첫 로그인, 지금까지 쓰던 것을 올린다 |
 * | 없음 | 없음/빈 것 | **noop** |
 *
 * 로컬이 비어 있어도 클라우드가 있으면 적용한다 — 새 기기에서 로그인한 경우다.
 */
export const decidePortfolioSync = (params: {
  cloud: { record: PortfolioPersistedRecord; calendarTickers: string[] } | null;
  local: PortfolioPersistedRecord | null;
}): PortfolioSyncOutcome => {
  const { cloud, local } = params;

  if (cloud) {
    if (local && isSameMeaning(cloud.record, local)) return { type: 'noop' };
    return { type: 'applied-cloud', record: cloud.record, calendarTickers: cloud.calendarTickers };
  }

  // 클라우드가 비었다 — 올릴 것이 있을 때만 올린다(빈 것을 올려 슬롯을 만들지 않는다).
  if (local && local.holdings.length > 0) return { type: 'pushed-local' };
  return { type: 'noop' };
};

/** 저장 레코드가 "올릴 만한 내용"을 갖고 있는가 — 빈 슬롯을 만들지 않기 위한 게이트. */
export const hasPortfolioContent = (record: PortfolioPersistedRecord | null): boolean =>
  record !== null && record.holdings.length > 0;

export { PORTFOLIO_RECORD_VERSION };
