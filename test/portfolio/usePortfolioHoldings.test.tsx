import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { buildPortfolioRecord, readPortfolioRecord, writePortfolioRecord } from '@/pages/Portfolio/utils';
import type { PortfolioPersistedRecord, PortfolioRecordReader } from '@/pages/Portfolio/utils';
import { toPortfolioHoldings, usePortfolioHoldings } from '@/pages/Portfolio/hooks';
import type { UsePortfolioHoldingsOptions } from '@/pages/Portfolio/hooks';
import type { PortfolioHolding } from '@/shared/lib/portfolio';

/**
 * `usePortfolioHoldings` — 로드 / 편집 / 실행 취소 / 디바운스 저장 / 실패 표면화.
 *
 * 성공 경로 일부는 **실제 IndexedDB 왕복**으로 검증하고(fake-indexeddb), 타이밍·실패 경로는
 * 저장 계층 주입으로 결정적으로 검증한다(`useGoalScenario` 테스트와 같은 분업).
 */

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();

  return { ...actual, trackEvent: vi.fn() };
});

const PORTFOLIO_DB_NAME = 'snowball-portfolio';

const deletePortfolioDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

const renderHoldings = (options: UsePortfolioHoldingsOptions = {}) =>
  renderHook(() => usePortfolioHoldings(options));

const readerOf = (value: PortfolioPersistedRecord | null): PortfolioRecordReader => async () => ({
  ok: true,
  value
});

const createWriter = () =>
  vi.fn(async (holdings: readonly PortfolioHolding[], taxPercent: number) =>
    buildPortfolioRecord(holdings, taxPercent, 1_700_000_000_000)
  );

const waitForReady = async (getStatus: () => string) => {
  await waitFor(() => expect(getStatus()).not.toBe('loading'));
};

/**
 * 읽기를 **손으로 열어 주는** 리더 — "로드가 아직 안 끝난 창"을 결정적으로 만든다.
 *
 * ⚠ `let release: (() => void) | null` 로 두고 클로저에서만 대입하면 tsc 가 호출부를 `never` 로 좁혀
 * 죽는다(vitest 는 통과, tsc 만 잡는다) — 그래서 속성 홀더로 감싼다.
 */
const gatedReader = (value: PortfolioPersistedRecord | null) => {
  const gate: { release: () => void } = { release: () => undefined };
  const readRecord: PortfolioRecordReader = () =>
    new Promise((resolve) => {
      gate.release = () => resolve({ ok: true, value });
    });

  return { gate, readRecord };
};

/** 디바운스(300ms)를 확실히 넘긴다 — 예약된 저장이 있었다면 이 사이에 반드시 발화한다. */
const passDebounceWindow = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
};

beforeEach(async () => {
  await deletePortfolioDb();
  vi.mocked(trackEvent).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePortfolioHoldings — 저장 데이터 왕복 (실제 IndexedDB)', () => {
  it('저장된 보유 목록과 세율을 복원한다', async () => {
    await writePortfolioRecord(
      [
        { ticker: 'SCHD', quantity: 12.5 },
        { ticker: 'O', quantity: 0 }
      ],
      22
    );

    const { result } = renderHoldings();
    expect(result.current.status).toBe('loading');

    await waitForReady(() => result.current.status);

    expect(result.current.status).toBe('ready');
    expect(result.current.taxPercent).toBe(22);
    expect(result.current.items).toEqual([
      { ticker: 'SCHD', quantity: 12.5, quantityInput: '12.5' },
      // 수량 미입력 행은 목록에 그대로 남고 입력창은 빈 값이다(0 을 지우게 만들지 않는다).
      { ticker: 'O', quantity: null, quantityInput: '' }
    ]);
  });

  it('저장한 적이 없으면 빈 목록 + 기본 세율로 시작한다 (읽기 실패와 구분)', async () => {
    const { result } = renderHoldings();

    await waitForReady(() => result.current.status);

    expect(result.current.status).toBe('ready');
    expect(result.current.items).toEqual([]);
    expect(result.current.taxPercent).toBe(15.4);
    expect(result.current.writeError).toBeNull();
  });

  it('편집한 수량이 실제 저장소에 남아 다음 세션에 복원된다', async () => {
    const first = renderHoldings();
    await waitForReady(() => first.result.current.status);

    act(() => {
      first.result.current.actions.add('SCHD');
    });
    act(() => {
      first.result.current.actions.updateQuantity('SCHD', '12.5');
    });

    await waitFor(async () => {
      const stored = await readPortfolioRecord();
      expect(stored.ok && stored.value?.holdings).toEqual([{ ticker: 'SCHD', quantity: 12.5 }]);
    });

    first.unmount();

    const second = renderHoldings();
    await waitForReady(() => second.result.current.status);
    expect(second.result.current.items).toEqual([{ ticker: 'SCHD', quantity: 12.5, quantityInput: '12.5' }]);
  });

  it('디바운스가 끝나기 전에 언마운트해도 마지막 편집이 저장된다', async () => {
    const { result, unmount } = renderHoldings();
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });
    act(() => {
      result.current.actions.updateQuantity('SCHD', '7');
    });

    // 디바운스(300ms)가 끝나기 전에 라우트를 떠난다 — 여기서 clearTimeout 만 하면 편집이 사라진다.
    unmount();

    await waitFor(async () => {
      const stored = await readPortfolioRecord();
      expect(stored.ok && stored.value?.holdings).toEqual([{ ticker: 'SCHD', quantity: 7 }]);
    });
  });
});

describe('usePortfolioHoldings — 저장 타이밍 (저장 계층 주입)', () => {
  it('연속 편집을 300ms 디바운스로 한 번만 저장한다', async () => {
    const writeRecord = createWriter();
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });
    act(() => {
      result.current.actions.updateQuantity('SCHD', '1');
    });
    act(() => {
      result.current.actions.updateQuantity('SCHD', '12');
    });

    expect(writeRecord).not.toHaveBeenCalled();

    await waitFor(() => expect(writeRecord).toHaveBeenCalledTimes(1));
    expect(writeRecord.mock.calls[0][0]).toEqual([{ ticker: 'SCHD', quantity: 12 }]);
  });

  it('언마운트 시 대기 중인 편집을 즉시 flush 한다', async () => {
    const writeRecord = createWriter();
    const { result, unmount } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });
    act(() => {
      result.current.actions.updateQuantity('SCHD', '7');
    });
    expect(writeRecord).not.toHaveBeenCalled();

    unmount();

    expect(writeRecord).toHaveBeenCalledTimes(1);
    expect(writeRecord.mock.calls[0][0]).toEqual([{ ticker: 'SCHD', quantity: 7 }]);
  });

  it('pagehide(이탈) 에서도 대기 중인 편집을 flush 한다', async () => {
    const writeRecord = createWriter();
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });
    expect(writeRecord).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(writeRecord).toHaveBeenCalledTimes(1);
  });

  it('저장할 편집이 없으면 언마운트해도 쓰지 않는다 (빈 저장으로 원본을 건드리지 않는다)', async () => {
    const writeRecord = createWriter();
    const { result, unmount } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    unmount();

    expect(writeRecord).not.toHaveBeenCalled();
  });
});

describe('usePortfolioHoldings — 하이드레이션 경합 (로드 지연 중 편집)', () => {
  const seedRecord = buildPortfolioRecord(
    [
      { ticker: 'SCHD', quantity: 12.5 },
      { ticker: 'O', quantity: 4 }
    ],
    22,
    1_700_000_000_000
  );

  const seedRows = [
    { ticker: 'SCHD', quantity: 12.5, quantityInput: '12.5' },
    { ticker: 'O', quantity: 4, quantityInput: '4' }
  ];

  it('로드가 끝나기 전 add 는 loading 으로 거부하고, 저장된 원본이 그대로 화면에 온다', async () => {
    const writeRecord = createWriter();
    const { gate, readRecord } = gatedReader(seedRecord);
    const { result } = renderHoldings({ readRecord, writeRecord });

    expect(result.current.status).toBe('loading');

    let added: ReturnType<typeof result.current.actions.add> | null = null;
    act(() => {
      added = result.current.actions.add('JEPI');
    });

    // 조용한 no-op 이 아니라 **구분 가능한 거절** — 화면이 "불러오는 중"을 말할 수 있어야 한다.
    expect(added).toEqual({ ok: false, ticker: 'JEPI', reason: 'loading' });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      gate.release();
    });
    await waitForReady(() => result.current.status);

    // 뒤늦게 도착한 로드값이 "추가 1행"에 오염되지 않고 원본 그대로 온다.
    expect(result.current.items).toEqual(seedRows);
    expect(result.current.taxPercent).toBe(22);
  });

  it('로딩 중 세율 변경·수량 수정·삭제·실행 취소도 전부 무시되고 저장을 예약하지 않는다', async () => {
    const writeRecord = createWriter();
    const { gate, readRecord } = gatedReader(seedRecord);
    const { result } = renderHoldings({ readRecord, writeRecord });

    let restored: string | null = 'unset';
    act(() => {
      result.current.actions.updateQuantity('SCHD', '99');
      result.current.actions.remove('SCHD');
      result.current.actions.setTaxPercent(33);
      restored = result.current.actions.undo();
    });

    expect(restored).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.pendingUndo).toBeNull();
    // 세율만 목록 없이도 변이가 가능한 액션이다 — 33 이 남았다면 가드가 뚫린 것.
    expect(result.current.taxPercent).toBe(15.4);

    // 디바운스가 지나도 쓰지 않는다: 로딩 중 편집은 저장 **예약 자체**를 만들지 않는다.
    await passDebounceWindow();
    expect(writeRecord).not.toHaveBeenCalled();

    await act(async () => {
      gate.release();
    });
    await waitForReady(() => result.current.status);

    expect(result.current.items).toEqual(seedRows);
    expect(result.current.taxPercent).toBe(22);
  });

  it('로드 지연 중 add 는 저장을 예약조차 하지 않는다 — 디스크의 원본이 불변이다 (실제 IndexedDB)', async () => {
    await writePortfolioRecord(
      [
        { ticker: 'SCHD', quantity: 12.5 },
        { ticker: 'O', quantity: 4 }
      ],
      22
    );
    const stored = await readPortfolioRecord();

    // 라이터는 주입하지 않는다 — 진짜 저장소에 무엇이 남는지가 이 테스트의 계약이다.
    const { gate, readRecord } = gatedReader(stored.ok ? stored.value : null);
    const { result, unmount } = renderHoldings({ readRecord });

    expect(result.current.status).toBe('loading');
    act(() => {
      result.current.actions.add('JEPI');
    });

    // 디바운스 경과 + 언마운트 flush — 예약이 있었다면 여기서 디스크가 1행짜리로 교체된다.
    await passDebounceWindow();
    unmount();
    await passDebounceWindow();

    const after = await readPortfolioRecord();
    expect(after.ok && after.value?.holdings).toEqual([
      { ticker: 'SCHD', quantity: 12.5 },
      { ticker: 'O', quantity: 4 }
    ]);
    expect(after.ok && after.value?.taxPercent).toBe(22);

    gate.release();
  });

  it('로드가 끝난 뒤의 add 는 기존처럼 동작한다 (회귀 없음)', async () => {
    const writeRecord = createWriter();
    const { gate, readRecord } = gatedReader(seedRecord);
    const { result } = renderHoldings({ readRecord, writeRecord });

    await act(async () => {
      gate.release();
    });
    await waitForReady(() => result.current.status);

    let added: ReturnType<typeof result.current.actions.add> | null = null;
    act(() => {
      added = result.current.actions.add('jepi');
    });

    expect(added).toEqual({ ok: true, ticker: 'JEPI' });
    expect(result.current.items.map((item) => item.ticker)).toEqual(['SCHD', 'O', 'JEPI']);

    await waitFor(() => expect(writeRecord).toHaveBeenCalledTimes(1));
    expect(writeRecord.mock.calls[0][0]).toEqual([
      { ticker: 'SCHD', quantity: 12.5 },
      { ticker: 'O', quantity: 4 },
      { ticker: 'JEPI', quantity: 0 }
    ]);
  });
});

describe('usePortfolioHoldings — 편집 액션', () => {
  const seed = (holdings: PortfolioHolding[], taxPercent = 15.4): PortfolioPersistedRecord =>
    buildPortfolioRecord(holdings, taxPercent, 1_700_000_000_000);

  it('종목을 수량 없이 추가한다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    let added: ReturnType<typeof result.current.actions.add> | null = null;
    act(() => {
      added = result.current.actions.add(' schd ');
    });

    expect(added).toEqual({ ok: true, ticker: 'SCHD' });
    expect(result.current.items).toEqual([{ ticker: 'SCHD', quantity: null, quantityInput: '' }]);
  });

  it('이미 보유 중인 종목은 추가하지 않고 duplicate 를 돌려준다 (AC1-3)', async () => {
    const { result } = renderHoldings({
      readRecord: readerOf(seed([{ ticker: 'SCHD', quantity: 3 }])),
      writeRecord: createWriter()
    });
    await waitForReady(() => result.current.status);

    let added: ReturnType<typeof result.current.actions.add> | null = null;
    act(() => {
      added = result.current.actions.add('schd');
    });

    expect(added).toEqual({ ok: false, ticker: 'SCHD', reason: 'duplicate' });
    // 기존 수량이 초기화되지 않는다.
    expect(result.current.items).toEqual([{ ticker: 'SCHD', quantity: 3, quantityInput: '3' }]);
  });

  it('빈 티커는 invalid-ticker 로 거부한다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    let added: ReturnType<typeof result.current.actions.add> | null = null;
    act(() => {
      added = result.current.actions.add('   ');
    });

    expect(added).toEqual({ ok: false, ticker: '', reason: 'invalid-ticker' });
    expect(result.current.items).toEqual([]);
  });

  it('수동 입력 종목은 manual 을 달고 추가되고, 무효한 값은 버린다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add({ ticker: 'tiger200', manual: { price: 21.4, dividendYield: 4.2 } });
    });
    act(() => {
      result.current.actions.add({ ticker: 'bad', manual: { price: 0, dividendYield: 4 } });
    });

    expect(result.current.items[0].manual).toEqual({ price: 21.4, dividendYield: 4.2 });
    expect(result.current.items[1].manual).toBeUndefined();
  });

  it('수량은 M0 규칙으로 정규화하되 입력창 원문은 그대로 둔다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });

    act(() => {
      result.current.actions.updateQuantity('SCHD', '12.34567');
    });
    expect(result.current.items[0]).toEqual({ ticker: 'SCHD', quantity: 12.3457, quantityInput: '12.34567' });

    // 소수점을 찍는 도중에도 입력이 되돌아가지 않는다.
    act(() => {
      result.current.actions.updateQuantity('SCHD', '12.');
    });
    expect(result.current.items[0].quantityInput).toBe('12.');
    expect(result.current.items[0].quantity).toBe(12);
  });

  it('수량을 비우면 미입력(null)이 되고 행은 남는다 (에러가 아니다)', async () => {
    const { result } = renderHoldings({
      readRecord: readerOf(seed([{ ticker: 'SCHD', quantity: 5 }])),
      writeRecord: createWriter()
    });
    await waitForReady(() => result.current.status);

    for (const raw of ['', '0', 'abc', '-3']) {
      act(() => {
        result.current.actions.updateQuantity('SCHD', raw);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBeNull();
      expect(result.current.items[0].quantityInput).toBe(raw);
    }
  });

  it('없는 티커의 수량 수정은 아무 일도 하지 않는다', async () => {
    const writeRecord = createWriter();
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.updateQuantity('NOPE', '3');
    });

    expect(result.current.items).toEqual([]);
    await waitFor(() => expect(writeRecord).not.toHaveBeenCalled());
  });

  it('세율을 0..100 으로 가둔다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.setTaxPercent(22);
    });
    expect(result.current.taxPercent).toBe(22);

    act(() => {
      result.current.actions.setTaxPercent(500);
    });
    expect(result.current.taxPercent).toBe(100);
  });
});

describe('usePortfolioHoldings — 삭제와 실행 취소', () => {
  const seedRecord = buildPortfolioRecord(
    [
      { ticker: 'SCHD', quantity: 3 },
      { ticker: 'O', quantity: 7 },
      { ticker: 'JEPI', quantity: 11 }
    ],
    15.4,
    1_700_000_000_000
  );

  it('삭제한 행을 원래 인덱스·원래 수량으로 되돌린다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(seedRecord), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.remove('O');
    });

    expect(result.current.items.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI']);
    expect(result.current.pendingUndo).toEqual({ ticker: 'O' });

    let restored: string | null = null;
    act(() => {
      restored = result.current.actions.undo();
    });

    expect(restored).toBe('O');
    expect(result.current.items).toEqual([
      { ticker: 'SCHD', quantity: 3, quantityInput: '3' },
      { ticker: 'O', quantity: 7, quantityInput: '7' },
      { ticker: 'JEPI', quantity: 11, quantityInput: '11' }
    ]);
    expect(result.current.pendingUndo).toBeNull();
  });

  it('버퍼는 직전 1건만 — 연속 삭제하면 이전 건은 확정된다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(seedRecord), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.remove('SCHD');
    });
    act(() => {
      result.current.actions.remove('O');
    });

    expect(result.current.pendingUndo).toEqual({ ticker: 'O' });

    act(() => {
      result.current.actions.undo();
    });

    expect(result.current.items.map((item) => item.ticker)).toEqual(['O', 'JEPI']);
  });

  it('다른 편집이 일어나면 버퍼를 확정한다 (스택 꼬임 방지)', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(seedRecord), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.remove('O');
    });
    act(() => {
      result.current.actions.updateQuantity('SCHD', '4');
    });

    expect(result.current.pendingUndo).toBeNull();

    let restored: string | null = 'unset';
    act(() => {
      restored = result.current.actions.undo();
    });

    expect(restored).toBeNull();
    expect(result.current.items.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI']);
  });

  it('8초가 지나면 버퍼가 만료된다', async () => {
    const { result } = renderHoldings({ readRecord: readerOf(seedRecord), writeRecord: createWriter() });
    await waitForReady(() => result.current.status);

    // fake-indexeddb 는 setImmediate 로 돌기 때문에 타이머는 setTimeout 계열만 가짜로 만든다.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    act(() => {
      result.current.actions.remove('O');
    });
    expect(result.current.pendingUndo).toEqual({ ticker: 'O' });

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    expect(result.current.pendingUndo).toBeNull();

    let restored: string | null = 'unset';
    act(() => {
      restored = result.current.actions.undo();
    });

    expect(restored).toBeNull();
    expect(result.current.items.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI']);
  });
});

describe('usePortfolioHoldings — 실패 표면화', () => {
  it('읽기에 실패하면 read-error 로 알리고 저장을 잠근다 (원본 보호 · AC4-3)', async () => {
    const writeRecord = createWriter();
    const { result, unmount } = renderHoldings({
      readRecord: async () => ({ ok: false, reason: 'blocked' }),
      writeRecord
    });

    await waitFor(() => expect(result.current.status).toBe('read-error'));
    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(ANALYTICS_EVENT.OPERATION_ERROR, {
      operation: 'portfolio_storage_read',
      reason: 'blocked'
    });

    // 입력은 계속 가능하다(메모리 상태는 정상) — 다만 디스크에는 쓰지 않는다.
    act(() => {
      result.current.actions.add('SCHD');
    });
    expect(result.current.items).toHaveLength(1);

    await new Promise((resolve) => setTimeout(resolve, 400));
    unmount();

    expect(writeRecord).not.toHaveBeenCalled();
  });

  it('리더가 throw 해도 read-error 로 떨어진다', async () => {
    const { result } = renderHoldings({
      readRecord: async () => {
        throw new Error('boom');
      },
      writeRecord: createWriter()
    });

    await waitFor(() => expect(result.current.status).toBe('read-error'));
    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(ANALYTICS_EVENT.OPERATION_ERROR, {
      operation: 'portfolio_storage_read',
      reason: 'read-failed'
    });
  });

  it('쓰기에 실패하면 writeError 로 알리고, 다음 저장이 성공하면 지운다', async () => {
    const writeRecord = createWriter();
    writeRecord.mockImplementationOnce(async () => {
      throw new Error('quota exceeded');
    });

    const { result } = renderHoldings({ readRecord: readerOf(null), writeRecord });
    await waitForReady(() => result.current.status);

    act(() => {
      result.current.actions.add('SCHD');
    });

    await waitFor(() => expect(result.current.writeError).toBe('write-failed'));
    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(ANALYTICS_EVENT.OPERATION_ERROR, {
      operation: 'portfolio_storage_write',
      reason: 'write-failed'
    });
    // 화면 값은 그대로 유지된다(메모리 상태는 정상 — 상태 F).
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.actions.updateQuantity('SCHD', '5');
    });

    await waitFor(() => expect(result.current.writeError).toBeNull());
  });
});

describe('toPortfolioHoldings', () => {
  it('미입력(null)을 0 으로 옮긴다 — 엔진이 그걸 "미입력"으로 읽는다', () => {
    expect(
      toPortfolioHoldings([
        { ticker: 'SCHD', quantity: null, quantityInput: '' },
        { ticker: 'TIGER200', quantity: 3, quantityInput: '3', manual: { price: 21.4, dividendYield: 4.2 } }
      ])
    ).toEqual([
      { ticker: 'SCHD', quantity: 0 },
      { ticker: 'TIGER200', quantity: 3, manual: { price: 21.4, dividendYield: 4.2 } }
    ]);
  });
});
