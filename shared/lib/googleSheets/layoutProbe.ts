/**
 * 시트를 **한 번 훑어 모양을 알아내는** 진입점. `layout.ts`(순수 판정)와 UI 사이의 마지막 조각이다.
 *
 * 왜 따로 필요한가
 * ---------------------------------------------------------------------------
 * 지금까지 연결 흐름은 **1행만** 읽어 헤더로 삼았다(`fetchHeaderRow`). 평범한 시트는 그게 맞지만,
 * 널리 쓰이는 가계부 템플릿의 입력 탭은 **1행이 제목·안내문**이고 진짜 헤더가 한참 아래(실측 11행)에
 * 있다. 그 시트에 1행만 물으면 "안내 문구"를 헤더로 읽고 매핑을 하나도 못 잡는다.
 *
 * 그래서 위쪽 몇 줄을 **함께 읽어** 헤더처럼 보이는 줄을 고른다. 이 파일이 없으면 P3 의 레이아웃
 * 감지는 실제 시트에 닿지 못한다 — 순수 함수는 있는데 먹일 헤더 줄이 없기 때문이다.
 *
 * 🔴 **추측으로 단정하지 않는다.** 헤더처럼 보이는 줄이 없으면 `flat` + 1행으로 떨어져 기존 흐름
 *    그대로 간다. 잘못 감지해 엉뚱한 줄을 헤더로 삼는 것보다, 못 알아보고 사용자에게 묻는 쪽이 낫다.
 */
import { FLAT_LAYOUT, detectLedgerLayout, needsKindAssumption, type LedgerLayout } from './layout';
import { suggestColumnMapping } from './mapping';
import { fetchGridRows, type SheetsRequestContext } from './sheetsApi';
import { LEDGER_HEADER_ROW } from './schema';
import { ledgerErr, ledgerOk, type LedgerResult } from './types';

/**
 * 헤더를 찾아 훑을 줄 수.
 *
 * 실측 템플릿의 헤더가 11행이라 12줄이면 닿는다. 더 늘리면 얻는 것 없이 응답만 커지고, 그보다 아래에
 * 헤더가 있는 시트는 애초에 사람이 봐도 표로 안 읽힌다.
 */
export const LAYOUT_PROBE_ROWS = 14;

export type SheetLayoutProbe = {
  readonly layout: LedgerLayout;
  /** 헤더로 고른 줄(1-based). `flat` 이면 대개 1이다. */
  readonly headerRow: number;
  /** 그 줄의 셀 값 — 열 매핑 화면이 그대로 쓴다. */
  readonly headers: readonly string[];
  /**
   * `구분` 열이 없어 "전부 지출"인지 **사용자에게 물어야** 하는가.
   * 🔴 여기서 기본값을 정하지 않는다 — 수입이 섞인 시트를 지출로 단정하면 숫자가 조용히 틀어진다.
   */
  readonly needsKindChoice: boolean;
};

/** 그 줄이 헤더처럼 보이는가 = 필수 필드를 몇 개나 잡아내는가. */
const headerScore = (row: readonly string[]): number => {
  const { mapping } = suggestColumnMapping(row);
  let score = 0;
  if (mapping.date !== undefined) score += 1;
  if (mapping.amount !== undefined) score += 1;
  if (mapping.category !== undefined) score += 1;
  if (mapping.kind !== undefined) score += 1;
  if (mapping.subcategory !== undefined) score += 1;
  return score;
};

/** 헤더로 인정하는 최소 점수. 두 개는 우연히 맞을 수 있어도 셋이 한 줄에 모이면 표의 머리다. */
const MIN_HEADER_SCORE = 3;

/**
 * 위쪽 몇 줄 중 **가장 헤더다운 줄**을 고른다. 동점이면 위쪽이 이긴다(표는 보통 위에서 시작한다).
 * 점수가 문턱에 못 미치면 `null` — 호출부가 1행으로 떨어진다.
 */
export const pickHeaderRow = (rows: readonly (readonly string[])[]): { index: number; score: number } | null => {
  let best: { index: number; score: number } | null = null;
  rows.forEach((row, index) => {
    const score = headerScore(row);
    if (score < MIN_HEADER_SCORE) return;
    if (best === null || score > best.score) best = { index, score };
  });
  return best;
};

/**
 * 시트 위쪽을 읽어 모양·헤더 줄·매핑 후보를 한 번에 정한다.
 *
 * 요청 1회. 연결 흐름의 기존 헤더 읽기를 **대체**할 수 있다(같은 값을 더 넓게 읽어 온다).
 */
export const probeSheetLayout = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly sheetTitle: string }
): Promise<LedgerResult<SheetLayoutProbe>> => {
  const read = await fetchGridRows(context, {
    spreadsheetId: params.spreadsheetId,
    sheetTitle: params.sheetTitle,
    lastRow: LAYOUT_PROBE_ROWS
  });
  if (!read.ok) return ledgerErr(read.error);

  const rows = read.value;
  const picked = pickHeaderRow(rows);

  /* 헤더처럼 보이는 줄이 없다 → 기존 흐름 그대로(1행을 헤더로 보고 사용자가 매핑한다). */
  if (picked === null) {
    return ledgerOk({
      layout: FLAT_LAYOUT,
      headerRow: LEDGER_HEADER_ROW,
      headers: rows[LEDGER_HEADER_ROW - 1] ?? [],
      needsKindChoice: false
    });
  }

  const headers = rows[picked.index] ?? [];
  const headerRow = picked.index + 1;
  const layout = detectLedgerLayout(headers, headerRow);

  return ledgerOk({
    layout,
    headerRow,
    headers,
    needsKindChoice: needsKindAssumption(layout, headers)
  });
};
