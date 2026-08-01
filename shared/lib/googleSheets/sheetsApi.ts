/**
 * Sheets API v4 어댑터 — **fetch 래퍼만** 있다. 무엇을 쓸지는 `writeSafety.ts` 가 이미 정해서 준다.
 *
 * 규율 셋:
 *  1) 🔴 **예외를 삼키지 않는다.** 모든 함수가 `LedgerResult` 를 돌려주고, 실패는 코드로 구분된다.
 *     (401/403/404 는 사용자가 계정 설정에서 권한을 해제하거나 시트를 지웠을 때의 **정상 경로**다.)
 *  2) 🔴 **에러 메시지에 값이 들어가지 않는다.** 시트 ID·파일명·탭 제목·열 이름·금액은 준PII 라
 *     응답 본문을 그대로 싣지 않고 정적 문구만 쓴다(`LEDGER_ERROR_MESSAGE`).
 *  3) 읽기·쓰기 모두 **한 열 단위 범위**로만 한다 — 매핑 밖의 열을 읽지도 쓰지도 않는다(AC-W2).
 */
import type { DeleteRowRequest } from './writeSafety';
import type { LedgerError, LedgerErrorCode, LedgerResult, SheetValueRange } from './types';
import { ledgerErr, ledgerOk, ledgerError } from './types';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export type SheetsRequestContext = {
  /** GIS 로 받은 액세스 토큰. **메모리에서만** 온다(`auth.ts`). */
  readonly accessToken: string;
  /** 테스트에서 명시적인 성공/실패 응답을 주입한다. 없으면 전역 `fetch`. */
  readonly fetchImpl?: typeof fetch;
};

/** HTTP 상태 → 실패 코드. 사용자가 다음에 할 수 있는 일이 여기서 갈린다. */
export const mapHttpStatusToErrorCode = (status: number): LedgerErrorCode => {
  if (status === 401) return 'auth-expired';
  if (status === 403) return 'permission-denied';
  if (status === 404) return 'sheet-not-found';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server-error';
  return 'invalid-response';
};

const resolveFetch = (context: SheetsRequestContext): typeof fetch | null => {
  if (context.fetchImpl) return context.fetchImpl;
  if (typeof fetch === 'function') return fetch;
  return null;
};

const request = async <T>(
  context: SheetsRequestContext,
  init: { readonly method: 'GET' | 'POST'; readonly url: string; readonly body?: unknown }
): Promise<LedgerResult<T>> => {
  if (context.accessToken.trim().length === 0) return ledgerErr(ledgerError('not-authorized'));

  const fetchImpl = resolveFetch(context);
  if (!fetchImpl) return ledgerErr(ledgerError('network-error'));

  let response: Response;
  try {
    response = await fetchImpl(init.url, {
      method: init.method,
      headers: {
        authorization: `Bearer ${context.accessToken}`,
        ...(init.body === undefined ? {} : { 'content-type': 'application/json' })
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) })
    });
  } catch {
    // 네트워크 단절·CORS 실패 — 응답 자체가 없다.
    return ledgerErr(ledgerError('network-error'));
  }

  if (!response.ok) {
    // 본문은 읽지 않는다: 구글 오류 본문에 파일명·범위가 실릴 수 있어 그대로 두면 로그로 새어 나간다.
    return ledgerErr(ledgerError(mapHttpStatusToErrorCode(response.status)));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return ledgerErr(ledgerError('invalid-response'));
  }
  return ledgerOk(payload as T);
};

/** 실패를 그대로 흘려보내는 도우미(타입만 바꾼다). */
const passThroughError = <T>(error: LedgerError): LedgerResult<T> => ledgerErr(error);

/* ── 시트 메타 ──────────────────────────────────────────────────────────────── */

export type SheetTabMeta = {
  readonly sheetId: number;
  readonly title: string;
};

export type SpreadsheetMeta = {
  readonly spreadsheetId: string;
  readonly tabs: readonly SheetTabMeta[];
};

const parseSpreadsheetMeta = (payload: unknown): SpreadsheetMeta | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const spreadsheetId = record.spreadsheetId;
  if (typeof spreadsheetId !== 'string' || spreadsheetId.length === 0) return null;

  const sheets = Array.isArray(record.sheets) ? record.sheets : [];
  const tabs: SheetTabMeta[] = [];
  for (const sheet of sheets) {
    if (!sheet || typeof sheet !== 'object') continue;
    const properties = (sheet as Record<string, unknown>).properties;
    if (!properties || typeof properties !== 'object') continue;
    const { sheetId, title } = properties as Record<string, unknown>;
    if (!Number.isInteger(sheetId) || typeof title !== 'string') continue;
    tabs.push({ sheetId: sheetId as number, title });
  }
  if (tabs.length === 0) return null;
  return { spreadsheetId, tabs };
};

/**
 * 시트의 탭 목록. **탭 제목을 로컬에 저장하지 않기 때문에** 연결할 때마다 여기서 다시 읽는다.
 * `fields` 로 필요한 것만 받는다 — 셀 값은 한 칸도 내려받지 않는다.
 */
export const fetchSpreadsheetMeta = async (
  context: SheetsRequestContext,
  spreadsheetId: string
): Promise<LedgerResult<SpreadsheetMeta>> => {
  const fields = encodeURIComponent('spreadsheetId,sheets(properties(sheetId,title))');
  const result = await request<unknown>(context, {
    method: 'GET',
    url: `${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}?fields=${fields}`
  });
  if (!result.ok) return passThroughError(result.error);

  const meta = parseSpreadsheetMeta(result.value);
  return meta ? ledgerOk(meta) : ledgerErr(ledgerError('invalid-response'));
};

/* ── 시트 만들기 ────────────────────────────────────────────────────────────── */

/**
 * 앱 스키마의 새 스프레드시트를 만든다. `drive.file` 스코프로 만든 파일은 이후에도 앱이 접근할 수 있다.
 * ⚠ 헤더는 별도 쓰기로 넣는다 — 생성 요청에 셀 데이터를 섞으면 실패 시 "빈 시트만 남는" 중간 상태의
 *   원인을 구분할 수 없다.
 */
export const createSpreadsheet = async (
  context: SheetsRequestContext,
  params: { readonly title: string; readonly tabTitle: string }
): Promise<LedgerResult<SpreadsheetMeta>> => {
  const result = await request<unknown>(context, {
    method: 'POST',
    url: SHEETS_BASE,
    body: {
      properties: { title: params.title },
      sheets: [{ properties: { title: params.tabTitle } }]
    }
  });
  if (!result.ok) return passThroughError(result.error);

  const meta = parseSpreadsheetMeta(result.value);
  return meta ? ledgerOk(meta) : ledgerErr(ledgerError('invalid-response'));
};

/* ── 값 읽기 ────────────────────────────────────────────────────────────────── */

const parseValueColumns = (payload: unknown, expected: number): (readonly string[])[] | null => {
  if (!payload || typeof payload !== 'object') return null;
  const valueRanges = (payload as Record<string, unknown>).valueRanges;
  if (!Array.isArray(valueRanges) || valueRanges.length !== expected) return null;

  return valueRanges.map((valueRange) => {
    if (!valueRange || typeof valueRange !== 'object') return [];
    const values = (valueRange as Record<string, unknown>).values;
    if (!Array.isArray(values) || values.length === 0) return [];
    const column = values[0];
    if (!Array.isArray(column)) return [];
    return column.map((cell) => (typeof cell === 'string' ? cell : cell === null || cell === undefined ? '' : String(cell)));
  });
};

/**
 * 여러 **한 열짜리** 범위를 한 번에 읽는다. 응답 순서는 요청 순서와 같다.
 * `majorDimension=COLUMNS` 라 각 범위가 그 열의 값 배열로 온다.
 *
 * 표시값(`FORMATTED_VALUE`)으로 읽는 이유: 사용자가 시트에서 보는 문자열과 같아야 동시 편집 감지
 * (AC-W6)의 비교가 뜻을 갖는다. 서식 뒤의 원시값으로 읽으면 "보이는 값은 같은데 충돌"이 난다.
 */
export const fetchColumnValues = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly ranges: readonly string[] }
): Promise<LedgerResult<(readonly string[])[]>> => {
  if (params.ranges.length === 0) return ledgerOk([]);

  const query = params.ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&');
  const result = await request<unknown>(context, {
    method: 'GET',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}/values:batchGet?${query}&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE`
  });
  if (!result.ok) return passThroughError(result.error);

  const columns = parseValueColumns(result.value, params.ranges.length);
  return columns ? ledgerOk(columns) : ledgerErr(ledgerError('invalid-response'));
};

/**
 * 헤더 행 **한 줄만** 읽는다(열 매핑 후보를 만들 때 1회). 열 수를 모르므로 행 단위 범위를 쓰는
 * 유일한 자리이고, 데이터 행은 여기서 읽지 않는다.
 */
export const fetchHeaderRow = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly range: string }
): Promise<LedgerResult<readonly string[]>> => {
  const result = await request<unknown>(context, {
    method: 'GET',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}/values/${encodeURIComponent(params.range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  });
  if (!result.ok) return passThroughError(result.error);

  const payload = result.value;
  if (!payload || typeof payload !== 'object') return ledgerErr(ledgerError('invalid-response'));
  const values = (payload as Record<string, unknown>).values;
  // 빈 시트는 `values` 키 자체가 없다 — 실패가 아니라 "헤더가 없다"이다.
  if (values === undefined) return ledgerOk([]);
  if (!Array.isArray(values) || values.length === 0) return ledgerOk([]);
  const first = values[0];
  if (!Array.isArray(first)) return ledgerOk([]);
  return ledgerOk(first.map((cell) => (typeof cell === 'string' ? cell : cell === null || cell === undefined ? '' : String(cell))));
};

/* ── 값 쓰기 ────────────────────────────────────────────────────────────────── */

/**
 * 계획된 쓰기 단위(열 × 구간)를 한 번에 보낸다.
 *
 * `USER_ENTERED` — 사용자가 직접 입력한 것처럼 해석되어 날짜·숫자가 값으로 들어간다(사용자 시트의
 * 수식이 계속 동작한다). 자유 입력의 수식 해석은 `format.ts` 가 막는다.
 */
export const writeValues = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly data: readonly SheetValueRange[] }
): Promise<LedgerResult<{ readonly updatedCells: number }>> => {
  if (params.data.length === 0) return ledgerErr(ledgerError('invalid-entry'));

  const result = await request<unknown>(context, {
    method: 'POST',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}/values:batchUpdate`,
    body: {
      valueInputOption: 'USER_ENTERED',
      data: params.data.map((entry) => ({
        range: entry.range,
        majorDimension: entry.majorDimension,
        values: entry.values.map((column) => [...column])
      }))
    }
  });
  if (!result.ok) return passThroughError(result.error);

  const payload = result.value as Record<string, unknown> | null;
  const updatedCells = payload && Number.isInteger(payload.totalUpdatedCells) ? (payload.totalUpdatedCells as number) : 0;
  return ledgerOk({ updatedCells });
};

/**
 * 행 물리 삭제. 🔴 성공 뒤에는 **아래 행 번호가 전부 밀린다** — 호출부는 반드시 스냅샷을 폐기하고
 * 목록을 재조회해야 한다(`ledger.ts` 의 `deleteLedgerEntry` 가 그 책임을 진다).
 */
export const deleteRow = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly request: DeleteRowRequest }
): Promise<LedgerResult<true>> => {
  const result = await request<unknown>(context, {
    method: 'POST',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}:batchUpdate`,
    body: { requests: [params.request] }
  });
  if (!result.ok) return passThroughError(result.error);
  return ledgerOk(true);
};
