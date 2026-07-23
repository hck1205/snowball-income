#!/usr/bin/env node
// devstatus — 한 화면 개발 대시보드. (읽기 전용, 안전 — 아무것도 고치지 않는다)
//
//   node tools/dev/devstatus.mjs
//
// 보여주는 것:
//   · 현재 브랜치 + origin 대비 ahead/behind
//   · 미커밋 변경을 트랙별 파일 수로 요약 (tracks 로직 재사용)
//   · 로컬 브랜치 목록 + 워크트리 목록
//   · 인덱스(.index/code.json) 신선도 — 소스보다 얼마나 뒤졌나
//   · api 번들(api/*.js) 신선도 — server/handlers/ 와 일치하는지 (상태만; 고치지 않음)
//
// 모든 섹션은 실패해도 죽지 않고 "확인 불가"로 표기한다.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { checkApiBundle, git, paint, ROOT, trackMeta } from './trackConfig.mjs';
import { collectChanges, groupByTrack } from './tracks.mjs';

const ok = (s) => paint.green('✔ ' + s);
const warn = (s) => paint.yellow('⚠ ' + s);
const bad = (s) => paint.red('✗ ' + s);
const unknown = (s) => paint.gray('· ' + s);

/** 섹션 헤더 한 줄. */
function section(title) {
  console.log('');
  console.log(paint.bold(paint.cyan('━━ ' + title)));
}

/** 섹션 본문을 try 로 감싸 실패를 "확인 불가"로 흡수한다. */
function safe(title, fn) {
  section(title);
  try {
    fn();
  } catch (err) {
    console.log('  ' + unknown('확인 불가 — ' + (err && err.message ? err.message : String(err))));
  }
}

// ── 브랜치 + ahead/behind ────────────────────────────────────────────────────
function renderBranch() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  let line = '  ' + paint.bold(branch);

  const up = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { allowFail: true });
  if (up.status === 0 && up.stdout.trim()) {
    const upstream = up.stdout.trim();
    line += paint.dim('  →  ') + upstream;
    const lr = git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`], { allowFail: true });
    if (lr.status === 0) {
      const [behind, ahead] = lr.stdout.trim().split(/\s+/).map((n) => Number(n) || 0);
      const parts = [];
      parts.push(ahead > 0 ? paint.green(`ahead ${ahead}`) : paint.dim('ahead 0'));
      parts.push(behind > 0 ? paint.yellow(`behind ${behind}`) : paint.dim('behind 0'));
      line += '   (' + parts.join(paint.dim(' · ')) + ')';
    }
  } else {
    line += paint.dim('   (upstream 없음)');
  }
  console.log(line);
}

// ── 미커밋 변경: 트랙별 개수 ──────────────────────────────────────────────────
function renderChanges() {
  const { ok: good, reason, files } = collectChanges();
  if (!good) {
    console.log('  ' + unknown('확인 불가 — ' + reason));
    return;
  }
  if (!files.length) {
    console.log('  ' + ok('작업트리 깨끗함 (미커밋 변경 없음)'));
    return;
  }
  const grouped = groupByTrack(files);
  const staged = files.filter((f) => f.staged).length;
  const untracked = files.filter((f) => f.untracked).length;
  console.log(
    `  ${paint.bold(files.length + '개 변경')}  ${paint.dim(`(staged ${staged} · untracked ${untracked})`)}`
  );
  for (const [name, arr] of grouped) {
    if (!arr.length) continue;
    const meta = trackMeta(name);
    console.log(`    ${meta.emoji}  ${paint.cyan(name.padEnd(15))} ${String(arr.length).padStart(3)}개`);
  }
}

// ── 브랜치 목록 + 워크트리 ────────────────────────────────────────────────────
function renderBranchesAndWorktrees() {
  const br = git(['branch', '-vv'], { allowFail: true });
  if (br.status === 0) {
    const lines = br.stdout.split(/\r?\n/).filter((l) => l.trim());
    console.log('  ' + paint.dim(`로컬 브랜치 ${lines.length}개`));
    for (const l of lines) {
      // git branch -vv 는 2칸 마커로 시작한다: `* `(현재) / `+ `(다른 워크트리) / `  `(그 외).
      const marker = l[0];
      const current = marker === '*';
      const inWorktree = marker === '+';
      const body = l.slice(2);
      // "name  <sha> [upstream: ahead N] msg" → 이름 + 추적정보만 간추린다.
      const m = body.match(/^(\S+)\s+([0-9a-f]+)\s+(\[[^\]]*\]\s*)?(.*)$/i);
      const name = m ? m[1] : body.trim();
      const track = m && m[3] ? m[3].trim() : '';
      const bullet = current ? paint.green('●') : inWorktree ? paint.blue('◆') : paint.dim('○');
      const label = current ? paint.bold(name) : name;
      const suffix = inWorktree ? paint.dim(' (다른 워크트리)') : '';
      console.log(`    ${bullet} ${label}${track ? '  ' + paint.dim(track) : ''}${suffix}`);
    }
  } else {
    console.log('  ' + unknown('브랜치 목록 확인 불가'));
  }

  const wt = git(['worktree', 'list'], { allowFail: true });
  if (wt.status === 0) {
    const lines = wt.stdout.split(/\r?\n/).filter((l) => l.trim());
    console.log('  ' + paint.dim(`워크트리 ${lines.length}개`));
    for (const l of lines) {
      const m = l.match(/^(\S+)\s+([0-9a-f]+)\s+(.*)$/i);
      if (!m) {
        console.log('    ' + l);
        continue;
      }
      const [, path, , rest] = m;
      console.log(`    ${paint.dim('•')} ${rest.padEnd(34)} ${paint.dim(path)}`);
    }
  } else {
    console.log('  ' + unknown('워크트리 목록 확인 불가'));
  }
}

// ── 인덱스 신선도 ─────────────────────────────────────────────────────────────
const SOURCE_DIRS = ['shared', 'pages', 'components', 'jotai'];
const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const WALK_IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.index', '.codegraph']);

/** dir 하위(재귀)에서 소스 파일의 가장 최신 mtimeMs 를 찾는다. */
function newestMtime(dir) {
  let newest = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0; // 없는 폴더는 0
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (WALK_IGNORE.has(e.name) || e.name.startsWith('.')) continue;
      newest = Math.max(newest, newestMtime(join(dir, e.name)));
    } else if (e.isFile() && SOURCE_EXTS.some((x) => e.name.endsWith(x))) {
      try {
        newest = Math.max(newest, statSync(join(dir, e.name)).mtimeMs);
      } catch {
        /* 개별 파일 stat 실패는 무시 */
      }
    }
  }
  return newest;
}

function renderIndexFreshness() {
  let indexMtime;
  try {
    indexMtime = statSync(join(ROOT, '.index', 'code.json')).mtimeMs;
  } catch {
    console.log('  ' + warn('.index/code.json 없음') + paint.dim('  → npm run index'));
    return;
  }
  let newestSrc = 0;
  for (const d of SOURCE_DIRS) newestSrc = Math.max(newestSrc, newestMtime(join(ROOT, d)));
  if (newestSrc === 0) {
    console.log('  ' + unknown('소스 mtime 확인 불가'));
    return;
  }
  const behindMin = Math.round((newestSrc - indexMtime) / 60000);
  if (newestSrc > indexMtime) {
    console.log('  ' + warn(`stale — 소스가 인덱스보다 ${behindMin}분 앞섬`) + paint.dim('  → npm run index'));
  } else {
    console.log('  ' + ok('fresh — .index/code.json 이 소스보다 최신'));
  }
}

// ── api 번들 신선도 (node tools/apiBundle/build.mjs --check) ───────────────────
function renderApiFreshness() {
  const r = checkApiBundle();
  if (r.status === 'ok') {
    console.log('  ' + ok(r.detail));
  } else if (r.status === 'stale') {
    console.log('  ' + bad('stale — api 번들이 소스와 어긋남') + paint.dim('  → npm run api:bundle'));
    for (const s of r.stale || []) console.log('      ' + paint.red('· ' + s));
  } else if (r.status === 'error') {
    // 드리프트가 아니라 빌드 자체가 깨진 경우(예: 워크트리에 node_modules 없음). 상태만 알린다.
    console.log('  ' + warn('api:check 실패 — 드리프트가 아닌 빌드 에러로 보임 (확인 불가)'));
    console.log('      ' + paint.dim(r.detail));
  } else {
    console.log('  ' + unknown('확인 불가 — ' + r.detail));
  }
}

function main() {
  console.log('');
  console.log(paint.bold('devstatus') + paint.dim('  ·  snowball-income 개발 대시보드'));

  safe('브랜치', renderBranch);
  safe('미커밋 변경 (트랙별)', renderChanges);
  safe('브랜치 · 워크트리', renderBranchesAndWorktrees);
  safe('인덱스 신선도', renderIndexFreshness);
  safe('api 번들 신선도', renderApiFreshness);

  console.log('');
}

main();
