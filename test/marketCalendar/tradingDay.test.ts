// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  CURATED_FROM_YEAR,
  CURATED_THROUGH_YEAR,
  FOMC_MEETINGS,
  MARKET_EARLY_CLOSES,
  MARKET_HOLIDAYS,
  describeTradingDay,
  etToKst,
  isDaylightSaving,
  nextTradingDay,
  parseCalendarDate,
  toCalendarDate
} from '@/shared/constants/marketCalendar';

/**
 * 미국 증시 거래일 판정과 한국시각 환산의 계약.
 *
 * ## 🔴 이 테스트가 진짜로 막는 것
 * 이 화면이 틀리는 방식은 딱 셋이고, 셋 다 **조용히** 틀린다:
 *  ① 서머타임을 놓쳐 개장 시각이 한 시간 어긋난다 → 사용자가 밤 10시 반에 헛되이 기다린다.
 *  ② 폐장이 **다음 날**이라는 사실을 잃는다 → "05:00 폐장"을 그날 아침으로 읽는다.
 *  ③ 자료가 없는 해를 "정상 거래"로 답한다 → 2029년 성금요일에 장이 선다고 말한다.
 * 화면 스냅샷 테스트로는 셋 다 못 잡는다. 그래서 값으로 못 박는다.
 */

describe('서머타임 — 규칙에서 계산한다', () => {
  /**
   * 미국 서머타임은 2007년부터 **3월 둘째 일요일 ~ 11월 첫째 일요일** 로 고정이다.
   * 표로 적지 않고 규칙에서 뽑는 이유는 `marketCalendar.sessions.ts` 머리말에 있다.
   */
  it.each([
    ['2026-03-07', false, '3월 둘째 일요일 하루 전'],
    ['2026-03-08', true, '3월 둘째 일요일 = 시작'],
    ['2026-10-31', true, '11월 첫째 일요일 하루 전'],
    ['2026-11-01', false, '11월 첫째 일요일 = 종료'],
    ['2027-03-14', true, '2027 시작'],
    ['2027-11-07', false, '2027 종료']
  ])('%s → %s (%s)', (date, expected) => {
    const parsed = parseCalendarDate(date);
    expect(parsed).not.toBeNull();
    expect(isDaylightSaving(parsed as Date)).toBe(expected);
  });
});

describe('한국시각 환산', () => {
  /**
   * 🔴 폐장은 **거의 언제나 다음 날**이다. `dayOffset` 이 없으면 화면이 그 사실을 말할 수 없다.
   * ```
   *   미 동부      서머타임(UTC-4)   표준시(UTC-5)
   *   09:30 개장   22:30 당일        23:30 당일
   *   13:00 조기   02:00 다음날      03:00 다음날
   *   16:00 폐장   05:00 다음날      06:00 다음날
   * ```
   */
  it.each([
    ['09:30', true, '22:30', 0],
    ['09:30', false, '23:30', 0],
    ['13:00', true, '02:00', 1],
    ['13:00', false, '03:00', 1],
    ['16:00', true, '05:00', 1],
    ['16:00', false, '06:00', 1],
    ['14:00', true, '03:00', 1]
  ])('%s ET (서머타임 %s) → %s (+%d일)', (timeEt, dst, time, dayOffset) => {
    expect(etToKst(timeEt, dst)).toEqual({ time, dayOffset });
  });

  it('형식이 아니면 값을 지어내지 않는다', () => {
    expect(etToKst('9:30', true)).toBeNull();
    expect(etToKst('', true)).toBeNull();
  });
});

describe('거래일 판정', () => {
  it('주말은 휴장과 구분한다 — 주말은 규칙이고 휴장은 이유가 있는 날이다', () => {
    /* 2026-08-08 은 토요일, 08-09 는 일요일. */
    expect(describeTradingDay('2026-08-08')?.status).toBe('weekend');
    expect(describeTradingDay('2026-08-09')?.status).toBe('weekend');
    expect(describeTradingDay('2026-08-08')?.labelKo).toBeNull();
  });

  it('휴장일은 이름을 함께 말한다 — 색만으로는 왜 닫혔는지 알 수 없다', () => {
    const thanksgiving = describeTradingDay('2026-11-26');
    expect(thanksgiving?.status).toBe('closed');
    expect(thanksgiving?.labelKo).toBe('추수감사절');
    expect(thanksgiving?.openKst).toBeNull();
  });

  it('조기 폐장일은 13:00 에 닫고 한국시각도 그만큼 당겨진다', () => {
    /* 2026-11-27(금) = 추수감사절 다음날. 11월 말이라 서머타임은 이미 끝났다(UTC-5). */
    const day = describeTradingDay('2026-11-27');
    expect(day?.status).toBe('early');
    expect(day?.closeEt).toBe('13:00');
    expect(day?.daylightSaving).toBe(false);
    expect(day?.closeKst).toEqual({ time: '03:00', dayOffset: 1 });
  });

  it('정상 거래일은 09:30~16:00 이고 여름에는 한국시각이 한 시간 당겨진다', () => {
    const summer = describeTradingDay('2026-08-04');
    expect(summer?.status).toBe('open');
    expect(summer?.openKst).toEqual({ time: '22:30', dayOffset: 0 });
    expect(summer?.closeKst).toEqual({ time: '05:00', dayOffset: 1 });

    const winter = describeTradingDay('2026-12-01');
    expect(winter?.openKst).toEqual({ time: '23:30', dayOffset: 0 });
    expect(winter?.closeKst).toEqual({ time: '06:00', dayOffset: 1 });
  });

  /**
   * 🔴 이 화면의 존재 이유가 걸린 계약. 자료가 없는 해에 "정상 거래"를 답하면
   * 2029년 성금요일에 장이 선다고 말하게 된다 — 모르는 것은 `null` 로 답한다.
   */
  it('큐레이션 구간 밖이면 null 이다 — 모르는 것을 열려 있다고 말하지 않는다', () => {
    expect(describeTradingDay(`${CURATED_FROM_YEAR - 1}-06-15`)).toBeNull();
    expect(describeTradingDay(`${CURATED_THROUGH_YEAR + 1}-06-15`)).toBeNull();
    expect(describeTradingDay('2026-06-15')).not.toBeNull();
  });

  it('존재하지 않는 날짜와 형식 오류는 null 이다', () => {
    expect(describeTradingDay('2026-02-30')).toBeNull();
    expect(describeTradingDay('2026-13-01')).toBeNull();
    expect(describeTradingDay('20260601')).toBeNull();
  });
});

describe('다음 거래일', () => {
  it('주말을 건너뛴다', () => {
    /* 2026-08-07 은 금요일 → 다음 거래일은 08-10 월요일. */
    expect(nextTradingDay('2026-08-07')?.date).toBe('2026-08-10');
  });

  it('연휴를 건너뛴다 — 추수감사절 다음은 조기 폐장일이다', () => {
    const next = nextTradingDay('2026-11-25');
    expect(next?.date).toBe('2026-11-27');
    expect(next?.status).toBe('early');
  });

  it('성탄절 휴장 뒤 첫 거래일을 찾는다', () => {
    /* 2026-12-25(금) 휴장 → 26·27 주말 → 28(월). */
    expect(nextTradingDay('2026-12-24')?.date).toBe('2026-12-28');
  });
});

describe('큐레이션 자료의 무결성', () => {
  /** 손으로 적는 표라 오타가 조용히 들어온다 — 형식과 중복을 여기서 잠근다. */
  it('휴장일 날짜가 전부 실재하고 중복이 없다', () => {
    const dates = MARKET_HOLIDAYS.map((holiday) => holiday.date);
    expect(new Set(dates).size).toBe(dates.length);
    for (const date of dates) {
      const parsed = parseCalendarDate(date);
      expect(parsed, `${date} 가 실재하는 날짜가 아니다`).not.toBeNull();
      expect(toCalendarDate(parsed as Date)).toBe(date);
    }
  });

  /** 🔴 휴장일이 주말이면 그 줄은 의미가 없다 — 어차피 장이 없는 날을 휴장으로 적은 것이다. */
  it('휴장일은 전부 평일이다', () => {
    for (const holiday of MARKET_HOLIDAYS) {
      const weekday = (parseCalendarDate(holiday.date) as Date).getDay();
      expect(weekday, `${holiday.date} ${holiday.nameKo} 가 주말이다`).toBeGreaterThan(0);
      expect(weekday).toBeLessThan(6);
    }
  });

  /** 조기 폐장일이 휴장일과 겹치면 둘 중 하나가 틀린 것이다(휴장이 이긴다 — 그날은 아예 안 연다). */
  it('조기 폐장일과 휴장일이 겹치지 않는다', () => {
    const holidayDates = new Set(MARKET_HOLIDAYS.map((holiday) => holiday.date));
    for (const early of MARKET_EARLY_CLOSES) {
      expect(holidayDates.has(early.date), `${early.date} 가 휴장일과 겹친다`).toBe(false);
    }
  });

  /**
   * 🔴 FOMC 발표는 **둘째 날**이다. 첫날에 걸면 하루 이른 거짓이 된다.
   * 두 날이 인접(1일 차)한지도 함께 본다 — 회의는 이틀짜리다.
   */
  it('FOMC 는 이틀이고 발표일이 마지막 날이다', () => {
    for (const meeting of FOMC_MEETINGS) {
      const start = parseCalendarDate(meeting.startDate) as Date;
      const decision = parseCalendarDate(meeting.decisionDate) as Date;
      expect(start, meeting.startDate).not.toBeNull();
      expect(decision, meeting.decisionDate).not.toBeNull();
      expect(decision.getTime()).toBeGreaterThan(start.getTime());
      const days = Math.round((decision.getTime() - start.getTime()) / 86_400_000);
      expect(days, `${meeting.startDate} ~ ${meeting.decisionDate} 가 이틀이 아니다`).toBe(1);
    }
  });

  it('FOMC 발표일에는 장이 선다 — 휴장일과 겹치면 자료가 틀린 것이다', () => {
    for (const meeting of FOMC_MEETINGS) {
      const day = describeTradingDay(meeting.decisionDate);
      expect(day?.status, `${meeting.decisionDate} 에 장이 서지 않는다`).toBe('open');
    }
  });
});
