// 소스코드 → 심볼/모듈그래프/라우트/테스트 인덱스 (.index/code.json)
// "code-graph" 역할: 정규식 기반 경량 파서(외부 의존성 0). TS 컴파일러를 쓰지 않는다.
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { walk, relPosix, normalizeSpecifier, resolveModule, extractSpecifier, isCommentLine, uniq } from './lib.mjs';

const CODE_EXTS = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];

const IGNORE_DIRS = ['node_modules', 'dist', 'build', 'coverage', 'public', 'output'];

const LANG = { '.ts': 'ts', '.tsx': 'tsx', '.mjs': 'js', '.js': 'js', '.jsx': 'jsx' };

// React/상태/DOM에 의존하면 순수 함수 모듈이 아니다.
const IMPURE_PACKAGES = /^(react|react-dom|react-router|react-router-dom|jotai|@emotion|echarts|echarts-for-react|html2canvas)/;
const SIDE_EFFECT_GLOBALS = /\b(window|document|localStorage|sessionStorage|fetch|navigator|process\.env|Math\.random|Date\.now)\b/;

/** 경로 → 레이어 분류. 사람이 "어디를 봐야 하나"를 바로 알게 한다. */
function categorize(rel) {
  if (/(^|\/)test\//.test(rel) || /\.test\.[jt]sx?$/.test(rel) || /\.spec\.[jt]sx?$/.test(rel)) return 'test';
  if (rel.startsWith('tools/')) return 'tool';
  if (rel.startsWith('scripts/')) return 'script';
  if (rel.startsWith('router/')) return 'router';
  if (rel.startsWith('jotai/')) return 'state';
  if (rel.startsWith('components/')) return 'component';
  if (/^pages\/[^/]+\/hooks\//.test(rel)) return 'hook';
  if (rel.startsWith('pages/')) return 'page';
  if (rel.startsWith('shared/types/')) return 'types';
  if (rel.startsWith('shared/constants/')) return 'constants';
  if (rel.startsWith('shared/lib/') || rel.startsWith('shared/utils/')) return 'lib';
  if (rel.startsWith('shared/')) return 'shared';
  if (rel.startsWith('utils/')) return 'util';
  return 'root';
}

/**
 * 한 줄에서 심볼 하나를 추출한다(선언당 첫 매치 우선 — 중복 방지).
 * 최상위(들여쓰기 0) 선언만 본다 — 함수 본문 안의 지역 변수는 인덱스 노이즈라 제외.
 * 반환: { kind, name, exported } | null
 */
function matchSymbol(line, lang) {
  const isTsx = lang === 'tsx' || lang === 'jsx';
  if (/^\s/.test(line)) return null; // 들여쓰기 = 최상위 선언이 아님

  // export default function Foo / export function foo / function foo
  let m = line.match(/^(export\s+)?(?:default\s+)?(?:async\s+)?function\s+\*?\s*([A-Za-z_$][\w$]*)/);
  if (m) {
    const [, exp, name] = m;
    return { kind: fnKind(name, isTsx), name, exported: Boolean(exp) };
  }

  // class
  m = line.match(/^(export\s+)?(?:default\s+|abstract\s+)?class\s+([A-Za-z_$][\w$]*)/);
  if (m) return { kind: 'class', name: m[2], exported: Boolean(m[1]) };

  // type / interface / enum
  m = line.match(/^(export\s+)?(?:declare\s+)?type\s+([A-Za-z_$][\w$]*)\s*[=<]/);
  if (m) return { kind: 'type', name: m[2], exported: Boolean(m[1]) };
  m = line.match(/^(export\s+)?(?:declare\s+)?interface\s+([A-Za-z_$][\w$]*)/);
  if (m) return { kind: 'interface', name: m[2], exported: Boolean(m[1]) };
  m = line.match(/^(export\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/);
  if (m) return { kind: 'enum', name: m[2], exported: Boolean(m[1]) };

  // const/let 선언 — 우변(rhs)을 보고 종류를 판정한다.
  m = line.match(/^(export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]+)?=\s*(.*)$/);
  if (m) {
    const [, exp, name, rhsRaw] = m;
    const rhs = rhsRaw.trim();
    const exported = Boolean(exp);

    // Jotai atom: atom(…) / atomState<…>(…) / atomWithStorage(…) / …Atom 이름
    if (/^(atom|atomState|atomWrite|atomFamily|atomWithStorage|selectAtom|loadable)\s*[<(]/.test(rhs) || /Atom$/.test(name)) {
      return { kind: 'atom', name, exported };
    }
    // 커스텀 훅
    if (/^use[A-Z]/.test(name)) return { kind: 'hook', name, exported };
    // Emotion styled 컴포넌트 (노이즈 분리)
    if (/^styled[.(]/.test(rhs)) return { kind: 'styled', name, exported };
    // memo/forwardRef 래핑 컴포넌트: const Card = memo(CardComponent)
    if (isTsx && /^[A-Z]/.test(name) && /^(React\.)?(memo|forwardRef)\s*\(/.test(rhs)) return { kind: 'component', name, exported };
    // 화살표 함수: `(` 로 시작하거나 `x =>` 형태, `<T,>(…) =>` 제네릭 포함
    const isArrow = /^(async\s+)?(\(|<[^>]*>\s*\(|[A-Za-z_$][\w$]*\s*=>)/.test(rhs);
    if (isArrow) {
      if (isTsx && /^[A-Z]/.test(name)) return { kind: 'component', name, exported };
      return { kind: 'function', name, exported };
    }
    // 그 외 값 바인딩(객체/배열/리터럴/제네릭 팩토리 호출)
    return { kind: 'const', name, exported };
  }

  return null;
}

/**
 * 선언과 떨어져 나오는 export를 뒤늦게 반영한다.
 *   const Card = memo(CardComponent);  …  export default Card;   → Card.exported = true
 *   export { foo, bar as baz };
 */
function applyDeferredExports(lines, symbols) {
  const exported = new Set();
  for (const line of lines) {
    let m = line.match(/^export\s+default\s+([A-Za-z_$][\w$]*)\s*(?:as\s+[^;]+)?;?\s*$/);
    if (m) exported.add(m[1]);
    m = line.match(/^export\s+default\s+(?:React\.)?(?:memo|forwardRef)\s*\(\s*([A-Za-z_$][\w$]*)/);
    if (m) exported.add(m[1]);
    m = line.match(/^export\s*\{([^}]*)\}\s*;?\s*$/); // `export { a, b as c };` (from 절은 import 처리에서 걸러짐)
    if (m) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (name) exported.add(name);
      }
    }
  }
  if (!exported.size) return;
  for (const s of symbols) if (exported.has(s.name)) s.exported = true;
}

function fnKind(name, isTsx) {
  if (/^use[A-Z]/.test(name)) return 'hook';
  if (isTsx && /^[A-Z]/.test(name)) return 'component';
  return 'function';
}

/** 테스트 파일에서 describe/it/test 제목을 뽑는다(무엇을 검증하는지 검색용). */
function extractTestCases(lines) {
  const cases = [];
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(?:describe|it|test)(?:\.\w+)?\s*\(\s*(['"`])([^'"`]+)\1/);
    if (m) cases.push({ title: m[2], line: i + 1 });
  });
  return cases;
}

/** router/routes.tsx 에서 { path: '/x', element: <Page /> } 를 근사 추출. */
function extractRoutes(rel, lines) {
  const routes = [];
  lines.forEach((line, i) => {
    const m = line.match(/\bpath:\s*['"]([^'"]+)['"]/);
    if (!m) return;
    let element = '';
    for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 4); j++) {
      const e = lines[j].match(/\belement:\s*<\s*([A-Za-z_$][\w$]*)/);
      if (e) {
        element = e[1];
        break;
      }
    }
    routes.push({ route: m[1], element, path: rel, line: i + 1 });
  });
  return routes;
}

export async function buildCodeIndex(root) {
  const files = await walk(root, { exts: CODE_EXTS, ignoreDirs: IGNORE_DIRS });
  const raw = [];

  for (const file of files) {
    let content;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    raw.push({ rel: relPosix(root, file), content });
  }

  const fileSet = new Set(raw.map((f) => f.rel));
  const indexed = [];
  const routes = [];

  for (const { rel, content } of raw) {
    const lang = LANG[extname(rel).toLowerCase()] || 'unknown';
    const lines = content.split(/\r?\n/);
    const category = categorize(rel);
    const symbols = [];
    const imports = [];
    const externals = [];
    const reexports = [];
    let jsx = false;

    lines.forEach((line, i) => {
      const ln = i + 1;

      // import / re-export
      const spec = extractSpecifier(line);
      if (spec) {
        const norm = normalizeSpecifier(rel, spec);
        if (norm === null) externals.push(spec.split('/').slice(0, spec.startsWith('@') ? 2 : 1).join('/'));
        else {
          const resolved = resolveModule(norm, fileSet);
          imports.push(resolved || norm);
          if (/^\s*export\s+/.test(line)) reexports.push(resolved || norm);
        }
        return; // import 줄에서는 심볼을 찾지 않는다
      }

      if (isCommentLine(line)) return;
      if (!jsx && /<[A-Z][\w.]*[\s/>]/.test(line)) jsx = true;

      const sym = matchSymbol(line, lang);
      if (sym) symbols.push({ kind: sym.kind, name: sym.name, line: ln, exported: sym.exported });
    });

    applyDeferredExports(lines, symbols);

    const importsU = uniq(imports);
    const externalsU = uniq(externals);
    const isBarrel = symbols.length === 0 && reexports.length > 0;

    // 순수성 휴리스틱: React/Jotai/DOM 비의존 + 부수효과 전역 미사용 + JSX 없음
    const pure =
      category !== 'test' &&
      !jsx &&
      !externalsU.some((p) => IMPURE_PACKAGES.test(p)) &&
      !SIDE_EFFECT_GLOBALS.test(content) &&
      !symbols.some((s) => s.kind === 'hook' || s.kind === 'atom' || s.kind === 'component');

    const entry = {
      path: rel,
      lang,
      category,
      loc: lines.length,
      pure,
      barrel: isBarrel,
      symbols,
      imports: importsU,
      externals: externalsU,
    };

    if (category === 'test') entry.cases = extractTestCases(lines);
    if (/^router\//.test(rel)) routes.push(...extractRoutes(rel, lines));

    indexed.push(entry);
  }

  // ---- 그래프: 역방향 의존(importedBy) ----
  const importedBy = {};
  for (const f of indexed) {
    for (const dep of f.imports) {
      if (!fileSet.has(dep)) continue;
      (importedBy[dep] ||= []).push(f.path);
    }
  }

  // ---- 배럴(index.ts) 관통: 테스트가 배럴을 타고 실제 모듈에 닿게 한다 ----
  const barrelTargets = new Map(indexed.filter((f) => f.barrel).map((f) => [f.path, f.imports.filter((p) => fileSet.has(p))]));
  const expand = (mod, depth = 0) => {
    if (depth > 2 || !barrelTargets.has(mod)) return [mod];
    return barrelTargets.get(mod).flatMap((m) => expand(m, depth + 1));
  };

  // ---- 테스트 커버리지 맵 ----
  const tests = indexed
    .filter((f) => f.category === 'test')
    .map((f) => ({
      path: f.path,
      targets: uniq(f.imports.filter((p) => fileSet.has(p)).flatMap((m) => expand(m))).filter((p) => !p.startsWith('test/')),
      cases: (f.cases || []).map((c) => c.title),
    }));

  const testedBy = {};
  for (const t of tests) for (const target of t.targets) (testedBy[target] ||= []).push(t.path);

  // ---- 종류별 색인(검색 CLI가 바로 쓴다) ----
  const collect = (kind) =>
    indexed.flatMap((f) =>
      f.symbols.filter((s) => s.kind === kind && s.exported).map((s) => ({ name: s.name, path: f.path, line: s.line, category: f.category }))
    );

  const components = collect('component');
  const hooks = collect('hook');
  const atoms = collect('atom');
  const pureFns = indexed
    .filter((f) => f.pure)
    .flatMap((f) =>
      f.symbols
        .filter((s) => s.exported && (s.kind === 'function' || s.kind === 'const'))
        .map((s) => ({ name: s.name, path: f.path, line: s.line, kind: s.kind, category: f.category }))
    );

  const symbolCount = indexed.reduce((a, f) => a + f.symbols.length, 0);
  const exportedCount = indexed.reduce((a, f) => a + f.symbols.filter((s) => s.exported).length, 0);
  const untested = indexed
    .filter((f) => !['test', 'tool'].includes(f.category) && !f.barrel && f.symbols.some((s) => s.exported) && !testedBy[f.path])
    .map((f) => f.path);

  return {
    kind: 'code',
    generatedAt: new Date().toISOString(),
    fileCount: indexed.length,
    symbolCount,
    exportedCount,
    routeCount: routes.length,
    componentCount: components.length,
    hookCount: hooks.length,
    atomCount: atoms.length,
    pureFileCount: indexed.filter((f) => f.pure).length,
    pureFnCount: pureFns.length,
    testCount: tests.length,
    files: indexed,
    routes,
    components,
    hooks,
    atoms,
    pureFns,
    tests,
    importedBy,
    testedBy,
    untested,
  };
}
