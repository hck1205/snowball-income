// @vitest-environment node — 조회 → 추가 → 수정 → 삭제 왕복. fetch 는 명시적으로 주입한다.
import { beforeEach, describe, expect, it } from 'vitest';

import {
  APP_SHEET_MAPPING,
  HARD_DELETE_CONFIRMATION,
  appendLedgerEntries,
  connectSpreadsheet,
  createLedgerSheet,
  deleteLedgerEntry,
  readLedgerSnapshot,
  resetRetiredSnapshotsForTest,
  updateLedgerEntry,
  type ColumnMapping,
  type LedgerDraft,
  type SheetLink
} from '@/shared/lib/googleSheets';

type Reply = { readonly status?: number; readonly payload: unknown };
type Recorded = { readonly kind: string; readonly url: string; readonly body: unknown };

/**
 * 요청 종류별 응답 **큐**. 목이 없으면 조용히 성공하지 않고 `unmatched` 에 남아 테스트가 실패한다
 * (기본 반환으로 목킹하면 "실패 상태를 정상이라고 단정"하게 된다 — 이 레포의 실측 함정).
 */
const createHarness = () => {
  const queues: Record<string, Reply[]> = {
    create: [],
    meta: [],
    headerGet: [],
    batchGet: [],
    valuesWrite: [],
    sheetBatchUpdate: []
  };
  const calls: Recorded[] = [];
  const unmatched: string[] = [];

  const classify = (url: string, method: string): string => {
    if (method === 'POST' && url.includes('/values:batchUpdate')) return 'valuesWrite';
    if (method === 'POST' && url.includes(':batchUpdate')) return 'sheetBatchUpdate';
    if (method === 'POST') return 'create';
    if (url.includes('/values:batchGet')) return 'batchGet';
    if (url.includes('/values/')) return 'headerGet';
    return 'meta';
  };

  const impl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const kind = classify(url, method);
    const body = init?.body === undefined ? undefined : JSON.parse(String(init.body));
    calls.push({ kind, url, body });

    const reply = queues[kind].shift();
    if (!reply) {
      unmatched.push(`${kind} ${method}`);
      return new Response(JSON.stringify({ error: 'no mock' }), { status: 599 });
    }
    return new Response(JSON.stringify(reply.payload), {
      status: reply.status ?? 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  return { queues, calls, unmatched, context: { accessToken: 'token', fetchImpl: impl } };
};

const valueRanges = (columns: readonly (readonly string[])[]) => ({
  valueRanges: columns.map((values) => (values.length === 0 ? {} : { values: [values] }))
});

const LINK: SheetLink = {
  spreadsheetId: 'sheet-1',
  sheetId: 0,
  sheetTitle: '가계부',
  mapping: APP_SHEET_MAPPING,
  createdByApp: true
};

/**
 * 2행 = 읽히는 항목 / 3행 = 날짜를 못 읽는 항목.
 *
 * ⚠ 순서는 **v2 열 순서**다: 날짜·구분·항목·상세항목·금액·주체·결제수단·고정·내용·상태.
 *   v2 축 넷은 빈 열이다 — 값을 넣지 않은 시트가 정상이고, 그때도 읽혀야 한다는 것이 이 픽스처의 뜻이다.
 */
const SHEET_COLUMNS: readonly (readonly string[])[] = [
  ['2026-08-01', 'ㅁㅁ'],
  ['지출', '수입'],
  ['식비', '급여'],
  [],
  ['₩1,200', '1000'],
  [],
  [],
  [],
  ['점심'],
  []
];

/**
 * 2행의 현재 값 — **필드 순서**다(열 순서가 아니다).
 *
 * 🔴 두 읽기의 순서가 다르다. 스냅샷 조회는 `mappedColumnIndices`(열 인덱스 오름차순)로 요청하고,
 *    충돌 검증(`readCurrentRowCells`)·추가 검증은 `mappedFields`(필수 → 선택의 **필드** 순서)로
 *    요청한다. 그래서 위 SHEET_COLUMNS 는 열 순서, 이 픽스처는 필드 순서다 —
 *    섞으면 값이 엉뚱한 필드로 들어가 "바꾸지도 않은 칸이 충돌"로 나온다.
 *
 * 필드 순서: 날짜 · 구분 · 금액 · 항목 · 상세항목 · 주체 · 결제수단 · 고정 · 내용 · 상태
 */
const ROW2_CURRENT: readonly (readonly string[])[] = [
  ['2026-08-01'],
  ['지출'],
  ['₩1,200'],
  ['식비'],
  [],
  [],
  [],
  [],
  ['점심'],
  []
];

const DRAFT: LedgerDraft = { date: '2026-08-05', kind: 'expense', amount: 5000, category: '교통', memo: '지하철' };

describe('연결', () => {
  beforeEach(() => resetRetiredSnapshotsForTest());

  it('앱 스키마와 일치하면 매핑 단계를 건너뛴다', async () => {
    const harness = createHarness();
    harness.queues.meta.push({ payload: { spreadsheetId: 'sheet-1', sheets: [{ properties: { sheetId: 0, title: '가계부' } }] } });
    harness.queues.headerGet.push({ payload: { values: [['날짜', '구분', '항목', '상세항목', '금액', '주체', '결제수단', '고정', '내용', '상태']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1' });
    expect(harness.unmatched).toEqual([]);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.status !== 'linked') throw new Error('연결되지 않았습니다');
    expect(result.value.link.mapping).toEqual(APP_SHEET_MAPPING);
    expect(result.value.link.createdByApp).toBe(true);
  });

  it('남의 시트는 매핑이 필요하다고 알린다 (헤더를 그대로 넘겨준다)', async () => {
    const harness = createHarness();
    harness.queues.meta.push({ payload: { spreadsheetId: 'sheet-1', sheets: [{ properties: { sheetId: 3, title: '2026' } }] } });
    harness.queues.headerGet.push({ payload: { values: [['일자', '수입/지출', '금액', '항목', '비고']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1' });
    if (!result.ok || result.value.status !== 'needs-mapping') throw new Error('매핑 요구가 아닙니다');
    expect(result.value.headers).toEqual(['일자', '수입/지출', '금액', '항목', '비고']);
    expect(result.value.sheetId).toBe(3);
  });

  it('저장된 매핑이 있으면 그대로 쓴다', async () => {
    const harness = createHarness();
    const mapping: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3 };
    harness.queues.meta.push({ payload: { spreadsheetId: 'sheet-1', sheets: [{ properties: { sheetId: 0, title: '2026' } }] } });
    harness.queues.headerGet.push({ payload: { values: [['일자', '수입/지출', '금액', '항목']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1', mapping });
    if (!result.ok || result.value.status !== 'linked') throw new Error('연결되지 않았습니다');
    expect(result.value.link.mapping).toEqual(mapping);
    expect(result.value.link.createdByApp).toBe(false);
  });

  /*
   * B-1 — 연결 결과에 **탭 목록**이 실린다.
   * 🔴 이게 없으면 화면이 탭 선택을 그리려고 `fetchSpreadsheetMeta` 를 한 번 더 부르게 되고,
   *    연결마다 읽기 요청이 1회 늘어난다(429 예산). 두 분기 **모두** 실어야 한다 —
   *    매핑이 필요한 탭으로 옮기는 도중에도 탭 목록은 화면에 남아 있어야 하기 때문이다.
   */
  it('연결 결과에 그 파일의 탭 목록이 함께 온다 (linked)', async () => {
    const harness = createHarness();
    harness.queues.meta.push({
      payload: {
        spreadsheetId: 'sheet-1',
        sheets: [{ properties: { sheetId: 0, title: '가계부' } }, { properties: { sheetId: 7, title: '작년' } }]
      }
    });
    harness.queues.headerGet.push({ payload: { values: [['날짜', '구분', '항목', '상세항목', '금액', '주체', '결제수단', '고정', '내용', '상태']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1' });
    if (!result.ok || result.value.status !== 'linked') throw new Error('연결되지 않았습니다');
    expect(result.value.tabs).toEqual([
      { sheetId: 0, title: '가계부' },
      { sheetId: 7, title: '작년' }
    ]);
    // 메타는 **한 번만** 읽는다(탭 목록 때문에 요청이 늘지 않았다).
    expect(harness.calls.filter((call) => call.kind === 'meta')).toHaveLength(1);
  });

  it('연결 결과에 그 파일의 탭 목록이 함께 온다 (저장된 매핑으로 바로 연결 — 탭 전환의 주 경로)', async () => {
    const harness = createHarness();
    const mapping: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3 };
    harness.queues.meta.push({
      payload: {
        spreadsheetId: 'sheet-1',
        sheets: [{ properties: { sheetId: 0, title: '가계부' } }, { properties: { sheetId: 7, title: '작년' } }]
      }
    });
    harness.queues.headerGet.push({ payload: { values: [['일자', '수입/지출', '금액', '항목']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1', sheetId: 7, mapping });
    if (!result.ok || result.value.status !== 'linked') throw new Error('연결되지 않았습니다');
    expect(result.value.link.sheetId).toBe(7);
    expect(result.value.tabs).toEqual([
      { sheetId: 0, title: '가계부' },
      { sheetId: 7, title: '작년' }
    ]);
  });

  it('연결 결과에 그 파일의 탭 목록이 함께 온다 (needs-mapping)', async () => {
    const harness = createHarness();
    harness.queues.meta.push({
      payload: {
        spreadsheetId: 'sheet-1',
        sheets: [{ properties: { sheetId: 0, title: '가계부' } }, { properties: { sheetId: 7, title: '작년' } }]
      }
    });
    harness.queues.headerGet.push({ payload: { values: [['일자', '수입/지출', '금액', '항목']] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1', sheetId: 7 });
    if (!result.ok || result.value.status !== 'needs-mapping') throw new Error('매핑 요구가 아닙니다');
    expect(result.value.sheetId).toBe(7);
    expect(result.value.tabs).toEqual([
      { sheetId: 0, title: '가계부' },
      { sheetId: 7, title: '작년' }
    ]);
  });

  it('요청한 탭이 없으면 sheet-not-found 다', async () => {
    const harness = createHarness();
    harness.queues.meta.push({ payload: { spreadsheetId: 'sheet-1', sheets: [{ properties: { sheetId: 0, title: '가계부' } }] } });

    const result = await connectSpreadsheet(harness.context, { spreadsheetId: 'sheet-1', sheetId: 99 });
    expect(result.ok === false && result.error.code).toBe('sheet-not-found');
  });

  it('🔴 새 시트에는 헤더만 넣고 예시 데이터 행을 넣지 않는다', async () => {
    const harness = createHarness();
    harness.queues.create.push({
      payload: {
        spreadsheetId: 'new-1',
        sheets: [
          { properties: { sheetId: 0, title: '가계부' } },
          { properties: { sheetId: 1, title: '분류' } }
        ]
      }
    });
    /* 서식·드롭다운은 생성 뒤 두 번째 요청이다(sheetId 를 받아야 지정할 수 있다). */
    harness.queues.sheetBatchUpdate.push({ payload: {} });

    const result = await createLedgerSheet(harness.context, { title: '가계부' });
    expect(harness.unmatched).toEqual([]);
    expect(result.ok).toBe(true);

    /*
     * 🔴 계약은 그대로다 — **사용자가 지워야 할 예시 행을 앱이 만들지 않는다.**
     *    설계도가 탭·머리·수식을 생성 요청에 함께 실으므로 별도 값 쓰기는 없다.
     */
    const create = harness.calls.find((call) => call.kind === 'create');
    const body = create?.body as { sheets: { properties: { title: string }; data: { rowData: unknown[] }[] }[] };
    const ledgerTab = body.sheets.find((sheet) => sheet.properties.title === '가계부');

    expect(ledgerTab?.data[0].rowData).toHaveLength(1); // 머리 한 줄뿐
    expect(harness.calls.some((call) => call.kind === 'valuesWrite')).toBe(false);
  });

  it('설계도대로 탭 여럿을 한 번의 요청으로 만든다', async () => {
    const harness = createHarness();
    harness.queues.create.push({
      payload: { spreadsheetId: 'new-1', sheets: [{ properties: { sheetId: 0, title: '가계부' } }] }
    });
    harness.queues.sheetBatchUpdate.push({ payload: {} });

    await createLedgerSheet(harness.context, { title: '가계부' });

    const create = harness.calls.find((call) => call.kind === 'create');
    const body = create?.body as { sheets: { properties: { title: string } }[] };

    expect(body.sheets.length).toBeGreaterThan(1);
    expect(body.sheets[0].properties.title).toBe('가계부'); // 연결이 tabs[0] 을 집는다
    expect(harness.calls.filter((call) => call.kind === 'create')).toHaveLength(1);
  });

  it('🔴 서식이 실패해도 연결은 성립한다 — 방금 만든 파일을 고아로 남기지 않는다', async () => {
    const harness = createHarness();
    harness.queues.create.push({
      payload: { spreadsheetId: 'new-1', sheets: [{ properties: { sheetId: 0, title: '가계부' } }] }
    });
    harness.queues.sheetBatchUpdate.push({ status: 500, payload: {} });

    const result = await createLedgerSheet(harness.context, { title: '가계부' });

    expect(result.ok).toBe(true);
  });
});

describe('조회', () => {
  beforeEach(() => resetRetiredSnapshotsForTest());

  it('매핑된 열만 읽고, 읽을 수 없는 행은 건너뛰되 보고한다', async () => {
    const harness = createHarness();
    harness.queues.batchGet.push({ payload: valueRanges(SHEET_COLUMNS) });

    const result = await readLedgerSnapshot(harness.context, LINK);
    expect(harness.unmatched).toEqual([]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.entries).toHaveLength(1);
    expect(result.value.entries[0]).toMatchObject({
      date: '2026-08-01',
      kind: 'expense',
      amount: 1200,
      category: '식비',
      memo: '점심'
    });
    expect(result.value.unreadableRows).toEqual([{ rowNumber: 3, reasons: ['날짜를 읽을 수 없습니다.'] }]);
    expect(result.value.lastDataRow).toBe(3);

    // 매핑된 10열만, 각각 한 열짜리 열린 범위로 요청한다(v2: A~J).
    const url = decodeURIComponent(harness.calls[0].url);
    expect(url).toContain("ranges='가계부'!A2:A");
    expect(url).toContain("ranges='가계부'!J2:J");
    // 🔴 매핑 밖의 열은 요청하지 않는다 — 사용자가 오른쪽에 덧붙인 자기 열을 앱이 읽지 않는다.
    expect(url).not.toContain('K2');
  });

  it('조회가 실패하면 스냅샷을 지어내지 않는다', async () => {
    const harness = createHarness();
    harness.queues.batchGet.push({ status: 404, payload: {} });

    const result = await readLedgerSnapshot(harness.context, LINK);
    expect(result.ok === false && result.error.code).toBe('sheet-not-found');
    expect(result.ok === false && result.error.recovery).toBe('reconnect');
  });
});

describe('추가 (AC-W1 · AC-W5)', () => {
  beforeEach(() => resetRetiredSnapshotsForTest());

  const readSnapshot = async (harness: ReturnType<typeof createHarness>) => {
    harness.queues.batchGet.push({ payload: valueRanges(SHEET_COLUMNS) });
    const snapshot = await readLedgerSnapshot(harness.context, LINK);
    if (!snapshot.ok) throw new Error('스냅샷 조회 실패');
    return snapshot.value;
  };

  it('마지막 데이터 행 다음에 쓰고, 못 쓰는 건은 그 건만 실패로 돌려준다', async () => {
    const harness = createHarness();
    const snapshot = await readSnapshot(harness);

    harness.queues.batchGet.push({ payload: valueRanges([[], [], [], [], [], [], [], [], [], []]) }); // 대상 칸 확인
    harness.queues.valuesWrite.push({ payload: { totalUpdatedCells: 6 } });

    const report = await appendLedgerEntries(harness.context, {
      link: LINK,
      snapshot,
      drafts: [DRAFT, { ...DRAFT, date: '2026-13-01' }]
    });

    expect(harness.unmatched).toEqual([]);
    expect(report).toMatchObject({ status: 'partial', successCount: 1, failureCount: 1 });
    expect(report.items[0]).toEqual({ ok: true, index: 0, value: 4 });
    expect(report.items[1].ok).toBe(false);
    expect(report.items[1].ok === false && report.items[1].error.fields).toEqual(['date']);

    const write = harness.calls.find((call) => call.kind === 'valuesWrite');
    const data = (write?.body as { data: { range: string }[] }).data;
    /*
     * 열마다 한 단위씩 쓴다(행 통째로 덮지 않는다). 순서는 **필드 순서**라 열 문자가 A~J 오름차순이
     * 아니다 — 금액(E)이 항목(C)보다 먼저 온다. 이 어긋남이 곧 "쓰기는 필드 단위"라는 증거다.
     */
    expect(data.map((entry) => entry.range)).toEqual([
      "'가계부'!A4:A4", // 날짜
      "'가계부'!B4:B4", // 구분
      "'가계부'!E4:E4", // 금액
      "'가계부'!C4:C4", // 항목
      "'가계부'!D4:D4", // 상세항목
      "'가계부'!F4:F4", // 주체
      "'가계부'!G4:G4", // 결제수단
      "'가계부'!H4:H4", // 고정
      "'가계부'!I4:I4", // 내용
      "'가계부'!J4:J4" // 상태
    ]);
  });

  it('🔴 대상 칸에 이미 값이 있으면 덮어쓰지 않는다', async () => {
    const harness = createHarness();
    const snapshot = await readSnapshot(harness);

    harness.queues.batchGet.push({ payload: valueRanges([['남의 값'], [], [], [], [], [], [], [], [], []]) });

    const report = await appendLedgerEntries(harness.context, { link: LINK, snapshot, drafts: [DRAFT] });

    expect(report.status).toBe('failure');
    expect(report.items[0].ok === false && report.items[0].error.code).toBe('conflict');
    // 쓰기 요청 자체가 나가지 않았다.
    expect(harness.calls.some((call) => call.kind === 'valuesWrite')).toBe(false);
  });

  it('값이 전부 잘못됐으면 네트워크를 쓰지 않는다', async () => {
    const harness = createHarness();
    const snapshot = await readSnapshot(harness);
    const before = harness.calls.length;

    const report = await appendLedgerEntries(harness.context, {
      link: LINK,
      snapshot,
      drafts: [{ ...DRAFT, date: '어제' }]
    });

    expect(report.status).toBe('failure');
    expect(harness.calls).toHaveLength(before);
  });

  it('쓰기가 실패하면 건별로 그 실패를 알린다', async () => {
    const harness = createHarness();
    const snapshot = await readSnapshot(harness);

    harness.queues.batchGet.push({ payload: valueRanges([[], [], [], [], [], [], [], [], [], []]) });
    harness.queues.valuesWrite.push({ status: 403, payload: {} });

    const report = await appendLedgerEntries(harness.context, { link: LINK, snapshot, drafts: [DRAFT] });
    expect(report.status).toBe('failure');
    expect(report.items[0].ok === false && report.items[0].error.code).toBe('permission-denied');
  });
});

describe('수정 (AC-W3 · AC-W6)', () => {
  beforeEach(() => resetRetiredSnapshotsForTest());

  const setup = async () => {
    const harness = createHarness();
    harness.queues.batchGet.push({ payload: valueRanges(SHEET_COLUMNS) });
    const snapshot = await readLedgerSnapshot(harness.context, LINK);
    if (!snapshot.ok) throw new Error('스냅샷 조회 실패');
    return { harness, snapshot: snapshot.value, entry: snapshot.value.entries[0] };
  };

  it('바꾼 필드의 셀만 쓴다', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });
    harness.queues.valuesWrite.push({ payload: { totalUpdatedCells: 1 } });

    const result = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      patch: { amount: 3000 }
    });

    expect(harness.unmatched).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual({ rowNumber: 2, updatedFields: ['amount'] });

    const write = harness.calls.find((call) => call.kind === 'valuesWrite');
    expect((write?.body as { data: { range: string; values: string[][] }[] }).data).toEqual([
      { range: "'가계부'!E2", majorDimension: 'COLUMNS', values: [['3000']] }
    ]);
  });

  it('🔴 시트가 먼저 바뀌었으면 덮어쓰지 않고 충돌로 돌려준다', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({
      // 필드 순서(ROW2_CURRENT 주석 참고). 금액만 시트에서 먼저 바뀐 상황이다.
      payload: valueRanges([
        ['2026-08-01'],
        ['지출'],
        ['₩9,900'],
        ['식비'],
        [],
        [],
        [],
        [],
        ['점심'],
        []
      ])
    });

    const result = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      patch: { amount: 3000 }
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('conflict');
    expect(result.error.fields).toEqual(['amount']);
    expect(harness.calls.some((call) => call.kind === 'valuesWrite')).toBe(false);
  });

  /*
   * B-1 AC1-6 — 탭을 바꾸면 스냅샷이 통째로 새로 만들어진다. 그 **이전** 스냅샷의 행 참조로는
   * 쓰기가 실행되지 않아야 한다(다른 탭의 같은 행 번호를 덮어쓰는 사고).
   */
  it('🔴 다른 스냅샷(=다른 탭)에서 만든 행 참조로는 쓰지 않는다', async () => {
    const { harness, snapshot, entry } = await setup();

    // 탭을 바꿔 새로 읽은 스냅샷(같은 행 번호, 다른 스냅샷 ID).
    harness.queues.batchGet.push({ payload: valueRanges(SHEET_COLUMNS) });
    const other = await readLedgerSnapshot(harness.context, LINK);
    if (!other.ok) throw new Error('스냅샷 조회 실패');
    expect(other.value.snapshotId).not.toBe(snapshot.snapshotId);

    const before = harness.calls.length;
    const result = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot: other.value,
      ref: entry.ref,
      seen: entry.seen,
      patch: { amount: 3000 }
    });

    expect(result.ok === false && result.error.code).toBe('stale-snapshot');
    expect(harness.calls).toHaveLength(before);
  });

  it('값이 잘못된 수정은 네트워크를 쓰지 않는다', async () => {
    const { harness, snapshot, entry } = await setup();
    const before = harness.calls.length;

    const result = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      patch: { date: '2026-02-30' }
    });

    expect(result.ok === false && result.error.code).toBe('invalid-entry');
    expect(harness.calls).toHaveLength(before);
  });
});

describe('삭제 (AC-W4)', () => {
  beforeEach(() => resetRetiredSnapshotsForTest());

  const setup = async () => {
    const harness = createHarness();
    harness.queues.batchGet.push({ payload: valueRanges(SHEET_COLUMNS) });
    const snapshot = await readLedgerSnapshot(harness.context, LINK);
    if (!snapshot.ok) throw new Error('스냅샷 조회 실패');
    return { harness, snapshot: snapshot.value, entry: snapshot.value.entries[0] };
  };

  it('소프트 삭제는 상태 칸만 바꾸고 스냅샷을 유지한다', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });
    harness.queues.valuesWrite.push({ payload: { totalUpdatedCells: 1 } });

    const result = await deleteLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      mode: 'soft'
    });

    expect(result.ok && result.value).toEqual({ rowNumber: 2, mode: 'soft', snapshotRetired: false });
    const write = harness.calls.find((call) => call.kind === 'valuesWrite');
    expect((write?.body as { data: { range: string; values: string[][] }[] }).data).toEqual([
      { range: "'가계부'!J2", majorDimension: 'COLUMNS', values: [['삭제됨']] }
    ]);
  });

  it('🔴 확인 토큰 없이는 물리 삭제가 실행되지 않는다', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });

    const result = await deleteLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      mode: 'hard'
    });

    expect(result.ok === false && result.error.code).toBe('write-safety');
    expect(harness.calls.some((call) => call.kind === 'sheetBatchUpdate')).toBe(false);
  });

  it('🔴 물리 삭제 뒤에는 옛 참조로 다시 쓸 수 없다 — 목록을 재조회해야 한다', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });
    harness.queues.sheetBatchUpdate.push({ payload: { replies: [{}] } });

    const deleted = await deleteLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      mode: 'hard',
      confirmation: HARD_DELETE_CONFIRMATION
    });
    expect(deleted.ok && deleted.value.snapshotRetired).toBe(true);

    const callsAfterDelete = harness.calls.length;
    const followUp = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      patch: { amount: 1 }
    });

    expect(followUp.ok === false && followUp.error.code).toBe('stale-snapshot');
    // 밀린 행 번호로 나가는 요청이 하나도 없어야 한다.
    expect(harness.calls).toHaveLength(callsAfterDelete);
    expect(harness.unmatched).toEqual([]);
  });

  it('삭제가 실패하면 스냅샷을 폐기하지 않는다 (아직 아무것도 밀리지 않았다)', async () => {
    const { harness, snapshot, entry } = await setup();
    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });
    harness.queues.sheetBatchUpdate.push({ status: 500, payload: {} });

    const failed = await deleteLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      mode: 'hard',
      confirmation: HARD_DELETE_CONFIRMATION
    });
    expect(failed.ok === false && failed.error.code).toBe('server-error');

    harness.queues.batchGet.push({ payload: valueRanges(ROW2_CURRENT) });
    harness.queues.valuesWrite.push({ payload: { totalUpdatedCells: 1 } });
    const retry = await updateLedgerEntry(harness.context, {
      link: LINK,
      snapshot,
      ref: entry.ref,
      seen: entry.seen,
      patch: { amount: 10 }
    });
    expect(retry.ok).toBe(true);
  });
});
