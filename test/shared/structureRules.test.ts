// @vitest-environment node — 파일시스템만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * `.cursor/rules` 의 구조 불변식을 코드로 잠근다.
 *
 * 왜 테스트로 만드는가 — 이 레포의 반복 경험이 "잘 만든 규칙이 조용히 무효화돼 있던 자리"다.
 * 규칙을 문서에만 두면 리뷰가 놓치는 순간 조용히 깨지고, 깨진 채로도 앱은 잘 돌기 때문에
 * 아무도 모른다(헤더 4벌·드로어 3벌·아이콘 size prop 무효화가 전부 그렇게 살아남았다).
 * 여기서 잡는 것은 취향이 아니라 **어기면 나중에 반드시 비용을 내는** 세 가지다.
 */

const REPO_ROOT = process.cwd();

/** 규칙이 적용되는 최상위 폴더. `utils/`·`server/` 는 생성 스크립트·서버리스라 관례가 다르다. */
const RULED_ROOTS = ['components', 'pages', 'shared', 'jotai'] as const;

/** 워크트리·산출물·스냅샷은 우리 코드가 아니다. */
const SKIP_DIRS = new Set(['node_modules', '__snapshots__', '.git']);

const SOURCE_EXT = /\.(ts|tsx)$/;
const TEST_FILE = /\.test\.(ts|tsx)$/;

function listDirs(dir: string): string[] {
  const out: string[] = [dir];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listDirs(full));
  }
  return out;
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).filter((f) => {
    const full = join(dir, f);
    return statSync(full).isFile() && SOURCE_EXT.test(f);
  });
}

const ruledDirs = RULED_ROOTS.flatMap((root) => listDirs(join(REPO_ROOT, root)));
const rel = (p: string) => relative(REPO_ROOT, p).split(sep).join('/');

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;

/**
 * 선언된 이탈 — 규칙을 어기지만 **이유가 있어** 통과시키는 파일. 이 레포의 관례대로 이탈은
 * 이탈로 적는다. 여기 없는 새 이탈은 실패해야 한다(그게 이 가드의 전부다).
 */
const DECLARED_FILE_DEVIATIONS: Record<string, string> = {
  'components/common/ShareDialog/ShareChannelGlyph.tsx':
    '공유 채널(X·페북·네이버)의 글자꼴 도형만 담은 부품. 브랜드 원본 로고가 아니라 도형이라 별 이름이 붙었고, ShareDialog 밖에서 쓰일 일이 없어 하위 폴더로 내리지 않았다.',
  'components/community/CommunityAuthProvider/CommunityAuthProvider.context.ts':
    'React context 객체와 훅. 컴포넌트 파일에서 컴포넌트가 아닌 것을 내보내면 fast refresh 가 깨져 분리했다.',
  'components/community/SocialLoginButton/SocialLoginButton.marks.tsx':
    '카카오·네이버 공식 브랜드 마크(인라인 SVG). 규정색 하드코딩이 허용되는 유일한 자리라 버튼 로직과 섞지 않는다.',
  'pages/DividendCalendar/components/MonthCalendar/MonthCalendarSkeleton.tsx':
    '같은 스타일 파일을 공유하는 로딩 골격. 본체와 한 세트라 폴더를 나누지 않았다.',
  'pages/Main/Main.shared.styled.ts':
    'Main 하위 컴포넌트들이 공유하는 스타일 조각의 재수출 지점(공용 Modal 스킨 등). 옮기면 호출부 import 가 전부 바뀐다.',
  'pages/Portfolio/PortfolioPage/PortfolioPage.nextPayoutTile.ts':
    '다음 지급일 타일 전용 순수 함수 묶음. 규칙이 촘촘해 독립 서브모듈로 떼고 전용 테스트가 그 경계를 검증한다.'
};

type ComponentFolder = { dir: string; name: string; files: string[] };

/** PascalCase 폴더 중 **자기 이름의 컴포넌트 파일**(`X.tsx`/`X.ts`)을 가진 곳 = 이 규칙의 대상. */
const componentFolders: ComponentFolder[] = ruledDirs
  .map((dir) => ({ dir, name: dir.split(sep).pop() as string }))
  .filter(({ name }) => PASCAL.test(name))
  .map(({ dir, name }) => ({ dir, name, files: listSourceFiles(dir) }))
  .filter(({ name, files }) => files.includes(`${name}.tsx`) || files.includes(`${name}.ts`));

describe('.cursor/rules §2 — 모든 폴더에 index.ts', () => {
  it('소스 파일이 있는 폴더는 배럴을 갖는다', () => {
    const missing = ruledDirs
      .filter((dir) => listSourceFiles(dir).some((f) => !TEST_FILE.test(f)))
      .filter((dir) => {
        const entries = readdirSync(dir);
        return !entries.includes('index.ts') && !entries.includes('index.tsx');
      })
      .map(rel);

    // 배럴이 없으면 외부가 내부 파일을 직접 import 할 수밖에 없다 — 규칙 위반이 전염된다.
    expect(missing).toEqual([]);
  });
});

describe('.cursor/rules §2·§8 — 폴더 내부 파일 직접 import 금지', () => {
  /*
   * 금지되는 것은 **외부에서** 남의 폴더 내부를 집는 것이다.
   *  (1) `@/.../Card/Card` — 배럴을 건너뛰고 같은 이름의 내부 파일을 집는다
   *  (2) `@/.../X.styled` 류 — 남의 내부 구현 파일을 직접 집는다
   *  (3) `../X/X` — 상대경로로 남의 폴더 안을 뚫는다
   *
   * ⚠ 같은 폴더 안의 `./X.styled`·`./X.types` 는 **정상**이다 — 그게 §3 이 규정한 파일 세트가
   * 서로를 쓰는 방식이고, 배럴을 경유하면 자기 폴더 안에서 순환이 생긴다. 그래서 `@/` 로
   * 시작하는 절대 경로와 상위로 올라가는 상대 경로만 검사한다.
   */
  const BARREL_BYPASS = /from\s+'@\/[A-Za-z0-9_/-]*?([A-Za-z0-9]+)\/\1'/;
  const INTERNAL_FILE = /from\s+'@\/[A-Za-z0-9_/-]*\.(styled|types|utils|view)'/;
  const RELATIVE_DIG = /from\s+'\.\.\/[A-Za-z0-9_/-]*?([A-Za-z0-9]+)\/\1'/;

  it('배럴을 우회하는 import 가 없다', () => {
    const offenders: string[] = [];

    for (const dir of ruledDirs) {
      for (const file of listSourceFiles(dir)) {
        const full = join(dir, file);
        const source = readFileSync(full, 'utf8');
        source.split('\n').forEach((line, i) => {
          if (BARREL_BYPASS.test(line) || INTERNAL_FILE.test(line) || RELATIVE_DIG.test(line)) {
            offenders.push(`${rel(full)}:${i + 1} → ${line.trim()}`);
          }
        });
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('.cursor/rules §3 — 컴포넌트 파일명 prefix = 폴더명', () => {
  it('components 하위 PascalCase 폴더의 파일은 폴더명으로 시작한다', () => {
    const offenders: string[] = [];

    for (const dir of listDirs(join(REPO_ROOT, 'components'))) {
      const name = dir.split(sep).pop() as string;
      if (!PASCAL.test(name)) continue;

      for (const file of listSourceFiles(dir)) {
        if (file === 'index.ts' || file === 'index.tsx') continue;
        const path = rel(join(dir, file));
        if (path in DECLARED_FILE_DEVIATIONS) continue;
        if (!file.startsWith(name)) offenders.push(`${path} (폴더: ${name})`);
      }
    }

    // prefix 가 어긋나면 검색·이동 시 짝을 잃는다. 하위 부품이 여럿이면 하위 폴더로 내려라.
    expect(offenders).toEqual([]);
  });
});

/*
 * ── §3 "파일 세트" 를 어디까지 잠글 수 있나 (2026-07-31 실측 조사) ──────────────────────
 * `.cursor/rules` §3 은 `X.tsx`/`X.styled.ts`/`X.types.ts`/`X.test.ts` 한 세트를 규정하지만,
 * **레포가 실제로 지키는 것은 "존재"가 아니라 "배치"다.** 컴포넌트 폴더 150개를 세어 보면
 *   .styled.ts 113 · .types.ts 129 · .utils.ts 36 · 콜로케이트 테스트 41
 * — 즉 사이드카는 **필요할 때만** 만든다(순수 표현 컴포넌트는 타입도 스타일도 없을 수 있다).
 * "네 파일을 다 가져라"를 잠그면 100곳 넘게 빨개지고, 그러면 아무도 안 고치고 가드가 꺼진다.
 *
 * 그래서 **지금 100% 지켜지는 두 가지**만 잠근다.
 *   ① 세트 **밖의** 파일이 컴포넌트 폴더에 들어오지 않는다(이탈 7건은 이유와 함께 선언).
 *   ② 스타일은 `X.styled.ts` 에만 산다 — 컴포넌트 파일이 `@emotion/styled` 를 직접 들이지 않는다
 *      (150폴더 전수 조사에서 위반 0건).
 * §7("모든 재사용 컴포넌트는 테스트를 갖는다")은 아래 별도 describe 에서 **실제로 지켜지는 범위**
 * (`components/common`)만 잠근다. 그 밖은 오늘 지켜지지 않는다 — 넓히려면 백로그로 다뤄야지
 * 가드로 선언한다고 지켜지지 않는다.
 */
describe('.cursor/rules §3 — 컴포넌트 폴더의 파일 세트', () => {
  /** 세트가 허용하는 접미사. 없어도 되지만, 있으면 **이 이름이어야** 한다. */
  const SET_SUFFIXES = [
    '.tsx',
    '.ts',
    '.styled.ts',
    '.types.ts',
    '.utils.ts',
    '.view.tsx',
    '.test.ts',
    '.test.tsx',
    '.view.test.tsx',
    '.utils.test.ts'
  ];

  it('감사 대상이 실제로 잡힌다 (탐색이 죽으면 아래 계약이 조용히 통과한다)', () => {
    expect(componentFolders.length).toBeGreaterThan(100);
  });

  it('컴포넌트 폴더에는 세트 밖의 파일이 없다', () => {
    const offenders: string[] = [];

    for (const { dir, name, files } of componentFolders) {
      for (const file of files) {
        if (file === 'index.ts' || file === 'index.tsx') continue;
        const path = rel(join(dir, file));
        if (path in DECLARED_FILE_DEVIATIONS) continue;
        if (!file.startsWith(name)) {
          offenders.push(`${path} (폴더: ${name} — prefix 불일치)`);
          continue;
        }
        const suffix = file.slice(name.length);
        if (!SET_SUFFIXES.includes(suffix)) offenders.push(`${path} (세트에 없는 접미사: ${suffix})`);
      }
    }

    // 새 접미사가 필요하다고 판단되면 세트를 넓히거나, 이유와 함께 위 이탈 목록에 적는다.
    expect(offenders).toEqual([]);
  });

  it('스타일은 X.styled.ts 에만 산다 — 컴포넌트 파일이 styled 를 직접 만들지 않는다', () => {
    const STYLED_IMPORT = /from\s+'@emotion\/styled'/;
    const offenders: string[] = [];

    for (const { dir, name, files } of componentFolders) {
      for (const suffix of ['.tsx', '.ts', '.view.tsx']) {
        const file = `${name}${suffix}`;
        if (!files.includes(file)) continue;
        if (STYLED_IMPORT.test(readFileSync(join(dir, file), 'utf8'))) offenders.push(rel(join(dir, file)));
      }
    }

    // 컴포넌트 파일에 styled 가 섞이면 마크업과 시각 결정이 한 파일에서 엉킨다 — 세트가 존재하는 이유다.
    expect(offenders).toEqual([]);
  });
});

/*
 * §7 은 "모든 재사용 컴포넌트는 `X.test.ts` 를 갖는다"고 적지만, 레포 전체로는 150폴더 중 41곳만
 * 콜로케이트 테스트를 갖는다(2026-07-31 실측). 전부 잠그면 100곳 넘게 빨개진다. 반면 **재사용 레이어
 * 로 명시된 `components/common` 은 20곳 중 19곳이 지킨다** — 그 범위는 오늘 진짜 계약이라 잠근다.
 */
describe('.cursor/rules §7 — 재사용 레이어(components/common)는 테스트를 갖는다', () => {
  /** 테스트를 못 붙이는 이탈 — 이유와 함께. */
  const DECLARED_TEST_DEVIATIONS: Record<string, string> = {
    'components/common/ResponsiveEChart':
      'ECharts 캔버스 래퍼. jsdom 은 캔버스를 그리지 않아 이 컴포넌트를 쓰는 테스트들이 전부 모킹한다(test/community/ScenarioPreview.test.tsx). 렌더 테스트가 검증할 수 있는 것이 남지 않는다.'
  };

  it('components/common 의 각 컴포넌트 폴더에 테스트 파일이 있다', () => {
    const offenders = componentFolders
      .filter(({ dir }) => rel(dir).startsWith('components/common/'))
      .filter(({ dir }) => !(rel(dir) in DECLARED_TEST_DEVIATIONS))
      .filter(({ files }) => !files.some((file) => TEST_FILE.test(file)))
      .map(({ dir }) => rel(dir));

    expect(offenders).toEqual([]);
  });
});
