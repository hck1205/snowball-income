/**
 * **`자산` · `투자` · `분류 규칙` 탭 읽기** — 네트워크 + 파싱을 잇는 얇은 층.
 *
 * ## 왜 `readLedgerSnapshot` 과 따로인가
 *
 * `가계부` 는 매핑(사용자가 고른 기존 시트의 열 순서)이 필요해서 열 단위로 읽고 스냅샷 id 를 붙인다.
 * 이 세 탭은 **우리가 만든 탭**이라 열 순서가 고정이고, 쓰기 대상도 아니다(읽어서 보여 줄 뿐).
 * 억지로 같은 경로로 밀어 넣으면 `ColumnMapping` 이 자산·투자까지 알아야 하고 그 타입이 부푼다.
 *
 * ## 🔴 없는 탭은 실패가 아니다
 *
 * 사용자가 고른 기존 시트에는 이 탭들이 없다. 그때 오류를 띄우면 "가계부가 고장 났다"로 읽힌다 —
 * 탭이 없는 것은 **정상 상태**이고, 화면은 그 탭을 막고 사유를 말한다(`ledgerViewTabs.ts`).
 * 그래서 호출부가 애초에 부르지 않는 것이 정상 흐름이고, 여기서는 빈 결과로 떨어뜨리지 않는다
 * (조용히 빈 표를 보여 주면 "적은 게 사라졌다"로 읽힌다).
 */
import { parseClassifyRules } from '@/shared/lib/ledger';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';

import { BLUEPRINT_TABS } from './blueprint';
import type { HoldingRecord, InvestmentRecord } from './holdingsReader';
import { parseHoldingRows, parseInvestmentRows } from './holdingsReader';
import { fetchGridRows } from './sheetsApi';
import type { SheetsRequestContext } from './sheetsApi';
import { ledgerErr, ledgerOk } from './types';
import type { LedgerResult } from './types';

/**
 * 한 번에 읽는 행 수.
 *
 * ⚠ 청사진의 격자 크기와 맞춘다(`자산` 500 · `투자` 300 · `분류 규칙` 500). 더 크게 읽어도
 *   빈 행만 오지만, 사용자가 행을 늘렸을 때 뒤가 잘리는 것보다는 넉넉한 편이 낫다.
 */
const SIDE_TAB_LAST_ROW = 600;

/** 머리 행을 뺀 데이터 행. 🔴 빈 시트는 `values` 자체가 없어 빈 배열로 온다. */
const dataRowsOf = (rows: readonly (readonly string[])[]): readonly (readonly string[])[] =>
  rows.length <= 1 ? [] : rows.slice(1);

export type SideTabRead<T> = {
  readonly records: readonly T[];
  /** 알아보지 못해 버린 줄 수. 화면이 "3줄은 알아보지 못했습니다"라고 말할 근거다. */
  readonly skipped: number;
};

const readTab = async <T>(
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly sheetTitle: string },
  parse: (rows: readonly (readonly string[])[]) => SideTabRead<T>
): Promise<LedgerResult<SideTabRead<T>>> => {
  const read = await fetchGridRows(context, {
    spreadsheetId: params.spreadsheetId,
    sheetTitle: params.sheetTitle,
    lastRow: SIDE_TAB_LAST_ROW
  });
  if (!read.ok) return ledgerErr(read.error);
  return ledgerOk(parse(dataRowsOf(read.value)));
};

/** `자산` 탭 — 월말 잔액 스냅샷. */
export const readHoldings = async (
  context: SheetsRequestContext,
  spreadsheetId: string
): Promise<LedgerResult<SideTabRead<HoldingRecord>>> =>
  readTab(context, { spreadsheetId, sheetTitle: BLUEPRINT_TABS.holdings }, parseHoldingRows);

/** `투자` 탭 — 계좌·티커·수량. */
export const readInvestments = async (
  context: SheetsRequestContext,
  spreadsheetId: string
): Promise<LedgerResult<SideTabRead<InvestmentRecord>>> =>
  readTab(context, { spreadsheetId, sheetTitle: BLUEPRINT_TABS.investments }, parseInvestmentRows);

/**
 * `분류 규칙` 탭 — 히포가 배운 규칙.
 *
 * 🔴 **기록을 읽기 전에** 이것을 읽어야 한다. 규칙 없이 기록을 해석하면 사다리 1단이 빠져
 *    사용자가 만들어 둔 규칙이 무시되고, 화면에는 미분류가 잔뜩 나온다.
 */
export const readClassifyRules = async (
  context: SheetsRequestContext,
  spreadsheetId: string
): Promise<LedgerResult<SideTabRead<LedgerClassifyRule>>> =>
  readTab(context, { spreadsheetId, sheetTitle: BLUEPRINT_TABS.rules }, (rows) => {
    const { rules, skipped } = parseClassifyRules(rows);
    return { records: rules, skipped };
  });
