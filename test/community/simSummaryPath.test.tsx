import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommunityGalleryView from '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.view';
import type { CommunityGalleryViewModel } from '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.types';
import { EMPTY_INVESTMENT_SETTINGS } from '@/jotai';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import { fetchGalleryPage, fetchScenarioDetail, publishScenario, updateScenario } from '@/shared/lib/supabase';
import type { CommunityClient, ScenarioListItem, ScenarioPayload } from '@/shared/lib/supabase';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * sim_summary 데이터 경로 계약 (스펙 §E·§H, decisions.md "게시 시점 고정"):
 *   - 요약은 **게시·수정 뮤테이션에서만** 계산해 저장한다 — 읽기 경로 재계산 금지.
 *   - 목록/상세 쿼리는 sim_summary를 싣는다 (payload는 목록에서 계속 제외).
 *   - 읽기 측은 검증 파서를 통과한 값만 프리뷰로 쓰고, 오염 값은 텍스트 카드로 폴백한다.
 */

// ── 픽스처 ───────────────────────────────────────────────────────────────────

/** 정합 프로필 (dividendYield + dividendGrowth === expectedTotalReturn). */
const tickerProfile = (id: string, ticker: string, dividendYield: number, dividendGrowth: number): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency: 'quarterly'
});

/** 게시 가능한 완성 payload — buildScenarioSimSummary가 요약을 계산할 수 있다. */
const validPayload: ScenarioPayload = {
  portfolio: {
    tickerProfiles: [tickerProfile('t1', 'SCHD', 3.5, 5), tickerProfile('t2', 'JEPI', 7.2, 0)],
    includedTickerIds: ['t1', 't2'],
    weightByTickerId: { t1: 60, t2: 40 },
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 10_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4
  }
};

/** 포함 티커 0개 — 구조는 payload지만 요약 계산이 불가한 미완성 상태. */
const uncomputablePayload: ScenarioPayload = {
  portfolio: { tickerProfiles: [], includedTickerIds: [], weightByTickerId: {}, fixedByTickerId: {}, selectedTickerId: null },
  investmentSettings: validPayload.investmentSettings
};

/** insert/update에 넘어간 값을 캡처하는 최소 가짜 query-builder (queries.test.ts 패턴). */
const makeBuilder = (result: { data: unknown; error: { message: string } | null }) => {
  const calls = { insert: [] as unknown[], update: [] as unknown[], select: [] as string[] };
  const builder: Record<string, unknown> = {
    from: () => builder,
    select: (cols: string) => {
      calls.select.push(cols);
      return builder;
    },
    insert: (value: unknown) => {
      calls.insert.push(value);
      return builder;
    },
    update: (value: unknown) => {
      calls.update.push(value);
      return builder;
    },
    eq: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    returns: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject)
  };
  return { client: builder as unknown as CommunityClient, calls };
};

// ── 게시·수정 경로 ────────────────────────────────────────────────────────────

describe('publishScenario — sim_summary 게시 시점 계산', () => {
  it('payload가 있으면 순수 함수와 같은 요약을 함께 insert한다', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'new' }, error: null });

    await publishScenario(client, { title: '월배당 시나리오', payload: validPayload });

    const inserted = calls.insert[0] as Record<string, unknown>;
    const expected = buildScenarioSimSummary(validPayload);
    expect(expected).not.toBeNull(); // 픽스처 자체가 계산 가능해야 테스트가 의미 있다
    expect(inserted.sim_summary).toEqual(expected);
  });

  it('payload가 없으면(자유 글) sim_summary도 null', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'new' }, error: null });

    await publishScenario(client, { title: '자유 글', body: '<p>hi</p>' });

    expect((calls.insert[0] as Record<string, unknown>).sim_summary).toBeNull();
  });

  it('계산 불가한 payload면 null을 저장하고 게시는 막지 않는다 (폴백 = 텍스트 카드)', async () => {
    const { client, calls } = makeBuilder({ data: { id: 'new' }, error: null });

    await publishScenario(client, { title: '미완성 첨부', payload: uncomputablePayload });

    const inserted = calls.insert[0] as Record<string, unknown>;
    expect(inserted.payload).toEqual(uncomputablePayload); // 첨부 자체는 그대로 저장
    expect(inserted.sim_summary).toBeNull();
  });
});

describe('updateScenario — payload를 바꿀 때만 요약 갱신', () => {
  it('payload 패치 시 요약을 재계산해 함께 update한다', async () => {
    const { client, calls } = makeBuilder({ data: { id: 's1' }, error: null });

    await updateScenario(client, 's1', { payload: validPayload });

    const updated = calls.update[0] as Record<string, unknown>;
    expect(updated.sim_summary).toEqual(buildScenarioSimSummary(validPayload));
  });

  it('payload 해제(null)면 요약도 null로 지운다', async () => {
    const { client, calls } = makeBuilder({ data: { id: 's1' }, error: null });

    await updateScenario(client, 's1', { payload: null });

    const updated = calls.update[0] as Record<string, unknown>;
    expect(updated.payload).toBeNull();
    expect(updated.sim_summary).toBeNull();
  });

  it('payload를 안 건드리는 수정(제목만)은 sim_summary 키를 보내지 않는다 — 게시 시점 숫자 보존', async () => {
    const { client, calls } = makeBuilder({ data: { id: 's1' }, error: null });

    await updateScenario(client, 's1', { title: '제목만 수정' });

    expect(Object.keys(calls.update[0] as Record<string, unknown>)).not.toContain('sim_summary');
  });
});

describe('목록·상세 쿼리 — sim_summary 컬럼 포함', () => {
  it('갤러리 목록은 sim_summary를 싣고 payload는 계속 제외한다', async () => {
    const { client, calls } = makeBuilder({ data: [], error: null });

    await fetchGalleryPage(client, {});

    const columns = calls.select[0].split(',');
    expect(columns).toContain('sim_summary');
    expect(columns).not.toContain('payload');
  });

  it('상세는 sim_summary와 payload를 모두 싣는다', async () => {
    const { client, calls } = makeBuilder({ data: { id: 's1' }, error: null });

    await fetchScenarioDetail(client, 's1');

    const columns = calls.select[0].split(',');
    expect(columns).toContain('sim_summary');
    expect(columns).toContain('payload');
  });
});

// ── 갤러리 주입 (검증 파서 경유 폴백) ─────────────────────────────────────────

const listItem = (id: string, title: string, sim_summary: unknown): ScenarioListItem => ({
  id,
  user_id: 'u1',
  title,
  description: null,
  is_public: true,
  has_payload: true,
  sim_summary,
  like_count: 0,
  view_count: 0,
  comment_count: 0,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: null
});

/** DB에서 내려온 원시 jsonb 형태의 유효 요약 (§H 10필드). */
const rawValidSummary = {
  version: 1,
  durationYears: 20,
  tickerCount: 4,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  totalContribution: 250_000_000,
  finalAssetValue: 920_000_000,
  finalMonthlyDividend: 1_870_000,
  targetMonthlyDividend: 3_000_000,
  targetReachedInYears: 8
};

const baseVM = (overrides: Partial<CommunityGalleryViewModel> = {}): CommunityGalleryViewModel => ({
  items: [],
  status: 'ready',
  sort: 'recent',
  query: '',
  isSearching: false,
  reachedEnd: false,
  isLoadingMore: false,
  loadMoreError: false,
  viewType: 'card',
  setSort: vi.fn(),
  loadMore: vi.fn(),
  retry: vi.fn(),
  clearSearch: vi.fn(),
  clearFilters: vi.fn(),
  onToggleView: vi.fn(),
  onWrite: vi.fn(),
  ...overrides
});

const renderView = (viewModel: CommunityGalleryViewModel) =>
  render(
    <MemoryRouter>
      <CommunityGalleryView viewModel={viewModel} />
    </MemoryRouter>
  );

describe('갤러리 주입 — sim_summary는 검증 파서를 통과한 것만 프리뷰로', () => {
  it('카드 뷰: 유효한 요약은 숫자 프리뷰, 오염 값(has_payload=true여도)은 텍스트 카드 폴백', () => {
    renderView(
      baseVM({
        items: [
          listItem('s1', '첨부 글', rawValidSummary),
          listItem('s2', '오염된 글', { version: 999, hacked: true }),
          listItem('s3', '구버전 글', null)
        ]
      })
    );

    // 세 글 모두 렌더는 된다 (오염이 목록을 죽이지 않는다)
    expect(screen.getByText('첨부 글')).toBeInTheDocument();
    expect(screen.getByText('오염된 글')).toBeInTheDocument();
    expect(screen.getByText('구버전 글')).toBeInTheDocument();

    // 프리뷰 블록은 유효한 요약 하나만 — hero 라벨/값으로 판별
    expect(screen.getAllByText('월 배당(세후)')).toHaveLength(1);
    expect(screen.getByText('187만원')).toBeInTheDocument();
    expect(screen.getByText('8년차 목표 달성')).toBeInTheDocument();
  });

  it('인라인 뷰: 유효한 요약만 숫자 클러스터를 그린다', () => {
    renderView(
      baseVM({
        viewType: 'inline',
        items: [listItem('s1', '첨부 글', rawValidSummary), listItem('s2', '오염된 글', 'not-even-an-object')]
      })
    );

    // 행 뷰의 숫자 클러스터도 카드와 같은 hero 라벨(§B안) — 유효한 요약 하나만 그린다.
    expect(screen.getAllByText('월 배당(세후)')).toHaveLength(1);
    expect(screen.getByText('187만원')).toBeInTheDocument();
  });
});
