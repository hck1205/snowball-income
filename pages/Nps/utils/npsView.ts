import {
  NPS_PORTFOLIO,
  npsReclassifiedIssuers,
  npsTotalChangePercent
} from '@/shared/constants/npsPortfolio';
import type { NpsHolding, NpsMove, NpsPortfolioSnapshot } from '@/shared/constants/npsPortfolio';

/**
 * 화면이 그릴 형태로 접는 **순수 계산**. 네트워크도 `new Date()` 도 없다.
 */

/** 표에 보일 줄 수. 전체 562종을 다 그리면 화면이 자료 덤프가 된다. */
export const HOLDING_ROWS = 30;

export type NpsViewModel = {
  readonly snapshot: NpsPortfolioSnapshot;
  readonly holdings: readonly NpsHolding[];
  readonly opened: readonly NpsMove[];
  readonly closed: readonly NpsMove[];
  /** 직전 분기 대비 신고 총액 변화율(%). 비교 불가면 `null`. */
  readonly totalChangePercent: number | null;
  /** 합병·본사 이전으로 신규·청산 양쪽에 걸친 이름. 화면이 단서를 달 때 쓴다. */
  readonly reclassified: ReadonlySet<string>;
};

export const buildNpsViewModel = (snapshot: NpsPortfolioSnapshot = NPS_PORTFOLIO): NpsViewModel => ({
  snapshot,
  holdings: snapshot.topHoldings.slice(0, HOLDING_ROWS),
  opened: snapshot.opened,
  closed: snapshot.closed,
  totalChangePercent: npsTotalChangePercent(snapshot),
  reclassified: npsReclassifiedIssuers(snapshot)
});

/**
 * 달러를 한국어 자릿수로 줄인다.
 *
 * ⚠ 원화로 환산하지 않는다 — 공시 시점 환율을 알 수 없어서, 환산하는 순간 "언제 환율인가"라는
 *   답할 수 없는 질문이 생긴다(국회의원 화면과 같은 규율).
 */
export const formatUsdShort = (value: number): string => {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}십억 달러`;
  if (value >= 1e6) return `${Math.round(value / 1e6)}백만 달러`;
  return `${Math.round(value).toLocaleString('ko-KR')}달러`;
};

/**
 * 변화율 표시. 🔴 **부호를 글자로 먼저 말한다** — 색은 그 위에 얹힐 뿐이라
 * 색각 이상·흑백에서도 방향이 사라지지 않는다(이 레포 공통 규율).
 */
export const formatChangePercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '—';
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${sign}${Math.abs(rounded).toFixed(1)}%`;
};

export type ChangeDirection = 'up' | 'down' | 'flat';

export const changeDirection = (value: number | null): ChangeDirection => {
  if (value === null || !Number.isFinite(value) || Math.abs(value) < 0.05) return 'flat';
  return value > 0 ? 'up' : 'down';
};

/** 비중(%). `null` 이면 값을 지어내지 않고 표시를 비운다. */
export const formatWeight = (value: number | null): string =>
  value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)}%`;

/**
 * 공시의 발행사 이름을 화면용으로 다듬는다.
 *
 * 13F 는 전부 대문자로 온다(`NVIDIA CORPORATION`). 그대로 두면 표 전체가 소리치는 것처럼 읽힌다.
 * ⚠ 함부로 소문자로 내리지 않는다 — `NVIDIA`·`AT&T` 처럼 대문자가 이름의 일부인 경우가 있어서,
 *   **법인격 접미사만** 다듬고 나머지는 원문을 지킨다. 이름을 바꾸는 것이 아니라 꼬리를 자르는 일이다.
 */
export const formatIssuer = (issuer: string): string =>
  issuer
    .replace(/\s+(CORPORATION|CORP|INCORPORATED|INC|COMPANY|CO|LIMITED|LTD|PLC|SA|NV|AG)\.?$/i, '')
    .replace(/\s+COM$/i, '')
    .trim() || issuer;
