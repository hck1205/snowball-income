#!/usr/bin/env node
// 인덱스 1차 검색 CLI — 원문을 읽기 전에 여기서 위치(path:line)를 찾는다(토큰 절약).
//
//   npm run search -- kind:code atom          # 어느 셸에서든 안전한 형태(권장)
//   npm run search -- --kind code atom        # bash / 직접 node 실행에서 동작
//   npm run search -- file:shared/lib/snowball/SnowballSimulation.ts
//
// kind: all(기본) | code | docs | 심볼종류(component|hook|atom|pure|function|const|type|route|test)
//
// ⚠ Windows PowerShell에서 `npm run`은 `--kind`,`--limit` 같은 플래그를 npm 자신의 설정으로
//   먹어버리고(값만 argv에 남는다) 스크립트까지 오지 않는다. 그래서 `kind:` / `limit:` 콜론 형태를
//   1순위로 지원하고, 플래그가 먹힌 경우엔 조용히 틀린 결과를 내는 대신 에러로 알린다.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', '..', '.index');

const SYMBOL_KINDS = ['component', 'hook', 'atom', 'function', 'const', 'type', 'interface', 'enum', 'class', 'styled', 'pure', 'route', 'test'];

/** npm이 `--flag value` 를 삼켰는지 감지 (npm_config_<flag> === 'true') */
function swallowedByNpm(name) {
  return process.env[`npm_config_${name}`] === 'true';
}
/** npm이 `--flag=value` 로 넘긴 값 (이 형태는 값이 보존된다) */
function fromNpmEnv(name) {
  const v = process.env[`npm_config_${name}`];
  return v && v !== 'true' ? v : null;
}

function parseArgs(argv) {
  const opts = { kind: 'all', limit: 15, json: false, file: null, terms: [] };

  // 1) npm이 `--kind=code` 형태로 넘긴 값 회수
  const envKind = fromNpmEnv('kind');
  const envLimit = fromNpmEnv('limit');
  const envFile = fromNpmEnv('file');
  if (envKind) opts.kind = envKind.toLowerCase();
  if (envLimit) opts.limit = Number(envLimit) || 15;
  if (envFile) opts.file = envFile;
  if (process.env.npm_config_json === 'true') opts.json = true;

  // 2) argv 파싱 — 플래그 형태와 콜론 형태를 모두 받는다
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kind') opts.kind = String(argv[++i] || 'all').toLowerCase();
    else if (a === '--limit') opts.limit = Number(argv[++i]) || 15;
    else if (a === '--file') opts.file = argv[++i];
    else if (a === '--json' || a === 'json') opts.json = true;
    else if (a.startsWith('--kind=')) opts.kind = a.slice(7).toLowerCase();
    else if (a.startsWith('--limit=')) opts.limit = Number(a.slice(8)) || 15;
    else if (a.startsWith('--file=')) opts.file = a.slice(7);
    else if (a.startsWith('kind:')) opts.kind = a.slice(5).toLowerCase();
    else if (a.startsWith('limit:')) opts.limit = Number(a.slice(6)) || 15;
    else if (a.startsWith('file:')) opts.file = a.slice(5);
    else if (a.startsWith('--')) continue; // 알 수 없는 플래그 무시
    else opts.terms.push(a);
  }

  // 3) npm이 `--kind code` 를 삼킨 경우 — 값("code")만 argv에 남아 검색어를 오염시킨다.
  //    조용히 틀린 결과를 주느니 어떻게 고칠지 알려주고 멈춘다.
  const swallowed = ['kind', 'limit', 'file'].filter(swallowedByNpm);
  if (swallowed.length) {
    console.error(
      `[search] npm이 \`--${swallowed[0]}\` 플래그를 삼켰습니다 (Windows PowerShell + npm의 알려진 동작).\n` +
        `         콜론 형태로 다시 실행하세요:  npm run search -- ${swallowed.map((n) => `${n}:<값>`).join(' ')} <검색어>\n` +
        `         예)  npm run search -- kind:code atom\n` +
        `         또는 node를 직접 실행:  node tools/indexer/search.mjs --${swallowed[0]} <값> <검색어>`
    );
    process.exit(2);
  }

  return opts;
}

async function load(name) {
  try {
    return JSON.parse(await readFile(`${OUT}/${name}`, 'utf8'));
  } catch {
    return null;
  }
}

/** 텍스트 필드 가중 점수. 완전일치 > 접두사 > 부분일치 */
function score(terms, fields) {
  let total = 0;
  for (const t of terms) {
    for (const f of fields) {
      if (!f.text) continue;
      const text = String(f.text).toLowerCase();
      if (text === t) total += f.weight * 3;
      else if (text.startsWith(t)) total += f.weight * 2;
      else if (text.includes(t)) total += f.weight;
    }
  }
  return total;
}

function missingIndex() {
  console.error('[search] .index가 없습니다. 먼저 `npm run index`를 실행하세요.');
  process.exit(1);
}

// ---------- 파일 카드 ----------
async function printFileCard(target, json) {
  const code = await load('code.json');
  const docs = await load('docs.json');
  if (!code) missingIndex();

  const norm = target.replace(/^@\//, '').replace(/\\/g, '/');
  const file = code.files.find((f) => f.path === norm) || code.files.find((f) => f.path.includes(norm));
  if (!file) {
    console.log(`(파일을 인덱스에서 찾지 못함: ${target})`);
    return;
  }

  const card = {
    path: file.path,
    category: file.category,
    lang: file.lang,
    loc: file.loc,
    pure: file.pure,
    barrel: file.barrel,
    symbols: file.symbols.filter((s) => s.exported).map((s) => ({ ...s, at: `${file.path}:${s.line}` })),
    imports: file.imports,
    externals: file.externals,
    importedBy: code.importedBy[file.path] || [],
    testedBy: code.testedBy[file.path] || [],
    documentedBy: (docs && docs.documentedBy[file.path]) || [],
  };

  if (json) {
    console.log(JSON.stringify(card));
    return;
  }

  console.log(`\n${card.path}  (${card.category}${card.pure ? ' · pure' : ''}${card.barrel ? ' · barrel' : ''}, ${card.loc} lines)\n`);
  if (card.symbols.length) {
    console.log('exports:');
    for (const s of card.symbols) console.log(`  ${s.at.padEnd(56)} ${s.name}  (${s.kind})`);
  }
  const list = (label, arr) => {
    if (arr.length) console.log(`\n${label} (${arr.length}):\n${arr.map((x) => '  ' + x).join('\n')}`);
  };
  list('imports (내부)', card.imports);
  list('imports (외부)', card.externals);
  list('importedBy — 이 파일을 쓰는 곳', card.importedBy);
  list('testedBy', card.testedBy);
  list('documentedBy', card.documentedBy);
  if (!card.testedBy.length && card.category !== 'test') console.log('\n⚠ 이 파일을 직접 import 하는 테스트가 없습니다.');
  console.log('');
}

// ---------- 검색 ----------
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.file) return printFileCard(opts.file, opts.json);

  const terms = opts.terms.map((t) => t.toLowerCase()).filter(Boolean);
  if (!terms.length) {
    console.error('사용법: npm run search -- [kind:code|docs|component|hook|atom|pure|route|test] [limit:N] [json] <검색어...>');
    console.error('        npm run search -- file:<경로>     # 파일 카드(심볼/의존/역의존/테스트/문서)');
    console.error('        예)  npm run search -- runSimulation');
    console.error('             npm run search -- kind:pure allocation');
    console.error('        (bash/직접 node 실행은 --kind, --limit, --json 플래그도 받는다)');
    process.exit(2);
  }

  const kind = opts.kind;
  const wantCode = kind === 'all' || kind === 'code' || SYMBOL_KINDS.includes(kind);
  const wantDocs = kind === 'all' || kind === 'docs';
  const symbolFilter = SYMBOL_KINDS.includes(kind) && !['pure', 'route', 'test'].includes(kind) ? kind : null;

  const results = [];

  if (wantCode) {
    const code = await load('code.json');
    if (!code) missingIndex();

    // 순수 함수 전용 검색
    if (kind === 'pure') {
      for (const fn of code.pureFns) {
        const s = score(terms, [
          { text: fn.name, weight: 6 },
          { text: fn.path, weight: 2 },
          { text: fn.category, weight: 1 },
        ]);
        if (s > 0) results.push({ score: s, kind: 'pure', path: `${fn.path}:${fn.line}`, label: fn.name, meta: `pure ${fn.kind} · ${fn.category}` });
      }
    } else if (kind === 'test') {
      for (const t of code.tests) {
        for (const c of t.cases) {
          const s = score(terms, [
            { text: c, weight: 4 },
            { text: t.path, weight: 2 },
            { text: t.targets.join(' '), weight: 2 },
          ]);
          if (s > 0) results.push({ score: s, kind: 'test', path: t.path, label: c, meta: `tests: ${t.targets.slice(0, 2).join(', ') || '?'}` });
        }
      }
    } else if (kind !== 'route') {
      for (const f of code.files) {
        if (symbolFilter && f.symbols.every((s) => s.kind !== symbolFilter)) continue;
        for (const sym of f.symbols) {
          if (symbolFilter && sym.kind !== symbolFilter) continue;
          const s = score(terms, [
            { text: sym.name, weight: 6 },
            { text: sym.kind, weight: 2 },
            { text: f.path, weight: 2 },
            { text: f.category, weight: 1 },
          ]);
          if (s > 0) {
            // Emotion styled 컴포넌트는 대개 찾는 대상이 아니다 — 명시적으로 --kind styled 일 때만 제값을 준다.
            const weight = sym.kind === 'styled' && symbolFilter !== 'styled' ? 0.25 : 1;
            results.push({
              score: (s + (sym.exported ? 1 : 0) + (f.pure ? 0.5 : 0)) * weight,
              kind: 'code',
              path: `${f.path}:${sym.line}`,
              label: sym.name,
              meta: `${sym.kind}${sym.exported ? '' : ' (local)'} · ${f.category}${f.pure ? ' · pure' : ''}`,
            });
          }
        }
      }
    }

    // 라우트 (kind=all|code|route)
    if (kind === 'all' || kind === 'code' || kind === 'route') {
      for (const r of code.routes) {
        const s = score(terms, [
          { text: r.route, weight: 5 },
          { text: r.element, weight: 4 },
          { text: r.path, weight: 1 },
        ]);
        if (s > 0) results.push({ score: s, kind: 'route', path: `${r.path}:${r.line}`, label: `${r.route} → <${r.element}>`, meta: 'route' });
      }
    }
  }

  if (wantDocs) {
    const docs = await load('docs.json');
    if (docs) {
      for (const d of docs.docs) {
        const s = score(terms, [
          { text: d.title, weight: 5 },
          { text: d.tags.join(' '), weight: 3 },
          { text: d.headings.join(' '), weight: 3 },
          { text: (d.terms || []).join(' '), weight: 3 }, // 문서가 언급하는 심볼
          { text: d.summary, weight: 2 },
          { text: d.path, weight: 2 },
          { text: d.codeRefs.join(' '), weight: 1 },
        ]);
        if (s > 0) results.push({ score: s, kind: 'docs', path: d.path, label: d.title, meta: `${d.type}${d.summary ? ' · ' + d.summary.slice(0, 60) : ''}` });
      }
    }
  }

  results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const top = results.slice(0, opts.limit);

  if (opts.json) {
    console.log(JSON.stringify(top));
    return;
  }
  if (!top.length) {
    console.log('(검색 결과 없음)  — 다른 어휘로, 또는 kind: 필터를 빼고 다시 시도하세요.');
    return;
  }
  const tag = { code: '[code] ', docs: '[docs] ', route: '[route]', pure: '[pure] ', test: '[test] ' };
  for (const r of top) console.log(`${tag[r.kind]} ${r.path.padEnd(58)} ${r.label}  (${r.meta})`);
  if (results.length > top.length) console.log(`… ${results.length - top.length}건 더 (--limit ${results.length})`);
}

main().catch((err) => {
  console.error('[search] 실패:', err);
  process.exit(1);
});
