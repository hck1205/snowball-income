import { describe, expect, it } from 'vitest';
import {
  allBlockMappings,
  blockMapping,
  detectLedgerLayout,
  needsKindAssumption,
  type MonthBlockLayout
} from '@/shared/lib/googleSheets';

/**
 * P3 레이아웃 감지 — **헤비 유저의 시트를 읽을 수 있는가.**
 *
 * 헤더 줄은 실측에서 가져왔다: 널리 쓰이는 가계부 템플릿의 `가계부 작성` 탭은 6열 = 한 달 블록이
 * 가로로 15번 반복되고, 헤더가 `항목(복사금지) · 상세항목(복사금지) · 지출금액(원) · 상세내용` 이다.
 * 이 시트를 못 읽으면 "다른 가계부 연동"은 말뿐이 된다.
 */

/** 실측 템플릿의 헤더 줄을 재현한다(블록당 6열, 앞에 헬퍼 열 1개). */
const monthBlockHeaderRow = (blocks: number): string[] => {
  const row: string[] = [''];
  for (let i = 0; i < blocks; i += 1) {
    row.push('날짜', '항목(복사금지)', '상세항목(복사금지)', '지출금액(원)', '상세내용', '');
  }
  return row;
};

describe('가로 월별 블록 감지', () => {
  it('⭐ 15개월 블록을 폭 6·개수 15 로 알아본다', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(15), 11);

    expect(layout.kind).toBe('monthBlock');
    const monthBlock = layout as MonthBlockLayout;
    expect(monthBlock.blockWidth).toBe(6);
    expect(monthBlock.blockCount).toBe(15);
    expect(monthBlock.firstDataRow).toBe(12);
  });

  it('괄호가 붙은 헤더(`지출금액(원)`)도 금액으로 읽는다', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(3), 11) as MonthBlockLayout;

    expect(layout.innerMapping.amount).toBeGreaterThanOrEqual(0);
  });

  it('🔴 `상세항목` 이 `항목` 에 잡아먹히지 않는다 (두 열이 갈려 있다)', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(3), 11) as MonthBlockLayout;

    expect(layout.innerMapping.subcategory).toBeDefined();
    expect(layout.innerMapping.subcategory).not.toBe(layout.innerMapping.category);
  });

  it('🔴 `지출금액` 이 `금액` 에 잡아먹히지 않는다', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(3), 11) as MonthBlockLayout;

    expect(layout.innerMapping.amount).not.toBe(layout.innerMapping.category);
  });

  it('블록 n 의 절대 매핑은 폭 × n 만큼 밀린다', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(15), 11) as MonthBlockLayout;
    const first = blockMapping(layout, 0);
    const third = blockMapping(layout, 2);

    expect(third.amount - first.amount).toBe(layout.blockWidth * 2);
    expect(third.category - first.category).toBe(layout.blockWidth * 2);
  });

  it('전체 블록 매핑이 블록 수만큼 나온다 (한 달도 빠뜨리지 않는다)', () => {
    const layout = detectLedgerLayout(monthBlockHeaderRow(15), 11) as MonthBlockLayout;

    expect(allBlockMappings(layout)).toHaveLength(15);
  });

  it('⭐ 구분 열이 없는 시트를 알아본다 (임의로 지출로 단정하지 않기 위해)', () => {
    const headerRow = monthBlockHeaderRow(3);
    const layout = detectLedgerLayout(headerRow, 11);

    expect(needsKindAssumption(layout, headerRow)).toBe(true);
  });
});

describe('flat 로 떨어지는 경우 — 확신이 없으면 묻는다', () => {
  it('평범한 세로 시트는 flat 이다', () => {
    const layout = detectLedgerLayout(['날짜', '구분', '금액', '항목', '메모'], 1);

    expect(layout.kind).toBe('flat');
  });

  it('항목이 한 번만 나오면 블록이 아니다', () => {
    expect(detectLedgerLayout(['날짜', '항목', '금액', '내용'], 1).kind).toBe('flat');
  });

  it('🔴 간격이 일정하지 않으면 flat 이다 (대충 맞추면 마지막 블록이 밀린다)', () => {
    const row = ['항목', '금액', '', '항목', '금액', '', '', '항목', '금액'];

    expect(detectLedgerLayout(row, 1).kind).toBe('flat');
  });

  it('금액 없이 항목만 반복되면 가계부 블록이 아니다', () => {
    const row = ['항목', '비고', '', '항목', '비고', ''];

    expect(detectLedgerLayout(row, 1).kind).toBe('flat');
  });

  it('빈 헤더 줄은 flat 이다', () => {
    expect(detectLedgerLayout([], 1).kind).toBe('flat');
  });
});
