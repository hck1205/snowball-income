import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LedgerEntry, LedgerSnapshot } from '@/shared/lib/googleSheets';
import { LEDGER_LINK_STORAGE_KEY, loadSheetLinks, saveSheetLink } from '@/shared/lib/googleSheets';
import type { LedgerBlendRow, LedgerRowModel } from '@/pages/Ledger/types';
import {
  LEDGER_BLEND_DEFAULT_LABEL,
  LEDGER_BLEND_LABEL_MAX_LENGTH,
  LEDGER_BLEND_STORAGE_KEY,
  buildLedgerBlendModel,
  clearLedgerBlendConfig,
  createLedgerBlendConfig,
  isLedgerBlendAvailable,
  labelsOfLedgerBlendConfig,
  mergeLedgerBlendRows,
  normalizeLedgerBlendLabel,
  parseLedgerBlendConfig,
  readLedgerBlendConfig,
  resolveLedgerBlendConfig,
  serializeLedgerBlendConfig,
  subtotalOfSource,
  toBlendReadySource,
  writeLedgerBlendConfig
} from '@/pages/Ledger/utils';
import type { LedgerBlendConfig, LedgerBlendInput } from '@/pages/Ledger/utils';

/**
 * B-3 **두 가계부 블렌딩**의 데이터 계약.
 *
 * 이 파일이 잠그는 것은 세 가지다.
 *  1) **기존 사용자 자산 불변** — `snowball:ledger:links` 의 직렬화 결과가 블렌딩 사용 전후로
 *     바이트 동일(AC3-2). 이것이 이 트랙의 핵심 게이트다.
 *  2) **반쪽 실패를 합계로 위장하지 않는다**(AC3-5) — 한쪽이 실패하면 합산 필드가 아예 없다.
 *  3) **합산 = 소계의 합**(AC3-4) — 병합 행에서 나온 합산과 출처별로 따로 센 소계가 일치한다.
 *
 * ⚠ 순수 함수만 다룬다. 시계·난수를 쓰지 않는다(아래 속성 테스트의 난수도 고정 시드 LCG 다).
 */

const LABELS = { a: '나', b: '배우자' } as const;

const row = (overrides: Partial<LedgerRowModel> = {}): LedgerRowModel => ({
  id: 'snap-a:2',
  dateISO: '2026-08-03',
  dateText: '8월 3일 (월)',
  kind: 'expense',
  category: '식비',
  amount: 12000,
  amountText: '₩12,000',
  memo: '',
  failure: null,
  ...overrides
});

const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => ({
  ref: { snapshotId: 'snap-a', rowNumber: 2 },
  date: '2026-08-03',
  kind: 'expense',
  amount: 12000,
  category: '식비',
  seen: {},
  ...overrides
});

const snapshot = (overrides: Partial<LedgerSnapshot> = {}): LedgerSnapshot => ({
  snapshotId: 'snap-a',
  spreadsheetId: 'sheet-a',
  sheetTitle: '2026',
  lastDataRow: 9,
  entries: [],
  unreadableRows: [],
  ...overrides
});

const CONFIG: LedgerBlendConfig = {
  a: { spreadsheetId: 'sheet-a', sheetId: 0, label: '나' },
  b: { spreadsheetId: 'sheet-b', sheetId: 42, label: '배우자' }
};

const MAPPING = { date: 0, kind: 1, amount: 2, category: 3 } as const;

const blend = (input: Partial<LedgerBlendInput> = {}) =>
  buildLedgerBlendModel({
    labels: LABELS,
    a: { status: 'ready', rows: [], unreadableCount: 0 },
    b: { status: 'ready', rows: [], unreadableCount: 0 },
    ...input
  });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('블렌딩 구성 저장 — 왕복과 관용(AC3-8)', () => {
  it('저장 → 재로드 → 같은 구성이 복원된다', () => {
    writeLedgerBlendConfig(CONFIG);
    expect(readLedgerBlendConfig()).toEqual(CONFIG);
  });

  it('저장 페이로드는 version·a·b 와 세 필드뿐이다 (허용 키 밖은 떨어진다)', () => {
    const polluted = {
      a: { ...CONFIG.a, sheetTitle: '2026년 가계부', amount: 12000 },
      b: CONFIG.b
    } as unknown as LedgerBlendConfig;

    const parsed = JSON.parse(serializeLedgerBlendConfig(polluted)) as Record<string, unknown>;

    expect(Object.keys(parsed)).toEqual(['version', 'a', 'b']);
    expect(Object.keys(parsed.a as object)).toEqual(['spreadsheetId', 'sheetId', 'label']);
    expect(JSON.stringify(parsed)).not.toContain('2026년 가계부');
  });

  it('지우면 블렌딩이 꺼진다', () => {
    writeLedgerBlendConfig(CONFIG);
    clearLedgerBlendConfig();
    expect(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY)).toBeNull();
    expect(readLedgerBlendConfig()).toBeNull();
  });

  it.each([
    ['비어 있음', ''],
    ['JSON 이 아님', '{'],
    ['임의 JSON(문자열)', '"blend"'],
    ['배열', '[{"version":1}]'],
    ['버전 불일치', JSON.stringify({ version: 2, a: CONFIG.a, b: CONFIG.b })],
    ['a 누락', JSON.stringify({ version: 1, b: CONFIG.b })],
    ['b 누락', JSON.stringify({ version: 1, a: CONFIG.a })],
    ['sheetId 가 숫자가 아님', JSON.stringify({ version: 1, a: { ...CONFIG.a, sheetId: '0' }, b: CONFIG.b })],
    ['spreadsheetId 가 빈 문자열', JSON.stringify({ version: 1, a: { ...CONFIG.a, spreadsheetId: '' }, b: CONFIG.b })],
    ['두 자리가 같은 링크', JSON.stringify({ version: 1, a: CONFIG.a, b: { ...CONFIG.a, label: '배우자' } })]
  ])('불량 페이로드(%s)는 조용히 무시되고 블렌딩이 꺼진다', (_name, raw) => {
    window.localStorage.setItem(LEDGER_BLEND_STORAGE_KEY, raw);
    expect(() => readLedgerBlendConfig()).not.toThrow();
    expect(readLedgerBlendConfig()).toBeNull();
  });

  it('라벨이 없거나 공백뿐이면 중립 기본값이 들어간다 (시트 이름·탭 제목을 쓰지 않는다)', () => {
    const raw = JSON.stringify({
      version: 1,
      a: { spreadsheetId: 'sheet-a', sheetId: 0 },
      b: { spreadsheetId: 'sheet-b', sheetId: 1, label: '   ' }
    });
    expect(parseLedgerBlendConfig(raw)).toEqual({
      a: { spreadsheetId: 'sheet-a', sheetId: 0, label: '가계부 1' },
      b: { spreadsheetId: 'sheet-b', sheetId: 1, label: '가계부 2' }
    });
    expect(LEDGER_BLEND_DEFAULT_LABEL).toEqual({ a: '가계부 1', b: '가계부 2' });
  });

  it('라벨은 상한에서 잘리고 공백이 접힌다', () => {
    expect(normalizeLedgerBlendLabel('  나  의   가계부  ', '가계부 1')).toBe('나 의 가계부');
    expect(normalizeLedgerBlendLabel('가'.repeat(80), '가계부 1')).toHaveLength(LEDGER_BLEND_LABEL_MAX_LENGTH);
    expect(normalizeLedgerBlendLabel(12000, '가계부 1')).toBe('가계부 1');
  });

  it('구성이 없으면 라벨은 기본값이다', () => {
    expect(labelsOfLedgerBlendConfig(null)).toEqual({ a: '가계부 1', b: '가계부 2' });
    expect(labelsOfLedgerBlendConfig(CONFIG)).toEqual({ a: '나', b: '배우자' });
  });
});

describe('🔴 `snowball:ledger:links` 불변(AC3-2)', () => {
  /**
   * 🔴 이 테스트가 이 트랙의 핵심 게이트다. 블렌딩 저장이 링크 저장을 한 번이라도 다시 쓰면
   * (키 순서·필드 정규화가 달라지는 것만으로도) 바이트가 달라져 빨개진다.
   */
  it('블렌딩 구성을 만들고·저장하고·읽고·지워도 링크 페이로드의 바이트가 그대로다', () => {
    // 앱이 방금 쓴 것이 아니라 **이미 저장돼 있던** 형태를 그대로 넣는다(공백·키 순서 포함).
    const legacy = '[{"createdByApp":false,"sheetId":0,"spreadsheetId":"sheet-a","mapping":{"date":0,"kind":1,"amount":2,"category":3,"memo":4}} ]';
    window.localStorage.setItem(LEDGER_LINK_STORAGE_KEY, legacy);

    const created = createLedgerBlendConfig(
      { spreadsheetId: 'sheet-a', sheetId: 0, label: '나' },
      { spreadsheetId: 'sheet-b', sheetId: 42 }
    );
    expect(created).not.toBeNull();
    writeLedgerBlendConfig(created as LedgerBlendConfig);
    readLedgerBlendConfig();
    resolveLedgerBlendConfig(created, loadSheetLinks());
    clearLedgerBlendConfig();

    expect(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY)).toBe(legacy);
  });

  it('블렌딩은 링크 저장 키에 자기 값을 섞지 않는다 (별개 키 2개)', () => {
    saveSheetLink({ spreadsheetId: 'sheet-a', sheetId: 0, mapping: MAPPING, createdByApp: false });
    const before = window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY);

    writeLedgerBlendConfig(CONFIG);

    expect(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY)).toBe(before);
    expect(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY)).not.toContain('label');
    expect(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY)).toContain('label');
  });
});

describe('구성 ↔ 링크 대조(AC3-7)', () => {
  it('두 링크가 모두 남아 있으면 구성이 유효하다', () => {
    const links = [
      { spreadsheetId: 'sheet-a', sheetId: 0, mapping: MAPPING, createdByApp: false },
      { spreadsheetId: 'sheet-b', sheetId: 42, mapping: MAPPING, createdByApp: false }
    ];
    expect(resolveLedgerBlendConfig(CONFIG, links)).toEqual(CONFIG);
  });

  it('가리키던 링크가 지워지면 구성 전체가 무효다 (남은 한쪽으로 이어 가지 않는다)', () => {
    const links = [{ spreadsheetId: 'sheet-a', sheetId: 0, mapping: MAPPING, createdByApp: false }];
    expect(resolveLedgerBlendConfig(CONFIG, links)).toBeNull();
  });

  it('같은 스프레드시트라도 탭(sheetId)이 다르면 다른 링크다', () => {
    const links = [
      { spreadsheetId: 'sheet-a', sheetId: 0, mapping: MAPPING, createdByApp: false },
      { spreadsheetId: 'sheet-a', sheetId: 1, mapping: MAPPING, createdByApp: false }
    ];
    const sameFile: LedgerBlendConfig = {
      a: { spreadsheetId: 'sheet-a', sheetId: 0, label: '나' },
      b: { spreadsheetId: 'sheet-a', sheetId: 1, label: '배우자' }
    };
    // 같은 파일의 두 탭(권장 경로 D3-1)도 다른 파일과 똑같이 동작한다.
    expect(resolveLedgerBlendConfig(sameFile, links)).toEqual(sameFile);
    expect(resolveLedgerBlendConfig(sameFile, links.slice(0, 1))).toBeNull();
  });

  it('구성 만들기 — 같은 링크 두 개는 만들 수 없다', () => {
    expect(
      createLedgerBlendConfig({ spreadsheetId: 'sheet-a', sheetId: 0 }, { spreadsheetId: 'sheet-a', sheetId: 0 })
    ).toBeNull();
  });

  it('진입점은 저장된 링크가 2개 이상일 때만 선다(AC3-1)', () => {
    const link = { spreadsheetId: 'sheet-a', sheetId: 0, mapping: MAPPING, createdByApp: false };
    expect(isLedgerBlendAvailable([])).toBe(false);
    expect(isLedgerBlendAvailable([link])).toBe(false);
    expect(isLedgerBlendAvailable([link, { ...link, sheetId: 1 }])).toBe(true);
  });
});

describe('행 병합 — 날짜 오름차순 안정 정렬(AC3-3)', () => {
  const ids = (rows: readonly LedgerBlendRow[]): string[] => rows.map((item) => item.blendId);

  it('두 가계부의 항목이 날짜 오름차순으로 합쳐진다', () => {
    const merged = mergeLedgerBlendRows(
      LABELS,
      [row({ id: 'a:1', dateISO: '2026-08-10' }), row({ id: 'a:2', dateISO: '2026-08-02' })],
      [row({ id: 'b:1', dateISO: '2026-08-05' })]
    );
    expect(ids(merged)).toEqual(['a:a:2', 'b:b:1', 'a:a:1']);
    expect(merged.map((item) => item.dateISO)).toEqual(['2026-08-02', '2026-08-05', '2026-08-10']);
  });

  it('각 행이 출처 키와 라벨 텍스트를 싣는다 (배지의 채널은 색이 아니라 이 문자열이다)', () => {
    const merged = mergeLedgerBlendRows(LABELS, [row({ id: 'a:1' })], [row({ id: 'b:1' })]);
    expect(merged.map((item) => [item.source, item.sourceLabel])).toEqual([
      ['a', '나'],
      ['b', '배우자']
    ]);
    // 🔴 원본 id 는 가공하지 않는다 — "이 가계부에서 열기"가 이 값으로 원본을 되찾는다.
    expect(merged.map((item) => item.id)).toEqual(['a:1', 'b:1']);
  });

  /** 🔴 뮤턴트 감지용: 정렬을 불안정하게 바꾸면(동점 비교 제거) 이 기대값이 무너진다. */
  it('같은 날짜가 여럿이면 ①원본 시트 순서 ②a 가 b 보다 앞 순으로 유지된다', () => {
    const sameDay = (prefix: string, count: number): LedgerRowModel[] =>
      Array.from({ length: count }, (_, index) => row({ id: `${prefix}:${index}`, dateISO: '2026-08-07' }));

    const merged = mergeLedgerBlendRows(LABELS, sameDay('a', 4), sameDay('b', 4));

    expect(ids(merged)).toEqual([
      'a:a:0',
      'a:a:1',
      'a:a:2',
      'a:a:3',
      'b:b:0',
      'b:b:1',
      'b:b:2',
      'b:b:3'
    ]);
  });

  it('한쪽이 비어 있어도, 양쪽이 비어 있어도 터지지 않는다', () => {
    expect(ids(mergeLedgerBlendRows(LABELS, [], [row({ id: 'b:1' })]))).toEqual(['b:b:1']);
    expect(ids(mergeLedgerBlendRows(LABELS, [row({ id: 'a:1' })], []))).toEqual(['a:a:1']);
    expect(mergeLedgerBlendRows(LABELS, [], [])).toEqual([]);
  });

  it('날짜 형식이 아닌 행은 맨 뒤로 가되 원래 순서를 지킨다 (위치를 지어내지 않는다)', () => {
    const merged = mergeLedgerBlendRows(
      LABELS,
      [row({ id: 'a:1', dateISO: '알 수 없음' }), row({ id: 'a:2', dateISO: '2026-08-09' })],
      [row({ id: 'b:1', dateISO: '' })]
    );
    expect(ids(merged)).toEqual(['a:a:2', 'a:a:1', 'b:b:1']);
  });

  it('두 라벨이 같은 문자열이어도 출처 키로는 구분된다', () => {
    const merged = mergeLedgerBlendRows({ a: '가계부', b: '가계부' }, [row({ id: 'a:1' })], [row({ id: 'b:1' })]);
    expect(merged.map((item) => item.source)).toEqual(['a', 'b']);
    expect(new Set(ids(merged)).size).toBe(2);
  });
});

describe('월 요약 — 합산 = 소계의 합(AC3-4)', () => {
  it('합산 3숫자와 출처별 소계 2줄을 함께 준다', () => {
    const model = blend({
      a: {
        status: 'ready',
        rows: [row({ id: 'a:1', kind: 'income', amount: 3_000_000 }), row({ id: 'a:2', amount: 12_000 })],
        unreadableCount: 0
      },
      b: { status: 'ready', rows: [row({ id: 'b:1', amount: 8_000 })], unreadableCount: 0 }
    });

    expect(model.body.kind).toBe('ready');
    if (model.body.kind !== 'ready') return;

    expect(model.body.summary).toEqual({
      incomeText: '₩3,000,000',
      expenseText: '₩20,000',
      netText: '₩2,980,000',
      incomeCount: 1,
      expenseCount: 2
    });
    expect(model.body.subtotals.map((item) => [item.label, item.incomeText, item.expenseText])).toEqual([
      ['나', '₩3,000,000', '₩12,000'],
      ['배우자', '₩0', '₩8,000']
    ]);
  });

  /**
   * 속성 테스트 — 난수는 **고정 시드 LCG** 다(전역 `Math.random` 을 쓰면 실패가 재현되지 않는다).
   * 합산은 병합 행에서, 소계는 출처별 행에서 **따로** 계산되므로 이 단정은 진짜 교차검증이다.
   */
  it('무작위 200 케이스에서 합산 = 소계의 합이 항상 참이다', () => {
    let seed = 20260802;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const randomRows = (prefix: string): LedgerRowModel[] =>
      Array.from({ length: Math.floor(next() * 8) }, (_, index) =>
        row({
          id: `${prefix}:${index}`,
          dateISO: `2026-08-${`${1 + Math.floor(next() * 28)}`.padStart(2, '0')}`,
          kind: next() > 0.5 ? 'income' : 'expense',
          amount: Math.floor(next() * 1_000_000)
        })
      );

    for (let round = 0; round < 200; round += 1) {
      const aRows = randomRows('a');
      const bRows = randomRows('b');
      const model = blend({
        a: { status: 'ready', rows: aRows, unreadableCount: 0 },
        b: { status: 'ready', rows: bRows, unreadableCount: 0 }
      });
      if (model.body.kind !== 'ready') throw new Error('두 쪽 다 성공인데 ready 가 아니다');

      const [first, second] = model.body.subtotals;
      const totals = subtotalOfSource('a', '합', [...aRows, ...bRows]);

      expect(first.income + second.income).toBe(totals.income);
      expect(first.expense + second.expense).toBe(totals.expense);
      expect(model.body.summary.incomeText).toBe(totals.incomeText);
      expect(model.body.summary.expenseText).toBe(totals.expenseText);
      expect(first.incomeCount + second.incomeCount).toBe(model.body.summary.incomeCount);
      expect(first.expenseCount + second.expenseCount).toBe(model.body.summary.expenseCount);
      expect(model.body.rows).toHaveLength(aRows.length + bRows.length);
    }
  });
});

describe('🔴 반쪽 실패를 합계로 위장하지 않는다(AC3-5, D3-7)', () => {
  it('한쪽 읽기 실패 → 합산 필드가 아예 없고, 성공한 쪽의 소계만 남는다', () => {
    const model = blend({
      a: { status: 'failed', reason: 'network' },
      b: { status: 'ready', rows: [row({ id: 'b:1', amount: 8_000 })], unreadableCount: 0 }
    });

    expect(model.body.kind).toBe('partial');
    if (model.body.kind !== 'partial') return;

    // 🔴 뮤턴트 감지용: 성공한 쪽 숫자로 합계를 만들면 이 두 줄이 무너진다.
    expect(Object.keys(model.body)).not.toContain('summary');
    expect(Object.keys(model.body)).not.toContain('subtotals');

    expect(model.body.failure.source).toBe('a');
    expect(model.body.failure.label).toBe('나');
    expect(model.body.failure.error.reason).toBe('network');
    expect(model.body.available).toMatchObject({ source: 'b', label: '배우자', expense: 8_000 });
    expect(model.body.rows.map((item) => item.source)).toEqual(['b']);
  });

  it('실패한 쪽이 b 여도 대칭으로 동작한다', () => {
    const model = blend({
      a: { status: 'ready', rows: [row({ id: 'a:1' })], unreadableCount: 0 },
      b: { status: 'failed', reason: 'rateLimited' }
    });
    if (model.body.kind !== 'partial') throw new Error('partial 이어야 한다');
    expect(model.body.failure.source).toBe('b');
    expect(model.body.available.source).toBe('a');
  });

  it('양쪽 실패 → 실패 2건만 말한다 (숫자가 하나도 없다)', () => {
    const model = blend({
      a: { status: 'failed', reason: 'permission' },
      b: { status: 'failed', reason: 'network' }
    });
    expect(model.body.kind).toBe('unavailable');
    if (model.body.kind !== 'unavailable') return;
    expect(model.body.failures.map((item) => item.source)).toEqual(['a', 'b']);
    expect(Object.keys(model.body)).toEqual(['kind', 'failures']);
  });

  it('한쪽이라도 읽는 중이면 숫자를 만들지 않는다', () => {
    expect(
      blend({ a: { status: 'loading' }, b: { status: 'ready', rows: [row()], unreadableCount: 0 } }).body
    ).toEqual({ kind: 'loading' });
    expect(blend({ b: { status: 'loading' } }).body).toEqual({ kind: 'loading' });
    // 읽는 중이 실패보다 앞선다 — 아직 실패가 확정되지 않았다.
    expect(blend({ a: { status: 'loading' }, b: { status: 'failed', reason: 'network' } }).body.kind).toBe(
      'loading'
    );
  });

  it('실패·로딩 중에도 라벨은 살아 있다 (어느 가계부가 실패했는지 이름으로 말한다)', () => {
    expect(blend({ a: { status: 'loading' } }).labels).toEqual(LABELS);
  });
});

describe('읽지 못한 행 — 출처별로 센다(D3-6)', () => {
  it('출처별 건수를 라벨과 함께 싣고, 0 건인 출처는 넣지 않는다', () => {
    const model = blend({
      a: { status: 'ready', rows: [], unreadableCount: 3 },
      b: { status: 'ready', rows: [], unreadableCount: 0 }
    });
    if (model.body.kind !== 'ready') throw new Error('ready 여야 한다');
    expect(model.body.unreadable).toEqual([{ source: 'a', label: '나', count: 3 }]);
  });

  it('읽지 못한 행만 있는 스냅샷도 합산 0 원으로 정상 표시된다 (행이 없는 것과 같다)', () => {
    const model = blend({
      a: { status: 'ready', rows: [], unreadableCount: 2 },
      b: { status: 'ready', rows: [], unreadableCount: 5 }
    });
    if (model.body.kind !== 'ready') throw new Error('ready 여야 한다');
    expect(model.body.rows).toEqual([]);
    expect(model.body.summary.incomeText).toBe('₩0');
    expect(model.body.unreadable.map((item) => item.count)).toEqual([2, 5]);
  });

  it('한쪽 실패 상태에서도 성공한 쪽의 읽지 못한 행 수는 남는다', () => {
    const model = blend({
      a: { status: 'failed', reason: 'network' },
      b: { status: 'ready', rows: [], unreadableCount: 4 }
    });
    if (model.body.kind !== 'partial') throw new Error('partial 이어야 한다');
    expect(model.body.unreadable).toEqual([{ source: 'b', label: '배우자', count: 4 }]);
  });
});

describe('스냅샷 → 블렌딩 입력(toBlendReadySource)', () => {
  it('보고 있는 달만 남기고, 소프트 삭제된 행은 뺀다', () => {
    const source = toBlendReadySource(
      snapshot({
        entries: [
          entry({ ref: { snapshotId: 'snap-a', rowNumber: 2 }, date: '2026-08-03' }),
          entry({ ref: { snapshotId: 'snap-a', rowNumber: 3 }, date: '2026-07-30' }),
          entry({ ref: { snapshotId: 'snap-a', rowNumber: 4 }, date: '2026-08-20', status: '삭제됨' })
        ],
        unreadableRows: [{ rowNumber: 7, reasons: ['날짜를 읽지 못했습니다.'] }]
      }),
      { year: 2026, month: 8 }
    );

    if (source.status !== 'ready') throw new Error('ready 여야 한다');
    expect(source.rows.map((item) => item.dateISO)).toEqual(['2026-08-03']);
    expect(source.unreadableCount).toBe(1);
  });

  it('그 달에 기록이 하나도 없으면 빈 목록이다 (0 을 지어내지 않는다 — 그저 행이 없다)', () => {
    const source = toBlendReadySource(snapshot({ entries: [entry({ date: '2026-01-05' })] }), {
      year: 2026,
      month: 8
    });
    if (source.status !== 'ready') throw new Error('ready 여야 한다');
    expect(source.rows).toEqual([]);
  });
});
