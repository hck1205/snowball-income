import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const readHoldings = vi.fn();
const readInvestments = vi.fn();
const readClassifyRules = vi.fn();

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    readHoldings: (...args: unknown[]) => readHoldings(...args),
    readInvestments: (...args: unknown[]) => readInvestments(...args),
    readClassifyRules: (...args: unknown[]) => readClassifyRules(...args)
  };
});

const { useLedgerSideTabs } = await import('@/pages/Ledger/hooks');

/**
 * 옆탭 읽기 훅.
 *
 * 🔴 이 파일이 존재하는 이유는 **실제로 배포 전에 깨졌기 때문**이다: "읽고 있습니다…" 가
 *    영영 사라지지 않았다. 원인은 `setByTab` 업데이터 안에서 플래그를 세우고 그 밖에서 즉시
 *    읽은 것 — React 는 업데이터를 동기로 실행하지 않는다. 아래 첫 테스트가 그 가드다.
 */

const ok = <T>(records: readonly T[], skipped = 0) => ({ ok: true as const, value: { records, skipped } });

const setup = (overrides: Partial<Parameters<typeof useLedgerSideTabs>[0]> = {}) =>
  renderHook(() =>
    useLedgerSideTabs({
      spreadsheetId: 'sheet-1',
      createdByApp: true,
      readContext: () => ({ accessToken: 'token' }),
      onError: vi.fn(),
      ...overrides
    })
  );

beforeEach(() => {
  readHoldings.mockReset();
  readInvestments.mockReset();
  readClassifyRules.mockReset();
  readHoldings.mockResolvedValue(ok([]));
  readInvestments.mockResolvedValue(ok([]));
  readClassifyRules.mockResolvedValue(ok([]));
});

describe('🔴 읽고 있습니다… 가 영영 남던 버그', () => {
  it('⭐ 탭을 부르면 실제로 요청이 나가고 상태가 ready 로 끝난다', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.load('holdings');
    });

    expect(readHoldings).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.byTab.holdings.status).toBe('ready'));
  });

  it('🔴 loading 에서 멈추지 않는다', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.load('investments');
    });

    await waitFor(() => expect(result.current.byTab.investments.status).not.toBe('loading'));
  });
});

describe('할당량을 아낀다', () => {
  it('⭐ 고른 탭만 읽는다 — 셋을 미리 다 읽지 않는다', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.load('rules');
    });

    expect(readClassifyRules).toHaveBeenCalledTimes(1);
    expect(readHoldings).not.toHaveBeenCalled();
    expect(readInvestments).not.toHaveBeenCalled();
  });

  it('⭐ 같은 탭을 다시 부르면 요청하지 않는다', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.load('holdings');
    });
    await act(async () => {
      await result.current.load('holdings');
    });

    expect(readHoldings).toHaveBeenCalledTimes(1);
  });

  it('다시 읽기(force)는 요청한다 — 자동 갱신 대신 사용자가 정하는 갱신이다', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.load('holdings');
    });
    await act(async () => {
      await result.current.load('holdings', { force: true });
    });

    expect(readHoldings).toHaveBeenCalledTimes(2);
  });

  it('🔴 앱이 만든 시트가 아니면 아예 부르지 않는다 — 그 탭이 없다', async () => {
    const { result } = setup({ createdByApp: false });

    await act(async () => {
      await result.current.load('holdings');
    });

    expect(readHoldings).not.toHaveBeenCalled();
  });
});

describe('실패', () => {
  it('⭐ 실패하면 error 이고, 다시 부를 수 있다 — 시작 표시가 남으면 재시도가 막힌다', async () => {
    readHoldings.mockResolvedValue({ ok: false, error: { code: 'rate-limited' } });
    const { result } = setup();

    await act(async () => {
      await result.current.load('holdings');
    });
    await waitFor(() => expect(result.current.byTab.holdings.status).toBe('error'));

    readHoldings.mockResolvedValue(ok([]));
    await act(async () => {
      await result.current.load('holdings');
    });

    expect(readHoldings).toHaveBeenCalledTimes(2);
  });

  it('🔴 만료는 전용 배너로 넘기고 이 탭은 idle 로 되돌린다 — 패널에 또 적지 않는다', async () => {
    const onError = vi.fn();
    readHoldings.mockResolvedValue({ ok: false, error: { code: 'auth-expired' } });
    const { result } = setup({ onError });

    await act(async () => {
      await result.current.load('holdings');
    });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'auth-expired' }));
    await waitFor(() => expect(result.current.byTab.holdings.status).toBe('idle'));
  });

  it('토큰이 없으면 만료로 다룬다', async () => {
    const onError = vi.fn();
    const { result } = setup({ onError, readContext: () => null });

    await act(async () => {
      await result.current.load('holdings');
    });

    expect(readHoldings).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});

describe('🔴 시트를 바꾸면 읽어 둔 것을 버린다', () => {
  it('다른 시트의 값이 화면에 남지 않는다', async () => {
    const { result, rerender } = renderHook(
      (props: { spreadsheetId: string }) =>
        useLedgerSideTabs({
          spreadsheetId: props.spreadsheetId,
          createdByApp: true,
          readContext: () => ({ accessToken: 'token' }),
          onError: vi.fn()
        }),
      { initialProps: { spreadsheetId: 'sheet-1' } }
    );

    await act(async () => {
      await result.current.load('holdings');
    });
    await waitFor(() => expect(result.current.byTab.holdings.status).toBe('ready'));

    rerender({ spreadsheetId: 'sheet-2' });
    await waitFor(() => expect(result.current.byTab.holdings.status).toBe('idle'));

    /* 시작 표시도 함께 버려야 새 시트에서 다시 읽힌다. */
    await act(async () => {
      await result.current.load('holdings');
    });
    expect(readHoldings).toHaveBeenCalledTimes(2);
  });
});
