// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/**
 * **헤더 복제 방지 계약.**
 *
 * 2026-07-29 이전에는 같은 헤더가 **3벌**(시뮬레이터 · 커뮤니티 · 티커 셸) 살아 있었다. 셋 다
 * `PrimaryNav` 는 공유했지만 조립은 각자 해서, "티커·캘린더 헤더에만 로그인·더보기가 없다" 같은
 * 차이가 어떤 테스트도 깨지 않고 오래 남았다(사용자가 직접 발견해 세 번 지적했다).
 *
 * 그래서 **"헤더를 조립하는 파일은 하나뿐"** 을 소스 수준에서 잠근다. 렌더 테스트로는 못 잡는다 —
 * 복제본은 각자 잘 동작하기 때문이다. 새 페이지가 헤더를 다시 만들면 여기서 빨개진다.
 *
 * 새 헤더가 정말 필요하다면 이 목록을 고치기 전에 `AppHeader` 에 슬롯을 뚫는 쪽을 먼저 검토할 것.
 */
const REPO_ROOT = resolve(__dirname, '../..');

/** 헤더를 조립할 자격이 있는 유일한 파일들(구현 + 그 스타일/테스트). */
const HEADER_OWNER = 'components/AppHeader';

/** 앱 소스만 본다 — 산출물·의존성·에이전트 워크트리는 제외. */
const SCAN_ROOTS = ['components', 'pages', 'shared', 'router'];

const collectSourceFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
};

const SOURCE_FILES = SCAN_ROOTS.flatMap((root) => collectSourceFiles(join(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: readFileSync(file, 'utf-8')
}));

const filesUsing = (needle: string, { excludeOwner = true } = {}) =>
  SOURCE_FILES.filter(
    ({ path, source }) => source.includes(needle) && (!excludeOwner || !path.startsWith(HEADER_OWNER))
  ).map(({ path }) => path);

describe('앱 헤더는 한 벌뿐이다', () => {
  it('아랫줄 라우트 메뉴(PrimaryNavLinks)를 렌더하는 곳은 AppHeader 뿐이다', () => {
    // `PrimaryNavLinks` 를 직접 그린다 = 헤더 2줄 구조를 손으로 다시 만들고 있다는 뜻이다.
    // 배럴(components/PrimaryNav/index.ts)의 재export 는 렌더가 아니므로 제외한다.
    const renderers = filesUsing('<PrimaryNavLinks');

    expect(renderers).toEqual([]);
  });

  it('헤더 글래스 서피스·컨트롤 그리드 레시피를 쓰는 곳은 AppHeader 뿐이다', () => {
    expect(filesUsing('headerGlassSurface')).toEqual(['shared/styles/headerSurface.ts', 'shared/styles/index.ts']);
    expect(filesUsing('headerControlsGrid')).toEqual(['shared/styles/headerSurface.ts', 'shared/styles/index.ts']);
  });

  it('페이지 셸은 전부 AppHeader 를 쓴다 (시뮬레이터 · 커뮤니티 · 티커/포트폴리오/캘린더 셸)', () => {
    const shells = [
      'pages/Main/Main.view.tsx',
      'components/community/CommunityHeader/CommunityHeader.tsx',
      'pages/Ticker/components/TickerPageShell/TickerPageShell.tsx'
    ];

    for (const shell of shells) {
      const file = SOURCE_FILES.find(({ path }) => path === shell);
      expect(file, `${shell} 이(가) 사라졌다면 이 목록을 갱신할 것`).toBeDefined();
      expect(file?.source, `${shell} 이 AppHeader 를 쓰지 않는다`).toContain('<AppHeader');
    }
  });
});
