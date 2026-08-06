import { z } from 'zod';
import { DIVIDEND_LIST_IDS } from '@/shared/constants/routes';
import { DIVIDEND_LIST_SECTOR_IDS } from './dividendLists.sectors';

/* 목록 id 의 정본은 `shared/constants/routes`(의존성 0 리프)다 — 근거는 그 파일 주석. */
export { DIVIDEND_LIST_IDS };

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 여야 한다');

/**
 * 🔴 티커 형태를 여기서 못 박는다. 소스가 `BF/B`(ProShares)·`BF.B`(위키피디아)·`BF-B`(야후)로 갈리는데,
 * 정규화를 빠뜨린 값이 스냅샷에 들어오면 같은 회사가 두 줄이 되고 표의 정렬이 어긋난다.
 * 허용: 대문자 영문 1~5자 + 선택적으로 `.` + 대문자 1자(클래스 주식).
 */
const tickerSchema = z
  .string()
  .regex(/^[A-Z]{1,5}(\.[A-Z])?$/, '티커는 대문자와 클래스 접미사(.B)만 허용한다');

export const dividendListSourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  role: z.enum(['primary', 'crosscheck']),
  retrievedAt: isoDate
});

/**
 * 연속 증배 시작 연도의 상한. **미래 연도를 막는 것이 목적**이다 — `2027` 이 들어오면 화면은
 * 아직 오지 않은 해부터 세어 음수 연수를 그린다.
 *
 * ⚠ 모듈 로드 시점에 한 번 계산한다. 자정을 넘겨 실행되는 프로세스에서 하루 낡을 수 있지만,
 *   연 단위 값이라 실제로 어긋나는 순간은 12/31→1/1 뿐이고 그때도 "작년까지 허용"이라 안전하다.
 * ⚠ UTC 로 읽는다. 이 폴더의 다른 날짜(`asOf`·`retrievedAt`)가 전부 UTC 기준이라 로컬 연도를
 *   섞으면 KST 1월 1일에만 스키마가 통과/거부를 달리하는 재현 불가 버그가 된다.
 */
export const MAX_STREAK_START_YEAR = new Date().getUTCFullYear();

/** 하한 1900 — 그 이전은 미국 상장기업의 연속 증배 기록으로 확인할 수 있는 범위를 벗어난다. */
export const MIN_STREAK_START_YEAR = 1900;

export const dividendListMemberSchema = z
  .object({
    ticker: tickerSchema,
    name: z.string().min(1),
    sector: z.enum(DIVIDEND_LIST_SECTOR_IDS as [string, ...string[]]),
    sourceSectorLabel: z.string().min(1),
    /** 최소 1개 — 아무도 확인해 주지 않은 종목은 목록에 실을 수 없다. */
    confirmedBy: z.array(z.string().min(1)).min(1),
    streakStartYear: z
      .number()
      .int()
      .min(MIN_STREAK_START_YEAR, `연속 증배 시작 연도는 ${MIN_STREAK_START_YEAR}년 이후여야 한다`)
      .max(MAX_STREAK_START_YEAR, '연속 증배 시작 연도는 미래일 수 없다')
      .optional(),
    streakSource: z.string().min(1).optional()
  })
  /**
   * 🔴 **연도와 출처는 한 몸이다.** 출처 없는 연수는 이 레포에서 지어낸 숫자와 같다. 반대로 출처만
   * 남은 줄은 값을 지우다 만 흔적이라 다음 리뷰를 오도한다 — 둘 다 있거나 둘 다 없어야 한다.
   */
  .refine(
    (member) => (member.streakStartYear === undefined) === (member.streakSource === undefined),
    { message: 'streakStartYear 와 streakSource 는 둘 다 있거나 둘 다 없어야 한다', path: ['streakSource'] }
  );

export const dividendListSchema = z.object({
  id: z.enum(DIVIDEND_LIST_IDS),
  minimumStreakYears: z.number().int().min(1).max(200),
  maximumStreakYears: z.number().int().min(1).max(200).optional(),
  asOf: isoDate,
  /** 출처가 하나도 없는 목록은 화면에 낼 수 없다(기준일·출처 노출이 이 기능의 전제다). */
  sources: z.array(dividendListSourceSchema).min(1),
  coverageNote: z.string().min(1),
  /**
   * 🔴 빈 목록을 통과시키지 않는다. 수집기가 절반쯤 실패해 0종을 쓰고 지나가면 화면은 "이 목록에는
   * 종목이 없습니다"라는 **거짓말**을 하게 된다. 형태가 깨지면 폴백(큐레이션 값)으로 떨어지는 편이 낫다.
   */
  members: z.array(dividendListMemberSchema).min(1)
});

export const dividendListVerificationFlagSchema = z.object({
  listId: z.enum(DIVIDEND_LIST_IDS),
  ticker: tickerSchema,
  kind: z.enum(['cut', 'noHistory']),
  detail: z.string().min(1)
});

export const dividendListsVerificationSchema = z.object({
  checkedAt: isoDate,
  checkedCount: z.number().int().min(0),
  flags: z.array(dividendListVerificationFlagSchema)
});

export const dividendListsSnapshotSchema = z.object({
  asOf: isoDate.nullable(),
  source: z.string(),
  lists: z.record(z.enum(DIVIDEND_LIST_IDS), dividendListSchema),
  verification: dividendListsVerificationSchema.optional()
});
