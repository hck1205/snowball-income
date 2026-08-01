#!/usr/bin/env node
/**
 * archclip — 카드의 **둥근 모서리(아치) 안쪽을 콘텐츠가 넘었는지** 실제로 그려서 잰다.
 * 외부 의존성 0(Node 빌트인 fetch + WebSocket). `uiprobe` 와 같은 CDP 배선을 쓴다.
 *
 * 왜 있나. 카드 반경을 `calc(radius.sm + 카드패딩)` 으로 키운 뒤에도 **반경 값과 무관하게** 남는
 * 결함이 있다: 카드 안쪽 콘텐츠가 패딩 박스 밖으로 삐져나오면(가로 스크롤 표, 음수 마진, 마지막 행
 * 밀착) 우하단 아치가 그 콘텐츠를 자른다. 이건 소스로도, jsdom 으로도 못 본다 —
 *  - 소스: 각 파일은 각자 옳다. "이 폭에서 저 카드의 저 모서리"라는 조합이 결함이다.
 *  - jsdom: 레이아웃을 계산하지 않아 `getBoundingClientRect()` 가 전부 0 이다.
 *  - `getComputedStyle`: 선언값만 준다. 실제로 잘리는지는 기하로 따져야 한다.
 *
 * 판정. 카드의 각 모서리는 반지름 r 인 원호다(중심 = 모서리에서 r 만큼 안쪽).
 * 자식의 그 방향 꼭짓점이 원호 **바깥**(중심에서 거리 > r)이면 그만큼이 잘린다.
 *
 * ⚠ 두 가지를 반드시 지킨다(둘 다 이 레포에서 실측으로 틀렸던 것):
 *  1. 공용 `Card` 는 `content-visibility: auto` 라 **뷰포트 밖이면 DOM 측정이 거짓말한다.**
 *     → 카드마다 `scrollIntoView` + rAF 2회 뒤에 잰다.
 *  2. 서체가 늦게 오면 폴백으로 그려져 박스가 달라진다 → `document.fonts.ready` 를 기다린다.
 *
 * 오탐 방지: 조상의 `overflow: hidden|auto|scroll` 로 **이미 잘린** 부분은 화면에 없다.
 * 자식 사각형을 클리핑 조상들과 교집합한 뒤에 판정한다(예: 지급월 표는 `min-width: 520px` 라
 * 390px 에서 카드 밖까지 뻗지만 자기 스크롤 컨테이너가 자른다 — 아치 결함이 아니다).
 *
 * ```sh
 * node tools/dev/archclip.mjs                        # / · 390px · 기본 시나리오 · 허용 0건
 * node tools/dev/archclip.mjs --width 390,768,1280
 * node tools/dev/archclip.mjs --route /dividend/portfolio --click SCHD
 * node tools/dev/archclip.mjs --json
 * ```
 *
 * 옵션
 *   --url <u>        기본 http://localhost:5173
 *   --route <p>      기본 /   (⚠ Git Bash 는 경로를 윈도 경로로 바꾼다 — MSYS_NO_PATHCONV=1)
 *   --width <n[,n]>  기본 390
 *   --height <n>     기본 844
 *   --wait <ms>      첫 로드 대기. 기본 3000
 *   --click <text>   씨앗(DEFAULT_CLICKS) **뒤에** 이어서 누른다(여러 번 가능) — 뷰 전환 등
 *   --tolerance <px> 이 값 이하의 넘침은 무시. 기본 0.5(서브픽셀)
 *   --json           결과를 JSON 으로
 *   --port <n>       CDP 포트. 기본 9223
 *   --keep           끝나고 브라우저를 남긴다
 *
 * 넘침이 1건이라도 있으면 exit 1 (회귀 기준선 = 0건).
 *
 * ⚠ **빈 화면은 통과가 아니다.** 프로파일이 비면 시뮬레이터는 결과 카드 대신 프리셋 추천 보드만
 * 그린다(카드 18개 · 침범 0건) — 그 상태로 "정상"을 받으면 아무것도 검증하지 않은 것이다.
 * 그래서 기본으로 프리셋 하나를 눌러 결과 카드가 서게 만들고, 결과 카드를 못 찾으면 실패한다.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);

/**
 * 콜드 프로파일의 시뮬레이터는 **빈 포트폴리오**라 결과 카드가 아예 없다. 프리셋을 하나 눌러야
 * "실지급 월별 배당"을 포함한 결과 카드 6장이 선다 — 그 상태가 이 가드의 측정 대상이다.
 */
const DEFAULT_CLICKS = ['워렌 버핏'];
/** 이 글자가 화면에 없으면 "빈 화면을 통과로 세었다"는 뜻이라 측정을 실패로 본다. */
const REQUIRE_TEXT = '실지급 월별 배당';

let base = 'http://localhost:5173';
let route = '/';
let widths = [390];
let height = 844;
let waitMs = 3000;
let tolerance = 0.5;
let asJson = false;
let port = 9223;
let keepOpen = false;
let clicks = null;

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  const next = () => argv[(i += 1)];
  if (arg === '--url') base = next().replace(/\/$/, '');
  else if (arg === '--route') route = next();
  else if (arg === '--width') widths = next().split(',').map((v) => Number(v.trim())).filter(Boolean);
  else if (arg === '--height') height = Number(next());
  else if (arg === '--wait') waitMs = Number(next());
  else if (arg === '--click') (clicks ??= []).push(next());
  else if (arg === '--tolerance') tolerance = Number(next());
  else if (arg === '--json') asJson = true;
  else if (arg === '--port') port = Number(next());
  else if (arg === '--keep') keepOpen = true;
  else if (arg === '--help' || arg === '-h') {
    console.log('archclip — 카드 아치를 콘텐츠가 넘는지 실측 (기본 / · 390px · 허용 0건)');
    process.exit(0);
  }
}

/** `--click` 은 씨앗을 **대체하지 않고 뒤에 붙는다**(씨앗이 없으면 누를 화면 자체가 없다). */
const extraClicks = clicks ?? [];

// Git Bash(MSYS)가 '/dividend/portfolio' 를 'C:/Program Files/...' 로 바꿔 놓는 사고를 조용히 넘기지 않는다.
if (/^[A-Za-z]:[\\/]/.test(route)) {
  console.error(`[archclip] --route 가 윈도 경로로 변환됐다: ${route}`);
  console.error('           MSYS_NO_PATHCONV=1 을 앞에 붙이거나 PowerShell 에서 실행하라.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 브라우저 (uiprobe 와 동일 배선) ──────────────────────────────────────── */

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
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((path) => existsSync(path)) ?? null;
};

const cdpReady = async () => {
  try {
    await fetch(`http://127.0.0.1:${port}/json/version`);
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
    console.error('[archclip] 크롬/엣지를 찾지 못했다. 설치 경로를 확인하라.');
    process.exit(1);
  }

  const profile = resolve('node_modules/.cache/archclip-profile');
  mkdirSync(profile, { recursive: true });
  child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ],
    { stdio: 'ignore', detached: false }
  );

  for (let i = 0; i < 40; i += 1) {
    if (await cdpReady()) return 'launched';
    await sleep(300);
  }
  console.error('[archclip] CDP 가 뜨지 않았다.');
  process.exit(1);
};

const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[archclip] page 타겟이 없다.');
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
    new Promise((res, rej) => {
      id += 1;
      pending.set(id, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

  return { send, close: () => ws.close() };
};

/* ── 페이지 안에서 도는 측정기 ────────────────────────────────────────────── */

const MEASURE = (tol) => `(async () => {
  await document.fonts.ready;
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const TOL = ${tol};

  const label = (el) => {
    const heading = el.querySelector('h1, h2, h3');
    const text = (heading?.textContent || el.textContent || '').replace(/\\s+/g, ' ').trim();
    return text.slice(0, 28);
  };

  /* 카드 = 반경이 있는 면. 작은 알약·배지는 제외한다(폭 240 미만). */
  const cards = [...document.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el);
    const r = parseFloat(cs.borderBottomRightRadius) || 0;
    if (r < 12) return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 240 && rect.height >= 60;
  });

  const clipsOf = (el, stop) => {
    const out = [];
    for (let p = el.parentElement; p && p !== stop.parentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/hidden|auto|scroll|clip/.test(cs.overflowX + ' ' + cs.overflowY)) out.push(p.getBoundingClientRect());
    }
    return out;
  };

  const findings = [];
  const cardReport = [];

  for (const card of cards) {
    /* content-visibility: auto — 뷰포트 밖이면 측정이 거짓말한다. 반드시 보이게 한 뒤 잰다. */
    card.scrollIntoView({ block: 'center' });
    await raf2();

    const cs = getComputedStyle(card);
    const rect = card.getBoundingClientRect();
    if (rect.width < 240) continue;
    const rTL = parseFloat(cs.borderTopLeftRadius) || 0;
    const rTR = parseFloat(cs.borderTopRightRadius) || 0;
    const rBR = parseFloat(cs.borderBottomRightRadius) || 0;
    const rBL = parseFloat(cs.borderBottomLeftRadius) || 0;

    const corners = [
      { name: 'TL', cx: rect.left + rTL, cy: rect.top + rTL, r: rTL, px: 'left', py: 'top', sx: -1, sy: -1 },
      { name: 'TR', cx: rect.right - rTR, cy: rect.top + rTR, r: rTR, px: 'right', py: 'top', sx: 1, sy: -1 },
      { name: 'BR', cx: rect.right - rBR, cy: rect.bottom - rBR, r: rBR, px: 'right', py: 'bottom', sx: 1, sy: 1 },
      { name: 'BL', cx: rect.left + rBL, cy: rect.bottom - rBL, r: rBL, px: 'left', py: 'bottom', sx: -1, sy: 1 }
    ];

    let cardHits = 0;
    let cardMax = 0;

    for (const el of card.querySelectorAll('*')) {
      const ecs = getComputedStyle(el);
      if (ecs.display === 'none' || ecs.visibility === 'hidden' || ecs.opacity === '0') continue;
      /*
       * 🔴 **건너뛴 서브트리는 옛 좌표를 그대로 돌려준다.** 닫힌 <details>(content-visibility: hidden)
       * 안의 표가 카드 아래로 223px 삐져나온 것처럼 잡혔다 — 화면에는 아무것도 없는데도.
       * checkVisibility 가 이 상태를 표준 API 로 걸러 주는 유일한 수단이다.
       */
      if (!el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
      let box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;

      /* 이미 잘린 부분은 화면에 없다 — 클리핑 조상과 교집합한 뒤 판정. */
      let l = box.left, t = box.top, rr = box.right, b = box.bottom;
      for (const clip of clipsOf(el, card)) {
        l = Math.max(l, clip.left);
        t = Math.max(t, clip.top);
        rr = Math.min(rr, clip.right);
        b = Math.min(b, clip.bottom);
      }
      if (rr - l < 1 || b - t < 1) continue;
      box = { left: l, top: t, right: rr, bottom: b };

      for (const c of corners) {
        if (c.r <= 0) continue;
        const x = c.sx > 0 ? box.right : box.left;
        const y = c.sy > 0 ? box.bottom : box.top;
        if (c.sx > 0 ? x <= c.cx : x >= c.cx) continue;
        if (c.sy > 0 ? y <= c.cy : y >= c.cy) continue;
        const over = Math.hypot(x - c.cx, y - c.cy) - c.r;
        if (over <= TOL) continue;
        cardHits += 1;
        cardMax = Math.max(cardMax, over);
        findings.push({
          card: label(card),
          corner: c.name,
          over: Math.round(over * 100) / 100,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 24)
        });
      }
    }

    cardReport.push({ card: label(card), radius: Math.round(rBR * 10) / 10, hits: cardHits, max: Math.round(cardMax * 100) / 100 });
  }

  findings.sort((a, b) => b.over - a.over);
  return { cards: cardReport, total: findings.length, findings: findings.slice(0, 40) };
})()`;

/* ── 실행 ─────────────────────────────────────────────────────────────────── */

const mode = await launch();
const cdp = await connect();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 400));
  return result.result?.value;
};

/*
 * 🔴 **측정 전에 저장소를 비운다 — 안 그러면 가드가 결정적이지 않다.**
 * 프로파일(`node_modules/.cache/archclip-profile`)은 실행 사이에 살아남는다. 한 번 프리셋을 적용하면
 * 다음 실행은 이미 포트폴리오가 있는 상태로 뜨고, 그러면 기본 클릭이 "not-found" 로 죽는다(실측).
 * 우리가 띄운 브라우저일 때만 지운다 — 붙은 경우는 사람이 열어 둔 창의 로컬 데이터다.
 */
const resetStorage = async () => {
  if (mode !== 'launched') return;
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(300);
  await cdp.send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'all' });
};
if (mode !== 'launched') {
  console.warn('[archclip] 기존 브라우저에 붙었다 — 저장소를 지우지 않으므로 화면 상태가 기본값이 아닐 수 있다.');
}

const url = `${base}${route}`;
if (!asJson) console.log(`[archclip] ${mode} · ${url}`);

/**
 * 보이는 글자로 눌러 상태를 만든다. **완전일치를 먼저** 찾는다 — 부분일치만 쓰면 "캘린더" 가
 * 상단 내비의 "배당 캘린더" 를 잡아 다른 라우트로 넘어가 버린다(실측).
 */
const clickByText = (needle) => `(() => {
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();
  const all = [...document.querySelectorAll('button, [role="button"], a, summary')];
  const target = all.find((el) => name(el) === ${JSON.stringify(needle)})
    ?? all.find((el) => name(el).includes(${JSON.stringify(needle)}));
  if (!target) return 'not-found';
  target.click();
  return 'clicked';
})()`;

const report = {};
let violations = 0;
let measured = 0;

for (const width of widths) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await resetStorage();
  await cdp.send('Page.navigate', { url });
  await sleep(waitMs);

  const seen = (needle) => `document.body.textContent.includes(${JSON.stringify(needle)})`;
  const waitFor = async (needle) => {
    // 콜드 로드는 우패널이 "결과를 불러오는 중…" 로더로 먼저 뜬다 — 고정 대기로 재면 실행마다 갈린다.
    for (let tries = 0; tries < 30; tries += 1) {
      if (await evaluate(seen(needle))) return true;
      await sleep(500);
    }
    return false;
  };

  /*
   * 기본 클릭은 **결과 카드를 세우기 위한 씨앗**이라, 이미 서 있으면 건너뛴다. 앱이 첫 방문에
   * 프리셋을 미리 채우는 경우가 있어서(그리고 프로파일이 살아남아서) 무조건 누르면 "not-found" 로
   * 죽는다. 사용자가 `--click` 을 직접 준 경우는 상태를 만들려는 의도이므로 항상 누른다.
   */
  await waitFor(REQUIRE_TEXT);
  const seeds = (await evaluate(seen(REQUIRE_TEXT))) ? [] : DEFAULT_CLICKS;
  for (const text of [...seeds, ...extraClicks]) {
    await waitFor(text);
    const outcome = await evaluate(clickByText(text));
    if (outcome === 'not-found') {
      const screen = await evaluate('document.body.innerText.replace(/\\s+/g, " ").slice(0, 200)');
      console.error(`[archclip] ${width}px — "${text}" 를 누를 수 없다(상태를 못 만들었다).`);
      console.error(`           화면: ${screen}`);
      process.exit(1);
    }
    await sleep(waitMs);
  }

  // ⚠ `innerText` 는 `content-visibility: auto` 로 건너뛴 서브트리를 비운다 — 아래쪽 카드가 항상 "없다"로 나온다.
  if (!(await waitFor(REQUIRE_TEXT))) {
    console.error(`[archclip] ${width}px — "${REQUIRE_TEXT}" 가 화면에 없다. 빈 화면을 통과로 세지 않는다.`);
    process.exit(1);
  }
  measured += 1;

  const result = await evaluate(MEASURE(tolerance));
  report[width] = result;
  violations += result.total;

  if (!asJson) {
    const mark = result.total ? `✗ ${result.total}건` : '✓ 정상';
    console.log(`  ${String(width).padStart(4)}px  ${mark}  (카드 ${result.cards.length}개)`);
    for (const card of result.cards.filter((c) => c.hits > 0)) {
      console.log(`          "${card.card}" r=${card.radius}px → ${card.hits}건 · 최대 ${card.max}px`);
    }
    for (const f of result.findings.slice(0, 12)) {
      console.log(`            ${String(f.over).padStart(6)}px ${f.corner} <${f.tag}> "${f.text}"  [${f.card}]`);
    }
  }
}

if (asJson) console.log(JSON.stringify(report, null, 2));

cdp.close();
if (child && !keepOpen) child.kill();

if (violations > 0) {
  if (!asJson) console.error(`[archclip] 아치 침범 ${violations}건 — 회귀 기준선은 0건이다.`);
  process.exit(1);
}
if (measured === 0) {
  console.error('[archclip] 아무 폭도 측정하지 못했다.');
  process.exit(1);
}
