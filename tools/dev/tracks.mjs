#!/usr/bin/env node
// tracks — 미커밋 변경(수정·스테이지·untracked)을 "기능 트랙"별로 갈라 보여준다. (읽기 전용, 안전)
//
//   node tools/dev/tracks.mjs                  # 트랙별 그룹 출력(사람용)
//   node tools/dev/tracks.mjs --json           # 전체를 JSON 으로
//   node tools/dev/tracks.mjs --track reconcile # 그 트랙의 파일 경로만(개행 구분) → 파이프용
//   git add $(node tools/dev/tracks.mjs --track reconcile)   # 한 트랙만 스테이징
//
// 트랙 분류 규칙은 trackConfig.mjs 한 곳에서 관리한다.
//
// 안전성: git 을 **읽기 전용**으로만 부른다(status). 작업트리를 절대 변형하지 않는다.

import { pathToFileURL } from 'node:url';
import { ALL_TRACKS, classifyPath, git, isTrackName, paint, trackMeta, TRACK_NAMES } from './trackConfig.mjs';

/**
 * `git status --porcelain=v1 -z` 를 파싱해 변경 파일 목록을 분류까지 붙여 돌려준다.
 * devstatus.mjs / predeploy.mjs 도 이 함수를 재사용한다.
 *
 * @returns {{ ok: boolean, reason?: string, files: Array<{path,code,staged,unstaged,untracked,track}> }}
 */
export function collectChanges() {
  let res;
  try {
    res = git(['status', '--porcelain=v1', '-z'], { allowFail: true });
  } catch (err) {
    return { ok: false, reason: err.message, files: [] };
  }
  if (res.error) return { ok: false, reason: 'git 실행 불가 (설치/PATH 확인)', files: [] };
  if (res.status !== 0) return { ok: false, reason: String(res.stderr || 'git status 실패').trim(), files: [] };

  const tokens = String(res.stdout || '').split('\0');
  const files = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    const code = tok.slice(0, 2); // XY (X=인덱스/스테이지, Y=작업트리)
    const path = tok.slice(3); // "XY " 다음이 경로
    const x = code[0];
    const y = code[1];
    // rename/copy 는 -z 에서 다음 토큰이 "원본 경로"로 따라온다 — 새 경로(현재 path)만 쓰고 원본은 건너뛴다.
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') i++;
    if (code === '!!') continue; // ignored
    const untracked = code === '??';
    const staged = !untracked && x !== ' ' && x !== '?';
    const unstaged = !untracked && y !== ' ' && y !== '?';
    files.push({ path, code, staged, unstaged, untracked, track: classifyPath(path) });
  }
  return { ok: true, files };
}

/** 트랙 이름 → 파일 배열. ALL_TRACKS 순서(정의된 트랙들 뒤 other)로 정렬해 돌려준다. */
export function groupByTrack(files) {
  const map = new Map(ALL_TRACKS.map((t) => [t.name, []]));
  for (const f of files) map.get(f.track).push(f);
  return map;
}

/** 파일 하나의 상태를 짧은 태그로. */
function stateTag(f) {
  if (f.untracked) return paint.magenta('untracked');
  const parts = [];
  if (f.staged) parts.push(paint.green('staged'));
  if (f.unstaged) parts.push(paint.yellow('unstaged'));
  return parts.join('+') || paint.dim('—');
}

function parseArgs(argv) {
  const opts = { track: null, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--track') opts.track = argv[++i];
    else if (a.startsWith('--track=')) opts.track = a.slice(8);
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') opts.help = true;
  }
  return opts;
}

const USAGE = `tracks — 미커밋 변경을 기능 트랙별로 분류

사용법:
  node tools/dev/tracks.mjs [--json]
  node tools/dev/tracks.mjs --track <name> [--json]

옵션:
  --track <name>   그 트랙 파일 경로만 출력(개행 구분, 파이프용). --json 이면 그 트랙 배열.
  --json           전체 결과를 JSON 으로.
  -h, --help       도움말.

트랙: ${TRACK_NAMES.join(', ')}`;

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }

  if (opts.track && !isTrackName(opts.track)) {
    console.error(`[tracks] 알 수 없는 트랙: ${opts.track}`);
    console.error(`         가능한 값: ${TRACK_NAMES.join(', ')}`);
    process.exit(2);
  }

  const { ok, reason, files } = collectChanges();
  if (!ok) {
    // git 이 없거나 레포가 아니어도 죽지 않는다(읽기 전용 도구).
    console.error(paint.yellow(`[tracks] 변경을 읽을 수 없습니다: ${reason}`));
    return;
  }

  // ── --track <name>: 경로만(파이프용) ─────────────────────────────────────────
  if (opts.track) {
    const picked = files.filter((f) => f.track === opts.track);
    if (opts.json) {
      console.log(JSON.stringify(picked));
      return;
    }
    // stdout 은 경로만(깔끔하게) — 안내는 stderr 로 보내 파이프를 오염시키지 않는다.
    if (!picked.length) {
      console.error(paint.dim(`(트랙 '${opts.track}' 에 해당하는 미커밋 변경 없음)`));
      return;
    }
    for (const f of picked) console.log(f.path);
    return;
  }

  const grouped = groupByTrack(files);

  // ── --json: 전체 구조 ────────────────────────────────────────────────────────
  if (opts.json) {
    const out = { total: files.length, tracks: {} };
    for (const [name, arr] of grouped) if (arr.length) out.tracks[name] = arr;
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  // ── 사람용 그룹 출력 ─────────────────────────────────────────────────────────
  if (!files.length) {
    console.log(paint.green('작업트리가 깨끗합니다 — 미커밋 변경 없음.'));
    return;
  }

  console.log('');
  console.log(paint.bold(`변경 ${files.length}개 · ${[...grouped].filter(([, a]) => a.length).length}개 트랙`));
  for (const [name, arr] of grouped) {
    if (!arr.length) continue;
    const meta = trackMeta(name);
    console.log('');
    console.log(`${meta.emoji}  ${paint.bold(paint.cyan(name))} ${paint.dim('· ' + meta.label)}  ${paint.dim('(' + arr.length + ')')}`);
    for (const f of arr) {
      console.log(`   ${paint.gray(f.code)} ${f.path.padEnd(60)} ${stateTag(f)}`);
    }
  }
  console.log('');
}

// 직접 실행일 때만 CLI 를 돈다 — devstatus/predeploy 가 collectChanges 를 import 할 때는 돌지 않게.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main();
}
