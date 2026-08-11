// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  DIVIDEND_LISTS,
  HIDDEN_STAR_MONTHLY,
  HIDDEN_STARS_LIST,
  HIDDEN_STAR_FAME_LIST_KEYS,
  HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT,
  HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT,
  HIDDEN_STAR_MIN_GROWTH_PERCENT,
  HIDDEN_STAR_MIN_YIELD_PERCENT,
  formatHiddenStarMonth,
  pickMonthlyHiddenStar,
  selectHiddenStars,
  type HiddenStarCandidate
} from '@/shared/constants/dividendLists';

/**
 * 배당 히든스타 **선정 규칙**.
 *
 * 이 목록은 앞의 셋과 성격이 다르다 — 바깥 기관의 명부가 아니라 우리가 규칙으로 걸러 낸 것이다.
 * 그래서 규칙이 곧 이 목록의 정당성이고, 규칙이 흔들리면 목록 전체가 근거를 잃는다.
 *
 * 🔴 특히 게이트 ⑤(고배당이면 성장도 요구)는 **실측이 설계의 구멍을 드러내서** 나중에 더한 것이다.
 *    없으면 배당률만 높은 종목이 1위를 차지한다 — 그 회귀를 여기서 막는다.
 */

const candidate = (overrides: Partial<HiddenStarCandidate> = {}): HiddenStarCandidate => ({
  ticker: 'AAA',
  name: 'Alpha Corp',
  sector: 'industrials',
  minimumStreakYears: 10,
  forwardYieldPercent: 3,
  fiveYearGrowthPercent: 10,
  recentCut: null,
  ...overrides
});

const NONE = new Set<string>();

describe('게이트 — 하나라도 못 넘으면 후보가 아니다', () => {
  it('① 세 목록에 이미 있으면 히든이 아니다', () => {
    expect(selectHiddenStars([candidate({ ticker: 'KO' })], new Set(['KO']))).toEqual([]);
  });

  it('② 최근 삭감 이력이 있으면 뺀다', () => {
    expect(selectHiddenStars([candidate({ recentCut: { year: 2024 } })], NONE)).toEqual([]);
  });

  it('③ 배당률이 최소선에 못 미치면 뺀다', () => {
    const low = HIDDEN_STAR_MIN_YIELD_PERCENT - 0.01;
    expect(selectHiddenStars([candidate({ forwardYieldPercent: low })], NONE)).toEqual([]);
    expect(selectHiddenStars([candidate({ forwardYieldPercent: HIDDEN_STAR_MIN_YIELD_PERCENT })], NONE)).toHaveLength(1);
  });

  it('④ 성장률이 최소선에 못 미치면 뺀다', () => {
    const low = HIDDEN_STAR_MIN_GROWTH_PERCENT - 0.01;
    expect(selectHiddenStars([candidate({ fiveYearGrowthPercent: low })], NONE)).toEqual([]);
  });

  it('⭐⑤ 배당률이 또래보다 크게 높으면 성장률도 그만큼 요구한다', () => {
    const highYield = HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT + 1;

    /* 성장률이 일반 하한은 넘지만 고배당 하한에는 못 미친다 → 탈락. */
    const weak = candidate({
      forwardYieldPercent: highYield,
      fiveYearGrowthPercent: HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT - 0.01
    });
    expect(selectHiddenStars([weak], NONE)).toEqual([]);

    /* 성장으로 증명하면 통과한다. */
    const strong = candidate({
      forwardYieldPercent: highYield,
      fiveYearGrowthPercent: HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT
    });
    expect(selectHiddenStars([strong], NONE)).toHaveLength(1);
  });

  it('🔴 ⑤ 가 없으면 벌어질 일 — 고배당·저성장이 1위를 차지한다 (회귀 방지)', () => {
    const trap = candidate({ ticker: 'TRAP', forwardYieldPercent: 10.86, fiveYearGrowthPercent: 5.2 });
    const healthy = candidate({ ticker: 'GOOD', forwardYieldPercent: 3.9, fiveYearGrowthPercent: 13.1 });

    const stars = selectHiddenStars([trap, healthy], NONE);

    expect(stars.map((star) => star.ticker)).toEqual(['GOOD']);
  });

  it('⑥ 섹터를 모르는 종목은 싣지 않는다', () => {
    expect(selectHiddenStars([candidate({ sector: null })], NONE)).toEqual([]);
  });

  it('지표가 없으면 뺀다 — 없는 값을 0 으로 읽지 않는다', () => {
    expect(selectHiddenStars([candidate({ forwardYieldPercent: null })], NONE)).toEqual([]);
    expect(selectHiddenStars([candidate({ fiveYearGrowthPercent: undefined })], NONE)).toEqual([]);
  });
});

describe('순위', () => {
  it('배당률에 무게를 더 둔다 (A + C 혼합)', () => {
    const yieldy = candidate({ ticker: 'YLD', forwardYieldPercent: 5, fiveYearGrowthPercent: 8 }); // 5 + 4 = 9
    const growthy = candidate({ ticker: 'GRW', forwardYieldPercent: 3, fiveYearGrowthPercent: 10 }); // 3 + 5 = 8

    expect(selectHiddenStars([growthy, yieldy], NONE).map((star) => star.ticker)).toEqual(['YLD', 'GRW']);
  });

  it('🔴 점수가 같으면 티커 사전순 — 같은 입력이면 같은 순서가 나온다', () => {
    const b = candidate({ ticker: 'BBB', forwardYieldPercent: 3, fiveYearGrowthPercent: 10 });
    const a = candidate({ ticker: 'AAA', forwardYieldPercent: 3, fiveYearGrowthPercent: 10 });

    expect(selectHiddenStars([b, a], NONE).map((star) => star.ticker)).toEqual(['AAA', 'BBB']);
  });

  it('이달의 종목은 1위 하나다', () => {
    const stars = selectHiddenStars([candidate({ ticker: 'AAA' }), candidate({ ticker: 'BBB' })], NONE);

    expect(pickMonthlyHiddenStar(stars)?.ticker).toBe(stars[0].ticker);
  });

  it('후보가 없으면 채워 넣지 않는다', () => {
    expect(pickMonthlyHiddenStar([])).toBeNull();
  });
});

describe('주의 표시', () => {
  it('통과했더라도 배당률이 표본 상위면 표시한다', () => {
    const high = candidate({ forwardYieldPercent: HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT, fiveYearGrowthPercent: 12 });

    expect(selectHiddenStars([high], NONE)[0].isHighYieldOutlier).toBe(true);
  });

  it('평범한 배당률에는 표시하지 않는다', () => {
    expect(selectHiddenStars([candidate()], NONE)[0].isHighYieldOutlier).toBe(false);
  });
});

describe('생성물 — 실제 데이터', () => {
  it('목록이 비어 있지 않고 배당 목록에 실려 있다', () => {
    expect(HIDDEN_STARS_LIST.members.length).toBeGreaterThan(0);
    expect(DIVIDEND_LISTS.hiddenStars.members.length).toBe(HIDDEN_STARS_LIST.members.length);
  });

  it('⭐ 모든 종목이 규칙을 만족한다 (생성물과 규칙이 어긋나지 않는다)', () => {
    for (const member of HIDDEN_STARS_LIST.members) {
      expect(member.forwardYieldPercent, member.ticker).toBeGreaterThanOrEqual(HIDDEN_STAR_MIN_YIELD_PERCENT);
      expect(member.fiveYearGrowthPercent, member.ticker).toBeGreaterThanOrEqual(HIDDEN_STAR_MIN_GROWTH_PERCENT);
      if ((member.forwardYieldPercent ?? 0) >= HIDDEN_STAR_HIGH_YIELD_NOTICE_PERCENT) {
        expect(member.fiveYearGrowthPercent, member.ticker).toBeGreaterThanOrEqual(
          HIDDEN_STAR_HIGH_YIELD_MIN_GROWTH_PERCENT
        );
      }
    }
  });

  it('🔴 다른 세 목록과 겹치는 종목이 없다 ("히든" 의 정의)', () => {
    const listed = new Set(
      [...DIVIDEND_LISTS.kings.members, ...DIVIDEND_LISTS.aristocrats.members, ...DIVIDEND_LISTS.champions.members].map(
        (member) => member.ticker
      )
    );

    for (const member of HIDDEN_STARS_LIST.members) {
      expect(listed.has(member.ticker), member.ticker).toBe(false);
    }
  });

  it('기준일이 있다 — 언제의 사실인지 말할 수 없는 목록은 쓰지 않는다', () => {
    expect(HIDDEN_STARS_LIST.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('이달의 히든스타가 하나 이상 기록돼 있다', () => {
    expect(HIDDEN_STAR_MONTHLY.length).toBeGreaterThan(0);
    expect(HIDDEN_STAR_MONTHLY[0].month).toMatch(/^\d{4}-\d{2}$/);
  });

  it('월 표기를 사람이 읽는 말로 바꾼다', () => {
    expect(formatHiddenStarMonth('2026-08')).toBe('2026년 8월');
    expect(formatHiddenStarMonth('망가진값')).toBe('망가진값');
  });
});

/**
 * 🔴 **생성기가 자기 출력물을 후보에서 빼면 안 된다** (2026-08-11 회귀).
 *
 * 게이트 ①("이미 유명 목록에 실렸으면 히든이 아니다")이 보는 목록에 히든스타 자신이 들어가면,
 * 지난번에 뽑힌 종목이 이번에는 "이미 목록에 있다"로 탈락한다 — 규칙이 자기 자신을 무효화한다.
 *
 * 실제로 그렇게 됐다. 히든스타가 큐레이션 목록으로 편입된 뒤 생성기는 **매번 0종**을 뽑았고,
 * "빈 목록은 쓰지 않는다"는 안전장치 덕에 파일이 덮이진 않았지만 **생성물이 조용히 멈춰 있었다**
 * (2026-08-04 자에서 정지). 실측: 제외 180종 → 0종 / 히든스타를 뺀 136종 → 44종.
 *
 * 자동화(월간 워크플로)를 붙이는 순간 이 단계는 매달 exit 1 로 실패했을 것이다.
 */
describe('🔴 히든스타 게이트는 자기 목록을 보지 않는다', () => {
  it('명예 목록에 hiddenStars 가 들어 있지 않다', () => {
    expect(HIDDEN_STAR_FAME_LIST_KEYS).not.toContain('hiddenStars');
    // 셋 다 있어야 한다 — 하나라도 빠지면 이미 유명한 종목이 히든으로 올라온다.
    expect([...HIDDEN_STAR_FAME_LIST_KEYS].sort()).toEqual(['aristocrats', 'champions', 'kings']);
  });

  it('⭐ 자기 목록을 제외 집합에 넣으면 아무도 통과하지 못한다 — 그게 이 회귀의 모양이다', () => {
    const candidates: HiddenStarCandidate[] = HIDDEN_STARS_LIST.members.slice(0, 3).map((member) => ({
      ticker: member.ticker,
      name: member.name,
      sector: 'financials',
      minimumStreakYears: 10,
      forwardYieldPercent: 4,
      fiveYearGrowthPercent: 8,
      recentCut: null
    }));

    // 정상: 유명 목록에 없는 종목이라 전부 통과한다.
    expect(selectHiddenStars(candidates, new Set())).toHaveLength(candidates.length);

    // 회귀 모양: 자기 출력물을 제외 집합에 넣으면 전멸한다.
    const selfExcluded = new Set(HIDDEN_STARS_LIST.members.map((member) => member.ticker));
    expect(selectHiddenStars(candidates, selfExcluded)).toHaveLength(0);
  });
});
