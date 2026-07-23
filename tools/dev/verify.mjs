#!/usr/bin/env node
// verify — 배포 전 통합 검증 게이트. **fail-fast 5단계**를 순서대로 돌려, 하나라도 깨지면
// 거기서 멈추고 비0 exit 한다. `ship` 스킬(T4)과 `refresh-data`·`new-ticker-page` 도메인 스킬이
// "격리 빌드 그린"을 확인하는 단일 진입점이다.
//
//   node tools/dev/verify.mjs              # 전체 5단계
//   node tools/dev/verify.mjs --no-test    # 테스트 건너뛰기(빠른 타입·빌드 확인)
//   node tools/dev/verify.mjs --no-build   # vite build 건너뛰기
//   node tools/dev/verify.mjs --no-api     # api 번들/체크 건너뛰기(server/handlers 무변경일 때)
//   node tools/dev/verify.mjs --plan       # 실행 없이 단계 계획만(dry-run)
//
// ## 단계 (순서 = fail-fast 순서)
//   ① tsc -b tsconfig.build.json                 전체 타입체크(app+scripts+api, noUnusedLocals/Params)
//   ② vitest run --exclude "**/.claude/**"       테스트 — .claude/ 제외로 worktree 중복 유령실패 차단
//   ③ node tools/apiBundle/build.mjs             api/*.js 재생성(server/handlers 소스가 marketData 등을 임베드)
//   ④ node tools/apiBundle/build.mjs --check     재생성 결과가 커밋본과 일치(드리프트 0)인지 확인
//   ⑤ vite build                                 프로덕션 번들
//
// ## 설계 원칙 (tools/indexer·tools/dev 관례)
//   · 순수 Node ESM, **외부 의존성 0** — `node:` 빌트인만. standalone(다른 dev CLI에 의존하지 않는다).
//   · npm/셸을 거치지 않고 **node 로 로컬 패키지 JS 엔트리를 직접 실행**한다(npm.cmd/셸 의존·인젝션 회피,
//     크로스플랫폼). node_modules 는 위로 올라가며 찾으므로 링크드 워크트리(정션)에서도 그대로 돈다.
//   · 라이브 작업트리에서 **제자리로** 돈다(predeploy 의 임시 워크트리 격리와 다르다) — ③이 api/*.js 를
//     실제로 갱신하므로, 바뀌면 스테이징 대상이다(끝에 안내). 라이브 트리를 stash/checkout 하지는 않는다.
//
// 진화: 이 절차가 현실과 어긋나거나 더 나은 길이 보이면 .claude/knowledge/retro.md 에 근거를 남기고
//       이 파일과 dev-process 마스터 스킬을 고쳐라. 프로세스는 살아있다.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 저장소 루트(절대경로). tools/dev/verify.mjs → 두 단계 위. */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// 최소 ANSI 컬러 (NO_COLOR 존중 · FORCE_COLOR 강제 · 그 외 TTY 일 때만). 파이프 시 무채색.
// ─────────────────────────────────────────────────────────────────────────────
const USE_COLOR = process.env.NO_COLOR ? false : process.env.FORCE_COLOR ? true : !!process.stdout.isTTY;
const wrap = (open, close) => (s) => (USE_COLOR ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));
const paint = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

// ─────────────────────────────────────────────────────────────────────────────
// 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { test: true, build: true, api: true, plan: false, help: false };
  for (const a of argv) {
    if (a === '--no-test') opts.test = false;
    else if (a === '--no-build') opts.build = false;
    else if (a === '--no-api') opts.api = false;
    else if (a === '--plan' || a === '-n' || a === '--dry-run') opts.plan = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else {
      console.error(paint.red(`[verify] 알 수 없는 인자: ${a}`));
      console.error(USAGE);
      process.exit(2);
    }
  }
  return opts;
}

const USAGE = `verify — 배포 전 통합 검증 게이트(fail-fast 5단계)

사용법:
  node tools/dev/verify.mjs [옵션]

옵션:
  --no-test     ② vitest 를 건너뛴다
  --no-build    ⑤ vite build 를 건너뛴다
  --no-api      ③④ api 번들/체크를 건너뛴다(server/handlers 무변경일 때)
  --plan, -n    실행하지 않고 단계 계획만 출력(dry-run)
  -h, --help    이 도움말

단계: ① tsc → ② vitest → ③ api:bundle → ④ api:check → ⑤ vite build
첫 실패에서 멈추고 비0 exit. 통과하면 마지막에 요약.`;

// ─────────────────────────────────────────────────────────────────────────────
// node_modules 루트 탐색 — 위로 올라가며 첫 node_modules 를 가진 디렉터리를 찾는다.
// (링크드 워크트리는 자기 아래에 정션/심링크로 node_modules 를 갖는다.)
// ─────────────────────────────────────────────────────────────────────────────
function findNodeModulesRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'node_modules'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 단계 정의 — 각 단계는 `node <entry> <args>` 로 실행된다(npm/셸 미경유).
//   · bin: node_modules 상대 경로(tsc/vitest/vite). null 이면 project(=ROOT 상대) 스크립트.
//   · script: ROOT 상대 .mjs 경로(api 번들러). bin 과 상호배타.
// ─────────────────────────────────────────────────────────────────────────────
function buildSteps(opts, nmRoot) {
  const nm = (rel) => join(nmRoot, 'node_modules', rel);
  const all = [
    {
      key: 'tsc',
      label: 'tsc -b tsconfig.build.json',
      note: '전체 타입체크 (app+scripts+api)',
      entry: nm(join('typescript', 'bin', 'tsc')),
      args: ['-b', 'tsconfig.build.json'],
      enabled: true,
    },
    {
      key: 'vitest',
      label: 'vitest run --exclude "**/.claude/**"',
      note: '테스트 (.claude/ worktree 중복 제외)',
      entry: nm(join('vitest', 'vitest.mjs')),
      args: ['run', '--exclude', '**/.claude/**'],
      enabled: opts.test,
      skipReason: '--no-test',
    },
    {
      key: 'api:bundle',
      label: 'api:bundle (node tools/apiBundle/build.mjs)',
      note: 'api/*.js 재생성 — 바뀌면 스테이징 대상',
      entry: join(ROOT, 'tools', 'apiBundle', 'build.mjs'),
      args: [],
      enabled: opts.api,
      skipReason: '--no-api',
    },
    {
      key: 'api:check',
      label: 'api:check (node tools/apiBundle/build.mjs --check)',
      note: 'api/*.js 가 server/handlers 소스와 일치(드리프트 0)',
      entry: join(ROOT, 'tools', 'apiBundle', 'build.mjs'),
      args: ['--check'],
      enabled: opts.api,
      skipReason: '--no-api',
    },
    {
      key: 'vite',
      label: 'vite build',
      note: '프로덕션 번들',
      entry: nm(join('vite', 'bin', 'vite.js')),
      args: ['build'],
      enabled: opts.build,
      skipReason: '--no-build',
    },
  ];
  return all;
}

function fmtDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const nmRoot = findNodeModulesRoot(ROOT);
  if (!nmRoot) {
    console.error(paint.red('[verify] node_modules 를 찾지 못했습니다 — npm install 후 재시도.'));
    console.error(paint.dim('  (링크드 워크트리라면 node_modules 정션이 걸려 있는지 확인.)'));
    process.exit(1);
  }

  const steps = buildSteps(opts, nmRoot);
  const active = steps.filter((s) => s.enabled);
  const skipped = steps.filter((s) => !s.enabled);

  console.log('');
  console.log(paint.bold(paint.cyan('verify')) + paint.dim(`  · ${active.length}단계 실행` + (skipped.length ? `, ${skipped.length}단계 건너뜀` : '')));
  for (const s of skipped) console.log('  ' + paint.gray(`· ${s.label}  (건너뜀: ${s.skipReason})`));

  // ── --plan: 실행 없이 계획만 ──────────────────────────────────────────────
  if (opts.plan) {
    console.log('');
    console.log(paint.bold('계획 (실행 안 함):'));
    active.forEach((s, i) => {
      console.log(`   ${paint.dim((i + 1) + '.')} ${paint.bold(s.label)}  ${paint.dim('— ' + s.note)}`);
      if (!existsSync(s.entry)) console.log('      ' + paint.yellow('⚠ 엔트리 없음: ' + s.entry));
    });
    console.log('');
    process.exit(0);
  }

  // ── 순차 실행 (fail-fast) ─────────────────────────────────────────────────
  const totalStart = Date.now();
  const done = [];
  for (let i = 0; i < active.length; i++) {
    const s = active[i];
    console.log('');
    console.log(paint.bold(`━━ [${i + 1}/${active.length}] ${s.label}`) + paint.dim('  · ' + s.note));

    if (!existsSync(s.entry)) {
      console.log('  ' + paint.red('✗ 실행 엔트리를 찾지 못했습니다: ' + s.entry));
      console.log('  ' + paint.dim('  의존성 설치가 안 됐거나 경로가 바뀌었을 수 있습니다.'));
      summarize(done, s, totalStart);
      process.exit(1);
    }

    const stepStart = Date.now();
    // stdio: 'inherit' — 자식(tsc/vitest/vite)의 출력을 실시간 스트리밍. 진행상황이 그대로 보인다.
    const res = spawnSync(process.execPath, [s.entry, ...s.args], {
      cwd: ROOT,
      stdio: 'inherit',
      maxBuffer: 64 * 1024 * 1024,
    });
    const elapsed = Date.now() - stepStart;

    if (res.error) {
      console.log('  ' + paint.red(`✗ 실행 실패: ${res.error.message}`) + paint.dim(`  (${fmtDuration(elapsed)})`));
      summarize(done, s, totalStart);
      process.exit(1);
    }
    if (res.status !== 0) {
      console.log('  ' + paint.red(`✗ ${s.label} 실패 (exit ${res.status})`) + paint.dim(`  · ${fmtDuration(elapsed)}`));
      summarize(done, s, totalStart);
      process.exit(res.status || 1);
    }
    console.log('  ' + paint.green(`✓ ${s.label}`) + paint.dim(`  · ${fmtDuration(elapsed)}`));
    done.push({ label: s.label, ms: elapsed });
  }

  // ── 성공 요약 ─────────────────────────────────────────────────────────────
  console.log('');
  console.log(paint.green(paint.bold('✓ verify 통과')) + paint.dim(`  · ${done.length}단계 · 총 ${fmtDuration(Date.now() - totalStart)}`));
  for (const d of done) console.log('  ' + paint.dim(`✓ ${d.label.padEnd(48)} ${fmtDuration(d.ms)}`));
  if (opts.api) {
    console.log('');
    console.log('  ' + paint.yellow('↳ api:bundle 이 api/*.js 를 재생성했다면 ') + paint.bold('git status') + paint.yellow(' 로 확인 후 함께 스테이징하라.'));
  }
  console.log('');
  process.exit(0);
}

/** 실패 지점까지의 진행 상황을 짧게 요약한다. */
function summarize(done, failedStep, totalStart) {
  console.log('');
  console.log(paint.red(paint.bold('✗ verify 실패')) + paint.dim(`  · ${failedStep.label} 에서 중단 · 총 ${fmtDuration(Date.now() - totalStart)}`));
  for (const d of done) console.log('  ' + paint.dim(`✓ ${d.label.padEnd(48)} ${fmtDuration(d.ms)}`));
  console.log('  ' + paint.red(`✗ ${failedStep.label}`));
  console.log('  ' + paint.dim('위 로그에서 첫 실패 원인을 확인하고 고친 뒤 다시 verify 하라.'));
  console.log('');
}

main();
