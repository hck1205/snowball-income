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
import { quoteSheetTitle } from './a1';
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

/**
 * 🔴 **403 은 서로 완전히 다른 세 상황에 똑같이 온다.** 상태 코드만 보면 전부 "이 시트에 권한이 없다"가
 * 되는데, 실제로는 사용자가 앱 안에서 할 수 있는 일이 각각 다르다:
 *
 *  - `SERVICE_DISABLED` / `accessNotConfigured` — 클라우드 프로젝트에서 **Sheets API 가 꺼져 있다.**
 *    시트를 다시 골라도 영원히 실패한다. 실제로 이 오분류가 났다(2026-08-01: 앱이 **방금 만든** 시트에
 *    헤더를 쓰다 403 → "시트 편집 권한을 확인하세요"라고 안내해 사용자를 엉뚱한 곳으로 보냈다).
 *  - `ACCESS_TOKEN_SCOPE_INSUFFICIENT` / `insufficientPermissions` — 동의 창에서 체크를 해제해
 *    **스코프가 빠졌다.** 권한을 다시 받아야 한다.
 *  - 그 외 — 진짜로 그 파일에 접근할 수 없다.
 *
 * 🔴 여기서 읽는 것은 **열거형 사유 문자열뿐**이다(`error.status`·`error.details[].reason`).
 *    파일명·범위·시트 제목이 담기는 `error.message` 는 **읽지도 싣지도 않는다** — 이 파일 규율 2번.
 */
const FORBIDDEN_REASON_CODE: Readonly<Record<string, LedgerErrorCode>> = {
  SERVICE_DISABLED: 'api-disabled',
  accessNotConfigured: 'api-disabled',
  ACCESS_TOKEN_SCOPE_INSUFFICIENT: 'not-authorized',
  insufficientPermissions: 'not-authorized'
};

/** 403 본문에서 사유 열거형만 뽑아 코드를 좁힌다. 못 읽으면 기존 판정을 그대로 쓴다. */
export const refineForbiddenErrorCode = (payload: unknown): LedgerErrorCode => {
  const fallback: LedgerErrorCode = 'permission-denied';
  if (!payload || typeof payload !== 'object') return fallback;
  const error = (payload as Record<string, unknown>).error;
  if (!error || typeof error !== 'object') return fallback;

  const record = error as Record<string, unknown>;
  const reasons: string[] = [];
  if (typeof record.status === 'string') reasons.push(record.status);
  if (Array.isArray(record.details)) {
    for (const detail of record.details) {
      if (detail && typeof detail === 'object') {
        const reason = (detail as Record<string, unknown>).reason;
        if (typeof reason === 'string') reasons.push(reason);
      }
    }
  }
  if (Array.isArray(record.errors)) {
    for (const entry of record.errors) {
      if (entry && typeof entry === 'object') {
        const reason = (entry as Record<string, unknown>).reason;
        if (typeof reason === 'string') reasons.push(reason);
      }
    }
  }

  for (const reason of reasons) {
    const mapped = FORBIDDEN_REASON_CODE[reason];
    if (mapped) return mapped;
  }
  return fallback;
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
    // 본문 전체를 메시지에 싣지 않는다: 구글 오류 본문에는 파일명·범위가 들어 있다(규율 2).
    // 다만 403 만은 **열거형 사유**를 읽어 코드를 좁힌다 — 그러지 않으면 "프로젝트에서 API 가 꺼짐"이
    // "이 시트에 권한이 없음"으로 둔갑해 사용자가 고칠 수 없는 곳을 보게 된다(`refineForbiddenErrorCode`).
    if (response.status === 403) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // 본문이 없거나 JSON 이 아니면 상태만으로 판정한다.
      }
      return ledgerErr(ledgerError(refineForbiddenErrorCode(payload)));
    }
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
  params: { readonly title: string; readonly body?: Record<string, unknown>; readonly tabTitle?: string }
): Promise<LedgerResult<SpreadsheetMeta>> => {
  const result = await request<unknown>(context, {
    method: 'POST',
    url: SHEETS_BASE,
    /*
     * 🔴 `body` 를 받으면 그대로 보낸다 — 설계도(`blueprint.ts`)가 탭·격자·고정행·초기값을 **한 번의
     *    요청**으로 만들기 때문이다. 나눠 보내면 탭마다 왕복이 생기고 429 예산을 그만큼 먹는다.
     * ⚠ `tabTitle` 은 설계도를 안 쓰는 호출부(테스트 등)를 위한 최소 경로다.
     */
    body: params.body ?? {
      properties: { title: params.title },
      sheets: [{ properties: { title: params.tabTitle ?? params.title } }]
    }
  });
  if (!result.ok) return passThroughError(result.error);

  const meta = parseSpreadsheetMeta(result.value);
  return meta ? ledgerOk(meta) : ledgerErr(ledgerError('invalid-response'));
};

/**
 * 서식·드롭다운·줄무늬를 입힌다. 생성 응답에서 받은 `sheetId` 가 필요해 **두 번째 요청**이다.
 *
 * 🔴 실패해도 시트는 살아 있다 — 호출부가 이 실패로 연결을 무르지 않는다. 서식이 덜 입혀진 시트는
 *    보기에 아쉬울 뿐 기록은 정상이고, 여기서 되돌리면 사용자가 만든 파일이 드라이브에 고아로 남는다.
 */
export const applySheetFormatting = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly requests: readonly Record<string, unknown>[] }
): Promise<LedgerResult<true>> => {
  if (params.requests.length === 0) return ledgerOk(true);
  const result = await request<unknown>(context, {
    method: 'POST',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}:batchUpdate`,
    body: { requests: params.requests }
  });
  if (!result.ok) return passThroughError(result.error);
  return ledgerOk(true);
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

/**
 * 시트 **위쪽 몇 줄**을 행 단위로 읽는다(레이아웃 탐색용).
 *
 * 🔴 `fetchHeaderRow` 와 갈라 두는 이유: 저쪽은 "헤더는 1행"이라는 전제를 갖고 한 줄만 읽는다.
 *    널리 쓰이는 가계부 템플릿은 1행이 제목·안내문이고 진짜 헤더가 한참 아래라(실측 11행) 그
 *    전제가 성립하지 않는다. 전제가 다른 함수를 하나로 합치면 한쪽 호출부가 조용히 틀린 줄을 읽는다.
 *
 * ⚠ **데이터 셀을 읽는 것이 아니다.** 위 N 줄만 보고 모양을 알아낸 뒤 버린다 — 가계부 값은 이
 *   단계에서 앱 메모리에 남지 않는다(연결 전에 남의 시트 내용을 들고 있지 않는다는 규율).
 * ⚠ 열 길이가 제각각이라 짧은 행은 그대로 짧게 온다. 호출부(`suggestColumnMapping`)가 빈 칸을
 *   후보에서 거르므로 여기서 굳이 채우지 않는다.
 */
export const fetchGridRows = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly sheetTitle: string; readonly lastRow: number }
): Promise<LedgerResult<readonly (readonly string[])[]>> => {
  const range = `${quoteSheetTitle(params.sheetTitle)}!1:${params.lastRow}`;
  const result = await request<unknown>(context, {
    method: 'GET',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  });
  if (!result.ok) return passThroughError(result.error);

  const payload = result.value;
  if (!payload || typeof payload !== 'object') return ledgerErr(ledgerError('invalid-response'));
  const values = (payload as Record<string, unknown>).values;
  // 빈 시트는 `values` 키 자체가 없다 — 실패가 아니라 "아무것도 없다"이다.
  if (values === undefined) return ledgerOk([]);
  if (!Array.isArray(values)) return ledgerErr(ledgerError('invalid-response'));

  return ledgerOk(
    values.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (typeof cell === 'string' ? cell : cell === null || cell === undefined ? '' : String(cell)))
        : []
    )
  );
};

/* ── 탭 속성 ────────────────────────────────────────────────────────────────── */

/**
 * 탭 하나의 **제목**을 바꾼다.
 *
 * 🔴 이름을 바꿔도 **수식은 따라온다.** 구글이 `'가계부'!$E:$E` 같은 참조를 자동으로 고쳐 준다 —
 *    그래서 `월별 요약`·`현금흐름` 이 깨지지 않는다.
 * ⚠ 우리 코드가 **제목으로 찾는 탭**(`자산`·`투자`·`분류 규칙`)은 이 경로로 바꾸면 안 된다.
 *   그 탭들은 앱이 이름으로 집으므로 바뀌는 순간 못 찾는다. 가계부 탭만 이름을 연다.
 */
export const updateSheetTitle = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly sheetId: number; readonly title: string }
): Promise<LedgerResult<null>> => {
  const result = await request<unknown>(context, {
    method: 'POST',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}:batchUpdate`,
    body: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: params.sheetId, title: params.title },
            fields: 'title'
          }
        }
      ]
    }
  });
  return result.ok ? ledgerOk(null) : passThroughError(result.error);
};

/**
 * 탭을 보이거나 숨긴다.
 *
 * 🔴 **지우지 않는다.** 공동 가계부를 끌 때 탭을 지우면 적어 둔 기록이 함께 사라진다 —
 *    끄는 것과 버리는 것은 다르고, 사용자가 뜻한 것은 앞쪽이다. 다시 켜면 그대로 돌아온다.
 */
export const setSheetHidden = async (
  context: SheetsRequestContext,
  params: { readonly spreadsheetId: string; readonly sheetId: number; readonly hidden: boolean }
): Promise<LedgerResult<null>> => {
  const result = await request<unknown>(context, {
    method: 'POST',
    url: `${SHEETS_BASE}/${encodeURIComponent(params.spreadsheetId)}:batchUpdate`,
    body: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: params.sheetId, hidden: params.hidden },
            fields: 'hidden'
          }
        }
      ]
    }
  });
  return result.ok ? ledgerOk(null) : passThroughError(result.error);
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
