/**
 * **배당 히든스타** 선정 규칙 — 순수 함수. 데이터도 IO 도 여기 없다.
 *
 * ## 무엇인가
 *
 * 배당킹(50년)·배당귀족(25년)·배당챔피언(25년) **어디에도 없지만**, 배당을 오래·꾸준히 늘려 온
 * 종목들. 세 목록은 전부 "연속 증배 연수"라는 한 자를 쓰는데, 그 자에 못 미친다고 해서 배당주로서
 * 성적이 나쁜 것은 아니다. 20년 연속 늘렸어도 챔피언 문턱(25년)에서 다섯 해가 모자라면 어느 목록에도
 * 안 실린다 — 그 틈에 있는 종목을 섹터 불문하고 모으는 것이 이 목록이다.
 *
 * ## 🔴 왜 "고르지" 않고 "거르는가"
 *
 * 이 레포는 검증할 수 없는 숫자를 쓰지 않는다(`dividendLists.types.ts` 머리말 — 배당귀족 연수를
 * 기계로 계산했다가 오차 16~52% 가 나오자 그 필드를 통째로 없앤 이력이 있다). 같은 이유로
 * **"좋은 종목"을 사람이 지목하지 않는다.** 규칙을 적어 두고 데이터가 통과시킨 것만 싣는다.
 * 그래야 다음 달에도, 다른 사람이 돌려도 같은 결과가 나온다.
 *
 * ## 규칙 (2026-08-08 사용자 확정)
 *
 * 게이트 — 하나라도 못 넘으면 후보가 아니다:
 *   ① 킹·귀족·챔피언 어디에도 없다                    ← "히든" 의 정의
 *   ② 최근 배당 삭감 이력이 없다                      ← 늘려 온 종목만
 *   ③ 선행 배당률 ≥ 2.5%                             ← 배당주라 부를 최소선
 *   ④ 5년 배당성장률 ≥ 4%                            ← 함정 차단
 *   ⑤ 배당률이 또래보다 확연히 높으면(≥ 5.43%) 성장률 ≥ 8%   ← 🔴 ④ 의 구멍을 막는다(아래)
 *   ⑥ 섹터가 분류돼 있다                              ← 성격을 말할 수 없는 종목은 싣지 않는다
 *
 * 순위 — `배당률 + 성장률 × 0.5` 내림차순. 배당률 1%p 를 성장률 2%p 와 같게 본다.
 *
 * ### 왜 배당률 **상한**이 아니라 조건부 성장률인가
 *
 * 고배당은 그 자체로 위험 신호가 아니다. 위험한 것은 **"고배당인데 성장이 없는"** 조합이고, 그건
 * 배당이 좋아서가 아니라 주가가 빠져서 배당률이 올라간 모습이다. 상한을 두면 성장률이 두 자릿수인
 * 리츠(실측: NXRT 배당률 8.2% · 성장률 10.3%)가 억울하게 걸리고, 정작 성장이 멈춘 종목(CHCT 10.5% ·
 * 2.3%)은 상한만 안 넘으면 통과한다.
 *
 * ### 🔴 ⑤ 를 나중에 더한 이유 (2026-08-08, 실측이 설계의 구멍을 드러냈다)
 *
 * 처음에는 ④ 하나로 충분하다고 봤다. 그런데 규칙을 실제 데이터에 돌리니 1위가 **PRGO**(배당률
 * 10.86% · 성장률 5.2%)로 나왔다. 성장률 하한 4% 를 **겨우** 넘겼을 뿐인데, 점수의 거의 전부가
 * 배당률에서 온다(10.86 + 2.6). 표본 p95 가 5.43% 인데 그 두 배인 종목이 목록의 얼굴이 되는 것이다.
 * 즉 ④ 는 "성장이 아예 없는" 것만 걸렀고, "고배당이 순위를 통째로 지배하는" 문제는 그대로였다.
 *
 * ⑤ 는 그 구멍을 한 문장으로 막는다 — **또래보다 배당률이 확연히 높다면 그만큼 성장으로도
 * 증명해야 한다.** 점수를 손보는 대신 게이트를 더한 것은, 점수 조작은 화면에 설명할 수 없지만
 * 이 문장은 그대로 화면에 적을 수 있기 때문이다. 규칙이 곧 설명이어야 한다.
 *
 * ⚠ 통과한 종목 중에도 배당률이 표본 상위면 화면이 **주의를 함께 표시한다**(`isHighYieldOutlier`).
 *   규칙이 통과시킨 것과 사용자가 알아야 할 것은 다른 문제다.
 */
import type { DividendListSectorId } from './dividendLists.types';

/** 선정에 필요한 최소 입력. 유니버스 항목에서 이 모양만 뽑아 쓴다(원본을 그대로 끌고 다니지 않는다). */
export type HiddenStarCandidate = {
  readonly ticker: string;
  readonly name: string;
  /** 유니버스가 섹터를 못 붙인 종목은 `null` 로 온다 — 게이트 ⑤ 가 여기서 걸린다. */
  readonly sector: DividendListSectorId | null;
  readonly sourceSectorLabel?: string;
  /** 소스 ETF 가 보증하는 연속 증배 **하한**(10 · 15 · 20). 정확한 연수는 쓰지 않는다. */
  readonly minimumStreakYears: number;
  readonly forwardYieldPercent?: number | null;
  readonly fiveYearGrowthPercent?: number | null;
  /** 최근 삭감 신고. 값이 있으면 후보에서 뺀다. */
  readonly recentCut?: unknown;
};

/* ── 규칙 상수 ─────────────────────────────────────────────────────────────────
 * 🔴 숫자를 코드 안에 흩지 않는다. 화면이 이 값들을 **그대로 읽어 규칙을 문장으로** 보여 주기
 *    때문이다 — 규칙과 설명이 갈리면 사용자는 무엇을 보고 있는지 알 수 없다. */

/** 배당주라 부를 최소선(%). */
export const HIDDEN_STAR_MIN_YIELD_PERCENT = 2.5;

/** 함정 차단선(%). 고배당이라도 이만큼은 늘려 왔어야 한다. */
export const HIDDEN_STAR_MIN_GROWTH_PERCENT = 4;

/** 순위 점수에서 성장률에 곱하는 가중치. 배당률 1%p ≒ 성장률 2%p. */
export const HIDDEN_STAR_GROWTH_WEIGHT = 0.5;

/**
 * "배당률이 표본 상위" 라고 주의를 붙이는 선(%).
 *
 * 실측 분포(목록 밖 후보 136종, 2026-08-04): p50 2.68 · p75 3.38 · p90 4.39 · p95 5.43 · 최대 10.86.
 * p95 를 넘으면 또래와 확연히 다른 자리에 있다는 뜻이라 그 선을 쓴다. **거르지는 않는다** —
 * 규칙이 통과시킨 것과 사용자가 알아야 할 것은 다른 문제다.
 */
export const HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT = 5.43;

/**
 * 배당률이 위 선을 넘는 종목에게 **추가로** 요구하는 성장률(%).
 *
 * 🔴 이 하나가 목록의 성격을 지킨다. 없으면 배당률만 높은 종목이 순위를 지배한다(머리말 ⑤).
 *    값 8% 는 임의가 아니다 — 하한 4% 의 두 배이고, 실측에서 이 선을 넘는 고배당 종목은
 *    성장률도 두 자릿수였다(NXRT 10.3%). "또래의 두 배로 주려면 성장도 두 배는 보여라"는 뜻이다.
 */
export const HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT = 8;

/** 선정된 한 종목. 화면이 쓰는 값이 전부 여기 있다. */
export type HiddenStar = {
  readonly ticker: string;
  readonly name: string;
  readonly sector: DividendListSectorId;
  readonly sourceSectorLabel?: string;
  readonly minimumStreakYears: number;
  readonly forwardYieldPercent: number;
  readonly fiveYearGrowthPercent: number;
  /** 순위 점수. 화면에 보이지는 않지만 정렬 근거를 되짚을 수 있게 남긴다. */
  readonly score: number;
  /** 배당률이 표본 상위라 주의 문장을 함께 보여야 하는가. */
  readonly isHighYieldOutlier: boolean;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** 순위 점수. 배당률에 무게를 더 둔 혼합이다(사용자 확정: A + C). */
export const hiddenStarScore = (yieldPercent: number, growthPercent: number): number =>
  yieldPercent + growthPercent * HIDDEN_STAR_GROWTH_WEIGHT;

/**
 * 게이트 다섯을 통과한 종목을 점수 내림차순으로 돌려준다.
 *
 * @param candidates 후보 유니버스(수집기의 `entries`).
 * @param listedTickers 킹·귀족·챔피언에 이미 실린 티커 — 게이트 ① 이 이 집합을 쓴다.
 *
 * ⚠ **정렬이 안정적이어야 한다.** 점수가 같으면 티커 사전순으로 갈라, 같은 입력이면 같은 순서가
 *   나온다. 안 그러면 매달 생성물이 이유 없이 흔들려 diff 가 소음이 된다.
 */
export const selectHiddenStars = (
  candidates: readonly HiddenStarCandidate[],
  listedTickers: ReadonlySet<string>
): HiddenStar[] => {
  const selected: HiddenStar[] = [];

  for (const candidate of candidates) {
    if (listedTickers.has(candidate.ticker)) continue; // ① 히든이 아니다
    if (candidate.recentCut !== null && candidate.recentCut !== undefined) continue; // ② 삭감 이력
    if (candidate.sector === null || candidate.sector === undefined) continue; // ⑥ 성격 불명

    const yieldPercent = candidate.forwardYieldPercent;
    const growthPercent = candidate.fiveYearGrowthPercent;
    if (!isFiniteNumber(yieldPercent) || !isFiniteNumber(growthPercent)) continue; // 지표 없음
    if (yieldPercent < HIDDEN_STAR_MIN_YIELD_PERCENT) continue; // ③
    if (growthPercent < HIDDEN_STAR_MIN_GROWTH_PERCENT) continue; // ④
    /*
     * ⑤ 또래보다 배당률이 확연히 높으면 성장으로도 증명해야 한다.
     * 🔴 이 줄이 없으면 배당률만 높은 종목이 1위를 차지한다(머리말의 PRGO 실측).
     */
    if (
      yieldPercent >= HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT &&
      growthPercent < HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT
    ) {
      continue;
    }

    selected.push({
      ticker: candidate.ticker,
      name: candidate.name,
      sector: candidate.sector,
      ...(candidate.sourceSectorLabel ? { sourceSectorLabel: candidate.sourceSectorLabel } : {}),
      minimumStreakYears: candidate.minimumStreakYears,
      forwardYieldPercent: yieldPercent,
      fiveYearGrowthPercent: growthPercent,
      score: hiddenStarScore(yieldPercent, growthPercent),
      isHighYieldOutlier: yieldPercent >= HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT
    });
  }

  return selected.sort((left, right) => right.score - left.score || left.ticker.localeCompare(right.ticker));
};

/**
 * 그달의 히든스타 = 점수 1위.
 *
 * 🔴 **한 종목만 고른다는 것이 이 화면의 약속**이다. 여러 개를 보여 주면 목록과 다를 바 없고,
 *    "이달의 하나"라는 자리가 사라진다. 후보가 없으면 `null` — 채워 넣지 않는다.
 */
export const pickMonthlyHiddenStar = (stars: readonly HiddenStar[]): HiddenStar | null => stars[0] ?? null;
