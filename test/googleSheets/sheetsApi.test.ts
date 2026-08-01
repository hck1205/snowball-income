// @vitest-environment node — fetch 를 주입해 어댑터만 본다.
import { describe, expect, it } from 'vitest';

import {
  createSpreadsheet,
  deleteRow,
  fetchColumnValues,
  fetchHeaderRow,
  fetchSpreadsheetMeta,
  mapHttpStatusToErrorCode,
  writeValues,
  type SheetValueRange
} from '@/shared/lib/googleSheets';

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

/**
 * ⚠ `vi.fn()` 기본 반환으로 목킹하면 "실패 상태를 정상이라고 단정"하게 된다(이 레포의 실측 함정).
 *   그래서 성공 목과 실패 목을 **각각 명시적으로** 만든다.
 */
const okFetch = (payload: unknown, status = 200) => {
  const calls: Call[] = [];
  const impl: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: (init?.method ?? 'GET').toUpperCase(),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body))
    });
    return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
  };
  return { impl, calls };
};

const statusFetch = (status: number): typeof fetch => async () =>
  new Response(JSON.stringify({ error: { message: '비밀 파일명.xlsx 에 접근할 수 없습니다', status } }), {
    status,
    headers: { 'content-type': 'application/json' }
  });

const throwingFetch: typeof fetch = async () => {
  throw new TypeError('Failed to fetch');
};

const context = (impl: typeof fetch) => ({ accessToken: 'token-abc', fetchImpl: impl });

const META_PAYLOAD = {
  spreadsheetId: 'sheet-1',
  sheets: [{ properties: { sheetId: 0, title: '가계부' } }]
};

describe('HTTP 상태 → 실패 코드', () => {
  it.each([
    [401, 'auth-expired'],
    [403, 'permission-denied'],
    [404, 'sheet-not-found'],
    [429, 'rate-limited'],
    [500, 'server-error'],
    [503, 'server-error'],
    [400, 'invalid-response']
  ])('%i → %s', (status, code) => {
    expect(mapHttpStatusToErrorCode(status)).toBe(code);
  });
});

describe('요청 형태', () => {
  it('Bearer 토큰을 실어 보낸다', async () => {
    const { impl, calls } = okFetch(META_PAYLOAD);
    await fetchSpreadsheetMeta(context(impl), 'sheet-1');
    expect(calls[0].headers.authorization).toBe('Bearer token-abc');
  });

  it('토큰이 비어 있으면 네트워크를 쓰지 않는다', async () => {
    const { impl, calls } = okFetch(META_PAYLOAD);
    const result = await fetchSpreadsheetMeta({ accessToken: '  ', fetchImpl: impl }, 'sheet-1');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.code).toBe('not-authorized');
    expect(calls).toHaveLength(0);
  });

  it('메타 조회는 셀 값을 한 칸도 받아오지 않는다', async () => {
    const { impl, calls } = okFetch(META_PAYLOAD);
    await fetchSpreadsheetMeta(context(impl), 'sheet-1');
    expect(decodeURIComponent(calls[0].url)).toContain('fields=spreadsheetId,sheets(properties(sheetId,title))');
  });

  it('열 조회는 한 열짜리 범위만 요청하고 COLUMNS 로 받는다', async () => {
    const { impl, calls } = okFetch({
      valueRanges: [{ values: [['2026-08-01', '2026-08-02']] }, { values: [['지출', '수입']] }]
    });
    const result = await fetchColumnValues(context(impl), {
      spreadsheetId: 'sheet-1',
      ranges: ["'가계부'!A2:A", "'가계부'!B2:B"]
    });

    expect(calls[0].url).toContain('values:batchGet');
    expect(calls[0].url).toContain('majorDimension=COLUMNS');
    expect(decodeURIComponent(calls[0].url)).toContain("ranges='가계부'!A2:A");
    expect(result.ok && result.value).toEqual([
      ['2026-08-01', '2026-08-02'],
      ['지출', '수입']
    ]);
  });

  it('값이 없는 열은 빈 배열로 돌려준다 (실패가 아니다)', async () => {
    const { impl } = okFetch({ valueRanges: [{}, { values: [] }] });
    const result = await fetchColumnValues(context(impl), {
      spreadsheetId: 'sheet-1',
      ranges: ["'가계부'!F2:F", "'가계부'!E2:E"]
    });
    expect(result.ok && result.value).toEqual([[], []]);
  });

  it('요청한 범위 수와 응답 수가 다르면 정렬을 신뢰하지 않는다', async () => {
    // 여기서 어긋난 채 진행하면 **다른 열의 값을 다른 필드로 읽는다**.
    const { impl } = okFetch({ valueRanges: [{ values: [['x']] }] });
    const result = await fetchColumnValues(context(impl), {
      spreadsheetId: 'sheet-1',
      ranges: ["'가계부'!A2:A", "'가계부'!B2:B"]
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.code).toBe('invalid-response');
  });

  it('헤더 행은 행 단위로 한 줄만 읽는다', async () => {
    const { impl, calls } = okFetch({ values: [['날짜', '구분', '금액']] });
    const result = await fetchHeaderRow(context(impl), { spreadsheetId: 'sheet-1', range: "'가계부'!1:1" });
    expect(calls[0].url).toContain('majorDimension=ROWS');
    expect(result.ok && result.value).toEqual(['날짜', '구분', '금액']);
  });

  it('빈 시트의 헤더 조회는 실패가 아니라 빈 목록이다', async () => {
    const { impl } = okFetch({ range: "'가계부'!1:1", majorDimension: 'ROWS' });
    const result = await fetchHeaderRow(context(impl), { spreadsheetId: 'sheet-1', range: "'가계부'!1:1" });
    expect(result.ok && result.value).toEqual([]);
  });

  it('쓰기는 USER_ENTERED 로 보내고 계획한 범위를 그대로 싣는다', async () => {
    const { impl, calls } = okFetch({ totalUpdatedCells: 2 });
    const data: SheetValueRange[] = [
      { range: "'가계부'!C5", majorDimension: 'COLUMNS', values: [['1200']] },
      { range: "'가계부'!E5", majorDimension: 'COLUMNS', values: [['점심']] }
    ];
    const result = await writeValues(context(impl), { spreadsheetId: 'sheet-1', data });

    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toContain('values:batchUpdate');
    expect(calls[0].body).toEqual({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: "'가계부'!C5", majorDimension: 'COLUMNS', values: [['1200']] },
        { range: "'가계부'!E5", majorDimension: 'COLUMNS', values: [['점심']] }
      ]
    });
    expect(result.ok && result.value.updatedCells).toBe(2);
  });

  it('쓸 것이 없으면 요청을 보내지 않는다', async () => {
    const { impl, calls } = okFetch({ totalUpdatedCells: 0 });
    const result = await writeValues(context(impl), { spreadsheetId: 'sheet-1', data: [] });
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('행 삭제는 스프레드시트 batchUpdate 로 한 행만 지운다', async () => {
    const { impl, calls } = okFetch({ replies: [{}] });
    await deleteRow(context(impl), {
      spreadsheetId: 'sheet-1',
      request: { deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: 4, endIndex: 5 } } }
    });
    expect(calls[0].url).toContain(':batchUpdate');
    expect(calls[0].url).not.toContain('values:batchUpdate');
    expect(calls[0].body).toEqual({
      requests: [{ deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: 4, endIndex: 5 } } }]
    });
  });

  it('새 시트는 앱 탭 제목으로 만든다', async () => {
    const { impl, calls } = okFetch(META_PAYLOAD);
    await createSpreadsheet(context(impl), { title: '우리집 가계부', tabTitle: '가계부' });
    expect(calls[0].body).toEqual({
      properties: { title: '우리집 가계부' },
      sheets: [{ properties: { title: '가계부' } }]
    });
  });
});

describe('실패 경로 — 무음으로 삼키지 않는다', () => {
  it.each([
    [401, 'auth-expired', 'reauthorize'],
    [403, 'permission-denied', 'reconnect'],
    [404, 'sheet-not-found', 'reconnect']
  ])('%i 는 %s 로 오고 복구 경로가 %s 다', async (status, code, recovery) => {
    const result = await fetchSpreadsheetMeta(context(statusFetch(status)), 'sheet-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(code);
    expect(result.error.recovery).toBe(recovery);
  });

  it('네트워크가 던져도 예외가 밖으로 나가지 않는다', async () => {
    const result = await fetchSpreadsheetMeta(context(throwingFetch), 'sheet-1');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.code).toBe('network-error');
  });

  it('JSON 이 아닌 응답은 invalid-response 다', async () => {
    const brokenFetch: typeof fetch = async () => new Response('<html>', { status: 200 });
    const result = await fetchSpreadsheetMeta(context(brokenFetch), 'sheet-1');
    expect(result.ok === false && result.error.code).toBe('invalid-response');
  });

  it('탭이 하나도 없는 응답은 지어내지 않고 실패로 둔다', async () => {
    const { impl } = okFetch({ spreadsheetId: 'sheet-1', sheets: [] });
    const result = await fetchSpreadsheetMeta(context(impl), 'sheet-1');
    expect(result.ok === false && result.error.code).toBe('invalid-response');
  });

  it('🔴 실패 메시지에 구글 응답 본문(파일명 등)이 실리지 않는다', async () => {
    const result = await fetchSpreadsheetMeta(context(statusFetch(403)), 'sheet-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).not.toContain('비밀 파일명');
    expect(result.error.message).not.toContain('xlsx');
    expect(result.error.message).not.toContain('sheet-1');
  });
});
