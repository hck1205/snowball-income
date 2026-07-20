import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * PrimaryNav의 커뮤니티 링크 노출은 isCommunityEnabled(env 상수)에 달려 있다.
 * 기본 테스트 env는 VITE_SUPABASE_* 가 비어 false다 — 켜진 동작을 보려면 상수를 가변 게터로 목킹한다.
 * PrimaryNav는 렌더 시점에 이 값을 읽으므로, 테스트마다 플래그를 바꿔 두 상태를 모두 검증한다.
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
const { PrimaryNav } = await import('@/components/PrimaryNav');

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PrimaryNav />
    </MemoryRouter>
  );

describe('PrimaryNav', () => {
  it('로고+앱이름은 홈(/)으로 가는 하나의 링크다', () => {
    communityEnabled = true;
    renderAt('/community');

    const brand = screen.getByRole('link', { name: 'Snowball Income' });
    expect(brand).toHaveAttribute('href', '/');
  });

  it('현재 라우트의 링크에 aria-current="page"를 준다 (시뮬레이터)', () => {
    communityEnabled = true;
    renderAt('/');

    expect(screen.getByRole('link', { name: '시뮬레이터' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
  });

  it('갤러리(/community/portfolio)에선 갤러리 링크만 활성 (시뮬레이터·게시판은 비활성)', () => {
    communityEnabled = true;
    renderAt('/community/portfolio');

    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
  });

  it('게시판 하위 경로(/community/board/write)에서도 게시판 링크가 활성이다 (섹션 유지)', () => {
    communityEnabled = true;
    renderAt('/community/board/write');

    expect(screen.getByRole('link', { name: '게시판' })).toHaveAttribute('aria-current', 'page');
    // 형제 세그먼트라 갤러리는 게시판 하위에서 활성이 되지 않는다.
    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');
  });

  // 갤러리 하위 경로(상세·글쓰기·수정)에서도 섹션 탭이 유지돼야 한다 — routes.tsx의 portfolio 자식 라우트.
  it.each(['/community/portfolio/abc123', '/community/portfolio/abc123/edit', '/community/portfolio/write'])(
    '갤러리 하위 경로(%s)에서도 갤러리 링크가 활성이다 (섹션 유지)',
    (path) => {
      communityEnabled = true;
      renderAt(path);

      expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
      // '/'는 exact(end)라 어떤 하위 경로에서도 활성이 되지 않는다.
      expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');
    }
  );

  it('활성 링크는 어느 라우트에서든 정확히 하나다', () => {
    communityEnabled = true;
    renderAt('/community/board/42');

    const current = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName('게시판');
  });

  it('커뮤니티 비활성 배포에선 갤러리·게시판 링크를 렌더하지 않는다 (앱은 그대로 동작)', () => {
    communityEnabled = false;
    renderAt('/');

    // 브랜드(홈)와 시뮬레이터 링크는 그대로. 커뮤니티 링크만 사라진다.
    expect(screen.getByRole('link', { name: 'Snowball Income' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '시뮬레이터' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '포트폴리오 갤러리' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '게시판' })).not.toBeInTheDocument();
  });
});
