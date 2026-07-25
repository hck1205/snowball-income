import { BREAKPOINT } from '@/shared/styles';

/**
 * 한 칸에 보여 줄 칩의 최대 개수.
 *
 * ⚠ **폭에 따라 이 값을 바꾸지 않는다.** 폭마다 다른 개수를 렌더하면 DOM이 폭에 의존하게 되고
 * (jsdom은 `@media`를 평가하지 않아 테스트가 두 변형을 동시에 보게 된다), 서버·클라이언트 렌더도
 * 갈린다. 좁은 화면의 밀도 조절은 **CSS가 감추는 것**으로만 한다 — 잘린 정보의 원본은 항상
 * 표 아래 아젠다 목록에 그대로 있다.
 */
export const MAX_DAY_CHIPS = 3;

/** 셀 밀도 분기점(스타일에서만 쓴다). 값의 출처를 토큰 한 곳으로 고정해 둔다. */
export const CALENDAR_DENSITY_BREAKPOINT = BREAKPOINT.mobile;

export type DayChipSplit<T> = {
  visible: T[];
  hiddenCount: number;
};

/** 표시분과 `+N` 으로 가른다. 잘린 개수는 텍스트로 말한다(팝오버를 만들지 않는다). */
export const splitDayChips = <T,>(items: T[], limit: number = MAX_DAY_CHIPS): DayChipSplit<T> => ({
  visible: items.slice(0, limit),
  hiddenCount: Math.max(items.length - limit, 0)
});
