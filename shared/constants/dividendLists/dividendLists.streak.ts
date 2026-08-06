import type { DividendListMember } from './dividendLists.types';

/**
 * 연속 증배 기간을 **화면에 어떻게 말할 것인가**를 정하는 단일 출처.
 *
 * ## 두 가지 형태밖에 없다
 * | 아는 것 | 표기 | 예 |
 * |---|---|---|
 * | 시작 연도를 소스에서 확인했다 | 그 해부터 몇 년째인지 | `1963년부터 64년째` |
 * | 시작 연도를 모른다 | 목록·ETF 가 보장하는 **하한** | `50년 이상` |
 *
 * 🔴 **"—"(빈칸)는 만들지 않는다.** 시작 연도를 모른다고 아무것도 못 쓰는 게 아니다 — 배당킹 목록에
 * 실렸다는 사실 자체가 "50년 이상"을 보장한다. 하한도 정보이고, 빈칸은 "우리가 데이터를 못 채웠다"로
 * 읽혀 목록 전체의 신뢰를 깎는다.
 *
 * ## 🔴 왜 `올해 − 시작연도 + 1` 인가 (+1 이 실수가 아닌 이유)
 * 1963년에 처음 늘렸고 이후 매년 늘렸다면, 2026년은 그 스트릭의 **64번째 해**다
 * (1963이 1년째이므로 `2026 − 1963 + 1 = 64`). 그래서 표기도 "64년 연속"이 아니라 **"64년째"**다.
 *
 * 이 구분은 말장난이 아니라 **거짓말을 막는 장치**다. 기업마다 증배를 발표하는 달이 달라서(2월인
 * 곳도, 11월인 곳도 있다) "올해 증배가 이미 났는가"는 8월에 종목마다 다르다. "64년 연속"은 올해치
 * 증배가 끝났다고 **단정**하지만, "64년째"는 그 해 안에 있다는 사실만 말하므로 언제 봐도 참이다.
 * 실측 근거: 2026-08-04 기준 시작 연도를 적은 배당킹 36종 중 **12종은 아직 2026년 증배 전**이었다
 * (야후 지급이력 실측 — 전부 하반기 증배 기업). "N년 연속"으로 쓰면 그 12종에서 매년 8개월 동안
 * 아직 일어나지 않은 증배를 사실처럼 말하게 된다.
 */

/**
 * 화면이 그릴 연속 증배 표기.
 *
 * `kind` 로 갈라 두는 이유: 두 값은 **성격이 다르다**. `measured` 는 "이 해부터"라는 사실이고
 * `atLeast` 는 "적어도 이만큼"이라는 보장이다. 하나의 숫자 필드로 합치면 화면이 하한을 정확한
 * 연수처럼 그리게 된다.
 */
export type DividendStreakDisplay =
  | {
      kind: 'measured';
      /** 스트릭의 첫 증배 연도. */
      startYear: number;
      /** 올해가 스트릭의 몇 번째 해인가(`올해 − 시작연도 + 1`). */
      years: number;
      /** 시작 연도의 출처. 화면이 근거를 밝힐 수 있어야 한다. */
      source: string;
    }
  | {
      kind: 'atLeast';
      /** 목록·ETF 편입이 보장하는 연수 하한(배당킹 50, 배당귀족 25 …). */
      years: number;
    };

/** `streakStartYear` 를 가질 수 있는 것이면 무엇이든 받는다(목록 멤버·후보 유니버스 항목 공통). */
type StreakBearing = Pick<DividendListMember, 'streakStartYear' | 'streakSource'>;

/**
 * @param minimumStreakYears 시작 연도를 모를 때 쓸 하한. 목록이면 `list.minimumStreakYears`,
 *   후보 유니버스면 항목의 `minimumStreakYears`(편입 ETF 에서 도출한 값)를 넘긴다.
 * @param currentYear 기준 연도. 🔴 인자로 받는다 — 모듈 안에서 `new Date()` 를 부르면 테스트가
 *   해가 바뀔 때마다 깨지고, 서버렌더와 브라우저가 다른 값을 낼 수 있다.
 */
export const toDividendStreakDisplay = (
  member: StreakBearing,
  minimumStreakYears: number,
  currentYear: number
): DividendStreakDisplay => {
  const { streakStartYear, streakSource } = member;
  // 출처 없는 연도는 없는 것으로 다룬다. 스키마가 이미 막지만, 화면은 스키마를 통과하지 않은
  // 폴백 데이터도 그린다 — 여기서 한 번 더 막지 않으면 근거 없는 숫자가 화면까지 간다.
  if (streakStartYear === undefined || streakSource === undefined) {
    return { kind: 'atLeast', years: minimumStreakYears };
  }
  return {
    kind: 'measured',
    startYear: streakStartYear,
    years: currentYear - streakStartYear + 1,
    source: streakSource
  };
};

/**
 * 표기 한 줄. 목록 표의 셀 하나에 들어갈 길이로 짧게 쓴다.
 * ⚠ `measured` 를 "N년 연속"으로 바꾸지 마라 — 위 머리말의 "+1" 설명이 그 이유다.
 */
export const formatDividendStreak = (display: DividendStreakDisplay): string =>
  display.kind === 'measured'
    ? `${display.startYear}년부터 ${display.years}년째`
    : `${display.years}년 이상`;
