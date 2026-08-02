// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/**
 * **주요 지수 스트립의 자리 계약.**
 *
 * 2026-08-02 하루 동안 이 부품의 자리가 세 번 바뀌었다: 랜딩 참조 구역 → 랜딩 히어로 아래 →
 * 앱 헤더(로고↔로그인 사이) → **되돌려서** 시세가 실제로 쓰이는 세 화면의 본문 맨 위. 중간 상태마다
 * 주석이 남아, 다음 세션이 "헤더 이동이 절반만 됐다"고 읽고 **이미 되돌린 작업을 다시 하러** 들어왔다.
 * 어떤 테스트도 그것을 막지 못했다 — 자리는 렌더 결과가 아니라 **어느 파일이 부품을 그리는가**라서
 * 화면 단위 테스트로는 "여기 없다"만 말할 수 있고 "저기 있다"를 말할 수 없기 때문이다.
 *
 * 그래서 배선을 소스 수준에서 못 박는다(`appHeaderSingleSource.test.ts` 와 같은 어법).
 * 자리를 바꾸는 것은 자유다 — 다만 **여기부터 고쳐야** 하고, 그 순간 의도가 기록으로 남는다.
 *
 * ## 왜 헤더가 아닌가 (되살리기 전에 읽을 것)
 * ① 헤더는 전 라우트 상시 표시라 시세가 무의미한 화면(커뮤니티·티커 소개·법무 문서)까지 따라다닌다.
 * ② **자리가 없다.** 1280 실측: 브랜드↔컨트롤 트랙 902px 중 라우트 메뉴가 753px 을 쓰고 ≤1024 에서는
 *    이미 넘쳐 스크롤한다. 6칸 티커는 1,100px 대를 요구하고, 전폭 한 줄을 새로 얹으면 헤더가
 *    65 → 90px 이 되어 `tools/dev/headerprobe.mjs` 의 상한(≥1024 에서 80px)을 깬다.
 */
const REPO_ROOT = resolve(__dirname, '../..');

/** 부품을 **그리는** 파일(뷰). 본문 맨 위 한 자리씩. */
const RENDER_SITES = [
  'pages/Main/Main.view.tsx',
  'pages/Portfolio/PortfolioPage/PortfolioPage.view.tsx',
  'pages/DividendCalendar/DividendCalendarPage/DividendCalendarPage.view.tsx'
];

/**
 * 조회 드라이버를 **부르는** 파일(컨테이너). 렌더 사이트와 1:1 이어야 한다 —
 * 드라이버 없는 렌더는 영원한 스켈레톤이고, 렌더 없는 드라이버는 아무도 안 보는 fetch 다.
 *
 * ⚠ 한 화면에 둘을 부르면 중복 조회지만, 위 셋은 **서로 다른 라우트**라 동시에 살지 않는다.
 */
const DRIVER_SITES = [
  'pages/Main/Main.tsx',
  'pages/Portfolio/PortfolioPage/PortfolioPage.tsx',
  'pages/DividendCalendar/DividendCalendarPage/DividendCalendarPage.tsx'
];

/** 앱 소스만 본다 — 산출물·의존성·테스트는 제외(`jotai/` 는 드라이버 **정의** 파일이라 스캔 밖). */
const SCAN_ROOTS = ['components', 'pages', 'shared', 'router'];

const collectSourceFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
};

/**
 * 주석을 지운 소스. 이 레포는 주석에 **사용 예시 코드**를 싣는 관례가 있어
 * (`MarketIndexStrip.tsx` 상단 JSDoc 이 `useMarketIndicesSync()` 를 그대로 보여 준다)
 * 원문 그대로 세면 문서가 배선으로 잡힌다.
 */
const stripComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');

const SOURCE_FILES = SCAN_ROOTS.flatMap((root) => collectSourceFiles(join(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  code: stripComments(readFileSync(file, 'utf-8'))
}));

const filesUsing = (needle: string) =>
  SOURCE_FILES.filter(({ code }) => code.includes(needle))
    .map(({ path }) => path)
    .sort();

describe('주요 지수 스트립은 정해진 세 화면에만 있다', () => {
  it('부품을 그리는 곳은 시뮬레이터 · 내 포트폴리오 · 배당 캘린더 뷰뿐이다', () => {
    expect(filesUsing('<MarketIndexStrip')).toEqual([...RENDER_SITES].sort());
  });

  it('조회 드라이버를 부르는 곳은 그 세 화면의 컨테이너뿐이다', () => {
    expect(filesUsing('useMarketIndicesSync(')).toEqual([...DRIVER_SITES].sort());
  });

  it('🔴 앱 헤더와 랜딩은 부품도 드라이버도 갖지 않는다', () => {
    // 헤더에 넣으면 전 라우트를 따라다니고 폭이 없다(파일 상단 실측). 랜딩은 서사 화면이라 시세를 안 쓴다.
    const forbidden = [
      'components/AppHeader/AppHeader.tsx',
      'pages/Landing/LandingPage/LandingPage.tsx',
      'pages/Landing/LandingPage/LandingPage.view.tsx'
    ];

    for (const path of forbidden) {
      const file = SOURCE_FILES.find((candidate) => candidate.path === path);
      expect(file, `${path} 가 사라졌다면 이 목록을 갱신할 것`).toBeDefined();
      expect(file?.code).not.toContain('<MarketIndexStrip');
      expect(file?.code).not.toContain('useMarketIndicesSync(');
    }
  });
});
