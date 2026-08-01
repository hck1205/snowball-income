import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * **전 페이지 헤더 계약.** 앱의 헤더는 이 컴포넌트 한 벌이므로, 여기서 단정하는 구조·접근명이
 * 곧 모든 화면(시뮬레이터 · 내 포트폴리오 · 배당 캘린더 · ETF 소개 · 커뮤니티)의 헤더 계약이다.
 *
 * 헤더가 3벌로 복제돼 있던 시절에는 "티커 셸에만 로그인이 없다" 같은 차이가 아무 테스트도 깨지 않고
 * 몇 주씩 남아 있었다. 복제 자체를 막는 것은 `test/shared/appHeaderSingleSource.test.ts` 가 하고,
 * 이 파일은 **그 한 벌이 무엇을 보장하는가**를 고정한다.
 *
 * 레이아웃(sticky · 3컬럼 정렬 · 좁은 폭 접힘)은 jsdom 이 `@media` 도 스태킹도 평가하지 않아
 * 테스트로 잡히지 않는다 — 실브라우저 육안/계측 몫이다. 여기서는 DOM 계약만 단정한다.
 */
let communityEnabled = true;
vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    get isCommunityEnabled() {
      return communityEnabled;
    }
  };
});

// 목킹 이후에 import 해야 목이 적용된다.
const { default: AppHeader } = await import('./AppHeader');
const { CommunityAuthProvider } = await import('@/components/community/CommunityAuthProvider');

type Props = Parameters<typeof AppHeader>[0];

const renderHeader = (props: Props = {}) =>
  render(
    <MemoryRouter>
      <CommunityAuthProvider>
        <AppHeader {...props} />
      </CommunityAuthProvider>
    </MemoryRouter>
  );

describe('AppHeader — 전 페이지 공통 계약', () => {
  it('banner 랜드마크가 정확히 하나다', () => {
    communityEnabled = true;
    renderHeader();

    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('워드마크는 기본적으로 제목이 아니다 — 본문이 h1 을 갖는 화면을 위해', () => {
    communityEnabled = true;
    renderHeader();

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: COMMUNITY_COPY.nav.brand })).toBeInTheDocument();
  });

  it('brandAs="h1" 이면 워드마크가 그 화면의 유일한 h1 이 된다', () => {
    communityEnabled = true;
    renderHeader({ brandAs: 'h1' });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    // 두 색으로 쪼갠 워드마크가 한 덩어리로 읽혀야 한다 — 부분일치는 공백 소실 회귀를 못 잡는다.
    expect(headings[0].textContent).toBe(COMMUNITY_COPY.nav.brand);
  });

  it('커뮤니티가 켜진 배포에선 로그인과 더보기가 함께 보인다', async () => {
    communityEnabled = true;
    renderHeader();

    const banner = screen.getByRole('banner');
    expect(await within(banner).findByRole('button', { name: COMMUNITY_COPY.nav.login })).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: '더보기' })).toBeInTheDocument();
  });

  it('커뮤니티가 꺼진 배포에선 로그인이 사라지고 더보기·밝기 토글은 남는다', () => {
    communityEnabled = false;
    renderHeader();

    const banner = screen.getByRole('banner');
    expect(within(banner).queryByRole('button', { name: COMMUNITY_COPY.nav.login })).not.toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: '더보기' })).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: '다크 모드' })).toBeInTheDocument();
  });

  it('기본 더보기 메뉴는 앱 설치뿐 — 튜토리얼은 시뮬레이터 전용, 테마는 헤더로 승격됐다', async () => {
    communityEnabled = false;
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '더보기' }));

    expect(screen.getByRole('menuitem', { name: '앱 설치' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: '튜토리얼 보기' })).not.toBeInTheDocument();
    // 🔴 테마는 이 서랍에 되돌아오면 안 된다 — 진입점이 둘이 되면 같은 기능이 두 곳에서 갈린다.
    expect(screen.queryByRole('menuitem', { name: '테마' })).not.toBeInTheDocument();
  });

  /**
   * 테마 축은 헤더에 **상시** 있어야 한다(F4, 2026-07-31). 다만 그 축이 2026-08-01 에
   * "색 프리셋 8종"에서 **"라이트/다크 하나"** 로 줄었다 — 사용자가 화면을 보고 내린 결정이다.
   * 여기서 잠그는 것은 ①어떤 화면에서든 헤더에서 한 번에 닿는다 ②상태가 색 아닌 단서로 전달된다
   * ③고를 수 있는 것이 그 하나뿐이다(색 프리셋 진입점 0건).
   */
  it('밝기 토글이 헤더에 상시 있고, 상태를 색이 아닌 단서(aria-pressed)로 알린다', async () => {
    communityEnabled = false;
    const user = userEvent.setup();
    renderHeader();

    const banner = screen.getByRole('banner');
    const toggle = within(banner).getByRole('button', { name: '다크 모드' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(within(banner).getByRole('button', { name: '다크 모드' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('🔒 헤더 어디에도 색 프리셋을 고르는 진입점이 없다', async () => {
    communityEnabled = false;
    const user = userEvent.setup();
    renderHeader();

    expect(screen.queryByRole('button', { name: /테마 프리셋/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: '테마 프리셋' })).not.toBeInTheDocument();

    // ⋯ 서랍을 열어도 마찬가지다(예전 진입점이 여기였다).
    await user.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.queryByRole('radiogroup', { name: '테마 프리셋' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('overflowMenu 를 넘기면 기본 더보기 대신 그것을 그린다 (⋯ 가 두 개가 되지 않는다)', () => {
    communityEnabled = false;
    renderHeader({
      overflowMenu: (
        <button type="button" aria-label="더보기">
          ⋯
        </button>
      )
    });

    expect(screen.getAllByRole('button', { name: '더보기' })).toHaveLength(1);
  });

  // 구 `center`(갤러리 검색)·`below`(모바일 검색 펼침 바) 슬롯은 2026-07-31 에 삭제됐다 —
  // 그 위젯들이 본문 툴바로 내려가 소비처가 0이 됐고, 남겨 두면 헤더 한 줄의 폭 경쟁이 재발한다.
  it('status·actions 슬롯 내용을 헤더 안에 렌더한다', () => {
    communityEnabled = false;
    renderHeader({
      status: <span>저장 중</span>,
      actions: (
        <button type="button" aria-label="글쓰기">
          글쓰기
        </button>
      )
    });

    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('저장 중')).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: '글쓰기' })).toBeInTheDocument();
  });

  it('라우트 메뉴(주요 nav)를 항상 그린다 — 화면을 옮겨도 같은 자리에 있다', () => {
    communityEnabled = false;
    renderHeader();

    const banner = screen.getByRole('banner');
    expect(within(banner).getAllByRole('navigation', { name: COMMUNITY_COPY.nav.primaryLabel }).length).toBeGreaterThan(
      0
    );
    expect(within(banner).getByRole('link', { name: COMMUNITY_COPY.nav.simulator })).toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: COMMUNITY_COPY.nav.myPortfolio })).toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: COMMUNITY_COPY.nav.dividendCalendar })).toBeInTheDocument();
  });
});
