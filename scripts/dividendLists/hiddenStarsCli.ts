/**
 * 배당 히든스타 생성기 — 유니버스에서 규칙(`dividendLists.hiddenStars.ts`)을 돌려 커밋되는 생성물을 만든다.
 *
 * ```sh
 * npm run dividend:hidden-stars
 * ```
 *
 * ## 🔴 왜 화면에서 계산하지 않는가
 *
 * 규칙은 순수 함수라 브라우저에서도 돈다. 그런데 입력인 유니버스 원본이 **172KB · 262종**이고,
 * 화면이 그걸 import 하면 라우트 청크가 그만큼 무거워진다 — 배당 목록 폴더가 유니버스 JSON 을
 * 배럴에서 일부러 빼 둔 이유와 같다(`dividendLists/index.ts` 주석). 그래서 빌드 전에 한 번 돌려
 * **통과한 종목만·화면이 쓰는 필드만** 추린 작은 파일을 만든다.
 *
 * ## 🔴 이달의 히든스타는 "그때 뽑힌 것"으로 **보존**된다
 *
 * 매달 이 스크립트를 다시 돌리면 지표가 바뀌어 1위도 바뀐다. 그때 지난달 선정을 다시 계산하면
 * **과거가 뒤집힌다** — 8월에 소개한 종목이 9월에 돌렸더니 다른 종목으로 바뀌는 것은 기록이 아니라
 * 거짓말이다. 그래서 이미 있는 달은 건드리지 않고, **없는 달만 추가**한다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CURATED_DIVIDEND_LISTS } from '@/shared/constants/dividendLists';
import {
  selectHiddenStars,
  type HiddenStar,
  type HiddenStarCandidate
} from '@/shared/constants/dividendLists/dividendLists.hiddenStars';

const ROOT = resolve(process.cwd());
const DIR = resolve(ROOT, 'shared/constants/dividendLists');
const UNIVERSE = resolve(DIR, 'dividendLists.universe.generated.json');
const LISTS = resolve(DIR, 'dividendLists.generated.json');
const OUT = resolve(DIR, 'dividendLists.hiddenStars.generated.json');

type MonthlyPick = {
  /** `2026-08`. 소개한 달. */
  readonly month: string;
  /** 그달에 쓴 데이터의 기준일 — 나중에 되짚을 수 있어야 한다. */
  readonly asOf: string;
  readonly star: HiddenStar;
};

type HiddenStarsFile = {
  readonly asOf: string;
  readonly note: string;
  readonly members: readonly HiddenStar[];
  /** 오래된 달이 위. 화면은 뒤집어 최신부터 보여 준다. */
  readonly monthly: readonly MonthlyPick[];
};

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

/** 킹·귀족·챔피언에 이미 실린 티커 — 게이트 ①. 큐레이션과 생성물을 **둘 다** 본다. */
const collectListedTickers = (): Set<string> => {
  const listed = new Set<string>();

  for (const list of Object.values(CURATED_DIVIDEND_LISTS)) {
    for (const member of list.members) listed.add(member.ticker);
  }

  const snapshot = readJson(LISTS) as { lists?: Record<string, { members?: { ticker: string }[] }> };
  for (const list of Object.values(snapshot.lists ?? {})) {
    for (const member of list.members ?? []) listed.add(member.ticker);
  }

  return listed;
};

const toCandidates = (universe: unknown): HiddenStarCandidate[] => {
  const entries = (universe as { entries?: unknown[] }).entries ?? [];
  return entries.map((raw) => {
    const entry = raw as {
      ticker: string;
      name: string;
      sector: string | null;
      sourceSectorLabel?: string;
      minimumStreakYears: number;
      metrics?: {
        forwardYieldPercent?: number | null;
        fiveYearGrowthPercent?: number | null;
        recentCut?: unknown;
      };
    };
    return {
      ticker: entry.ticker,
      name: entry.name,
      sector: (entry.sector ?? null) as HiddenStarCandidate['sector'],
      ...(entry.sourceSectorLabel ? { sourceSectorLabel: entry.sourceSectorLabel } : {}),
      minimumStreakYears: entry.minimumStreakYears,
      forwardYieldPercent: entry.metrics?.forwardYieldPercent,
      fiveYearGrowthPercent: entry.metrics?.fiveYearGrowthPercent,
      recentCut: entry.metrics?.recentCut
    };
  });
};

/** `2026-08-04` → `2026-08`. */
const monthOf = (isoDate: string): string => isoDate.slice(0, 7);

const main = (): void => {
  const universe = readJson(UNIVERSE) as { asOf?: string };
  const asOf = universe.asOf ?? new Date().toISOString().slice(0, 10);

  const members = selectHiddenStars(toCandidates(universe), collectListedTickers());
  if (members.length === 0) {
    console.error('[hidden-stars] 통과한 종목이 없다. 규칙이나 유니버스를 확인하라 — 빈 목록은 쓰지 않는다.');
    process.exitCode = 1;
    return;
  }

  /* 이미 있는 달은 그대로 둔다(머리말: 과거는 뒤집지 않는다). */
  let previous: HiddenStarsFile | null = null;
  try {
    previous = readJson(OUT) as HiddenStarsFile;
  } catch {
    previous = null;
  }

  const month = monthOf(asOf);
  const monthly = [...(previous?.monthly ?? [])];
  const already = monthly.some((pick) => pick.month === month);
  if (!already) {
    monthly.push({ month, asOf, star: members[0] });
    monthly.sort((left, right) => left.month.localeCompare(right.month));
  }

  const file: HiddenStarsFile = {
    asOf,
    note: '수집기(npm run dividend:hidden-stars)가 유니버스에 선정 규칙을 돌려 만든다. 손으로 고치지 마라. 규칙은 shared/constants/dividendLists/dividendLists.hiddenStars.ts 가 정본이다.',
    members,
    monthly
  };

  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  console.log(`[hidden-stars] ${members.length}종 · ${month} 선정 ${already ? '유지' : `추가(${members[0].ticker})`}`);
};

main();
