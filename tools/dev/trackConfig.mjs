// 파일 경로 → "기능 트랙" 분류 규칙 + 트랙 표시 메타 + 저수준 공용 헬퍼를 한 곳에 모은다.
//
// tracks.mjs / devstatus.mjs / predeploy.mjs 세 CLI가 이 파일을 공유한다.
// 순수 Node(ESM), 외부 의존성 0 — `node:` 빌트인만 쓴다. (tools/indexer 관례)
//
// ## 트랙이란
// 이번 개발 사이클에서 병렬로 굴러가는 "기능 단위"다. 한 브랜치/워크트리가 한 트랙을 맡고,
// 미커밋 변경을 트랙별로 갈라 보면 "지금 무엇을, 어디까지 건드렸나"가 한눈에 잡힌다.
//
// ## 트랙 추가/수정하는 법 (여기 한 곳만 고치면 세 CLI에 다 반영된다)
//   1) 아래 TRACKS 배열에 `{ name, emoji, label, patterns: [정규식...] }` 를 추가한다.
//   2) patterns 는 **저장소 루트 기준 POSIX 경로**(슬래시)에 대해 test 된다. 접두사 매칭은
//      `/^pages\/Ticker\//` 처럼 앵커(^)를 쓴다. 특정 파일은 `/^api\/fx\.js$/` 처럼 $ 로 닫는다.
//   3) **순서가 의미 있다** — classifyPath 는 위에서부터 첫 매칭을 채택한다. 더 좁은/우선순위 높은
//      트랙을 위에 둔다. 어디에도 안 걸리면 'other'.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 저장소 루트(절대경로, 후행 슬래시 포함). tools/dev/trackConfig.mjs → 두 단계 위. */
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// 트랙 정의 — 위에서부터 첫 매칭 우선. 좁은 트랙을 위에.
// ─────────────────────────────────────────────────────────────────────────────
export const TRACKS = [
  {
    name: 'ticker-seo',
    emoji: '🔎',
    label: '티커 상세 페이지 · SEO',
    patterns: [
      /^pages\/Ticker\//,
      /^shared\/constants\/tickers\//,
      /^server\/handlers\/TickerHtml\//,
      /^api\/ticker-html\.js$/,
      /^test\/api\/tickerHtml/,
    ],
  },
  {
    name: 'reconcile',
    emoji: '☁️',
    label: '클라우드 동기화 · 리컨사일',
    patterns: [
      /^jotai\/snowball\/cloud\//,
      /^components\/CloudReconcileModal\//,
      /^components\/CloudSyncIndicator\//,
      // useCloudWorkspaceSync + useCloudSyncAnalytics 등 business 훅의 클라우드 계열을 함께 담는다.
      /^pages\/Main\/hooks\/business\/useCloud/,
      /^pages\/Main\/components\/MainLeftPanel\//,
      /^test\/.*cloud/i,
      /reconcile/i,
    ],
  },
  {
    name: 'ticker-data',
    emoji: '📈',
    label: '티커/프리셋 데이터',
    patterns: [
      /^shared\/constants\/marketData\//,
      /^shared\/constants\/presets\//,
      /^scripts\/tickerRefresh\//,
    ],
  },
  {
    name: 'chart-viz',
    emoji: '📊',
    label: '차트 · 시각화',
    patterns: [
      /^pages\/Main\/components\/ChartPanel\//,
      /^pages\/Main\/components\/MainRightPanel\//,
      /^pages\/Main\/utils\/charts/,
      /^components\/SimulationResult\//,
      /^components\/common\/StatTile\//,
      /^shared\/styles\/chartTheme/,
    ],
  },
  {
    name: 'fx',
    emoji: '💱',
    label: '실시간 환율(원↔달러)',
    patterns: [
      /^components\/ExchangeRateWidget\//,
      /^api\/fx\.js$/,
    ],
  },
  {
    name: 'docs-knowledge',
    emoji: '📚',
    label: '문서 · 에이전트 지식',
    patterns: [
      /^\.claude\//,
      /^docs\//,
      /^[^/]+\.md$/, // 루트의 마크다운만 (하위 폴더 README 는 각 트랙 소속)
    ],
  },
];

/** 어느 트랙에도 안 걸린 파일이 모이는 곳. */
export const OTHER = { name: 'other', emoji: '📦', label: '기타 (미분류)', patterns: [] };

/** 표시 순서용 — 정의된 트랙들 + 마지막에 other. */
export const ALL_TRACKS = [...TRACKS, OTHER];
export const TRACK_NAMES = ALL_TRACKS.map((t) => t.name);

/**
 * 저장소 루트 기준 경로 하나를 트랙 이름으로 분류한다. 첫 매칭 우선, 없으면 'other'.
 * 입력은 Windows 역슬래시·선행 `./`·git 의 따옴표 감싼 경로도 관대하게 받는다.
 */
export function classifyPath(p) {
  const path = String(p)
    .trim()
    .replace(/^"(.*)"$/, '$1') // git 이 특수문자 경로를 "..." 로 감쌌을 때
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
  for (const t of TRACKS) {
    if (t.patterns.some((re) => re.test(path))) return t.name;
  }
  return OTHER.name;
}

/** 트랙 이름 → 메타(emoji/label). 모르는 이름은 OTHER 로. */
export function trackMeta(name) {
  return ALL_TRACKS.find((t) => t.name === name) || OTHER;
}

/** 유효한 트랙 이름인지 (other 포함). */
export function isTrackName(name) {
  return TRACK_NAMES.includes(name);
}

// ─────────────────────────────────────────────────────────────────────────────
// 공용 저수준 헬퍼 — 세 CLI가 공유한다.
// ─────────────────────────────────────────────────────────────────────────────

/** 터미널 컬러 사용 여부. NO_COLOR 존중, FORCE_COLOR 강제, 그 외 TTY 일 때만. */
const USE_COLOR = process.env.NO_COLOR ? false : process.env.FORCE_COLOR ? true : !!process.stdout.isTTY;
const wrap = (open, close) => (s) => (USE_COLOR ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));

/** 최소 ANSI 컬러 헬퍼. 비-TTY/파이프 시 자동으로 무채색(원문 그대로). */
export const paint = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

/**
 * git 을 동기 실행한다. 기본 cwd 는 저장소 루트.
 * allowFail=false(기본)면 실패 시 throw, true 면 결과 객체를 그대로 돌려준다(호출부에서 status 판단).
 */
export function git(args, { cwd = ROOT, allowFail = false, encoding = 'utf8' } = {}) {
  const res = spawnSync('git', args, { cwd, encoding, maxBuffer: 64 * 1024 * 1024 });
  if (!allowFail && (res.error || res.status !== 0)) {
    const msg = res.error ? res.error.message : String(res.stderr || '').trim();
    throw new Error(`git ${args.join(' ')} 실패: ${msg}`);
  }
  return res;
}

/** 임의 명령을 동기 실행(결과 객체 반환). npm 대신 node 를 직접 부르는 등에 쓴다. */
export function run(cmd, args, { cwd = ROOT, encoding = 'utf8' } = {}) {
  return spawnSync(cmd, args, { cwd, encoding, maxBuffer: 64 * 1024 * 1024 });
}

/**
 * `node tools/apiBundle/build.mjs --check` 를 돌려 api 번들 신선도를 **구조화된 결과**로 돌려준다.
 * npm 대신 node 를 직접 부른다 — npm.cmd/셸 의존을 피하고 종료코드/출력 파싱이 안정적이다.
 *
 * 종료코드가 0이 아니어도 원인을 구분한다: 산출물 드리프트(stale)인지, 그 외 빌드 에러(error)인지.
 * (예: 워크트리에 node_modules 가 없어 esbuild 가 의존성 해석에 실패하면 'error' — 드리프트가 아니다.)
 *
 * @returns {{ status:'ok'|'stale'|'error'|'unavailable', detail?:string, stale?:string[] }}
 */
export function checkApiBundle() {
  const res = run(process.execPath, [join(ROOT, 'tools', 'apiBundle', 'build.mjs'), '--check']);
  if (res.error) return { status: 'unavailable', detail: res.error.message };
  const text = `${res.stdout || ''}\n${res.stderr || ''}`;
  if (res.status === 0) {
    const m = text.match(/OK\s+—\s+(.*)$/m);
    return { status: 'ok', detail: m ? m[1].trim() : 'api/*.js 가 server/handlers/ 와 일치' };
  }
  // 실패 — `✗ api/xxx.js` 로 나열된 낡은 산출물을 뽑는다.
  const stale = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('✗'))
    .map((l) => (l.match(/(api\/[\w.-]+\.js)/) || [])[1])
    .filter(Boolean);
  const looksStale = stale.length > 0 || /산출물이 낡았다|커밋되지 않음|소스와 다르다/.test(text);
  if (looksStale) return { status: 'stale', stale };
  // 드리프트가 아니라 빌드 자체가 깨진 경우 — 첫 에러 줄만 간추린다.
  const errLine =
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && /error|ERROR|Cannot|Could not|실패/.test(l)) || 'api:check 가 비정상 종료';
  return { status: 'error', detail: errLine };
}
