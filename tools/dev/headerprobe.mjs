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
 *   4. 승격된 버튼이 **헤더 바로 아래 8px** 에 붙어 있는가(승격 버튼이 서는 화면 = 시뮬레이터).
 *      🔴 이 검사도 **대상 라우트에서 요소가 0건이면 실패**다(`SIMULATOR_ROUTES`). 예전에는 보이는
 *      버튼만 훑는 `for` 문이라 승격이 사라지거나 셀렉터가 어긋나면 `pinned` 가 빈 배열이 되고
 *      프로브는 그대로 초록이었다 — "새는 것이 없다"가 아니라 **"본 적이 없다"** 인데 로그가 둘을
 *      구분해 주지 않았다. 5번과 같은 처방이고, `overflowprobe` 의 `MIN_INSPECTED_ELEMENTS` 와 같은 원리다.
 *   5. (랜딩 `/` 한정) 시뮬레이터 CTA 가 **스크롤 0 상태에서 뷰포트 안에 완전히** 있는가.
 *      🔴 이 검사는 **요소를 못 찾으면 실패**다. 4번이 "화면에 승격 버튼이 있으면 잰다"라서 랜딩에서
 *      조용히 0건이 되어 통과하는 것과 같은 함정을 여기서 반복하지 않는다 — 앵커가 사라지면
 *      "새는 것이 없다"가 아니라 "본 적이 없다"이고, 그건 통과가 아니다.
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
/**
 * 승격된 히어로 액션(4번 검사)이 **반드시 있어야 하는** 라우트.
 *
 * 🔴 4번 검사는 "보이는 승격 버튼마다 간격을 잰다"라서 **요소가 0건이면 자동으로 통과**했다.
 * `useStickyHeroAction` 승격이 사라지거나 `position: fixed` 버튼 셀렉터가 어긋나는 순간
 * `pinned` 가 빈 배열이 되고 프로브는 30/30 초록을 낸다 — 게이트가 장식이 되는 전형
 * (docs/simulator-route-migration-compat.md §8). 그래서 대상 라우트를 집합으로 못 박고,
 * 거기서 0건이면 **통과가 아니라 실패**로 끝낸다.
 *
 * ⚠ 랜딩(`/`)·포트폴리오·캘린더 등에는 승격 버튼이 **없는 것이 정상**이라 여기 넣지 않는다.
 *   반대로 새 화면에 승격 액션을 붙였다면 그 라우트를 여기에 추가하라 — 안 그러면 그 화면의
 *   4번 검사는 영원히 "본 적이 없는" 상태로 초록이다.
 */
const SIMULATOR_ROUTES = new Set(['/simulator']);
/**
 * 그 라우트에서 "4번 검사를 실제로 했다"고 인정하는 최소 승격 액션 수.
 * `overflowprobe` 의 `MIN_INSPECTED_ELEMENTS`(검사한 개수를 출력하고, 모자라면 실패)와 같은 어법.
 * 시뮬레이터 히어로의 승격 액션은 "투자 설정" 하나뿐이므로 1이다.
 */
const MIN_PINNED_ACTIONS = 1;
/**
 * 랜딩 라우트 — 접힘 위 CTA(5번 검사)를 강제하는 대상.
 *
 * 시뮬레이터로 가는 1클릭이 첫 화면에 없으면, `/` 를 북마크했던 재방문자가 도구 대신 소개 문서를
 * 만나 "내 데이터가 사라졌다"로 읽는다(docs/simulator-route-migration-compat.md §2).
 */
const LANDING_ROUTES = new Set(['/']);
/** 랜딩 CTA 앵커. `pages/Landing` 이 CTA `id` 에서 파생해 심는다. */
const LANDING_CTA_SELECTOR = '[data-landing-cta="simulator"]';

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
 * 🔴 `/` 는 **랜딩**, `/simulator` 가 시뮬레이터다(2026-08-01 이전 완료). `/simulator` 를 빼면
 *   시뮬레이터 전용 검사(승격된 히어로 액션 등)가 **조용히 0건이 되어 통과**한다 — 라우트로
 *   게이트되지 않는 검사라 대상 화면이 목록에서 빠지는 순간 게이트가 장식이 된다.
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
  /*
   * ⚠ 프로파일 경로에 **포트를 붙인다.** 한 프로파일은 한 크롬 인스턴스만 잠그므로 `--port` 만
   * 나눠서는 병렬 트랙 중 뒤에 뜬 쪽이 'CDP 가 뜨지 않았다' 로 죽는다(overflowprobe 와 같은 어법).
   */
  const profile = resolve(`node_modules/.cache/headerprobe-profile-${PORT}`);
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
  const cta = document.querySelector(${JSON.stringify(LANDING_CTA_SELECTOR)});
  const ctaBox = cta ? cta.getBoundingClientRect() : null;
  return {
    published: Number.parseFloat(raw) || null,
    measured: header ? Math.round(header.getBoundingClientRect().height) : null,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    scrollY: Math.round(window.scrollY),
    viewportHeight: window.innerHeight,
    viewportWidth: doc.clientWidth,
    landingCta: ctaBox
      ? {
          top: Math.round(ctaBox.top),
          bottom: Math.round(ctaBox.bottom),
          left: Math.round(ctaBox.left),
          right: Math.round(ctaBox.right)
        }
      : null
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
console.log(
  `  계약: ≥${SINGLE_ROW_MIN_WIDTH}px 헤더 ≤${SINGLE_ROW_MAX_HEIGHT}px · 전 폭 가로 오버플로 0 · 승격 액션 간격 ${PIN_GAP}px · 랜딩 CTA 접힘 위`
);

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

    // 5번 검사는 "접힘 위"가 전제라 반드시 스크롤 0 에서 잰다(앞 라우트의 스크롤이 남지 않게).
    await evaluate('window.scrollTo(0, 0)');
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
    /* 4. 승격된 히어로 액션 — 대상 라우트에서 **0건이면 실패**(5번과 대칭), 있으면 간격을 잰다. */
    if (SIMULATOR_ROUTES.has(route) && scrolled.pinned.length < MIN_PINNED_ACTIONS) {
      problems.push(
        `승격된 히어로 액션이 ${scrolled.pinned.length}개뿐이다(기준 ${MIN_PINNED_ACTIONS}) — 이 라우트의 간격 검사는 ` +
          `한 번도 검사된 적이 없다. useStickyHeroAction 승격이 사라졌는지, position:fixed 버튼 셀렉터가 바뀌었는지 확인하라`
      );
    }
    for (const pin of scrolled.pinned) {
      if (pin.gap !== PIN_GAP) problems.push(`승격 버튼 "${pin.name}" 이 헤더에서 ${pin.gap}px (기대 ${PIN_GAP}px)`);
    }

    /* 5. 랜딩의 시뮬레이터 CTA — 스크롤 0 에서 뷰포트 안에 **완전히** 들어와야 한다. */
    if (LANDING_ROUTES.has(route)) {
      if (!at.landingCta) {
        // 🔴 "못 찾았다"는 통과가 아니다 — 앵커가 사라지면 이 게이트가 영구히 0건이 된다.
        problems.push(`랜딩 CTA(${LANDING_CTA_SELECTOR})를 못 찾았다 — 검사가 0건이 되어 통과하는 것을 막는다`);
      } else if (at.scrollY !== 0) {
        problems.push(`랜딩 CTA 를 스크롤 ${at.scrollY}px 에서 쟀다(접힘 위 판정 불가)`);
      } else {
        const cta = at.landingCta;
        if (cta.top < 0 || cta.bottom > at.viewportHeight) {
          problems.push(`랜딩 CTA 가 접힘 아래 (top ${cta.top} · bottom ${cta.bottom} > 뷰포트 ${at.viewportHeight})`);
        }
        if (cta.left < 0 || cta.right > at.viewportWidth) {
          problems.push(`랜딩 CTA 가 가로로 잘림 (left ${cta.left} · right ${cta.right} > ${at.viewportWidth})`);
        }
      }
    }

    const label = `${route.padEnd(22)} ${String(width).padStart(4)}px`;
    if (problems.length) {
      failures.push(`${label} — ${problems.join(' · ')}`);
      console.log(`  ✗ ${label}  h=${at.published}px · 승격 ${scrolled.pinned.length}개`);
      for (const problem of problems) console.log(`      ${problem}`);
    } else {
      /*
       * 🔴 **무엇을 보았나의 증거.** 대상 라우트에서는 승격 액션 수를 0이어도 항상 적는다 —
       * "간격이 어긋난 게 없다"와 "잴 것이 없었다"를 사람이 로그만 보고 구분할 수 있어야 한다
       * (`overflowprobe` 가 `요소 N개 검사` 를 항상 찍는 것과 같은 이유).
       */
      const pinNote = SIMULATOR_ROUTES.has(route)
        ? ` · 승격 ${scrolled.pinned.length}개 +${PIN_GAP}px`
        : scrolled.pinned.length
          ? ` · 승격 ${scrolled.pinned.length}개 +${PIN_GAP}px`
          : '';
      const ctaNote = at.landingCta ? ` · CTA 하단 ${at.landingCta.bottom}px/${at.viewportHeight}px` : '';
      console.log(`  ✓ ${label}  h=${at.published}px${pinNote}${ctaNote}`);
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
