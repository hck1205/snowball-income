#!/usr/bin/env node
// predeploy — "특정 트랙의 변경만으로 격리 빌드가 그린인지" 검증 + api 번들 드리프트 진단.
//
//   node tools/dev/predeploy.mjs <track>          # dry-run: 대상 파일 + 검증 계획만 출력(안전)
//   node tools/dev/predeploy.mjs <track> --run     # 실제 격리 빌드 (임시 워크트리에서)
//
// ⚠⚠ 안전 최우선 — 라이브 작업트리를 절대 변형하지 않는다 ⚠⚠
//   · git stash 를 절대 쓰지 않는다(에러 시 미커밋 변경 유실 위험).
//   · --run 은 **임시 git worktree**(HEAD 에서 detach)를 따로 만들고, 현재 트리의 "해당 트랙 변경만"
//     그 워크트리에 반영해 거기서 빌드한다. 라이브 트리는 git diff/파일 복사로 **읽기만** 한다.
//   · 어느 단계에서 실패하든 finally 에서 임시 워크트리를 반드시 정리한다. node_modules 링크는
//     **재귀 삭제로 대상(실제 node_modules)에 닿지 않도록** 링크만 먼저 끊고 정리한다.
//
// 완전 격리 여부: 임시 워크트리는 HEAD 전체 + 이 트랙의 미커밋 변경만 담는다. 즉 "이 트랙만 배포하면
//   빌드가 서는가"를 재현한다. node_modules 는 실 저장소 것을 정션/심링크로 참조한다(설치 시간 0).

import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { checkApiBundle, git, isTrackName, paint, ROOT, run, trackMeta, TRACK_NAMES } from './trackConfig.mjs';
import { collectChanges } from './tracks.mjs';
import { API_BUNDLES } from '../apiBundle/manifest.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { track: null, run: false, help: false };
  for (const a of argv) {
    if (a === '--run') opts.run = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (!a.startsWith('-') && !opts.track) opts.track = a;
  }
  return opts;
}

const USAGE = `predeploy — 트랙 격리 빌드 검증 + api 번들 드리프트 진단

사용법:
  node tools/dev/predeploy.mjs <track>          # dry-run(기본, 안전): 대상 파일 + 검증 계획
  node tools/dev/predeploy.mjs <track> --run     # 실제 격리 빌드(임시 워크트리)

트랙: ${TRACK_NAMES.join(', ')}

안전: --run 도 라이브 작업트리를 변형하지 않는다. 임시 워크트리에서만 빌드하고, 끝나면 정리한다.`;

// ─────────────────────────────────────────────────────────────────────────────
// api 번들 드리프트 진단 (읽기 전용 — api:check 만 돌리고, api:bundle 은 "제안"만)
// ─────────────────────────────────────────────────────────────────────────────
function diagnoseApiBundle() {
  console.log('');
  console.log(paint.bold(paint.cyan('━━ api 번들 드리프트')));
  const r = checkApiBundle();
  if (r.status === 'ok') {
    console.log('  ' + paint.green('✔ ' + r.detail));
    return;
  }
  if (r.status === 'unavailable') {
    console.log('  ' + paint.gray('· 확인 불가 — api:check 실행 실패 (' + r.detail + ')'));
    return;
  }
  if (r.status === 'error') {
    // 산출물 드리프트가 아니라 빌드 자체가 깨진 경우(예: 워크트리에 node_modules 없음).
    console.log('  ' + paint.yellow('⚠ api:check 실패 — 드리프트가 아닌 빌드 에러로 보임 (확인 불가)'));
    console.log('      ' + paint.dim(r.detail));
    return;
  }
  // status === 'stale' — 낡은 산출물을 소스 핸들러로 매핑해 안내한다.
  console.log('  ' + paint.red('✗ api 번들이 server/handlers/ 소스와 어긋남'));
  for (const out of r.stale || []) {
    const bundle = API_BUNDLES.find((b) => b.out === out);
    const src = bundle ? bundle.entry : '(소스 매핑 불명)';
    console.log(`      ${paint.red('· ' + out)}  ${paint.dim('←  ' + src)}`);
  }
  console.log('  ' + paint.yellow('제안: ') + paint.bold('npm run api:bundle') + paint.dim('  후 바뀐 api/*.js 를 함께 커밋'));
  console.log('  ' + paint.dim('(predeploy 는 안내만 한다 — api:bundle 을 직접 실행하지 않는다)'));
}

// ─────────────────────────────────────────────────────────────────────────────
// --run: 임시 워크트리 격리 빌드
// ─────────────────────────────────────────────────────────────────────────────

/** ROOT 에서 위로 올라가며 node_modules 를 가진 첫 디렉터리를 찾는다(링크드 워크트리 대응). */
function findNodeModulesRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'node_modules'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * node_modules 링크를 **안전하게** 제거한다. 절대 재귀 삭제하지 않는다 — 링크만 끊어
 * 대상(실제 node_modules)에는 손대지 않는다.
 */
function removeNodeModulesLink(linkPath) {
  let st;
  try {
    st = lstatSync(linkPath);
  } catch {
    return; // 없으면 끝
  }
  try {
    if (st.isSymbolicLink()) unlinkSync(linkPath); // 심링크/정션(Windows) — 링크 엔트리만 제거
    else if (st.isDirectory()) rmdirSync(linkPath); // 방어적: 비어있을 때만 지워짐(내용 있으면 throw → 대상 무손상)
    else unlinkSync(linkPath);
  } catch (err) {
    console.log('  ' + paint.yellow('⚠ node_modules 링크 정리 실패(무해) — 수동 확인: ' + linkPath));
  }
}

/**
 * 임시 워크트리를 반드시 정리한다. **순서가 안전의 핵심**:
 *   ① node_modules 링크(정션/심링크)를 먼저 끊는다 — 그래야 이후 재귀 삭제가 실제 node_modules 에 닿지 못한다.
 *   ② git worktree remove --force + prune 으로 워크트리 등록 해제.
 *   ③ 그래도 남은 임시 디렉터리를 재귀 삭제(이 시점엔 링크가 없어 라이브 트리에 무해).
 * @param {string|null} tmpBase mkdtemp 로 만든 최상위 임시 디렉터리
 * @param {string|null} wt      그 하위의 실제 워크트리 경로(node_modules 링크가 여기 있다)
 */
function cleanupWorktree(tmpBase, wt) {
  if (wt) {
    removeNodeModulesLink(join(wt, 'node_modules')); // ① 재귀 삭제 전에 링크부터 끊는다(핵심 안전장치)
    git(['worktree', 'remove', '--force', wt], { allowFail: true }); // ②
    git(['worktree', 'prune'], { allowFail: true });
  }
  if (tmpBase && existsSync(tmpBase)) {
    try {
      rmSync(tmpBase, { recursive: true, force: true }); // ③ 링크가 이미 끊겼으므로 라이브 node_modules 에 닿지 않는다
    } catch {
      console.log('  ' + paint.yellow('⚠ 임시 디렉터리 잔여 — 수동 삭제 필요: ' + tmpBase));
    }
  }
}

/** node 로 로컬 패키지의 JS 엔트리를 직접 실행한다(.bin/npx 셸 의존 회피, 크로스플랫폼). */
function runNodeBin(entryAbs, args, cwd) {
  if (!existsSync(entryAbs)) return { ok: false, missing: true, tail: `엔트리 없음: ${entryAbs}` };
  const res = run(process.execPath, [entryAbs, ...args], { cwd });
  const outText = `${res.stdout || ''}${res.stderr || ''}`;
  const tail = outText.split(/\r?\n/).slice(-30).join('\n');
  return { ok: res.status === 0, code: res.status, tail };
}

function runIsolatedBuild(track, files) {
  const tracked = files.filter((f) => !f.untracked).map((f) => f.path);
  const untracked = files.filter((f) => f.untracked).map((f) => f.path);

  console.log('');
  console.log(paint.bold(paint.cyan('━━ 격리 빌드 (--run)')));

  const nmRoot = findNodeModulesRoot(ROOT);
  if (!nmRoot) {
    console.log('  ' + paint.red('✗ node_modules 를 찾지 못해 격리 빌드를 진행할 수 없습니다. npm install 후 재시도.'));
    return 1;
  }

  let tmp = null;
  let wt = null;
  let failed = false;
  try {
    // 1) HEAD 에서 detach 한 임시 워크트리 생성
    tmp = mkdtempSync(join(tmpdir(), `predeploy-${track}-`));
    // mkdtemp 로 만든 빈 디렉터리는 git worktree add 가 싫어할 수 있어, 실제 워크트리는 그 하위에 만든다.
    wt = join(tmp, 'wt');
    const add = git(['worktree', 'add', '--detach', wt, 'HEAD'], { allowFail: true });
    if (add.status !== 0) {
      console.log('  ' + paint.red('✗ 임시 워크트리 생성 실패: ' + String(add.stderr || '').trim()));
      return 1;
    }
    console.log('  ' + paint.dim('임시 워크트리: ' + wt));

    // 2) node_modules 를 실 저장소 것으로 링크(정션/심링크) — 설치 없이 의존성 해결
    try {
      symlinkSync(join(nmRoot, 'node_modules'), join(wt, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
      console.log('  ' + paint.dim('node_modules ← ' + join(nmRoot, 'node_modules') + ' (링크)'));
    } catch (err) {
      console.log('  ' + paint.yellow('⚠ node_modules 링크 실패 — 빌드가 의존성을 못 찾을 수 있음: ' + err.message));
    }

    // 3) 트랙의 "추적 파일 변경"을 패치로 뽑아 적용(git diff HEAD → git apply). 라이브 트리는 읽기만.
    if (tracked.length) {
      const diff = git(['diff', 'HEAD', '--', ...tracked], { allowFail: true });
      const patch = String(diff.stdout || '');
      if (patch.trim()) {
        const patchFile = join(tmp, 'track.patch');
        writeFileSync(patchFile, patch);
        const applied = git(['apply', '--whitespace=nowarn', patchFile], { cwd: wt, allowFail: true });
        if (applied.status !== 0) {
          console.log('  ' + paint.red('✗ 트랙 패치 적용 실패 — 격리 재현 불가: ' + String(applied.stderr || '').trim()));
          failed = true;
        } else {
          console.log('  ' + paint.dim(`패치 적용: 추적 파일 ${tracked.length}개`));
        }
      }
    }

    // 4) 트랙의 untracked 파일/폴더 복사(라이브 → 임시). 라이브는 읽기만.
    for (const rel of untracked) {
      const srcAbs = join(ROOT, rel);
      const destAbs = join(wt, rel);
      try {
        mkdirSync(dirname(destAbs), { recursive: true });
        cpSync(srcAbs, destAbs, { recursive: true });
      } catch (err) {
        console.log('  ' + paint.yellow('⚠ untracked 복사 실패(' + rel + '): ' + err.message));
      }
    }
    if (untracked.length) console.log('  ' + paint.dim(`untracked 복사: ${untracked.length}개`));

    if (failed) return 1;

    // 5) 격리 빌드: tsc -b → vite build (로컬 패키지 JS 엔트리를 node 로 직접 실행)
    console.log('');
    console.log('  ' + paint.bold('빌드 실행…') + paint.dim(' (tsc -b tsconfig.build.json → vite build)'));

    const tscEntry = join(nmRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    const tsc = runNodeBin(tscEntry, ['-b', 'tsconfig.build.json'], wt);
    console.log('  ' + (tsc.ok ? paint.green('✔ tsc 통과') : paint.red('✗ tsc 실패')));
    if (!tsc.ok) {
      console.log(paint.dim(indent(tsc.tail)));
      failed = true;
    }

    if (!failed) {
      const viteEntry = join(nmRoot, 'node_modules', 'vite', 'bin', 'vite.js');
      const vite = runNodeBin(viteEntry, ['build'], wt);
      console.log('  ' + (vite.ok ? paint.green('✔ vite build 통과') : paint.red('✗ vite build 실패')));
      if (!vite.ok) {
        console.log(paint.dim(indent(vite.tail)));
        failed = true;
      }
    }

    console.log('');
    console.log('  ' + (failed ? paint.red(paint.bold('격리 빌드 실패')) : paint.green(paint.bold('격리 빌드 그린 ✔'))));
    return failed ? 1 : 0;
  } catch (err) {
    console.log('  ' + paint.red('✗ 격리 빌드 중 예외: ' + (err && err.message ? err.message : String(err))));
    return 1;
  } finally {
    // 어떤 경로로 빠져나가든 임시 워크트리를 반드시 정리한다. 라이브 트리는 무손상.
    cleanupWorktree(tmp, wt);
    console.log('  ' + paint.dim('임시 워크트리 정리 완료 — 라이브 작업트리 무손상.'));
  }
}

function indent(text, pad = '      ') {
  return text
    .split(/\r?\n/)
    .map((l) => pad + l)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// dry-run 계획 출력
// ─────────────────────────────────────────────────────────────────────────────
function printPlan(track, files) {
  const meta = trackMeta(track);
  console.log('');
  console.log(paint.bold(`${meta.emoji}  predeploy · ${paint.cyan(track)}`) + paint.dim('  · ' + meta.label));

  console.log('');
  console.log(paint.bold(paint.cyan('━━ 이 트랙의 미커밋 변경')));
  if (!files.length) {
    console.log('  ' + paint.dim('(없음 — 이 트랙에 걸리는 미커밋 변경이 없습니다)'));
  } else {
    for (const f of files) {
      const tag = f.untracked ? paint.magenta('untracked') : [f.staged && 'staged', f.unstaged && 'unstaged'].filter(Boolean).join('+');
      console.log(`   ${paint.gray(f.code)} ${f.path.padEnd(60)} ${paint.dim(tag)}`);
    }
    console.log('  ' + paint.dim(`합계 ${files.length}개`));
  }

  console.log('');
  console.log(paint.bold(paint.cyan('━━ 격리 검증 계획 (--run 시 수행)')));
  const steps = [
    '임시 git worktree 를 HEAD 에서 detach 로 생성(라이브 트리와 분리)',
    'node_modules 를 실 저장소 것으로 링크(정션/심링크, 설치 0초)',
    `이 트랙의 추적 파일 변경만 git diff HEAD → git apply 로 반영`,
    '이 트랙의 untracked 파일만 복사',
    'npx 없이 node 로 tsc -b tsconfig.build.json → vite build 실행',
    '결과 보고 후 임시 워크트리 제거(git worktree remove --force + prune)',
  ];
  steps.forEach((s, i) => console.log(`   ${paint.dim((i + 1) + '.')} ${s}`));
  console.log('  ' + paint.green('안전: ') + paint.dim('라이브 작업트리는 git diff/파일복사로 읽기만 — stash·add·checkout 없음.'));
}

// ─────────────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.track) {
    console.log(USAGE);
    process.exit(opts.help ? 0 : 2);
  }
  if (!isTrackName(opts.track)) {
    console.error(paint.red(`[predeploy] 알 수 없는 트랙: ${opts.track}`));
    console.error(`            가능한 값: ${TRACK_NAMES.join(', ')}`);
    process.exit(2);
  }

  const changes = collectChanges();
  if (!changes.ok) {
    console.error(paint.yellow('[predeploy] 변경을 읽을 수 없습니다: ' + changes.reason));
    // 변경을 못 읽어도 api 진단은 시도한다(읽기 전용).
  }
  const files = (changes.files || []).filter((f) => f.track === opts.track);

  printPlan(opts.track, files);

  let buildExit = 0;
  if (opts.run) {
    buildExit = await runIsolatedBuild(opts.track, files);
  } else {
    console.log('');
    console.log('  ' + paint.yellow('dry-run') + paint.dim(' — 실제 격리 빌드는 ') + paint.bold('--run') + paint.dim(' 을 붙여 실행하세요.'));
  }

  diagnoseApiBundle();

  console.log('');
  process.exit(buildExit);
}

main().catch((err) => {
  console.error(paint.red('[predeploy] 실패: ' + (err && err.stack ? err.stack : err)));
  process.exit(1);
});
