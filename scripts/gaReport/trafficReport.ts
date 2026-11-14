/**
 * GA 트래픽 리포트 — 판정과 문구(순수 함수, 2026-11-13).
 *
 * 왜 **참여 세션(engagedSessions)** 으로 판정하나: 이 사이트의 세션은 절반 이상이 봇이다
 * (2026-11-06 하루 39세션 중 참여 2 — 구글·AWS 데이터센터 도시, 직접 유입, 참여 0). GA 의 참여 세션은
 * "10초 이상 머물렀거나 · 2페이지 이상 봤거나 · 전환이 있었던" 세션이라 그런 봇이 거의 걸러진다.
 * 그래서 급증 판정도, 리포트의 첫 숫자도, 경로·페이지·기기 비율도 전부 참여 세션 기준이다.
 * 전체 세션은 옆에 같이 적어 봇·즉시 이탈 비율을 보인다.
 *
 * 문구는 텔레그램 **HTML** 모드다(굵게만 쓴다). GA 원값(경로·소스)은 반드시 `escapeHtml` 을 거친다 —
 * `<` 하나로 전송이 통째로 실패한다.
 */
import { deviceLabel, eventLabel, AUTO_EVENTS, pageLabel, sourceLabel, visitorLabel } from './labels';

export type PeriodTotals = {
  readonly sessions: number;
  readonly engagedSessions: number;
  readonly activeUsers: number;
  readonly pageViews: number;
  /** 사용자 참여 시간 합(초) — GA `userEngagementDuration`. */
  readonly engagementSeconds: number;
};

export type DayTotals = PeriodTotals & {
  /** `YYYYMMDD` (GA date 차원 그대로). */
  readonly date: string;
};

export type BreakdownRow = {
  readonly label: string;
  readonly sessions: number;
  readonly engagedSessions: number;
};

export type EventRow = { readonly name: string; readonly count: number };

/** GA 원값 그대로의 내역. 이름 붙이기 · 묶기는 문구를 만들 때 한다. */
export type Breakdowns = {
  readonly sources: readonly BreakdownRow[];
  readonly landingPages: readonly BreakdownRow[];
  readonly devices: readonly BreakdownRow[];
  readonly visitors: readonly BreakdownRow[];
  readonly events: readonly EventRow[];
};

/** 급증 기준 — 어제 참여 세션이 이 수 이상이면서 평소의 이 배수 이상일 때만 알린다. */
export const SPIKE_MIN_ENGAGED = 10;
export const SPIKE_RATIO = 2;
/** 평소 = 어제 직전 이 일수의 참여 세션 평균. */
export const BASELINE_DAYS = 14;
const TOP_N = 5;

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
      pageViews: acc.pageViews + row.pageViews,
      engagementSeconds: acc.engagementSeconds + row.engagementSeconds
    }),
    { sessions: 0, engagedSessions: 0, activeUsers: 0, pageViews: 0, engagementSeconds: 0 }
  );

// ── 작은 서식 도우미 ───────────────────────────────────────────────

export const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

const isGaDate = (date: string): boolean => /^\d{8}$/.test(date);

/** `20261113` → `11/13`. 형식이 아니면 `-` (자료가 비었을 때 "NaN/NaN" 대신). */
export const shortDate = (date: string): string => (isGaDate(date) ? `${Number(date.slice(4, 6))}/${Number(date.slice(6, 8))}` : '-');

/** `20261113` → `금` (달력 날짜 그대로, 시간대 무관). */
export const weekdayOf = (date: string): string =>
  isGaDate(date) ? WEEKDAY_KO[new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8)))).getUTCDay()]! : '';

/** `20261113` → `11/13(금)`. */
export const dayLabel = (date: string): string => (isGaDate(date) ? `${shortDate(date)}(${weekdayOf(date)})` : '-');

const pct = (part: number, whole: number): string => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '-');

/** 이전 대비 변화 — "+120%" · "-30%" · 이전이 0이면 "새로 생김". */
export const changeLabel = (current: number, previous: number): string => {
  if (previous <= 0) return current > 0 ? '새로 생김' : '변화 없음';
  const diff = Math.round(((current - previous) / previous) * 100);
  return `${diff >= 0 ? '+' : ''}${diff}%`;
};

/** 초 → "1분 20초" · "45초". */
export const durationLabel = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes}분${rest > 0 ? ` ${rest}초` : ''}` : `${rest}초`;
};

const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const;
/** 값 → 막대 한 칸(최댓값 기준). 0은 빈 칸 대신 가장 낮은 막대. */
export const barOf = (value: number, max: number): string =>
  max > 0 ? BARS[Math.min(BARS.length - 1, Math.round((value / max) * (BARS.length - 1)))]! : BARS[0];

// ── 묶기 ───────────────────────────────────────────────────────────

/** 원값 행을 이름으로 묶어 합친다(네이버 모바일·PC 검색 → "네이버 검색"). 참여 세션 많은 순. */
export const groupBy = (rows: readonly BreakdownRow[], name: (raw: string) => string): BreakdownRow[] => {
  const merged = new Map<string, BreakdownRow>();
  for (const row of rows) {
    const label = name(row.label);
    const prev = merged.get(label);
    merged.set(label, {
      label,
      sessions: (prev?.sessions ?? 0) + row.sessions,
      engagedSessions: (prev?.engagedSessions ?? 0) + row.engagedSessions
    });
  }
  return [...merged.values()].sort((a, b) => b.engagedSessions - a.engagedSessions || b.sessions - a.sessions);
};

const rankedLines = (rows: readonly BreakdownRow[], name: (raw: string) => string): string[] => {
  const grouped = groupBy(rows, name).filter((row) => row.engagedSessions > 0);
  const total = grouped.reduce((sum, row) => sum + row.engagedSessions, 0);
  if (!grouped.length) return ['(참여 세션 없음)'];
  return grouped.slice(0, TOP_N).map((row) => `• ${escapeHtml(row.label)} ${row.engagedSessions} (${pct(row.engagedSessions, total)})`);
};

/** "모바일 75% · PC 25%" — 참여 세션 비율. */
const shareLine = (rows: readonly BreakdownRow[], name: (raw: string) => string): string => {
  const grouped = groupBy(rows, name).filter((row) => row.engagedSessions > 0);
  const total = grouped.reduce((sum, row) => sum + row.engagedSessions, 0);
  return grouped.length ? grouped.map((row) => `${escapeHtml(row.label)} ${pct(row.engagedSessions, total)}`).join(' · ') : '-';
};

const eventLines = (events: readonly EventRow[]): string[] => {
  const merged = new Map<string, number>();
  for (const event of events) {
    if (AUTO_EVENTS.has(event.name) || event.count <= 0) continue;
    const label = eventLabel(event.name);
    merged.set(label, (merged.get(label) ?? 0) + event.count);
  }
  const top = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N);
  return top.length ? top.map(([label, count]) => `• ${escapeHtml(label)} ${count}회`) : ['(기록된 행동 없음)'];
};

const qualityLines = (totals: PeriodTotals): string[] => [
  `세션당 ${totals.sessions > 0 ? (totals.pageViews / totals.sessions).toFixed(1) : '-'}쪽 · 1인 평균 체류 ${
    totals.activeUsers > 0 ? durationLabel(totals.engagementSeconds / totals.activeUsers) : '-'
  }`,
  `전체 세션 ${totals.sessions} 중 봇·즉시 이탈 추정 ${pct(totals.sessions - totals.engagedSessions, totals.sessions)}`
];

const detailSections = (breakdowns: Breakdowns): string[] => [
  '',
  '<b>🔎 어디서 왔나</b> (참여 세션)',
  ...rankedLines(breakdowns.sources, sourceLabel),
  '',
  '<b>📄 처음 연 페이지</b>',
  ...rankedLines(breakdowns.landingPages, pageLabel),
  '',
  '<b>👥 누가</b>',
  shareLine(breakdowns.devices, deviceLabel),
  shareLine(breakdowns.visitors, visitorLabel),
  '',
  '<b>🖱 무엇을 했나</b>',
  ...eventLines(breakdowns.events)
];

// ── 메시지 ─────────────────────────────────────────────────────────

const ratioLabel = (verdict: SpikeVerdict): string =>
  verdict.baseline > 0 ? `평소의 ${(verdict.day!.engagedSessions / verdict.baseline).toFixed(1)}배` : '평소 기록 없음';

/** 일일 리포트 — 매일 아침, 어제 하루 전체. 급증 여부와 상관없이 같은 모양이다(급증은 따로 알린다). */
export const formatDailyMessage = (verdict: SpikeVerdict, breakdowns: Breakdowns): string => {
  const day = verdict.day!;
  return [
    '📋 <b>Hungry Hippo 일일 리포트</b>',
    `${dayLabel(day.date)} · ${ratioLabel(verdict)}`,
    '',
    '<b>📌 요약</b>',
    `참여 세션 <b>${day.engagedSessions}</b> (직전 ${BASELINE_DAYS}일 평균 ${verdict.baseline.toFixed(1)})`,
    `방문자 ${day.activeUsers} · 페이지뷰 ${day.pageViews}`,
    ...qualityLines(day),
    ...detailSections(breakdowns)
  ].join('\n');
};

const SPIKE_TOP = 3;

/**
 * 급증 알림 — 일일 리포트와 **별개로** 먼저 가는 짧은 메시지(2026-11-14 사용자 요청). 알림 미리보기만 봐도
 * "얼마나 · 어디서 · 무엇을" 이 보이게 세 줄씩만. 자세한 내역은 바로 뒤의 일일 리포트에 있다.
 */
export const formatSpikeAlert = (verdict: SpikeVerdict, breakdowns: Breakdowns): string => {
  const day = verdict.day!;
  const top = (rows: readonly BreakdownRow[], name: (raw: string) => string): string =>
    groupBy(rows, name)
      .filter((row) => row.engagedSessions > 0)
      .slice(0, SPIKE_TOP)
      .map((row) => `${escapeHtml(row.label)} ${row.engagedSessions}`)
      .join(' · ') || '-';
  return [
    `🚀 <b>트래픽 급증 — ${dayLabel(day.date)}</b>`,
    `참여 세션 <b>${day.engagedSessions}</b> · ${ratioLabel(verdict)} (평소 ${verdict.baseline.toFixed(1)})`,
    `유입: ${top(breakdowns.sources, sourceLabel)}`,
    `페이지: ${top(breakdowns.landingPages, pageLabel)}`
  ].join('\n');
};

export type WeeklyInput = {
  /** 이번 주(직전 7일) 날짜별 합계 — 요일 막대와 기간 표시에 쓴다. */
  readonly days: readonly DayTotals[];
  /**
   * 이번 주 합계 — GA 에 기간으로 따로 물은 값. 날짜별 합을 더하면 방문자가 중복으로 부푼다
   * (월·화에 온 한 사람이 2명). 없으면 날짜별 합으로 대신한다.
   */
  readonly current?: PeriodTotals;
  readonly previous: PeriodTotals;
  readonly breakdowns: Breakdowns;
  /** 지난주 첫 페이지 원값 — 이번 주에 처음 생긴 유입 페이지를 가린다. */
  readonly previousLandingPages: readonly BreakdownRow[];
};

/** 지난주에는 참여 세션이 없던 첫 페이지 중 이번 주에 생긴 것 — 새 글·새 페이지가 검색에 잡히기 시작한 신호. */
export const newLandingPages = (current: readonly BreakdownRow[], previous: readonly BreakdownRow[]): BreakdownRow[] => {
  const before = new Set(groupBy(previous, pageLabel).filter((row) => row.engagedSessions > 0).map((row) => row.label));
  return groupBy(current, pageLabel).filter((row) => row.engagedSessions > 0 && !before.has(row.label));
};

const compareLine = (label: string, current: number, previous: number): string =>
  `${label} ${current} (지난주 ${previous}, ${changeLabel(current, previous)})`;

/** 주간 요약 — 매주 월요일, 급증과 상관없이. */
export const formatWeeklyMessage = (input: WeeklyInput): string => {
  const days = [...input.days].sort((a, b) => a.date.localeCompare(b.date));
  const current = input.current ?? sumTotals(days);
  const max = Math.max(0, ...days.map((day) => day.engagedSessions));
  const fresh = newLandingPages(input.breakdowns.landingPages, input.previousLandingPages);
  return [
    '📊 <b>Hungry Hippo 주간 리포트</b>',
    `${dayLabel(days[0]?.date ?? '')} ~ ${dayLabel(days.at(-1)?.date ?? '')}`,
    '',
    '<b>📌 요약</b>',
    `참여 세션 <b>${current.engagedSessions}</b> (지난주 ${input.previous.engagedSessions}, ${changeLabel(current.engagedSessions, input.previous.engagedSessions)})`,
    compareLine('방문자', current.activeUsers, input.previous.activeUsers),
    compareLine('페이지뷰', current.pageViews, input.previous.pageViews),
    ...qualityLines(current),
    '',
    '<b>📅 요일별 참여 세션</b>',
    ...(days.length ? days.map((day) => `${weekdayOf(day.date)} ${barOf(day.engagedSessions, max)} ${day.engagedSessions}`) : ['(자료 없음)']),
    ...detailSections(input.breakdowns),
    '',
    '<b>🆕 이번 주 새로 유입된 페이지</b>',
    ...(fresh.length ? fresh.slice(0, TOP_N).map((row) => `• ${escapeHtml(row.label)} ${row.engagedSessions}`) : ['(없음)'])
  ].join('\n');
};

/** 실행 날짜(한국시간)가 월요일인가 — 주간 요약을 붙일지. */
export const isKstMonday = (now: Date): boolean => new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
