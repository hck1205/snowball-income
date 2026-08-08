/**
 * 배당 히든스타 **데이터 어댑터** — 생성물 JSON 을 화면이 아는 모양(`DividendList`)으로 옮긴다.
 *
 * 🔴 규칙은 여기 없다. 규칙은 `dividendLists.hiddenStars.ts`(순수) 가 정본이고, 그것을 유니버스에
 *    돌려 만든 결과가 `dividendLists.hiddenStars.generated.json` 이다. 이 파일은 그 결과를 읽기만 한다.
 *
 * ⚠ 생성물을 여기서 **직접 import 하는 것은 의도다**(16KB · 44종). 유니버스 원본(172KB · 262종)은
 *   배럴에서 일부러 빼 뒀지만, 이건 이미 추려진 것이라 라우트 청크가 그대로 들고 가도 된다.
 *
 * 🔴 여기서 throw 하지 마라 — 라우트 청크가 import 한다. 파일이 깨졌으면 빈 목록으로 떨어지고
 *    화면은 "아직 준비되지 않았다"를 말한다. 배당 목록 폴더 전체가 같은 태도다.
 */
import rawHiddenStars from './dividendLists.hiddenStars.generated.json';
import type { DividendList, DividendListMember, DividendListSectorId } from './dividendLists.types';

/** 그달에 소개한 한 종목. 지난달 것은 **그때의 수치와 함께 보존**된다(생성기 머리말). */
export type HiddenStarMonthlyPick = {
  /** `2026-08`. */
  readonly month: string;
  /** 그달에 쓴 데이터의 기준일. */
  readonly asOf: string;
  readonly ticker: string;
  readonly name: string;
  readonly sector: DividendListSectorId;
  readonly minimumStreakYears: number;
  readonly forwardYieldPercent: number;
  readonly fiveYearGrowthPercent: number;
  /** 배당률이 표본 상위라 주의 문장을 함께 보여야 하는가. */
  readonly isHighYieldOutlier: boolean;
};

type RawStar = {
  ticker: string;
  name: string;
  sector: string;
  sourceSectorLabel?: string;
  minimumStreakYears: number;
  forwardYieldPercent: number;
  fiveYearGrowthPercent: number;
  isHighYieldOutlier: boolean;
};

type RawFile = {
  asOf?: string;
  members?: RawStar[];
  monthly?: { month: string; asOf: string; star: RawStar }[];
};

const raw = rawHiddenStars as RawFile;

const toMember = (star: RawStar): DividendListMember => ({
  ticker: star.ticker,
  name: star.name,
  sector: star.sector as DividendListSectorId,
  sourceSectorLabel: star.sourceSectorLabel ?? '',
  /*
   * 🔴 이 목록의 "확인해 준 소스"는 **규칙 그 자체**다. 앞의 세 목록은 바깥 명부를 옮겨 온 것이라
   *    누가 실었는지가 근거이지만, 여기는 우리가 공개된 규칙으로 걸러 낸 것이라 근거가 규칙이다.
   *    빈 배열로 두면 화면이 "출처 없음"으로 읽어 버리므로 규칙 이름을 적는다.
   */
  confirmedBy: ['배당 히든스타 선정 규칙'],
  /* 🔴 종목별 하한을 살린다 — 목록 하한(10년)으로 뭉개면 44종이 전부 같은 등급이 된다. */
  minimumStreakYears: star.minimumStreakYears,
  forwardYieldPercent: star.forwardYieldPercent,
  fiveYearGrowthPercent: star.fiveYearGrowthPercent
});

/** 생성물이 비었거나 깨졌을 때의 안전값. 화면은 0종을 그대로 말한다(지어내지 않는다). */
const FALLBACK_AS_OF = '';

export const HIDDEN_STARS_AS_OF: string = raw.asOf ?? FALLBACK_AS_OF;

/**
 * 배당 히든스타 목록.
 *
 * `minimumStreakYears` 는 **10** 이다 — 후보 유니버스를 만드는 ETF 중 가장 낮은 하한(SMDV, 10년)이
 * 그대로 이 목록의 하한이 된다. 실제 구성은 10년+ 22종 · 15년+ 8종 · 20년+ 14종처럼 섞여 있고,
 * 종목별 하한은 표가 따로 보여 준다.
 */
export const HIDDEN_STARS_LIST: DividendList = {
  id: 'hiddenStars',
  minimumStreakYears: 10,
  /* 🔴 상한이 24 인 것이 이 목록의 정의다 — 25년을 넘으면 배당귀족·배당챔피언 쪽으로 간다. */
  maximumStreakYears: 24,
  asOf: HIDDEN_STARS_AS_OF,
  sources: [
    {
      label: 'ProShares NOBL 보유내역',
      url: 'https://accounts.profunds.com/etfdata/psdlyhld.csv',
      role: 'primary',
      retrievedAt: '2026-07-31'
    },
    {
      label: 'SPDR SDY·SMDV·REGL 보유내역',
      url: 'https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-dividend-etf-sdy',
      role: 'primary',
      retrievedAt: '2026-07-31'
    }
  ],
  coverageNote:
    '배당킹·배당귀족·배당챔피언 어디에도 없는 종목만 담습니다. 후보는 배당성장 ETF(NOBL·SDY·SMDV·REGL) 보유내역에서 모았고, 공개된 선정 규칙을 통과한 종목만 실었습니다. 세 목록과 달리 바깥 기관이 만든 명부가 아니라 이 서비스가 규칙으로 걸러 낸 목록이며, 규칙과 기준일은 이 페이지에 그대로 적혀 있습니다. 연속 증배 연수는 후보를 모은 ETF가 보장하는 하한이고 정확한 연수가 아닙니다.',
  members: (raw.members ?? []).map(toMember)
};

/**
 * 월별 선정 — **최신이 앞**이다(화면이 최근부터 읽는다).
 *
 * 🔴 지난달 항목은 **그때 뽑힌 것 그대로** 남는다. 매달 지표가 바뀌므로 다시 계산하면 과거가
 *    뒤집힌다 — 8월에 소개한 종목이 9월에 다른 종목으로 바뀌는 것은 기록이 아니다.
 */
export const HIDDEN_STAR_MONTHLY: HiddenStarMonthlyPick[] = [...(raw.monthly ?? [])]
  .sort((left, right) => right.month.localeCompare(left.month))
  .map((pick) => ({
    month: pick.month,
    asOf: pick.asOf,
    ticker: pick.star.ticker,
    name: pick.star.name,
    sector: pick.star.sector as DividendListSectorId,
    minimumStreakYears: pick.star.minimumStreakYears,
    forwardYieldPercent: pick.star.forwardYieldPercent,
    fiveYearGrowthPercent: pick.star.fiveYearGrowthPercent,
    isHighYieldOutlier: pick.star.isHighYieldOutlier
  }));

/** 가장 최근에 소개한 종목. 아직 없으면 `null` — 자리를 비워 두지 채워 넣지 않는다. */
export const LATEST_HIDDEN_STAR: HiddenStarMonthlyPick | null = HIDDEN_STAR_MONTHLY[0] ?? null;

/** `2026-08` → `2026년 8월`. 화면이 여러 곳에서 쓰므로 한 곳에서만 만든다. */
export const formatHiddenStarMonth = (month: string): string => {
  const [year, rawMonth] = month.split('-');
  const monthNumber = Number(rawMonth);
  if (!year || !Number.isFinite(monthNumber)) return month;
  return `${year}년 ${monthNumber}월`;
};
