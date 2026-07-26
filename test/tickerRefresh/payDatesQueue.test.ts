import { describe, expect, it } from 'vitest';
import { isKnownTicker, prioritize, rotationDayOf } from '@/scripts/tickerRefresh';
import type { MarketDataSnapshotEntry } from '@/shared/constants/marketData';

/** 큐는 `payoutMonthsSource` 만 본다 — 나머지 필드는 타입을 만족시키기 위한 자리 채움이다. */
const entry = (payoutMonthsSource?: MarketDataSnapshotEntry['payoutMonthsSource']): MarketDataSnapshotEntry => ({
  initialPrice: 100,
  dividendYield: 3,
  frequency: 'quarterly',
  ...(payoutMonthsSource === undefined ? {} : { payoutMonthsSource })
});

/** `T00`…`T{n-1}` 형태의 정렬된 티커 이름 — 알파벳순과 생성순이 일치한다. */
const tickerNames = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `T${String(index).padStart(2, '0')}`);

const entriesOf = (
  tickers: readonly string[],
  payoutMonthsSource?: MarketDataSnapshotEntry['payoutMonthsSource']
): Record<string, MarketDataSnapshotEntry> =>
  Object.fromEntries(tickers.map((ticker) => [ticker, entry(payoutMonthsSource)]));

/** 알파벳 앞 25개만 매일 다시 조회되던 회전 정지(문제 ①)를 고정하는 예산. */
const DAILY_BUDGET = 25;

describe('prioritize — 미승급 우선 그룹', () => {
  const mixed: Record<string, MarketDataSnapshotEntry> = {
    AAA: entry('pay'),
    BBB: entry(),
    CCC: entry('ex'),
    DDD: entry('none')
  };

  it('회전이 없으면(rotationDay=0) 미승급이 앞, 그룹 안은 알파벳순 — 기존 동작 그대로다', () => {
    expect(prioritize(mixed, null, 0)).toEqual(['BBB', 'CCC', 'AAA', 'DDD']);
  });

  it('rotationDay 를 안 주면 0 과 같다 (기본값 회귀 방지)', () => {
    expect(prioritize(mixed, null)).toEqual(prioritize(mixed, null, 0));
  });

  it('회전해도 그룹 경계는 안 넘는다 — 미승급이 항상 pay/none 보다 앞', () => {
    for (const rotationDay of [0, 1, 2, 3, 7, 73_000]) {
      const queue = prioritize(mixed, null, rotationDay);
      const unsettledCount = ['BBB', 'CCC'].length;

      expect(queue.slice(0, unsettledCount).sort()).toEqual(['BBB', 'CCC']);
      expect(queue.slice(unsettledCount).sort()).toEqual(['AAA', 'DDD']);
    }
  });

  it('rotationDay 가 1 늘면 각 그룹이 정확히 한 칸 좌회전한다', () => {
    expect(prioritize(mixed, null, 1)).toEqual(['CCC', 'BBB', 'DDD', 'AAA']);
    expect(prioritize(mixed, null, 2)).toEqual(['BBB', 'CCC', 'AAA', 'DDD']);
  });

  /**
   * 문제 ②: 무배당 종목은 매일 쿼터를 1건씩 영원히 낭비했다. `'none'` 마커가 붙으면 pay 와 같은
   * "정산됨" 그룹으로 내려가야 한다 — 목록에서 사라지는 게 아니라 **후순위**로 간다.
   */
  it("'none' 은 미승급 그룹에서 빠지고 후순위 그룹에 들어간다 (무배당 종목의 쿼터 낭비 차단)", () => {
    const entries = {
      AAA: entry('none'),
      BBB: entry('ex'),
      CCC: entry()
    };

    const queue = prioritize(entries, null, 0);

    expect(queue.slice(0, 2)).toEqual(['BBB', 'CCC']);
    expect(queue).toContain('AAA');
    expect(queue).toHaveLength(3);
  });

  it("undefined·'ex' 는 미승급, 'pay'·'none' 은 정산됨으로 가른다", () => {
    const entries = {
      A_UNDEF: entry(),
      B_EX: entry('ex'),
      C_PAY: entry('pay'),
      D_NONE: entry('none')
    };

    expect(prioritize(entries, null, 0)).toEqual(['A_UNDEF', 'B_EX', 'C_PAY', 'D_NONE']);
  });
});

describe('prioritize — 회전 경계', () => {
  const tickers = tickerNames(3);
  const entries = entriesOf(tickers);

  it('rotationDay === 그룹 길이면 제자리로 돌아온다', () => {
    expect(prioritize(entries, null, 3)).toEqual(prioritize(entries, null, 0));
    expect(prioritize(entries, null, 3)).toEqual(['T00', 'T01', 'T02']);
  });

  it('그룹 길이 + 1 은 1 과 같다', () => {
    expect(prioritize(entries, null, 4)).toEqual(prioritize(entries, null, 1));
    expect(prioritize(entries, null, 4)).toEqual(['T01', 'T02', 'T00']);
  });

  it('큰 rotationDay(실제 UTC epoch-day 규모)도 mod 로 안전하다', () => {
    // 73_000 % 3 === 1.
    expect(prioritize(entries, null, 73_000)).toEqual(['T01', 'T02', 'T00']);
  });

  it('빈 스냅샷은 빈 큐 — 나눗셈 없이 그대로 통과한다', () => {
    expect(prioritize({}, null, 73_000)).toEqual([]);
  });

  it('한 그룹이 비어 있어도(전부 pay) 전 종목이 큐에 남는다', () => {
    const allSettled = entriesOf(tickerNames(4), 'pay');

    expect(prioritize(allSettled, null, 2).sort()).toEqual(tickerNames(4));
  });

  it('단일 종목은 회전값과 무관하게 그대로다', () => {
    const single = entriesOf(['AAA'], 'pay');

    expect(prioritize(single, null, 0)).toEqual(['AAA']);
    expect(prioritize(single, null, 73_000)).toEqual(['AAA']);
  });

  it('회전은 순서만 바꾼다 — 종목을 잃거나 중복시키지 않는다', () => {
    const many = entriesOf(tickerNames(30), 'pay');

    for (const rotationDay of [0, 1, 17, 29, 30, 73_000]) {
      expect(prioritize(many, null, rotationDay).sort()).toEqual(tickerNames(30));
    }
  });
});

/**
 * 문제 ① 회귀 고정: 전 종목이 pay 로 승급되면 그룹이 하나뿐이라, 회전이 없으면 매일 알파벳 앞
 * 25개만 다시 조회되고 뒤쪽 5개는 **영원히** 갱신되지 않았다.
 */
describe('prioritize — 전 종목 pay 승급 후에도 예산 창이 움직인다', () => {
  const tickers = tickerNames(30);
  const entries = entriesOf(tickers, 'pay');

  const windowOf = (rotationDay: number) => prioritize(entries, null, rotationDay).slice(0, DAILY_BUDGET);

  it('하루가 지나면 실제로 다른 25개를 조회한다', () => {
    expect(windowOf(0)).toEqual(tickers.slice(0, 25));
    expect(windowOf(1)).toEqual(tickers.slice(1, 26));
    expect(windowOf(1)).not.toEqual(windowOf(0));
  });

  it('그룹 길이만큼의 날이 지나면 모든 종목이 한 번은 조회된다', () => {
    const queried = new Set<string>();
    for (let rotationDay = 0; rotationDay < tickers.length; rotationDay += 1) {
      for (const ticker of windowOf(rotationDay)) queried.add(ticker);
    }

    expect([...queried].sort()).toEqual(tickers);
  });

  it('예산을 넘는 뒤쪽 종목도 며칠 안에 창 안으로 들어온다', () => {
    const last = tickers[tickers.length - 1];
    const daysUntilQueried = [0, 1, 2, 3, 4, 5].filter((rotationDay) => windowOf(rotationDay).includes(last));

    expect(daysUntilQueried.length).toBeGreaterThan(0);
  });
});

describe('prioritize — --only', () => {
  const entries = {
    AAA: entry('pay'),
    BBB: entry(),
    CCC: entry('ex')
  };

  it('사람이 고른 목록은 회전하지 않는다 (요청한 날짜와 무관하게 같은 순서)', () => {
    const only = ['CCC', 'BBB', 'AAA'];

    expect(prioritize(entries, only, 0)).toEqual(prioritize(entries, only, 73_000));
  });

  it('그룹 분리는 유지하되 그룹 안은 입력 순서를 그대로 쓴다', () => {
    expect(prioritize(entries, ['AAA', 'CCC', 'BBB'], 7)).toEqual(['CCC', 'BBB', 'AAA']);
  });

  it('스냅샷에 없는 티커도 미승급으로 분류해 큐에 남긴다 — 실제 조회는 CLI 가드(isKnownTicker)가 막는다', () => {
    // `prioritize`는 순서만 정할 뿐 존재 여부를 검증하지 않는다. `ticker:refresh`가 아직 만들지
    // 않은 엔트리를 여기서 조회해버리면 필수 필드가 없는 불량 엔트리가 기록될 수 있어(가격/빈도
    // 없음), 실제 API 호출 전에 `payDatesCli`가 `isKnownTicker`로 걸러낸다 — 이 큐 자체는 여전히
    // "모르는 티커"를 미승급으로 앞세운다.
    expect(prioritize(entries, ['AAA', 'NEW'], 0)).toEqual(['NEW', 'AAA']);
  });

  it('스냅샷 전체가 아니라 지정한 티커만 조회한다', () => {
    expect(prioritize(entries, ['BBB'], 3)).toEqual(['BBB']);
  });
});

describe('rotationDayOf', () => {
  it('UTC 달력일을 정수로 준다 (파일·카운터 없는 무상태 회전 키)', () => {
    expect(rotationDayOf(new Date('2026-07-26T00:00:00.000Z'))).toBe(20_660);
  });

  it('같은 UTC 날짜 안에서는 시각이 달라도 같은 값 — 하루에 한 번만 창이 움직인다', () => {
    expect(rotationDayOf(new Date('2026-07-26T23:59:59.999Z'))).toBe(20_660);
  });

  it('다음 날은 정확히 +1', () => {
    const day = rotationDayOf(new Date('2026-07-26T12:00:00.000Z'));

    expect(rotationDayOf(new Date('2026-07-27T12:00:00.000Z'))).toBe(day + 1);
  });
});

/**
 * M1 회귀 고정: `--only`로 스냅샷에 없는 티커(오타·정말로 새 종목)가 들어오면 `payDatesCli`는 이
 * 함수로 조회 전에 걸러낸다 — 안 그러면 필수 필드(가격·빈도)가 없는 불량 엔트리가 기록되고,
 * 다음 `parseMarketDataSnapshot`이 스냅샷 전체를 EMPTY로 폴백시킨다.
 *
 * ⚠ CLI 배선(실제로 fetch 전에 이 가드를 타는지) 자체는 이 테스트로 고정되지 않는다 —
 * `payDatesCli.ts`는 import 시 `main()`이 즉시 실행돼 직접 임포트해 테스트할 수 없다.
 */
describe('isKnownTicker', () => {
  const entries: Record<string, MarketDataSnapshotEntry> = {
    AAA: entry('pay')
  };

  it('스냅샷에 엔트리가 있으면 true', () => {
    expect(isKnownTicker(entries, 'AAA')).toBe(true);
  });

  it('스냅샷에 없는 티커는 false', () => {
    expect(isKnownTicker(entries, 'NEW')).toBe(false);
  });

  it('빈 스냅샷에서는 어떤 티커도 false', () => {
    expect(isKnownTicker({}, 'AAA')).toBe(false);
  });
});
