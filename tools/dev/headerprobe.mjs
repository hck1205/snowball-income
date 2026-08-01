#!/usr/bin/env node
/**
 * headerprobe — **앱 헤더의 높이와 가로 오버플로를 실제로 그려서 재는 회귀 기준선.**
 *
 * 왜 있나. 헤더는 이 레포에서 가장 자주 조용히 뚱뚱해지는 표면이다. 2026-07-31 이전에는
 * 데스크톱에서 **117px 짜리 2줄**(브랜드 줄 오른쪽 900px 이 빈 채로)이었고, 390px 에서는 127px 로
 * 첫 화면의 15% 를 먹었다. 그 상태는 **어떤 테스트도 깨지 않는다** — jsdom 은 `@media` 도 레이아웃도
 * 계산하지 않아 높이를 알 수 없고, 소스만 읽어서는 "두 줄"이 문제로 보이지 않기 때문이다.
 * 남은 방법은 실제로 그려서 재는 것뿐이라 그 계약을 여기 스크립트로 못 박는다.
 *
 * 재는 것(라우트 × 폭 전부):
 *   1. `--sb-app-header-h` (AppHeader 가 실측해 발행하는 값) 이 **≥1024 에서 80px 이하**인가
 *      — 내비 높이 상한 규칙. 목표 대역은 64~72px 이고 80 은 절대 상한이다.
 *   2. 문서 가로 오버플로가 **0** 인가(`documentElement.scrollWidth > clientWidth` 이면 실패).
 *      ⚠ 요소 단위 `scrollWidth − clientWidth` 로 세지 않는다 — 공용 Button 의 44×44 터치 타깃
 *      `::before` 가 28px 아이콘 버튼 좌우로 8px 씩 삐져나와 **보이지도 않는 8px 거짓 양성**을 만든다.
 *      ⚠ 등호(`===`)로도 판정하지 않는다 — 세로 스크롤바가 없는 짧은 페이지에서는 `scrollWidth`
 *      (1265)가 `clientWidth`(1280)보다 **작게** 나오는 정상 상태가 있어 거짓 양성이 된다(실측
 *      `/dividend/portfolio` @1280). 넘친 경우만 실패로 센다.
 *   3. 스크롤한 뒤에도 오버플로가 0 인가. 히어로의 "투자 설정" 버튼은 스크롤하면 `position: fixed`
 *      로 승격되는데, 조상에 transform 이 하나 생기면 그 버튼이 화면 밖(실측 x=2043px)으로 날아가
 *      **스크롤한 상태에서만 드러나는** 가로 오버플로가 된다. 로드 직후만 재면 못 잡는다.
 *   4. (`/` 한정) 승격된 버튼이 **헤더 바로 아래 8px** 에 붙어 있는가.
 *
 * ```sh
 * node tools/dev/headerprobe.mjs                          # 기본 라우트 × 기본 폭
 * node tools/dev/headerprobe.mjs --base http://localhost:5199
 * node tools/dev/headerprobe.mjs --widths 1280,1024,390 --routes /,/dividend/calendar
 * ```
 *
 * ⚠ **Git Bash(MSYS)에서는 `--routes` 에 슬래시로 시작하는 값을 그대로 넘기지 마라** — MSYS 가
 * `/dividend/calendar` 를 윈도우 경로(`C:/Program Files/Git/dividend/calendar`)로 바꿔치기해
 * "Cannot navigate to invalid URL" 로 죽는다. `MSYS_NO_PATHCONV=1` 을 앞에 붙이거나 PowerShell 에서 실행한다.
 *
 * 외부 의존성 0(Node 빌트인 fetch + WebSocket 으로 CDP 를 직접 말한다, `uiprobe.mjs` 와 같은 방식).
 * 실패하면 종료 코드 1 — CI 게이트로 그대로 쓸 수 있다.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 계약 상수 ────────────────────────────────────────────────────────────── */

/** 헤더가 한 줄로 서는 최소 폭. `shared/styles/tokens.ts` 의 BREAKPOINT.headerStack + 1 과 같다. */
const SINGLE_ROW_MIN_WIDTH = 1024;
/** 한 줄 모드의 절대 상한(px). 목표 대역은 64~72. */
const SINGLE_ROW_MAX_HEIGHT = 80;
/** 두 줄 모드의 절대 상한(px) — 개선 전 실측 121~127 에 대한 회귀 방지선. */
const STACKED_MAX_HEIGHT = 120;
/** 승격된 히어로 액션이 헤더 아래에 서는 간격(px). useStickyHeroAction 의 PIN_GAP. */
const PIN_GAP = 8;

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const BASE = arg('base', 'http://localhost:5173').replace(/\/$/, '');
const WIDTHS = arg('widths', '1280,1024,900,760,390')
  .split(',')
  .map((w) => Number(w.trim()))
  .filter(Boolean);
/*
 * 🔴 `/simulator` 는 `/` 에 **더한** 것이다(대체가 아니다). 지금은 같은 화면이지만 `/` 가
 *   랜딩으로 바뀌는 순간, 시뮬레이터 전용 검사(승격된 히어로 액션 등)는 라우트로 게이트되지
 *   않아서 **조용히 0건이 되어 통과**한다 — 게이트가 장식이 되는 전형이다.
 */
const ROUTES = arg('routes', '/,/simulator,/dividend/portfolio,/dividend/calendar,/ticker/all,/community/portfolio')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);
const PORT = Number(arg('port', '9344'));
const WAIT = Number(arg('wait', '2200'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 브라우저 ─────────────────────────────────────────────────────────────── */

const findBrowser = () => {
  const candidates =
    platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
        ]
      : platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((path) => existsSync(path)) ?? null;
};

const cdpReady = async () => {
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return true;
  } catch {
    return false;
  }
};

let child = null;

const launch = async () => {
  if (await cdpReady()) return 'attached';
  const browser = findBrowser();
  if (!browser) {
    console.error('[headerprobe] 크롬/엣지를 찾지 못했다.');
    process.exit(1);
  }
  const profile = resolve('node_modules/.cache/headerprobe-profile');
  mkdirSync(profile, { recursive: true });
  child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );
  for (let i = 0; i < 40; i += 1) {
    if (await cdpReady()) return 'launched';
    await sleep(300);
  }
  console.error('[headerprobe] CDP 가 뜨지 않았다.');
  process.exit(1);
};

const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[headerprobe] page 타겟이 없다.');
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  });
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { send, close: () => ws.close() };
};

/* ── 페이지 안에서 도는 조각 ──────────────────────────────────────────────── */

/**
 * 헤더 높이 + 문서 오버플로. 높이는 **발행된 CSS 변수와 실측 박스 둘 다** 본다 —
 * 둘이 어긋나면 발행 로직(ResizeObserver)이 멈춘 것이라 그 자체가 결함이다.
 */
const MEASURE = `(() => {
  const doc = document.documentElement;
  const header = document.querySelector('header');
  const raw = getComputedStyle(doc).getPropertyValue('--sb-app-header-h').trim();
  return {
    published: Number.parseFloat(raw) || null,
    measured: header ? Math.round(header.getBoundingClientRect().height) : null,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth
  };
})()`;

/** 스크롤 후: 오버플로 재확인 + 승격된 히어로 액션의 좌표(있을 때만). */
const MEASURE_SCROLLED = `(() => {
  const doc = document.documentElement;
  const header = document.querySelector('header');
  const pinned = [...document.querySelectorAll('button')]
    .filter((b) => getComputedStyle(b).position === 'fixed')
    .map((b) => ({
      name: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 20),
      gap: Math.round(b.getBoundingClientRect().top - header.getBoundingClientRect().bottom)
    }));
  return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, pinned };
})()`;

/* ── 실행 ─────────────────────────────────────────────────────────────────── */

const mode = await launch();
const cdp = await connect();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
};

console.log(`[headerprobe] ${mode} · ${BASE}`);
console.log(`  계약: ≥${SINGLE_ROW_MIN_WIDTH}px 헤더 ≤${SINGLE_ROW_MAX_HEIGHT}px · 전 폭 가로 오버플로 0 · 승격 액션 간격 ${PIN_GAP}px`);

const failures = [];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await cdp.send('Page.navigate', { url: `${BASE}${route}` });
    await sleep(WAIT);

    const at = await evaluate(MEASURE);
    await evaluate('window.scrollTo(0, 900)');
    await sleep(500);
    const scrolled = await evaluate(MEASURE_SCROLLED);

    const limit = width >= SINGLE_ROW_MIN_WIDTH ? SINGLE_ROW_MAX_HEIGHT : STACKED_MAX_HEIGHT;
    const problems = [];

    if (!at.published || !at.measured) problems.push('헤더 높이를 못 읽었다(헤더가 없거나 변수 미발행)');
    else {
      if (at.published > limit) problems.push(`높이 ${at.published}px > 상한 ${limit}px`);
      if (Math.abs(at.published - at.measured) > 1) {
        problems.push(`발행값 ${at.published}px ≠ 실측 ${at.measured}px (ResizeObserver 발행이 멎었다)`);
      }
    }
    if (at.scrollWidth > at.clientWidth) {
      problems.push(`가로 오버플로 ${at.scrollWidth} > ${at.clientWidth}`);
    }
    if (scrolled.scrollWidth > scrolled.clientWidth) {
      problems.push(`스크롤 뒤 가로 오버플로 ${scrolled.scrollWidth} > ${scrolled.clientWidth}`);
    }
    for (const pin of scrolled.pinned) {
      if (pin.gap !== PIN_GAP) problems.push(`승격 버튼 "${pin.name}" 이 헤더에서 ${pin.gap}px (기대 ${PIN_GAP}px)`);
    }

    const label = `${route.padEnd(22)} ${String(width).padStart(4)}px`;
    if (problems.length) {
      failures.push(`${label} — ${problems.join(' · ')}`);
      console.log(`  ✗ ${label}  h=${at.published}px`);
      for (const problem of problems) console.log(`      ${problem}`);
    } else {
      const pinNote = scrolled.pinned.length ? ` · 승격 ${scrolled.pinned.length}개 +${PIN_GAP}px` : '';
      console.log(`  ✓ ${label}  h=${at.published}px${pinNote}`);
    }
  }
}

cdp.close();
if (child) child.kill();

if (failures.length) {
  console.error(`\n[headerprobe] ${failures.length}건 실패`);
  process.exit(1);
}
console.log('\n[headerprobe] 전부 통과');
