/**
 * GA 트래픽 리포트 — 판정과 문구(순수 함수, 2026-11-13).
 *
 * 왜 **참여 세션(engagedSessions)** 으로 판정하나: 이 사이트의 세션은 절반 이상이 봇이다
 * (2026-11-06 하루 39세션 중 참여 2 — 구글·AWS 데이터센터 도시, 직접 유입, 참여 0). GA 의 참여 세션은
 * "10초 이상 머물렀거나 · 2페이지 이상 봤거나 · 전환이 있었던" 세션이라 그런 봇이 거의 걸러진다.
 * 그래서 급증 판정도, 리포트의 첫 숫자도 참여 세션이다. 전체 세션은 옆에 같이 적어 봇 비율을 보인다.
 *
 * 문구는 텔레그램 **일반 텍스트**(parse_mode 없음)다 — 마크다운 이스케이프 실수로 전송이 실패하는
 * 표면을 아예 없앤다.
 */

export type DayTotals = {
  /** `YYYYMMDD` (GA date 차원 그대로). */
  readonly date: string;
  readonly sessions: number;
  readonly engagedSessions: number;
  readonly activeUsers: number;
  readonly pageViews: number;
};

export type BreakdownRow = {
  readonly label: string;
  readonly sessions: number;
  readonly engagedSessions: number;
};

export type PeriodTotals = Omit<DayTotals, 'date'>;

/** 급증 기준 — 어제 참여 세션이 이 수 이상이면서 평소의 이 배수 이상일 때만 알린다. */
export const SPIKE_MIN_ENGAGED = 10;
export const SPIKE_RATIO = 2;
/** 평소 = 어제 직전 이 일수의 참여 세션 평균. */
export const BASELINE_DAYS = 14;

export type SpikeVerdict = {
  readonly spike: boolean;
  readonly day: DayTotals | null;
  /** 직전 BASELINE_DAYS 일 평균 참여 세션. 자료가 없으면 0. */
  readonly baseline: number;
};

/**
 * 마지막 날(어제)이 급증인가. 날짜순이 아니어도 된다 — 안에서 정렬한다.
 * 평소가 0이어도 절대 하한(SPIKE_MIN_ENGAGED)이 있어 "1명 → 2명" 같은 소음은 울리지 않는다.
 */
export const detectSpike = (days: readonly DayTotals[]): SpikeVerdict => {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const day = sorted.at(-1) ?? null;
  if (!day) return { spike: false, day: null, baseline: 0 };
  const before = sorted.slice(0, -1).slice(-BASELINE_DAYS);
  const baseline = before.length ? before.reduce((sum, row) => sum + row.engagedSessions, 0) / before.length : 0;
  const spike = day.engagedSessions >= SPIKE_MIN_ENGAGED && day.engagedSessions >= baseline * SPIKE_RATIO;
  return { spike, day, baseline };
};

export const sumTotals = (rows: readonly PeriodTotals[]): PeriodTotals =>
  rows.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      engagedSessions: acc.engagedSessions + row.engagedSessions,
      activeUsers: acc.activeUsers + row.activeUsers,
      pageViews: acc.pageViews + row.pageViews
    }),
    { sessions: 0, engagedSessions: 0, activeUsers: 0, pageViews: 0 }
  );

/** `20261113` → `11/13`. 형식이 아니면 `-` (자료가 비었을 때 "NaN/NaN" 대신). */
export const shortDate = (date: string): string =>
  /^\d{8}$/.test(date) ? `${Number(date.slice(4, 6))}/${Number(date.slice(6, 8))}` : '-';

const pct = (part: number, whole: number): string => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '-');

/** 이전 대비 변화 — "+120%" · "-30%" · 이전이 0이면 "새로 생김". */
export const changeLabel = (current: number, previous: number): string => {
  if (previous <= 0) return current > 0 ? '새로 생김' : '변화 없음';
  const diff = Math.round(((current - previous) / previous) * 100);
  return `${diff >= 0 ? '+' : ''}${diff}%`;
};

const breakdownLines = (rows: readonly BreakdownRow[], limit: number): string[] => {
  const top = [...rows]
    .filter((row) => row.engagedSessions > 0)
    .sort((a, b) => b.engagedSessions - a.engagedSessions || b.sessions - a.sessions)
    .slice(0, limit);
  return top.length ? top.map((row, i) => `${i + 1}. ${row.label} — 참여 ${row.engagedSessions} / 세션 ${row.sessions}`) : ['(참여 세션 없음)'];
};

const totalsLines = (totals: PeriodTotals): string[] => [
  `참여 세션 ${totals.engagedSessions} (전체 세션 ${totals.sessions}, 봇·이탈 추정 ${pct(totals.sessions - totals.engagedSessions, totals.sessions)})`,
  `방문자 ${totals.activeUsers} · 페이지뷰 ${totals.pageViews}`
];

export type Breakdowns = {
  readonly sources: readonly BreakdownRow[];
  readonly landingPages: readonly BreakdownRow[];
};

const TOP_N = 5;

/** 급증 알림 — 어제 하루. */
export const formatSpikeMessage = (verdict: SpikeVerdict, breakdowns: Breakdowns): string => {
  const day = verdict.day!;
  return [
    `🚀 Hungry Hippo 트래픽 급증 — ${shortDate(day.date)}`,
    '',
    ...totalsLines(day),
    `평소(직전 ${BASELINE_DAYS}일 평균) 참여 세션 ${verdict.baseline.toFixed(1)} → ${changeLabel(day.engagedSessions, verdict.baseline)}`,
    '',
    '유입 경로',
    ...breakdownLines(breakdowns.sources, TOP_N),
    '',
    '첫 페이지',
    ...breakdownLines(breakdowns.landingPages, TOP_N)
  ].join('\n');
};

export type WeeklyInput = {
  /** 이번 주(직전 7일) 시작·끝 `YYYYMMDD`. */
  readonly from: string;
  readonly to: string;
  readonly current: PeriodTotals;
  readonly previous: PeriodTotals;
  readonly breakdowns: Breakdowns;
};

/** 주간 요약 — 매주 월요일, 급증과 상관없이. */
export const formatWeeklyMessage = (input: WeeklyInput): string =>
  [
    `📊 Hungry Hippo 주간 트래픽 — ${shortDate(input.from)}~${shortDate(input.to)}`,
    '',
    ...totalsLines(input.current),
    `지난주 대비 참여 세션 ${changeLabel(input.current.engagedSessions, input.previous.engagedSessions)} (지난주 ${input.previous.engagedSessions})`,
    '',
    '유입 경로',
    ...breakdownLines(input.breakdowns.sources, TOP_N),
    '',
    '첫 페이지',
    ...breakdownLines(input.breakdowns.landingPages, TOP_N)
  ].join('\n');

/** 실행 날짜(한국시간)가 월요일인가 — 주간 요약을 붙일지. */
export const isKstMonday = (now: Date): boolean => new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
