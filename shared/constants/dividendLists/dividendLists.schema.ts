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

export const dividendListMemberSchema = z.object({
  ticker: tickerSchema,
  name: z.string().min(1),
  sector: z.enum(DIVIDEND_LIST_SECTOR_IDS as [string, ...string[]]),
  sourceSectorLabel: z.string().min(1),
  /** 최소 1개 — 아무도 확인해 주지 않은 종목은 목록에 실을 수 없다. */
  confirmedBy: z.array(z.string().min(1)).min(1)
});

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
