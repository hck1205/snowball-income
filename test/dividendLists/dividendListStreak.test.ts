// @vitest-environment node — 순수 데이터 계약 테스트(DOM 불필요).
import { describe, expect, it } from 'vitest';
import {
  CURATED_DIVIDEND_LISTS,
  DIVIDEND_LIST_ALL,
  KINGS_STREAK_UNRESOLVED,
  MAX_STREAK_START_YEAR,
  MIN_STREAK_START_YEAR,
  dividendListMemberSchema,
  formatDividendStreak,
  toDividendStreakDisplay
} from '@/shared/constants/dividendLists';

/**
 * 연속 증배 **시작 연도**의 계약.
 *
 * 이 값이 하는 일은 하나다 — 화면이 "몇 년째인지"를 **매년 스스로 다시 세게** 하는 것.
 * 그래서 지켜야 할 것도 세 가지뿐이다:
 *  ① 적힌 시작 연도는 그 목록의 기준(배당킹 50년)을 실제로 만족하는가
 *  ② 숫자 옆에 출처가 있는가 (이 레포에서 출처 없는 숫자는 지어낸 숫자다)
 *  ③ 시작 연도를 모르는 종목이 화면에서 **빈칸이 되지 않는가** (하한도 정보다)
 */

const KINGS = CURATED_DIVIDEND_LISTS.kings;
/** 검증 기준 연도. 🔴 `new Date()` 를 쓰지 않는다 — 해가 바뀌면 깨지는 테스트는 계약이 아니다. */
const THIS_YEAR = 2026;

const memberOf = (ticker: string) => {
  const found = KINGS.members.find((member) => member.ticker === ticker);
  if (found === undefined) throw new Error(`배당킹 목록에 ${ticker} 가 없다`);
  return found;
};

describe('연속 증배 시작 연도 — 배당킹 데이터', () => {
  it('시작 연도가 적힌 킹은 전부 50년 이상을 만족한다', () => {
    const withYear = KINGS.members.filter((member) => member.streakStartYear !== undefined);
    expect(withYear.length).toBeGreaterThan(0);

    for (const member of withYear) {
      const years = THIS_YEAR - (member.streakStartYear as number) + 1;
      // 🔴 50년 미만인 값이 하나라도 들어오면 그 종목은 애초에 배당킹이 아니다 — 목록과 값이
      //    서로를 반증하는 상태이므로, 화면에 내보내기 전에 여기서 멈춘다.
      expect(
        years,
        `${member.ticker} 시작 ${member.streakStartYear} → ${years}년째 (킹 기준 50년 미만)`
      ).toBeGreaterThanOrEqual(KINGS.minimumStreakYears);
    }
  });

  it('시작 연도가 있으면 출처도 반드시 함께 있다 — 세 목록 전부', () => {
    for (const list of DIVIDEND_LIST_ALL) {
      for (const member of list.members) {
        expect(member.streakStartYear === undefined).toBe(member.streakSource === undefined);
      }
    }
  });

  it('출처 문자열이 되짚을 수 있는 두 입력값(증배 횟수·마지막 증배 지급월)을 담는다', () => {
    // 출처가 "어디서 봤다"만 말하면 다음 리뷰어가 값을 재현할 수 없다. 역산의 입력이 남아 있어야 한다.
    const ko = memberOf('KO');
    expect(ko.streakStartYear).toBe(1963);
    expect(ko.streakSource).toContain('stockanalysis.com');
    expect(ko.streakSource).toContain('64회');
    expect(ko.streakSource).toContain('2026-03');
  });

  it('하반기 증배 기업은 올해가 아니라 마지막 증배가 지급된 해에서 역산한다', () => {
    // EMR 은 2025-11 지급부터 올랐고 횟수는 69다. 올해(2026)에서 빼면 1958 이 되어 한 해 밀린다.
    expect(memberOf('EMR').streakStartYear).toBe(1957);
    // 상반기 증배 기업은 올해가 곧 기준 연도다.
    expect(memberOf('PG').streakStartYear).toBe(1957);
    expect(memberOf('JNJ').streakStartYear).toBe(1963);
  });

  it('판단이 갈린 10종은 값을 비워 둔다 — 틀린 연수는 없는 것보다 나쁘다', () => {
    for (const ticker of KINGS_STREAK_UNRESOLVED) {
      expect(memberOf(ticker).streakStartYear, `${ticker} 는 비어 있어야 한다`).toBeUndefined();
    }
    // 나머지는 전부 채워져 있어야 한다 — 조용히 빠진 종목이 생기는 것을 막는다.
    const missing = KINGS.members
      .filter((member) => member.streakStartYear === undefined)
      .map((member) => member.ticker)
      .sort();
    expect(missing).toEqual([...KINGS_STREAK_UNRESOLVED].sort());
  });

  it('배당귀족·배당챔피언은 시작 연도를 적지 않는다 (선택 필드라는 사실 자체를 고정한다)', () => {
    for (const id of ['aristocrats', 'champions'] as const) {
      for (const member of CURATED_DIVIDEND_LISTS[id].members) {
        expect(member.streakStartYear).toBeUndefined();
      }
    }
  });
});

describe('연속 증배 시작 연도 — 스키마 경계', () => {
  const base = {
    ticker: 'KO',
    name: 'Coca-Cola Company (The)',
    sector: 'consumerStaples',
    sourceSectorLabel: 'Consumer Defensive',
    confirmedBy: ['stockanalysis.com']
  };

  it('시작 연도가 없어도 통과한다 (선택 필드)', () => {
    expect(dividendListMemberSchema.safeParse(base).success).toBe(true);
  });

  it('경계값 1900 과 올해는 통과하고, 그 바깥은 막는다', () => {
    const withYear = (year: number) =>
      dividendListMemberSchema.safeParse({ ...base, streakStartYear: year, streakSource: '출처' }).success;

    expect(withYear(MIN_STREAK_START_YEAR)).toBe(true);
    expect(withYear(MAX_STREAK_START_YEAR)).toBe(true);
    expect(withYear(MIN_STREAK_START_YEAR - 1)).toBe(false);
    // 🔴 미래 연도를 막지 않으면 화면이 음수 연수를 그린다.
    expect(withYear(MAX_STREAK_START_YEAR + 1)).toBe(false);
  });

  it('정수가 아닌 연도를 막는다', () => {
    const parsed = dividendListMemberSchema.safeParse({
      ...base,
      streakStartYear: 1963.5,
      streakSource: '출처'
    });
    expect(parsed.success).toBe(false);
  });

  it('출처 없는 시작 연도를 막는다 — 그리고 값 없는 출처도 막는다', () => {
    expect(dividendListMemberSchema.safeParse({ ...base, streakStartYear: 1963 }).success).toBe(false);
    expect(dividendListMemberSchema.safeParse({ ...base, streakSource: '출처' }).success).toBe(false);
    expect(dividendListMemberSchema.safeParse({ ...base, streakStartYear: 1963, streakSource: '' }).success).toBe(
      false
    );
  });
});

describe('연속 증배 표기 규칙', () => {
  const measured = { streakStartYear: 1963, streakSource: 'stockanalysis.com 64회' };

  it('시작 연도가 있으면 그 해부터 몇 년째인지로 말한다', () => {
    const display = toDividendStreakDisplay(measured, 50, 2026);
    expect(display).toEqual({
      kind: 'measured',
      startYear: 1963,
      years: 64,
      source: 'stockanalysis.com 64회'
    });
    expect(formatDividendStreak(display)).toBe('1963년부터 64년째');
  });

  it('해가 바뀌면 데이터를 안 고쳐도 연수가 하나 늘어난다 — 이 구조를 택한 이유', () => {
    expect(toDividendStreakDisplay(measured, 50, 2026).years).toBe(64);
    expect(toDividendStreakDisplay(measured, 50, 2027).years).toBe(65);
    expect(toDividendStreakDisplay(measured, 50, 2030).years).toBe(68);
  });

  it('시작 연도를 모르면 하한으로 말한다 — 🔴 절대 "—"로 비우지 않는다', () => {
    expect(formatDividendStreak(toDividendStreakDisplay({}, 50, 2026))).toBe('50년 이상');
    expect(formatDividendStreak(toDividendStreakDisplay({}, 25, 2026))).toBe('25년 이상');
    // 후보 유니버스의 ETF 하한(SMDV 10년)도 같은 규칙으로 그린다.
    expect(formatDividendStreak(toDividendStreakDisplay({}, 10, 2026))).toBe('10년 이상');
  });

  it('출처만 있고 연도가 없으면 근거 없는 숫자 대신 하한으로 떨어진다', () => {
    // 스키마가 막는 형태지만, 화면은 스키마를 통과하지 않은 폴백 데이터도 그린다.
    const display = toDividendStreakDisplay({ streakSource: '출처만 남은 줄' }, 50, 2026);
    expect(display.kind).toBe('atLeast');
  });

  it('목록의 실제 데이터로 그리면 킹 46종이 전부 무언가를 말한다 (빈칸 0)', () => {
    for (const member of KINGS.members) {
      const label = formatDividendStreak(toDividendStreakDisplay(member, KINGS.minimumStreakYears, THIS_YEAR));
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toContain('—');
      expect(label).toMatch(/년/);
    }
  });
});
