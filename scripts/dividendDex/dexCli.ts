/**
 * 배당 도감 생성기 — 목록 넷을 모아 카드 한 벌을 만든다.
 *
 * ```sh
 * npm run dividend:dex
 * ```
 *
 * ## 🔴 번호는 append-only 다
 *
 * 포켓몬 도감의 번호가 그렇듯 한 번 매긴 번호는 바뀌지 않는다. 이 스크립트는 **기존 번호를 읽어
 * 그대로 두고, 새 종목만 뒤에 붙인다.** 사전순으로 매번 다시 매기면 종목 하나가 편입될 때마다 그
 * 뒤 카드들의 번호가 전부 밀려, 사용자가 기억한 "087번"이 다른 회사가 된다.
 *
 * 목록에서 빠진 종목도 **번호를 회수하지 않는다.** 빈 번호가 생기는 편이, 그 번호를 다른 회사가
 * 물려받는 것보다 낫다(도감에서 사라진 것과 다른 것이 된 것은 다르다).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { DIVIDEND_LISTS, DIVIDEND_LIST_IDS } from '@/shared/constants/dividendLists';
import type { DividendListMember, DividendListSectorId } from '@/shared/constants/dividendLists';
import { sectorArtKey, toDexRarity } from '@/shared/constants/dividendDex/dividendDex.types';

const OUT = resolve(process.cwd(), 'shared/constants/dividendDex/dividendDex.generated.json');

type StoredEntry = {
  readonly number: number;
  readonly ticker: string;
  readonly name: string;
  readonly sector: DividendListSectorId;
  readonly rarity: number;
  readonly listIds: readonly string[];
  readonly forwardYieldPercent: number | null;
  readonly fiveYearGrowthPercent: number | null;
  readonly artKey: string;
};

type DexFile = {
  readonly asOf: string;
  readonly note: string;
  readonly entries: readonly StoredEntry[];
};

const readPrevious = (): DexFile | null => {
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')) as DexFile;
  } catch {
    return null;
  }
};

/** 종목별로 "어느 목록에 실렸나 + 그중 가장 높은 하한". 하한이 곧 희귀도다. */
type Collected = {
  member: DividendListMember;
  listIds: string[];
  bestStreak: number;
};

const collect = (): Map<string, Collected> => {
  const byTicker = new Map<string, Collected>();

  for (const listId of DIVIDEND_LIST_IDS) {
    const list = DIVIDEND_LISTS[listId];
    for (const member of list.members) {
      const found = byTicker.get(member.ticker);
      if (found) {
        found.listIds.push(listId);
        /* 🔴 여러 목록에 실렸으면 **가장 높은 하한**을 쓴다 — 킹이면서 챔피언일 수 없지만,
           히든스타와 겹칠 일이 생기면 낮은 쪽으로 떨어뜨리지 않는다. */
        const streak = member.minimumStreakYears ?? list.minimumStreakYears;
        if (streak > found.bestStreak) found.bestStreak = streak;
        /* 지표는 있는 쪽을 남긴다 — 목록마다 실측이 붙은 정도가 다르다. */
        if (found.member.forwardYieldPercent == null && member.forwardYieldPercent != null) {
          found.member = { ...found.member, forwardYieldPercent: member.forwardYieldPercent };
        }
        if (found.member.fiveYearGrowthPercent == null && member.fiveYearGrowthPercent != null) {
          found.member = { ...found.member, fiveYearGrowthPercent: member.fiveYearGrowthPercent };
        }
        continue;
      }
      /*
        * 🔴 **종목별 하한이 있으면 그것을 쓴다.** 히든스타는 종목마다 10/15/20년으로 다른데,
        *    목록 하한(10년)으로 뭉개면 44종이 전부 ★1 이 되어 도감의 등급이 무너진다.
        */
      byTicker.set(member.ticker, {
        member,
        listIds: [listId],
        bestStreak: member.minimumStreakYears ?? list.minimumStreakYears
      });
    }
  }

  return byTicker;
};

const main = (): void => {
  const collected = collect();
  const previous = readPrevious();

  /* 이미 번호를 받은 종목은 그 번호를 지킨다. */
  const assigned = new Map<string, number>();
  let maxNumber = 0;
  for (const entry of previous?.entries ?? []) {
    assigned.set(entry.ticker, entry.number);
    if (entry.number > maxNumber) maxNumber = entry.number;
  }

  /* 새 종목은 사전순으로 뒤에 붙인다 — 같은 입력이면 같은 순서가 나와야 한다. */
  const fresh = [...collected.keys()].filter((ticker) => !assigned.has(ticker)).sort((a, b) => a.localeCompare(b));
  for (const ticker of fresh) {
    maxNumber += 1;
    assigned.set(ticker, maxNumber);
  }

  const entries: StoredEntry[] = [...collected.entries()]
    .map(([ticker, item]) => ({
      number: assigned.get(ticker) as number,
      ticker,
      name: item.member.name,
      sector: item.member.sector,
      rarity: toDexRarity(item.bestStreak),
      listIds: [...item.listIds].sort(),
      forwardYieldPercent: item.member.forwardYieldPercent ?? null,
      fiveYearGrowthPercent: item.member.fiveYearGrowthPercent ?? null,
      /* 🔴 지금은 전부 섹터 기본 그림이다. 종목별 몬스터가 그려지면 이 값만 바뀐다. */
      artKey: sectorArtKey(item.member.sector)
    }))
    .sort((left, right) => left.number - right.number);

  /*
   * 목록에서 빠진 종목은 **번호를 회수하지 않는다** — 다만 카드로도 싣지 않는다.
   * (빈 번호가 생기는 편이, 그 번호를 다른 회사가 물려받는 것보다 낫다.)
   */
  const retired = (previous?.entries ?? []).filter((entry) => !collected.has(entry.ticker));

  /*
   * 🔴 **카드가 그대로면 날짜도 그대로 둔다**(2026-08-11).
   *
   * 종전에는 실행할 때마다 `asOf` 에 오늘을 썼다. 카드 180장이 한 글자도 안 바뀌어도 파일은 늘
   * 변경됐고, 그래서 "바뀐 게 없으면 커밋하지 않는다"는 자동화의 가드가 통하지 않았다(매달 날짜
   * 한 줄짜리 PR 이 열린다). 사람이 확인차 한 번 돌려도 작업 트리가 더러워졌다.
   *
   * `asOf` 는 "이 도감이 언제 만들어졌나"가 아니라 **"카드가 언제 바뀌었나"** 여야 한다 —
   * 그래야 화면의 기준일이 실제로 의미를 갖는다.
   */
  const nextEntries = JSON.stringify(entries);
  const isUnchanged = previous !== null && JSON.stringify(previous.entries ?? []) === nextEntries;

  const file: DexFile = {
    asOf: isUnchanged ? previous.asOf : new Date().toISOString().slice(0, 10),
    note: '수집기(npm run dividend:dex)가 배당 목록 넷을 모아 만든다. 손으로 고치지 마라. 🔴 number 는 append-only — 기존 값을 바꾸면 사용자가 기억한 도감 번호가 다른 회사가 된다.',
    entries
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  console.log(
    `[dex] ${entries.length}장 · 새 번호 ${fresh.length}개${retired.length > 0 ? ` · 목록에서 빠진 종목 ${retired.length}개(번호는 보존)` : ''}${isUnchanged ? ' · 변화 없음(기준일 유지)' : ''}`
  );
};

main();
