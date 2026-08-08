/**
 * **지출을 여러 각도에서** — 구성·추이·리듬·흐름도·달력·두 층·폭포·평소 비교.
 *
 * 🔴 전부 지출만 본다. 수입과 이체는 `reportFlows.ts` 가 맡는다 — 한 파일이 둘 다 하면
 *    "이 함수는 무엇을 세나"를 매번 확인해야 한다.
 */
import type { LedgerEntry } from '@/shared/lib/googleSheets';

import { alive, labelOf, monthOf, toSlices } from './reportShared';
import type { ReportMonth, ReportSlice } from './reportShared';

/* ── 구성(파이) ──────────────────────────────────────────────────────────────── */


/** 항목별 지출 구성. `month` 를 주면 그 달만, 없으면 전 기간. */
export const expenseByCategory = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): readonly ReportSlice[] => {
  const totals = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    if (month !== undefined && monthOf(entry) !== month) continue;
    const key = labelOf(entry.category);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  return toSlices(totals);
};

/** 결제수단별 지출. 🔴 카드 추천의 유일한 입력이 될 자리라 **적힌 값 그대로** 센다. */
export const expenseByMethod = (entries: readonly LedgerEntry[]): readonly ReportSlice[] => {
  const totals = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const key = labelOf(entry.method);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  return toSlices(totals);
};

/* ── 항목별 추이 ─────────────────────────────────────────────────────────────── */

export type ReportCategoryTrend = {
  readonly months: readonly ReportMonth[];
  /** 항목 이름 → 달별 금액(달 순서는 `months` 와 같다). */
  readonly series: readonly { readonly label: string; readonly values: readonly number[] }[];
};

/** 추이에 세울 항목 수. 그보다 많으면 읽을 수 없고, 나머지는 `기타` 한 줄로 접는다. */
export const CATEGORY_TREND_LIMIT = 5;

/**
 * 상위 항목이 **달마다 어떻게 움직였나.**
 *
 * 🔴 파이는 "지금 어떻게 나뉘나"를 말하고 이건 **"무엇이 늘고 있나"** 를 말한다 — 파이만 보면
 *    비중이 그대로여도 총액이 두 배가 된 것을 못 본다.
 * ⚠ 상위 밖 항목은 버리지 않고 `기타` 로 접는다. 버리면 달별 합이 실제 지출과 안 맞는다.
 */
export const categoryTrend = (
  entries: readonly LedgerEntry[],
  limit = CATEGORY_TREND_LIMIT
): ReportCategoryTrend => {
  const living = alive(entries).filter((entry) => entry.kind === 'expense');
  const months = [...new Set(living.map(monthOf))].sort();
  if (months.length === 0) return { months: [], series: [] };

  const totals = new Map<string, number>();
  for (const entry of living) {
    const key = labelOf(entry.category);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  const ranked = [...totals.entries()].sort(([, left], [, right]) => right - left).map(([label]) => label);
  const head = ranked.slice(0, limit);
  const headSet = new Set(head);
  const hasTail = ranked.length > head.length;

  const byLabel = new Map<string, number[]>();
  for (const label of head) byLabel.set(label, months.map(() => 0));
  if (hasTail) byLabel.set('기타', months.map(() => 0));

  const monthIndex = new Map(months.map((month, index) => [month, index]));
  for (const entry of living) {
    const key = labelOf(entry.category);
    const bucket = byLabel.get(headSet.has(key) ? key : '기타');
    if (!bucket) continue;
    bucket[monthIndex.get(monthOf(entry)) as number] += entry.amount;
  }

  return {
    months,
    series: [...byLabel.entries()].map(([label, values]) => ({ label, values }))
  };
};

/* ── 요일별 소비 리듬 ────────────────────────────────────────────────────────── */

export type ReportWeekdaySpending = {
  /** 0 = 일요일. */
  readonly weekday: number;
  readonly label: string;
  readonly total: number;
  /** 그 요일에 기록이 있던 날 수. */
  readonly days: number;
  /** 하루 평균. 🔴 요일마다 등장 횟수가 달라 **합계로 비교하면 왜곡**된다. */
  readonly average: number;
};

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 요일별 지출.
 *
 * 🔴 **합계가 아니라 평균으로 비교한다.** 기록 구간에 따라 월요일이 5번, 화요일이 4번일 수 있어
 *    합계로 세우면 그 차이가 소비 습관처럼 보인다.
 * ⚠ 하루에 여러 건이 있어도 그 날은 하루로 센다.
 */
export const weekdaySpending = (entries: readonly LedgerEntry[]): readonly ReportWeekdaySpending[] => {
  const totals = new Array(7).fill(0) as number[];
  const dates = Array.from({ length: 7 }, () => new Set<string>());

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const weekday = new Date(entry.date + 'T00:00:00').getDay();
    if (!Number.isFinite(weekday)) continue;
    totals[weekday] += entry.amount;
    dates[weekday].add(entry.date);
  }

  return WEEKDAY_LABEL.map((label, weekday) => {
    const days = dates[weekday].size;
    return {
      weekday,
      label,
      total: totals[weekday],
      days,
      average: days === 0 ? 0 : totals[weekday] / days
    };
  });
};

/* ── 돈의 흐름 (생키) ────────────────────────────────────────────────────────── */

export type ReportFlowNode = { readonly name: string };
export type ReportFlowLink = { readonly source: string; readonly target: string; readonly value: number };
export type ReportSankey = {
  readonly nodes: readonly ReportFlowNode[];
  readonly links: readonly ReportFlowLink[];
};

/** 흐름도의 가운데 마디 이름. 화면과 집계가 같은 글자를 봐야 한다. */
export const SANKEY_HUB = '들어온 돈';
/** 쓰지도 옮기지도 않고 남은 돈. */
export const SANKEY_LEFTOVER = '남은 돈';

/**
 * **돈이 어디서 와서 어디로 갔나** — 수입원 → 들어온 돈 → 항목별 지출 / 저축·투자 / 남은 돈.
 *
 * 🔴 이 그림이 가계부에서 가장 많은 것을 한 번에 말한다. 파이는 지출 안의 비율만 보여 주고
 *    막대는 달별 크기만 보여 주는데, 흐름도는 **번 돈이 어떻게 쪼개졌나**를 통째로 보여 준다.
 *
 * 🔴 **남은 돈이 음수면 그 마디를 만들지 않는다.** 생키는 음수 링크를 그릴 수 없고, 억지로
 *    0 으로 만들면 "딱 맞게 썼다"는 거짓이 된다 — 대신 화면이 그 사실을 문장으로 말한다.
 * ⚠ 수입이 없으면 빈 그림이다(그릴 원천이 없다).
 */
export const sankeyFlow = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): ReportSankey & { readonly overspent: number } => {
  const living = alive(entries).filter((entry) => month === undefined || monthOf(entry) === month);

  const incomeBy = new Map<string, number>();
  const expenseBy = new Map<string, number>();
  const transferBy = new Map<string, number>();

  for (const entry of living) {
    const key = labelOf(entry.category);
    if (entry.kind === 'income') incomeBy.set(key, (incomeBy.get(key) ?? 0) + entry.amount);
    else if (entry.kind === 'expense') expenseBy.set(key, (expenseBy.get(key) ?? 0) + entry.amount);
    else transferBy.set(key, (transferBy.get(key) ?? 0) + entry.amount);
  }

  const income = [...incomeBy.values()].reduce((total, value) => total + value, 0);
  if (income <= 0) return { nodes: [], links: [], overspent: 0 };

  const outTotal =
    [...expenseBy.values()].reduce((total, value) => total + value, 0)
    + [...transferBy.values()].reduce((total, value) => total + value, 0);
  const leftover = income - outTotal;

  const names = new Set<string>([SANKEY_HUB]);
  const links: ReportFlowLink[] = [];

  for (const [name, value] of incomeBy) {
    if (value <= 0) continue;
    /* 🔴 수입 항목 이름이 지출 항목과 같을 수 있다 — 마디 이름이 겹치면 생키가 고리를 만든다. */
    const source = `${name} (수입)`;
    names.add(source);
    links.push({ source, target: SANKEY_HUB, value });
  }
  for (const [name, value] of [...expenseBy, ...transferBy]) {
    if (value <= 0) continue;
    names.add(name);
    links.push({ source: SANKEY_HUB, target: name, value });
  }
  if (leftover > 0) {
    names.add(SANKEY_LEFTOVER);
    links.push({ source: SANKEY_HUB, target: SANKEY_LEFTOVER, value: leftover });
  }

  return {
    nodes: [...names].map((name) => ({ name })),
    links,
    /* 🔴 번 것보다 쓴 것이 많으면 그 크기를 돌려준다 — 화면이 문장으로 말한다. */
    overspent: leftover < 0 ? -leftover : 0
  };
};

/* ── 일별 지출 (캘린더 히트맵) ───────────────────────────────────────────────── */

export type ReportDailySpending = {
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly amount: number;
};

/**
 * 날짜별 지출.
 *
 * 🔴 **기록이 있는 날만** 돌려준다. 안 쓴 날과 안 적은 날을 0 으로 같게 만들면, 달력이 온통
 *    "안 썼다"로 칠해져 실제로 안 쓴 날의 뜻이 사라진다.
 */
export const dailySpending = (entries: readonly LedgerEntry[]): readonly ReportDailySpending[] => {
  const byDate = new Map<string, number>();
  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + entry.amount);
  }
  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amount]) => ({ date, amount }));
};

/** 캘린더가 덮을 해 목록. 기록이 있는 해만. */
export const spendingYears = (daily: readonly ReportDailySpending[]): readonly string[] =>
  [...new Set(daily.map((point) => point.date.slice(0, 4)))].sort();

/* ── 항목 → 상세항목 (선버스트) ─────────────────────────────────────────────── */

export type ReportSunburstNode = {
  readonly name: string;
  readonly value: number;
  readonly children?: readonly ReportSunburstNode[];
};

/**
 * 항목 안쪽 고리, 상세항목 바깥 고리.
 *
 * 🔴 도넛은 한 층만 보여 준다 — `식비` 가 크다는 것까지는 알아도 그 안에서 `외식` 과 `배달` 중
 *    무엇이 컸는지는 못 본다. 우리 시트는 두 층을 이미 갖고 있으므로 그것을 버릴 이유가 없다.
 * ⚠ 상세항목을 안 적은 기록은 항목 자체의 몫으로 남는다 — 억지로 `기타` 자식을 만들지 않는다
 *   (없는 분류를 지어내는 것과 같다).
 */
export const categorySunburst = (
  entries: readonly LedgerEntry[],
  month?: ReportMonth
): readonly ReportSunburstNode[] => {
  const tree = new Map<string, { own: number; children: Map<string, number> }>();

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    if (month !== undefined && monthOf(entry) !== month) continue;
    const parent = labelOf(entry.category);
    const node = tree.get(parent) ?? { own: 0, children: new Map<string, number>() };
    const child = (entry.subcategory ?? '').trim();
    if (child.length === 0) node.own += entry.amount;
    else node.children.set(child, (node.children.get(child) ?? 0) + entry.amount);
    tree.set(parent, node);
  }

  return [...tree.entries()]
    .map(([name, node]) => {
      const childTotal = [...node.children.values()].reduce((total, value) => total + value, 0);
      const children = [...node.children.entries()]
        .map(([childName, value]) => ({ name: childName, value }))
        .sort((left, right) => right.value - left.value);
      return {
        name,
        value: node.own + childTotal,
        ...(children.length > 0 ? { children } : {})
      };
    })
    .sort((left, right) => right.value - left.value);
};

/* ── 폭포 (한 달의 수입 → 지출 → 남은 돈) ───────────────────────────────────── */

export type ReportWaterfallStep = {
  readonly label: string;
  /** 이 칸이 시작하는 높이(투명 받침). */
  readonly base: number;
  /** 막대 길이. 언제나 양수다 — 방향은 `direction` 이 갖는다. */
  readonly size: number;
  readonly direction: 'up' | 'down' | 'total';
  /** 실제 값(부호 있음). 툴팁이 이걸 말한다. */
  readonly value: number;
};

/** 폭포에 세울 지출 항목 수. 나머지는 `기타` 한 칸으로 접는다. */
export const WATERFALL_LIMIT = 6;

/**
 * 한 달의 돈이 **어디서 깎여 나갔나**.
 *
 * 🔴 파이는 지출 안의 비율만 말한다. 폭포는 **수입에서 시작해 항목마다 깎이고 무엇이 남았는지**를
 *    한 줄로 보여 준다 — "왜 이만큼밖에 안 남았지"에 대한 답이 그림 자체다.
 * ⚠ 이체(저축·투자)도 한 칸으로 세운다. 쓴 것은 아니지만 **손에서 나간 것**은 맞고, 그걸 빼면
 *   마지막 "남은 돈"이 통장 잔액과 안 맞는다. 라벨이 그것이 저축임을 말한다.
 */
export const monthWaterfall = (
  entries: readonly LedgerEntry[],
  month: ReportMonth,
  limit = WATERFALL_LIMIT
): readonly ReportWaterfallStep[] => {
  const living = alive(entries).filter((entry) => monthOf(entry) === month);
  const income = living
    .filter((entry) => entry.kind === 'income')
    .reduce((total, entry) => total + entry.amount, 0);
  if (income <= 0) return [];

  const outBy = new Map<string, number>();
  for (const entry of living) {
    if (entry.kind === 'income') continue;
    const key = entry.kind === 'transfer' ? '저축·투자' : labelOf(entry.category);
    outBy.set(key, (outBy.get(key) ?? 0) + entry.amount);
  }

  const ranked = [...outBy.entries()].sort(([, left], [, right]) => right - left);
  const head = ranked.slice(0, limit);
  const tail = ranked.slice(limit);
  const steps: ReportWaterfallStep[] = [
    { label: '수입', base: 0, size: income, direction: 'up', value: income }
  ];

  let running = income;
  for (const [label, value] of head) {
    running -= value;
    steps.push({ label, base: Math.max(running, 0), size: value, direction: 'down', value: -value });
  }
  if (tail.length > 0) {
    const rest = tail.reduce((total, [, value]) => total + value, 0);
    running -= rest;
    steps.push({
      label: `기타 ${tail.length}개`,
      base: Math.max(running, 0),
      size: rest,
      direction: 'down',
      value: -rest
    });
  }

  /* 🔴 남은 돈이 음수면 받침을 0 으로 두고 크기만 그린다 — 음수 막대는 폭포에서 그릴 수 없다. */
  steps.push({
    label: '남은 돈',
    base: 0,
    size: Math.abs(running),
    direction: 'total',
    value: running
  });
  return steps;
};

/* ── 레이더 (이번 달 vs 평균) ───────────────────────────────────────────────── */

export type ReportRadarAxis = {
  readonly label: string;
  /** 축 최댓값 — 두 값 중 큰 쪽에 여유를 준다. */
  readonly max: number;
  readonly latest: number;
  readonly average: number;
};

/** 레이더 축 수. 셋 미만이면 도형이 안 되고, 여덟을 넘으면 라벨이 겹친다. */
export const RADAR_MIN_AXES = 3;
export const RADAR_MAX_AXES = 6;

/**
 * **이번 달이 평소와 어떻게 달랐나.**
 *
 * 🔴 추이 그래프는 항목별로 따로 봐야 하는데, 레이더는 **한 그림에서 튀는 축**을 찾게 해 준다.
 * ⚠ 평균은 **그 항목에 지출이 있던 달**로만 나눈다 — 없던 달을 0 으로 섞으면 평균이 낮아져
 *   이번 달이 실제보다 과하게 튀어 보인다.
 * 🔴 달이 둘 미만이면 비교할 평소가 없다 — 빈 배열을 돌려주고 화면이 그리지 않는다.
 */
export const categoryRadar = (
  entries: readonly LedgerEntry[],
  maxAxes = RADAR_MAX_AXES
): readonly ReportRadarAxis[] => {
  const living = alive(entries).filter((entry) => entry.kind === 'expense');
  const months = [...new Set(living.map(monthOf))].sort();
  if (months.length < 2) return [];

  const latestMonth = months[months.length - 1];
  const byCategory = new Map<string, Map<ReportMonth, number>>();
  for (const entry of living) {
    const key = labelOf(entry.category);
    const bucket = byCategory.get(key) ?? new Map<ReportMonth, number>();
    bucket.set(monthOf(entry), (bucket.get(monthOf(entry)) ?? 0) + entry.amount);
    byCategory.set(key, bucket);
  }

  const axes = [...byCategory.entries()]
    .map(([label, byMonth]) => {
      const latest = byMonth.get(latestMonth) ?? 0;
      /* 🔴 그 항목에 지출이 있던 달로만 나눈다(이번 달은 빼고 — 평소와 비교하는 것이다). */
      const past = [...byMonth.entries()].filter(([month]) => month !== latestMonth).map(([, value]) => value);
      const average = past.length === 0 ? 0 : past.reduce((total, value) => total + value, 0) / past.length;
      return { label, latest, average, max: Math.max(latest, average) * 1.2 };
    })
    .filter((axis) => axis.max > 0)
    .sort((left, right) => right.max - left.max)
    .slice(0, maxAxes);

  return axes.length >= RADAR_MIN_AXES ? axes : [];
};

/* ── 결제수단 × 고정/변동 ────────────────────────────────────────────────────── */

export type ReportMethodSplit = {
  /** 결제수단 이름. 큰 것부터. */
  readonly methods: readonly string[];
  /** `methods` 와 같은 순서의 고정비 금액. */
  readonly fixed: readonly number[];
  readonly variable: readonly number[];
};

/** 가로 막대에 세울 결제수단 수. 그보다 많으면 축이 빽빽해 읽을 수 없다. */
export const METHOD_SPLIT_LIMIT = 6;

/**
 * 결제수단마다 **고정비가 얼마고 변동비가 얼마인가.**
 *
 * 🔴 결제수단 합계만 보면 "이 카드를 많이 쓴다"까지다. 고정/변동을 쪼개면 **그 카드에 묶인 것이
 *    자동이체인지 그때그때 쓴 것인지**가 보인다 — 카드를 바꿀 수 있는지 판단하는 자리다.
 * ⚠ 결제수단을 안 적은 지출은 버리지 않고 미분류로 모은다.
 */
export const methodFixitySplit = (
  entries: readonly LedgerEntry[],
  limit = METHOD_SPLIT_LIMIT
): ReportMethodSplit => {
  const totals = new Map<string, { fixed: number; variable: number }>();

  for (const entry of alive(entries)) {
    if (entry.kind !== 'expense') continue;
    const key = labelOf(entry.method);
    const bucket = totals.get(key) ?? { fixed: 0, variable: 0 };
    if (entry.fixity === 'fixed') bucket.fixed += entry.amount;
    else bucket.variable += entry.amount;
    totals.set(key, bucket);
  }

  const ranked = [...totals.entries()]
    .sort(([, left], [, right]) => right.fixed + right.variable - (left.fixed + left.variable))
    .slice(0, limit);

  return {
    methods: ranked.map(([name]) => name),
    fixed: ranked.map(([, bucket]) => bucket.fixed),
    variable: ranked.map(([, bucket]) => bucket.variable)
  };
};
