import { describe, expect, it } from 'vitest';
import { HIDDEN_STAR_MONTHLY, LATEST_HIDDEN_STAR } from '@/shared/constants/dividendLists';

/**
 * 월별 선정의 **순서 계약**.
 *
 * 🔴 화면이 `HIDDEN_STAR_MONTHLY[0]` 을 "이달의 종목"으로 크게 세운다(2026-08-09). 순서가 뒤집히면
 *    **지난달 종목이 이달로 소개된다** — 오류도 빈 화면도 아니고, 그냥 틀린 것이 그럴듯하게 보인다.
 *    그래서 화면에서 다시 정렬하지 않고 이 계약을 여기서 잠근다(두 곳이 순서를 정하면 한쪽만
 *    바뀔 때 조용히 어긋난다).
 */

describe('🔴 최신이 앞이다', () => {
  it('⭐ 달이 내림차순이다 — 화면의 첫 줄이 곧 이달이다', () => {
    const months = HIDDEN_STAR_MONTHLY.map((pick) => pick.month);
    const sorted = [...months].sort((left, right) => right.localeCompare(left));

    expect(months).toEqual(sorted);
  });

  it('⭐ `LATEST_HIDDEN_STAR` 가 첫 줄과 같은 것을 가리킨다', () => {
    if (HIDDEN_STAR_MONTHLY.length === 0) {
      /* 아직 한 달도 없으면 자리를 비워 둔다 — 채워 넣지 않는다. */
      expect(LATEST_HIDDEN_STAR).toBeNull();
      return;
    }
    expect(LATEST_HIDDEN_STAR).toEqual(HIDDEN_STAR_MONTHLY[0]);
  });

  it('같은 달이 두 번 있지 않다 — 있으면 어느 쪽이 이달인지 정할 수 없다', () => {
    const months = HIDDEN_STAR_MONTHLY.map((pick) => pick.month);

    expect(new Set(months).size).toBe(months.length);
  });
});
