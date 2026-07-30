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
  /*
   * 선언된 이탈 — 규칙을 어기지만 이유가 있어 통과시키는 것. 여기에 없는 새 이탈은 실패해야 한다.
   * ShareChannelGlyph: 공유 채널(X·페북·네이버)의 글자꼴 도형만 담은 부품. 브랜드 원본 로고가
   * 아니라 도형이라 별 이름이 붙었고, ShareDialog 밖에서 쓰일 일이 없어 하위 폴더로 내리지 않았다.
   */
  const DECLARED_DEVIATIONS = new Set(['components/common/ShareDialog/ShareChannelGlyph.tsx']);

  it('components 하위 PascalCase 폴더의 파일은 폴더명으로 시작한다', () => {
    const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
    const offenders: string[] = [];

    for (const dir of listDirs(join(REPO_ROOT, 'components'))) {
      const name = dir.split(sep).pop() as string;
      if (!PASCAL.test(name)) continue;

      for (const file of listSourceFiles(dir)) {
        if (file === 'index.ts' || file === 'index.tsx') continue;
        const path = rel(join(dir, file));
        if (DECLARED_DEVIATIONS.has(path)) continue;
        if (!file.startsWith(name)) offenders.push(`${path} (폴더: ${name})`);
      }
    }

    // prefix 가 어긋나면 검색·이동 시 짝을 잃는다. 하위 부품이 여럿이면 하위 폴더로 내려라.
    expect(offenders).toEqual([]);
  });
});
