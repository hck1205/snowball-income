import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

/**
 * 가계부 링크도 같은 방식이다 — `isGoogleSheetsEnabled`(VITE_GOOGLE_* 셋 다 있음)가 false 면
 * `router/routes.tsx` 의 `/ledger` 라우트가 아예 없어서 메뉴만 남으면 404 로 가는 죽은 링크가 된다.
 * 테스트 env 는 비어 있어 기본이 false 다 — 켜진 동작을 보려면 여기서도 가변 게터로 목킹한다.
 */
let ledgerEnabled = true;
vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    get isGoogleSheetsEnabled() {
      return ledgerEnabled;
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

/**
 * 포트폴리오 묶음 메뉴를 편다.
 *
 * 🔴 내 포트폴리오·대가들의 포트폴리오는 **접혀 있다**(2026-08-02) — nav 항목이 8개 상한에 닿아
 * 같은 축 둘을 한 칸으로 묶었다. 그래서 이 둘은 **펼친 뒤에만** 링크로 존재한다.
 */
const openPortfolioMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: /포트폴리오/ }));
};

describe('PrimaryNav', () => {
  // 두 플래그는 테스트마다 명시하지만, 앞 테스트가 끈 값이 새는 일을 막으려 기본을 켜 둔다.
  beforeEach(() => {
    communityEnabled = true;
    ledgerEnabled = true;
  });

  it('워드마크는 홈(/)으로 가는 하나의 링크다', () => {
    communityEnabled = true;
    renderAt('/community');

    const brand = screen.getByRole('link', { name: 'Hungry Hippo' });
    expect(brand).toHaveAttribute('href', '/');
  });

  /*
   * 워드마크는 "Hungry"·"Hippo" 두 색으로 나뉘어 렌더되지만 **읽히는 이름은 한 덩어리**여야 한다.
   * 부분일치(/Hungry/)로는 두 파트 사이 공백이 사라지는 회귀("HungryHippo")를 못 잡으므로 정확일치로 못 박는다.
   */
  it('워드마크는 두 색으로 쪼개져도 "Hungry Hippo" 한 덩어리로 읽힌다', () => {
    communityEnabled = true;
    renderAt('/');

    const brand = screen.getByRole('link', { name: 'Hungry Hippo' });
    expect(brand).toHaveAccessibleName('Hungry Hippo');
    expect(brand.textContent).toBe('Hungry Hippo');
  });

  /*
   * 🔴 2026-08-03: 로고는 **브랜드 링크 안이 아니라 헤더가 소유한다.**
   *
   * 종전 계약은 *"브랜드 영역은 텍스트 워드마크 단독이다"* 였고 그 이유는 심볼이 앱 곳곳(19곳)에
   * 흩어져 있어서였다. 사용자 지시로 그 19곳을 전부 걷고 로고를 **헤더 하나**로 모았는데
   * ("Hungry Hippo 왼쪽에만"), 그 로고는 헤더 격자에서 브랜드 줄과 메뉴 줄을 **가로지르는**
   * 트랙에 서야 한다("윗줄 아랫줄을 병합한 크기 스페이스"). 가로지르려면 격자의 직계 자식이어야
   * 하므로 브랜드 링크 **밖**이다 — `AppHeader` 의 LogoSlot 이 소유한다.
   *
   * 🔴 그래서 이 링크 안은 여전히 글자뿐이고, 그 사실이 계약이다:
   * `getByRole('link', {name: 'Hungry Hippo'})` 로 브랜드를 집는 테스트가 십수 개다.
   * 여기에 그림이 들어오면 접근명이 오염되어 그 전부가 무너진다.
   */
  it('브랜드 링크는 글자뿐이다 — 로고는 헤더가 따로 소유한다', () => {
    communityEnabled = true;
    renderAt('/');

    const brand = screen.getByRole('link', { name: 'Hungry Hippo' });

    expect(brand.querySelector('img')).toBeNull();
    expect(brand.querySelector('svg')).toBeNull();
    expect(brand.textContent).toBe('Hungry Hippo');
  });

  it('현재 라우트의 링크에 aria-current="page"를 준다 (시뮬레이터)', () => {
    communityEnabled = true;
    renderAt('/simulator');

    expect(screen.getByRole('link', { name: '시뮬레이터' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
    // 갤러리는 묶음 안이라 트리거가 꺼져 있는 것으로 확인한다.
    expect(screen.getByRole('button', { name: /포트폴리오/ })).not.toHaveAttribute('aria-current');
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
    expect(screen.getByRole('link', { name: 'Hungry Hippo' })).toHaveAttribute('href', '/');
  });

  it('갤러리(/community/portfolio)에선 묶음 안 갤러리 링크만 활성 (시뮬레이터·게시판은 비활성)', () => {
    communityEnabled = true;
    renderAt('/community/portfolio');
    openPortfolioMenu();

    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '게시판' })).not.toHaveAttribute('aria-current');
  });

  it('게시판 하위 경로(/community/board/write)에서도 게시판 링크가 활성이다 (섹션 유지)', () => {
    communityEnabled = true;
    renderAt('/community/board/write');

    expect(screen.getByRole('link', { name: '게시판' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');
    // 형제 세그먼트라 갤러리(묶음 안)는 게시판 하위에서 활성이 되지 않는다 — 트리거부터 꺼져 있어야 한다.
    expect(screen.getByRole('button', { name: /포트폴리오/ })).not.toHaveAttribute('aria-current');
    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '포트폴리오 갤러리' })).not.toHaveAttribute('aria-current');
  });

  // 갤러리 하위 경로(상세·글쓰기·수정)에서도 섹션 탭이 유지돼야 한다 — routes.tsx의 portfolio 자식 라우트.
  it.each(['/community/portfolio/abc123', '/community/portfolio/abc123/edit', '/community/portfolio/write'])(
    '갤러리 하위 경로(%s)에서도 갤러리 링크가 활성이다 (섹션 유지)',
    (path) => {
      communityEnabled = true;
      renderAt(path);

      // 접힌 채로도 "이 묶음 안에 있다"가 읽혀야 한다 — 하위 경로에서도 마찬가지다.
      expect(screen.getByRole('button', { name: /포트폴리오/ })).toHaveAttribute('aria-current', 'true');
      openPortfolioMenu();

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

  it('내 포트폴리오(/dividend/portfolio)에선 묶음 안 그 링크만 활성이다', () => {
    communityEnabled = true;
    renderAt('/dividend/portfolio');
    openPortfolioMenu();

    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).not.toHaveAttribute('aria-current');
    // `/dividend/*` 형제 세그먼트끼리 서로를 활성화하면 사용자는 현재 위치를 잃는다.
    expect(screen.getByRole('link', { name: '배당 캘린더' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '시뮬레이터' })).not.toHaveAttribute('aria-current');

    const current = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
  });

  it('배당 캘린더에선 내 포트폴리오 링크가 활성이 되지 않는다 (상호 배타)', () => {
    communityEnabled = true;
    renderAt('/dividend/calendar');
    openPortfolioMenu();

    expect(screen.getByRole('link', { name: '배당 캘린더' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).not.toHaveAttribute('aria-current');
  });

  /* ── 포트폴리오 묶음 메뉴 ──────────────────────────────────────────────────── */

  it('묶음 트리거는 링크가 아니다 — 눌러도 이동하지 않고 메뉴만 연다', () => {
    renderAt('/simulator');

    const trigger = screen.getByRole('button', { name: /포트폴리오/ });
    // 🔴 `/portfolio` 라우트는 없다. 링크로 만들면 없는 페이지를 가리킨다.
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: '나의 배당 포트폴리오' })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).toHaveAttribute('href', '/dividend/portfolio');
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).toHaveAttribute('href', '/portfolio/investors');
  });

  it('Escape 로 닫힌다 (열어 둔 메뉴가 화면에 남지 않는다)', () => {
    renderAt('/simulator');
    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: '대가들의 포트폴리오' })).not.toBeInTheDocument();
  });

  /**
   * 자식 라우트에 있으면 접혀 있어도 트리거가 그 사실을 말해야 한다 — 펼치지 않으면 현재 위치를
   * 알 수 없는 메뉴는 묶은 대가만 치르고 얻는 것이 없다.
   */
  it('묶음 안 라우트(/portfolio/investors)에선 접힌 트리거가 현재 위치를 말한다', () => {
    renderAt('/portfolio/investors');

    const trigger = screen.getByRole('button', { name: /포트폴리오/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // 채움 pill 은 시각 신호일 뿐이다 — 펼치기 전에도 읽히는 신호가 있어야 한다.
    expect(trigger).toHaveAttribute('aria-current', 'true');

    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).not.toHaveAttribute('aria-current');
  });

  /*
   * 구 "목표 달성"(/dividend/goal) 항목은 내 포트폴리오 화면의 목표 카드로 흡수되면서 사라졌다 —
   * 같은 이야기를 두 항목이 하지 않는다.
   */
  /**
   * 🔴 **윗줄은 8칸이 상한이다.** 좁은 폭에서 넘치면 가로 스크롤로 숨는데, 스크롤로 숨는 항목은
   * 사용자에게 아무 신호를 주지 않는다(2026-07-31 실측). 아홉 번째가 필요하면 새 칸이 아니라
   * 묶음(`NavGroupMenu`)으로 접는 것이 2026-08-02 에 택한 길이다 — 이 개수 단정이 그 규칙을 잠근다.
   * 포트폴리오 3종을 접어 7칸이 됐고, 2026-08-04 에 배당 목록 4종(허브 + 킹·귀족·챔피언)이 **한 칸**으로
   * 합류해 지금은 **8칸 = 상한**이다. 다음 기능은 반드시 묶음이어야 한다.
   */
  it('윗줄은 8칸이고 시뮬레이터 → 포트폴리오(묶음) → 가계부 → 배당 캘린더 → 배당 리스트(묶음) 순이다', () => {
    communityEnabled = true;
    ledgerEnabled = true;
    renderAt('/dividend/portfolio');

    /*
     * 한 칸은 링크(`a[aria-label]`)이거나 묶음 트리거(`button[aria-haspopup]`)다 — 둘을 **DOM 순서대로**
     * 함께 읽어야 묶음이 어느 자리에 들어갔는지가 드러난다(링크만 세면 묶음 자리가 사라진다).
     * 브랜드 링크는 aria-label 이 없어(워드마크 텍스트가 이름) 자연히 빠진다.
     */
    const nav = screen.getByRole('navigation', { name: '주요 메뉴' });
    const slots = [...nav.querySelectorAll('a[aria-label], button[aria-expanded]')].map(
      (element) => element.getAttribute('aria-label') ?? element.textContent
    );

    expect(slots).toEqual([
      '시뮬레이터',
      /* 포트폴리오 묶음 — 나의 배당 포트폴리오·대가들의 포트폴리오·포트폴리오 갤러리 셋이 여기 접혀 있다. */
      '포트폴리오',
      '가계부',
      '배당 캘린더',
      /* 배당 리스트 묶음(2026-08-04) — 목록 비교(허브)·배당킹·배당귀족·배당챔피언 넷이 여기 접혀 있다.
         배당 캘린더 바로 뒤: 둘 다 `/dividend/` 아래의 "배당 그 자체를 보는" 축이다. */
      '배당 리스트',
      '게시판',
      'ETF 소개',
      /* 종목 비교(2026-08-02) — ETF 소개와 같은 "종목 정보" 축이라 그 바로 뒤다. */
      '종목 비교'
    ]);
    expect(slots).toHaveLength(8);

    expect(screen.queryByRole('link', { name: '목표 달성' })).not.toBeInTheDocument();
  });

  /*
   * 🔴 가계부 라우트(`/ledger`)는 `isGoogleSheetsEnabled` 가 false 면 존재하지 않는다(routes.tsx).
   * 메뉴만 남으면 404 로 가는 죽은 링크라, 라우트와 **같은 플래그**로 갈리는지 양쪽 상태를 본다.
   */
  it('가계부 비활성 배포에선 가계부 링크를 렌더하지 않는다 (죽은 링크 금지)', () => {
    communityEnabled = true;
    ledgerEnabled = false;
    renderAt('/dividend/portfolio');

    expect(screen.queryByRole('link', { name: '가계부' })).not.toBeInTheDocument();
    // 나머지 메뉴는 그대로 — 플래그가 다른 항목을 건드리지 않는다(포트폴리오 둘은 묶음 안에 있다).
    expect(screen.getByRole('link', { name: 'ETF 소개' })).toBeInTheDocument();
    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).toBeInTheDocument();
  });

  it('가계부(/ledger)에선 그 링크만 활성이다', () => {
    communityEnabled = true;
    ledgerEnabled = true;
    renderAt('/ledger');

    expect(screen.getByRole('link', { name: '가계부' })).toHaveAttribute('href', '/ledger');
    expect(screen.getByRole('link', { name: '가계부' })).toHaveAttribute('aria-current', 'page');
    // 같은 hue(accentAlt)를 공유해도 활성 표시는 서로 배타다 — 사용자는 현재 위치를 잃으면 안 된다.
    // 묶음 트리거도 꺼져 있어야 한다: 가계부는 그 묶음 밖이다.
    expect(screen.getByRole('button', { name: /포트폴리오/ })).not.toHaveAttribute('aria-current');
    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).not.toHaveAttribute('aria-current');

    const current = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
  });

  it('커뮤니티 비활성 배포에서도 내 포트폴리오·배당 캘린더 링크는 남는다', () => {
    communityEnabled = false;
    renderAt('/dividend/portfolio');

    expect(screen.getByRole('link', { name: '배당 캘린더' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '포트폴리오 갤러리' })).not.toBeInTheDocument();
    // 포트폴리오 묶음은 커뮤니티 플래그와 무관하다 — 둘 다 커뮤니티 밖 화면이다.
    openPortfolioMenu();
    expect(screen.getByRole('link', { name: '나의 배당 포트폴리오' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대가들의 포트폴리오' })).toBeInTheDocument();
  });

  it('커뮤니티 비활성 배포에선 갤러리·게시판 링크를 렌더하지 않는다 (앱은 그대로 동작)', () => {
    communityEnabled = false;
    renderAt('/');

    // 브랜드(홈)와 시뮬레이터 링크는 그대로. 커뮤니티 링크만 사라진다.
    expect(screen.getByRole('link', { name: 'Hungry Hippo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '시뮬레이터' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '포트폴리오 갤러리' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '게시판' })).not.toBeInTheDocument();
  });
});
