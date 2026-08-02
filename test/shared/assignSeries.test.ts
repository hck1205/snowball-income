// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { assignSeries, seriesHomeIndex, seriesVarFor } from '@/shared/lib/tickerSeries';

/** 실제 팔레트(8색)와 같은 크기의 가짜 — 값이 아니라 규칙을 검사한다. */
const PALETTE = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

describe('assignSeries — 집합 내 충돌 회피(D4)', () => {
  /**
   * 🔴 이 개편의 전제다. 색이 "이 색이 곧 그 종목"이라는 길찾기 단서인데 한 화면에서 겹치면
   * 그 단서가 거짓말이 된다. 종전 규칙(해시 한 겹)은 충돌을 **허용**했으므로 이건 번복이다.
   */
  it('팔레트 안에서는 같은 색이 두 번 나오지 않는다', () => {
    const symbols = ['SCHD', 'JEPI', 'O', 'VYM', 'DGRO', 'QYLD', 'SPYD', 'HDV'];
    const assigned = assignSeries(symbols, PALETTE);

    const colors = [...assigned.values()];
    expect(colors).toHaveLength(symbols.length);
    expect(new Set(colors).size).toBe(symbols.length);
  });

  /**
   * 🔴 입력 순서가 결과를 바꾸면 **보유 종목을 드래그로 재정렬할 때 색이 통째로 따라 움직인다**.
   * 내부 정렬이 그걸 막는다 — 이 단정을 지우면 그 회귀가 무음으로 돌아온다.
   */
  it('입력 순서가 달라도 배정이 같다', () => {
    const a = assignSeries(['SCHD', 'JEPI', 'O'], PALETTE);
    const b = assignSeries(['O', 'SCHD', 'JEPI'], PALETTE);

    expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
  });

  it('중복·빈 문자열을 걸러낸다', () => {
    const assigned = assignSeries(['SCHD', 'SCHD', '', 'O'], PALETTE);

    expect([...assigned.keys()].sort()).toEqual(['O', 'SCHD']);
  });

  /** 충돌이 없으면 1겹 해시(고향)를 그대로 쓴다 — 종전 값과 이어진다. */
  it('충돌이 없으면 고향 색을 그대로 준다', () => {
    const assigned = assignSeries(['SCHD'], PALETTE);

    expect(assigned.get('SCHD')).toBe(PALETTE[seriesHomeIndex('SCHD', PALETTE.length)]);
  });

  /**
   * 팔레트가 8색이라 9번째부터는 겹칠 수밖에 없다.
   * 🔴 그때 **새 색을 만들지 않는다** — 팔레트 밖 색은 16테마 대비 검증 밖이다.
   */
  it('팔레트보다 많은 종목은 겹치되, 팔레트 밖 색을 만들지 않는다', () => {
    const symbols = Array.from({ length: 13 }, (_, index) => `T${index}`);
    const assigned = assignSeries(symbols, PALETTE);

    expect(assigned.size).toBe(13);
    for (const color of assigned.values()) expect(PALETTE).toContain(color);
  });

  it('팔레트가 비면 빈 맵이다 (죽지 않는다)', () => {
    expect(assignSeries(['SCHD'], []).size).toBe(0);
  });

  /**
   * 🔴 대가를 명시적으로 잠근다: **종목을 추가하면 기존 종목 색이 움직일 수 있다.**
   * 이 테스트는 "안 움직인다"를 단정하지 않는다 — 그게 D4 가 포기한 성질이기 때문이다.
   * 대신 **움직여도 겹치지는 않는다**를 단정한다. 그것이 우리가 새로 얻은 성질이다.
   */
  it('종목을 추가해도 겹치지 않는 성질은 유지된다 (색 이동은 허용)', () => {
    const before = assignSeries(['SCHD', 'JEPI'], PALETTE);
    const after = assignSeries(['SCHD', 'JEPI', 'O', 'VYM'], PALETTE);

    expect(new Set(after.values()).size).toBe(4);
    // 기존 두 종목은 여전히 색을 갖는다(사라지지 않는다).
    expect(after.get('SCHD')).toBeDefined();
    expect(after.get('JEPI')).toBeDefined();
    expect(before.size).toBe(2);
  });
});

describe('seriesVarFor — 집합을 모를 때의 탈출구', () => {
  /** 종전 `tickerSeriesVar` 와 같은 값이어야 한다 — 단독 배지가 갑자기 다른 색이 되면 안 된다. */
  it('1겹 해시 값을 그대로 준다', () => {
    expect(seriesVarFor('SCHD', PALETTE)).toBe(PALETTE[seriesHomeIndex('SCHD', PALETTE.length)]);
  });

  it('같은 이름은 언제나 같은 색이다', () => {
    expect(seriesVarFor('O', PALETTE)).toBe(seriesVarFor('O', PALETTE));
  });
});
