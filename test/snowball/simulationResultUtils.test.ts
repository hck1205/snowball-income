// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { findTargetReachYearIndex } from '@/components/ResultSummaryCard';
import type { SimulationOutput } from '@/shared/types';

/**
 * `findTargetReachYearIndex` — 달력 연도(엔진 출력)를 **투자 N년차**(표시용)로 옮기는 순수 함수.
 *
 * 결과 카드의 목표 StatTile hint("투자 3년차")가 이 함수 하나에 걸려 있다 — 달력 연도만 주는 엔진
 * 출력과 "얼마나 먼 미래인가"를 잇는 유일한 지점이라, 여기서 어긋나면 화면이 조용히 거짓말한다.
 */

const yearly = (years: number[]): SimulationOutput['yearly'] =>
  years.map((year) => ({ year }) as SimulationOutput['yearly'][number]);

describe('findTargetReachYearIndex', () => {
  it('도달 연도가 없으면(미설정·미도달) undefined', () => {
    expect(findTargetReachYearIndex(yearly([2026, 2027, 2028]), undefined)).toBeUndefined();
  });

  it('첫 해에 도달하면 1년차다 (0-based 인덱스가 새지 않는다)', () => {
    expect(findTargetReachYearIndex(yearly([2026, 2027, 2028]), 2026)).toBe(1);
  });

  it('마지막 해에 도달하면 기간 길이와 같은 년차다', () => {
    const rows = yearly([2026, 2027, 2028, 2029]);
    expect(findTargetReachYearIndex(rows, 2029)).toBe(rows.length);
  });

  it('중간 해는 그 위치의 1-based 순번이다', () => {
    expect(findTargetReachYearIndex(yearly([2026, 2027, 2028, 2029]), 2028)).toBe(3);
  });

  it('yearly에 없는 연도면 undefined (연도만 지어내 표시하지 않는다)', () => {
    expect(findTargetReachYearIndex(yearly([2026, 2027, 2028]), 2050)).toBeUndefined();
  });

  it('yearly가 비어 있으면 undefined', () => {
    expect(findTargetReachYearIndex(yearly([]), 2026)).toBeUndefined();
  });

  it('연도가 0이어도 "값 없음"으로 오인하지 않는다 (undefined만 미도달이다)', () => {
    expect(findTargetReachYearIndex(yearly([0, 1]), 0)).toBe(1);
  });
});
