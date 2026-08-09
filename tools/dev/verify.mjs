#!/usr/bin/env node
// verify — 배포 전 통합 검증 게이트. **fail-fast 6단계**를 순서대로 돌려, 하나라도 깨지면
// 거기서 멈추고 비0 exit 한다. `ship` 스킬(T4)과 `refresh-data`·`new-ticker-page` 도메인 스킬이
// "격리 빌드 그린"을 확인하는 단일 진입점이다.
//
//   node tools/dev/verify.mjs              # 전체 6단계
//   node tools/dev/verify.mjs --no-test    # 테스트 건너뛰기(빠른 타입·빌드 확인)
//   node tools/dev/verify.mjs --no-build   # vite build 건너뛰기
//   node tools/dev/verify.mjs --no-api     # api 번들/체크 건너뛰기(server/handlers 무변경일 때)
//   node tools/dev/verify.mjs --plan       # 실행 없이 단계 계획만(dry-run)
//
// ## 단계 (순서 = fail-fast 순서)
//   ① node tools/brand/check-brand-alpha.mjs     브랜드 래스터 알파·프레이밍(0.3초 — 가장 싸서 맨 앞)
//   ② tsc -b tsconfig.build.json                 전체 타입체크(app+scripts+api, noUnusedLocals/Params)
//   ③ vitest run --exclude "**/.claude/**"       테스트 — .claude/ 제외로 worktree 중복 유령실패 차단
//   ④ node tools/apiBundle/build.mjs             api/*.js 재생성(server/handlers 소스가 marketData 등을 임베드)
//   ⑤ node tools/apiBundle/build.mjs --check     재생성 결과가 커밋본과 일치(드리프트 0)인지 확인
//   ⑥ vite build                                 프로덕션 번들
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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
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
  const opts = { test: true, build: true, api: true, plan: false, help: false, quick: false };
  for (const a of argv) {
    if (a === '--quick' || a === '-q') opts.quick = true;
    else if (a === '--no-test') opts.test = false;
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
  --quick, -q   작업 중 빠른 확인 — 바뀐 파일에 걸린 테스트 + 전역 가드만. 배포 게이트가 아니다
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
/**
 * **레포를 파일로 훑는 테스트**를 찾아낸다 — `--quick` 에서도 항상 돈다.
 *
 * ## 🔴 왜 명단이 아니라 탐색인가
 *
 * 처음에는 파일 목록을 상수로 적어 뒀다. 그 명단을 `readdirSync|globSync` 로만 만든 탓에
 * **`readFileSync` 로 소스를 읽는 테스트가 통째로 빠졌고**, 사이트맵에 새 라우트를 빠뜨린 것을
 * `--quick` 이 놓쳤다(2026-08-09 실측 — 전체 verify 가 잡았다).
 *
 * 손으로 관리하는 명단은 **새 테스트가 생길 때마다 누군가 기억해야** 한다. 그 기억이 이 게이트의
 * 유일한 방어선이면 언젠가 또 샌다. 그래서 매번 `test/` 를 훑어 **직접 찾는다** — 새 가드를
 * 추가하면 아무것도 안 해도 여기 들어온다.
 *
 * ⚠ 이 테스트들은 모듈 그래프에 안 걸린다. import 가 아니라 **파일을 읽기** 때문이다 —
 *   새 컴포넌트를 만들면 그 파일을 import 하는 테스트는 없지만 구조 규칙은 깨질 수 있다.
 *   그래서 `--changed` 로는 절대 안 잡히고, 여기서 따로 돌려야 한다.
 */
const FS_MARKER = /read(File|dir)Sync|globSync/;

function collectRepoWideGuards(dir = join(ROOT, 'test'), found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectRepoWideGuards(full, found);
      continue;
    }
    if (!/\.test\.tsx?$/.test(entry.name)) continue;
    try {
      if (FS_MARKER.test(readFileSync(full, 'utf8'))) {
        found.push(relative(ROOT, full).split(sep).join('/'));
      }
    } catch {
      /* 읽을 수 없으면 건너뛴다 — 게이트가 파일 하나 때문에 죽지 않게. */
    }
  }

  return found.sort();
}

/** 워킹트리에서 바뀐 파일(스테이징 포함). git 이 없거나 실패하면 빈 배열 — 호출부가 전체로 되돌린다. */
function changedFiles() {
  const res = spawnSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((p) => (p.includes(' -> ') ? p.split(' -> ')[1] : p));
}

/**
 * 실패 기록을 파일로도 남기는 vitest 인자.
 *
 * ## 🔴 왜 (2026-08-09 실제로 당했다)
 *
 * 단계 출력은 `stdio: 'inherit'` 로 **실시간 스트리밍**된다(진행이 보여야 하므로 이건 지킨다).
 * 그런데 그 말은 **호출자가 파이프하면 아무것도 안 남는다**는 뜻이다. `npm run verify | tail -20`
 * 으로 돌렸다가 "1 failed" 라는 숫자만 남고 **어느 테스트인지 영영 알 수 없게** 됐다. 3분 30초를
 * 다시 태워야 하는데, 그 사이 재현이 안 되면(간헐 실패였다) 그대로 미제가 된다.
 *
 * vitest 는 리포터를 **겹칠 수 있다** — 콘솔 출력은 그대로 두고 json 을 파일로 하나 더 받는다.
 * 실시간성을 잃지 않으면서 실패 목록이 항상 디스크에 남는다.
 *
 * ⚠ `default` 를 명시적으로 함께 줘야 한다. `--reporter=json` 만 주면 콘솔 출력이 json 으로
 *   바뀌어 진행 상황이 안 보인다.
 * ⚠ 산출물은 git 비추적이다(.gitignore). 매 실행마다 덮어쓴다 — 마지막 실행 것만 남는다.
 */
const VITEST_RECORD = '.verify-vitest.json';
const VITEST_RECORD_ARGS = ['--reporter=default', '--reporter=json', '--outputFile', VITEST_RECORD];

/** 기록 파일에서 실패한 테스트만 뽑아 사람이 읽을 수 있게 출력한다. */
function printRecordedFailures() {
  const path = join(ROOT, VITEST_RECORD);
  if (!existsSync(path)) return;

  let report;
  try {
    report = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return; // 기록이 깨졌으면 조용히 넘어간다 — 이건 보조 수단이지 판정 근거가 아니다.
  }

  const failures = [];
  for (const file of report.testResults ?? []) {
    for (const assertion of file.assertionResults ?? []) {
      if (assertion.status === 'failed') failures.push({ file: file.name, name: assertion.fullName });
    }
  }
  if (!failures.length) return;

  console.log('');
  console.log('  ' + paint.bold(`실패한 테스트 ${failures.length}건`) + paint.dim(`  (기록: ${VITEST_RECORD})`));
  for (const failure of failures.slice(0, 20)) {
    console.log('  ' + paint.red('✗ ') + failure.name);
    console.log('    ' + paint.dim(failure.file));
  }
  if (failures.length > 20) console.log('  ' + paint.dim(`… 그 밖에 ${failures.length - 20}건`));
}

function buildSteps(opts, nmRoot) {
  const nm = (rel) => join(nmRoot, 'node_modules', rel);

  /*
   * --quick 의 api 단계는 **자동으로** 켜고 끈다. api/*.js 는 server/handlers 소스를 번들한
   * 생성물이라 그쪽이 안 바뀌었으면 재생성해도 결과가 같다 — 3.5초를 매번 낼 이유가 없다.
   */
  const changed = opts.quick ? changedFiles() : [];
  /* 매번 훑는다 — 명단을 손으로 관리하면 새 가드가 조용히 빠진다(위 주석 참고). */
  const repoWideGuards = opts.quick ? collectRepoWideGuards() : [];
  const apiTouched = changed.some((p) => p.startsWith('server/') || p.startsWith('api/') || p.startsWith('tools/apiBundle/'));

  const all = [
    {
      /*
       * 🔴 가장 싼 단계를 맨 앞에 둔다(0.3초). 여기 있는 이유는 순서가 아니라 **사고 이력**이다 —
       * 브랜드 래스터의 알파가 통째로 망가진 자산이 15개 화면에 배포됐는데, 레포에 PNG 를 읽는
       * 검사가 하나도 없어서 아무도 못 잡았다(2026-08-04). 타입도 테스트도 못 보는 종류의 회귀다.
       */
      key: 'brand:check',
      label: 'brand:check (node tools/brand/check-brand-alpha.mjs)',
      note: '브랜드 래스터 알파·프레이밍 회귀 0',
      entry: join(ROOT, 'tools', 'brand', 'check-brand-alpha.mjs'),
      args: [],
      enabled: true,
    },
    {
      /*
       * 🔴 **tsc 앞**에 둔다(0.4초). 이 검사가 잡는 것은 tsc 도 잡지만, tsc 는
       * `TS1005: ',' expected` 같은 **엉뚱한 자리의 구문 오류**로만 말한다 — 진짜 원인(주석 안의
       * 백틱 하나가 템플릿 리터럴을 끊었다)까지 가는 데 시간이 걸리고, Vite 의 모듈 그래프까지
       * 오염되면 "does not provide an export named 'X'" 라는 완전히 다른 얼굴로 나타난다.
       *
       * ⚠ 이 스크립트는 **만들어 두고 아무 데서도 안 돌리고 있었다**(2026-08-09 발견). 그래서 같은
       *   함정에 한 세션에서 네 번 빠졌다. 도구가 있다는 것과 도는 것은 다르다 — 여기 배선이 그 차이다.
       */
      key: 'styled:backticks',
      label: 'styled:backticks (node tools/dev/styled-comment-backticks.mjs)',
      note: '템플릿 리터럴 주석 안 백틱 0',
      entry: join(ROOT, 'tools', 'dev', 'styled-comment-backticks.mjs'),
      args: [],
      enabled: true,
    },
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
      args: ['run', '--exclude', '**/.claude/**', ...VITEST_RECORD_ARGS],
      enabled: opts.test && !opts.quick,
      skipReason: opts.quick ? '--quick (아래 축약 단계로 대체)' : '--no-test',
    },
    /*
     * --quick 전용 테스트. 두 갈래를 **각각** 돌린다:
     *   ① `--changed` — 바뀐 파일을 (전이적으로) import 하는 테스트. 모듈 그래프 기반이라
     *      "이 함수를 쓰는 테스트가 어디 있나"를 vitest 가 정확히 안다(grep 추측보다 낫다).
     *   ② REPO_WIDE_GUARDS — 그래프에 안 걸리는 레포 전수 검사(위 상수 주석 참고).
     *
     * 🔴 **한 번에 합치면 안 된다.** `--changed` 와 파일 인자를 같이 주면 vitest 는 둘을
     *    **교집합**으로 본다 — 안 바뀐 가드 파일은 전부 걸러져 "No test files found" 로
     *    **0개를 돌고도 초록**이 뜬다(2026-08-09 실측). 합집합이 필요하므로 단계를 나눈다.
     *
     * 🔴 **배포 게이트가 아니다.** 바뀐 파일과 무관한 회귀는 여기서 안 잡힌다. 머지·배포 전에는
     *    반드시 전체 `verify` 를 돌린다. 이 단계는 "작업 중 빠르게 확인"만을 위한 것이다.
     */
    {
      key: 'vitest:changed',
      label: 'vitest run --changed',
      note: '바뀐 파일을 import 하는 테스트 — 배포 게이트 아님',
      entry: nm(join('vitest', 'vitest.mjs')),
      args: ['run', '--exclude', '**/.claude/**', '--changed', ...VITEST_RECORD_ARGS],
      enabled: opts.test && opts.quick,
      skipReason: '--no-test',
    },
    {
      key: 'vitest:guards',
      label: `vitest run — 레포 전수 가드 ${repoWideGuards.length}개`,
      note: '레포를 훑는 규칙 검사(모듈 그래프에 안 걸린다)',
      entry: nm(join('vitest', 'vitest.mjs')),
      args: ['run', '--exclude', '**/.claude/**', ...repoWideGuards],
      enabled: opts.test && opts.quick,
      skipReason: '--no-test',
    },
    {
      key: 'api:bundle',
      label: 'api:bundle (node tools/apiBundle/build.mjs)',
      note: 'api/*.js 재생성 — 바뀌면 스테이징 대상',
      entry: join(ROOT, 'tools', 'apiBundle', 'build.mjs'),
      args: [],
      enabled: opts.api && (!opts.quick || apiTouched),
      skipReason: opts.quick && !apiTouched ? '--quick · server/ 무변경' : '--no-api',
    },
    {
      key: 'api:check',
      label: 'api:check (node tools/apiBundle/build.mjs --check)',
      note: 'api/*.js 가 server/handlers 소스와 일치(드리프트 0)',
      entry: join(ROOT, 'tools', 'apiBundle', 'build.mjs'),
      args: ['--check'],
      enabled: opts.api && (!opts.quick || apiTouched),
      skipReason: opts.quick && !apiTouched ? '--quick · server/ 무변경' : '--no-api',
    },
    {
      key: 'vite',
      label: 'vite build',
      note: '프로덕션 번들',
      entry: nm(join('vite', 'bin', 'vite.js')),
      args: ['build'],
      // --quick 은 번들을 만들지 않는다. tsc 가 이미 타입을 봤고, 빌드가 30초를 먹는다.
      enabled: opts.build && !opts.quick,
      skipReason: opts.quick ? '--quick' : '--no-build',
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
      /*
       * 파이프로 넘겨 생살이 잘려도 **어느 테스트가 죽었는지**는 남게 한다(VITEST_RECORD 주석 참고).
       * vitest 가 아닌 단계에서는 기록이 없거나 오래된 것이므로 조용히 넘어간다.
       */
      if (s.key.startsWith('vitest')) printRecordedFailures();
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
