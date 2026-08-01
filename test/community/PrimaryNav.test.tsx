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
  it('워드마크는 홈(/)으로 가는 하나의 링크다', () => {
    communityEnabled = true;
    renderAt('/community');

    const brand = screen.getByRole('link', { name: '스노우볼 인컴' });
    expect(brand).toHaveAttribute('href', '/');
  });

  /*
   * 워드마크는 "스노우볼"·"인컴" 두 색으로 나뉘어 렌더되지만 **읽히는 이름은 한 덩어리**여야 한다.
   * 부분일치(/스노우볼/)로는 두 파트 사이 공백이 사라지는 회귀("스노우볼인컴")를 못 잡으므로 정확일치로 못 박는다.
   */
  it('워드마크는 두 색으로 쪼개져도 "스노우볼 인컴" 한 덩어리로 읽힌다', () => {
    communityEnabled = true;
    renderAt('/');

    const brand = screen.getByRole('link', { name: '스노우볼 인컴' });
    expect(brand).toHaveAccessibleName('스노우볼 인컴');
    expect(brand.textContent).toBe('스노우볼 인컴');
  });

  /*
   * 아이콘이 사라졌으므로 브랜드명을 읽어줄 요소는 워드마크 텍스트뿐이다(장식 이미지도 남기지 않는다).
   *
   * ⚠ `img` 만 보면 안 된다 — 이 레포의 아이콘은 거의 전부 **lucide-react 인라인 `<svg>`** 다.
   *   실제 뮤테이션에서 브랜드 블록에 `<LineChart/>` 를 되살렸을 때 `img` 단정만으로는 무음 통과했다.
   *   그래서 브랜드 링크 **안쪽**에 그래픽 요소가 하나도 없음을 본다(라우트 링크의 아이콘은 정상이므로
   *   nav 전체가 아니라 브랜드 링크로 범위를 좁힌다).
   */
  it('브랜드 영역은 텍스트 워드마크 단독이다 (img·svg 어떤 심볼 아이콘도 없음)', () => {
    communityEnabled = true;
    renderAt('/');

    const brand = screen.getByRole('link', { name: '스노우볼 인컴' });

    expect(brand.querySelector('img')).toBeNull();
    expect(brand.querySelector('svg')).toBeNull();
    // 워드마크가 브랜드 링크의 유일한 내용이다 — 텍스트만 남는다.
    expect(brand.textContent).toBe('스노우볼 인컴');
  });

  it('현재 라우트의 링크에 aria-current="page"를 준다 (시뮬레이터)', () => {
    communityEnabled = true;
    renderAt('/simulator');

    expect(screen.getByRole('link', { name: '시뮬레이터' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
  });

  /*
   * 🔴 nav 의 시뮬레이터 목적지는 `/simulator` 다(2026-08-01 라우트 이전). 워드마크(`/`)와 **다른
   * 주소**라는 것이 이 이전의 핵심이라, 목적지가 조용히 `/` 로 되돌아가면 여기서 잡는다.
   * 항목 수는 늘지 않았다 — 목적지 문자열만 옮겨 갔다.
   */
  it('시뮬레이터 링크의 목적지는 /simulator 다 (워드마크의 홈과 다른 주소)', () => {
    communityEnabled = true;
    renderAt('/simulator');

    expect(screen.getByRole('link', { name: '시뮬레이터' })).toHaveAttribute('href', '/simulator');
    expect(screen.getByRole('link', { name: '스노우볼 인컴' })).toHaveAttribute('href', '/');
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
      // 시뮬레이터는 exact(end)라 어떤 하위 경로에서도 활성이 되지 않는다.
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

  it('내 포트폴리오(/dividend/portfolio)에선 그 링크만 활성이다', () => {
    communityEnabled = true;
    renderAt('/dividend/portfolio');

    expect(screen.getByRole('link', { name: '내 포트폴리오' })).toHaveAttribute('aria-current', 'page');
    // `/dividend/*` 형제 세그먼트끼리 서로를 활성화하면 사용자는 현재 위치를 잃는다.
    expect(screen.getByRole('link', { name: '배당 캘린더' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');

    const current = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
  });

  it('배당 캘린더에선 내 포트폴리오 링크가 활성이 되지 않는다 (상호 배타)', () => {
    communityEnabled = true;
    renderAt('/dividend/calendar');

    expect(screen.getByRole('link', { name: '배당 캘린더' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '내 포트폴리오' })).not.toHaveAttribute('aria-current');
  });

  /*
   * 구 "목표 달성"(/dividend/goal) 항목은 내 포트폴리오 화면의 목표 카드로 흡수되면서 사라졌다 —
   * 같은 이야기를 두 항목이 하지 않는다.
   */
  it('라우트 링크는 6개이고 시뮬레이터 → 내 포트폴리오 → 배당 캘린더 순이다', () => {
    communityEnabled = true;
    renderAt('/dividend/portfolio');

    // 라우트 링크만 aria-label을 갖는다(브랜드 링크는 워드마크 텍스트가 이름) — 순서 = 예상 관심도(확정 결정).
    const names = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label'))
      .filter((name): name is string => name !== null);

    expect(names).toEqual([
      '시뮬레이터',
      '내 포트폴리오',
      '배당 캘린더',
      '포트폴리오 갤러리',
      '게시판',
      'ETF 소개'
    ]);
    expect(screen.queryByRole('link', { name: '목표 달성' })).not.toBeInTheDocument();
  });

  it('커뮤니티 비활성 배포에서도 내 포트폴리오·배당 캘린더 링크는 남는다', () => {
    communityEnabled = false;
    renderAt('/dividend/portfolio');

    expect(screen.getByRole('link', { name: '내 포트폴리오' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '배당 캘린더' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '포트폴리오 갤러리' })).not.toBeInTheDocument();
  });

  it('커뮤니티 비활성 배포에선 갤러리·게시판 링크를 렌더하지 않는다 (앱은 그대로 동작)', () => {
    communityEnabled = false;
    renderAt('/');

    // 브랜드(홈)와 시뮬레이터 링크는 그대로. 커뮤니티 링크만 사라진다.
    expect(screen.getByRole('link', { name: '스노우볼 인컴' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '시뮬레이터' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '포트폴리오 갤러리' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '게시판' })).not.toBeInTheDocument();
  });
});
