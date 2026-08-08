/**
 * 배당 도감의 **카드 모델** — 순수 타입과 규칙. 데이터도 IO 도 여기 없다.
 *
 * ## 왜 도감인가
 *
 * 배당 목록 넷(킹·귀족·챔피언·히든스타)은 각각 "이 기준을 넘은 명단"이다. 그건 표로 읽는 것이고,
 * **모아 보는 재미**는 없다. 도감은 같은 데이터를 **한 벌의 카드**로 다시 세운 것이다 —
 * 번호가 있고, 타입이 있고, 희귀도가 있고, 내가 가진 것이 표시된다.
 *
 * ## 🔴 상표를 흉내 내지 않는다 (2026-08-08 사용자와 확인)
 *
 * 카드에서 **회사를 식별하는 것은 티커와 회사명**이다. 둘 다 우리 서체로 조판한다 — 회사 이름을
 * 적는 것은 지칭이지 상표 사용이 아니다. 반대로 **그 회사의 로고타입·심볼을 재현하는 것은 금지**다
 * (AI 로 만들든 손으로 그리든 결과가 닮으면 같은 문제다. 만든 방법은 상표법과 무관하다).
 *
 * 그림 자리(`artKey`)는 **우리 창작물만** 가리킨다. 지금은 섹터 기본 그림이고, 종목별 몬스터가
 * 그려지면 그 키만 바뀐다 — 카드 구조는 그대로다.
 *
 * ## 🔴 도감 번호는 영구하다
 *
 * 포켓몬 도감의 번호가 그렇듯, 한 번 매긴 번호는 바뀌지 않는다. 목록이 갱신돼 종목이 늘어도
 * **기존 번호는 그대로이고 새 종목이 뒤에 붙는다.** 사전순으로 매번 다시 매기면, 종목 하나가
 * 편입될 때마다 그 뒤 179장의 번호가 전부 밀린다 — 사용자가 기억한 "087번"이 다른 회사가 된다.
 * 그래서 번호는 계산이 아니라 **기록**이고, 생성물 파일이 그 기록이다.
 */
import type { DividendListSectorId } from '@/shared/constants/dividendLists';

/**
 * 희귀도 — **연속 증배 연수**로만 정한다.
 *
 * 🔴 배당률·성장률로 정하지 않는다. 그 둘은 매일 움직여서 어제 ★5 였던 카드가 오늘 ★3 이 된다.
 *    도감의 희귀도는 "얼마나 오래 지켜 왔는가"라는 **바뀌지 않는 사실**이어야 모으는 뜻이 생긴다.
 */
export type DexRarity = 1 | 2 | 3 | 4 | 5;

/** 희귀도 한 칸의 뜻. 화면이 이 문장을 그대로 쓴다. */
export const DEX_RARITY_LABEL: Readonly<Record<DexRarity, string>> = {
  5: '50년 이상',
  4: '25년 이상',
  3: '20년 이상',
  2: '15년 이상',
  1: '10년 이상'
};

/**
 * 연속 증배 하한 → 희귀도.
 *
 * ⚠ 여기 쓰는 연수는 **목록이 보장하는 하한**이지 종목별 정확값이 아니다(정확값은 계산이 불가능하다 —
 *   `dividendLists.types.ts` 머리말). 그래서 카드도 "50년 이상"처럼 하한으로만 말한다.
 */
export const toDexRarity = (minimumStreakYears: number): DexRarity => {
  if (minimumStreakYears >= 50) return 5;
  if (minimumStreakYears >= 25) return 4;
  if (minimumStreakYears >= 20) return 3;
  if (minimumStreakYears >= 15) return 2;
  return 1;
};

/** 카드 한 장. 화면이 쓰는 값이 전부 여기 있다. */
export type DexEntry = {
  /** 도감 번호(1-based). 🔴 한 번 매기면 바뀌지 않는다. */
  readonly number: number;
  readonly ticker: string;
  readonly name: string;
  /** 타입 = 섹터. 포켓몬의 타입과 같은 자리다. */
  readonly sector: DividendListSectorId;
  readonly rarity: DexRarity;
  /** 이 종목이 실린 목록들(킹·귀족·챔피언·히든스타). 카드 뒷면의 근거다. */
  readonly listIds: readonly string[];
  /** 선행 배당률(%). 아직 실측이 안 붙었으면 `null` — 0 으로 위장하지 않는다. */
  readonly forwardYieldPercent: number | null;
  /** 5년 배당성장률(%). 계산 불가면 `null`. */
  readonly fiveYearGrowthPercent: number | null;
  /**
   * 그림 키. 🔴 **우리 창작물만** 가리킨다(상표 재현 금지 — 머리말).
   * 종목별 몬스터가 없으면 섹터 기본 그림으로 떨어진다.
   */
  readonly artKey: string;
};

/** 종목별 그림이 아직 없을 때 쓰는 섹터 기본 키. */
export const sectorArtKey = (sector: DividendListSectorId): string => `sector:${sector}`;

/** 종목별 몬스터가 생기면 이 키가 된다. 파일 이름과 1:1 로 맞춘다. */
export const monsterArtKey = (ticker: string): string => `monster:${ticker.toLowerCase()}`;

/** 그림이 종목 전용인가(= 몬스터가 그려졌는가). 도감 완성률의 분자다. */
export const hasMonsterArt = (entry: DexEntry): boolean => entry.artKey.startsWith('monster:');
