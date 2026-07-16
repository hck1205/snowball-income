import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PersistedScenarioState } from '@/jotai/snowball/types';

/**
 * 게시 규칙(제목 필수 + 본문/첨부 중 하나)과 저장 경로(sanitize된 body, 기본 공개, 요약 자동발췌)를
 * 훅 수준에서 실제로 구동해 확인한다. supabase IO와 로컬 상태 읽기만 목킹하고, 규칙/정화는 실제 코드.
 * (글쓰기 토글은 "비공개" 스위치라 기본값은 공개 = isPublic true. off=공개가 기본이다.)
 */

const validScenario: PersistedScenarioState = {
  id: 'local-1',
  name: '내 시나리오',
  portfolio: {
    tickerProfiles: [],
    includedTickerIds: [],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    initialInvestment: 10_000_000,
    monthlyContribution: 500_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2026-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    reinvestTiming: 'sameMonth',
    dpsGrowthMode: 'annualStep',
    showQuickEstimate: false,
    showSplitGraphs: false,
    isResultCompact: false,
    isYearlyAreaFillOn: true,
    showPortfolioDividendCenter: true,
    visibleYearlySeries: {
      totalContribution: true,
      assetValue: true,
      annualDividend: false,
      monthlyDividend: false,
      cumulativeDividend: false
    }
  }
};

vi.mock('@/jotai', () => ({
  readPersistedAppState: vi.fn(async () => ({
    ok: true,
    payload: { activeScenarioId: 'local-1', scenarios: [validScenario] }
  }))
}));

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => ({}) as unknown),
    publishScenario: vi.fn(async (_client: unknown, input: Record<string, unknown>) => ({
      id: 'new-id',
      ...input
    })),
    updateScenario: vi.fn(async (_client: unknown, id: string, patch: Record<string, unknown>) => ({
      id,
      ...patch
    }))
  };
});

// 목킹 이후에 import 해야 목이 적용된 심볼을 받는다.
const { useScenarioComposer } = await import(
  '@/pages/Community/CommunityWritePage/hooks/useScenarioComposer'
);
const { publishScenario } = await import('@/shared/lib/supabase');

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

beforeEach(() => {
  vi.mocked(publishScenario).mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useScenarioComposer — 게시 가능 규칙', () => {
  it('제목만 있고 본문/첨부가 없으면 게시 불가', () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('제목만 있는 빈 글'));

    expect(result.current.canSubmit).toBe(false);
  });

  it('제목 + 본문이면 게시 가능', () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('제목'));
    act(() => result.current.handleBodyChange('<p>본문 내용</p>'));

    expect(result.current.canSubmit).toBe(true);
  });

  it('제목 + 시나리오 첨부(본문 없음)면 게시 가능', async () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('첨부만 있는 글'));
    await act(async () => {
      await result.current.attachCurrentScenario();
    });

    expect(result.current.attachedPayload).not.toBeNull();
    expect(result.current.canSubmit).toBe(true);
  });

  it('제목이 공백뿐이면 게시 불가', () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('   '));
    act(() => result.current.handleBodyChange('<p>본문</p>'));

    expect(result.current.canSubmit).toBe(false);
  });
});

describe('useScenarioComposer — 저장 경로', () => {
  it('제목은 trim, 본문은 sanitize해서 publishScenario에 넘긴다 (기본 공개)', async () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('  좋은 제목  '));
    act(() =>
      result.current.handleBodyChange('<p><strong>굵게</strong></p><script>steal()</script>')
    );

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishScenario).toHaveBeenCalledTimes(1));

    const input = vi.mocked(publishScenario).mock.calls[0][1] as Record<string, unknown>;
    expect(input.title).toBe('좋은 제목');
    expect(input.body).toContain('<strong>굵게</strong>');
    expect(String(input.body).toLowerCase()).not.toContain('<script');
    expect(input.body).not.toContain('steal');
    // 훅은 isPublic(camelCase)로 넘기고, queries.publishScenario가 is_public으로 매핑한다.
    // 새 글 기본값은 공개("비공개" 스위치 off) → true.
    expect(input.isPublic).toBe(true);
    expect(input.payload).toBeNull();
  });

  it('요약을 비우면 본문 앞부분을 자동 발췌해 넣는다', async () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('제목'));
    act(() => result.current.handleBodyChange('<p>자동 발췌될 본문입니다</p>'));

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishScenario).toHaveBeenCalledTimes(1));

    const input = vi.mocked(publishScenario).mock.calls[0][1] as Record<string, unknown>;
    expect(input.description).toBe('자동 발췌될 본문입니다');
  });

  it('비공개로 전환하면 is_public=false로 넘긴다', async () => {
    const { result } = renderHook(() => useScenarioComposer(), { wrapper });

    act(() => result.current.setTitle('제목'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    act(() => result.current.setIsPublic(false));

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishScenario).toHaveBeenCalledTimes(1));

    const input = vi.mocked(publishScenario).mock.calls[0][1] as Record<string, unknown>;
    expect(input.isPublic).toBe(false);
  });
});
