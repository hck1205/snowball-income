#!/usr/bin/env node
/**
 * overflowprobe — **요소 단위** 가로 오버플로 게이트.
 *
 * 왜 또 만드나. `headerprobe` 는 **문서 레벨**(`documentElement.scrollWidth > clientWidth`)만 본다.
 * 그건 "페이지가 가로로 스크롤되나"라는 가장 큰 사고만 잡는다. 그런데 카드 안쪽에서 새는 것은
 * 문서를 넓히지 않고도 **옆 요소를 덮거나 잘려 보인다**(실측 사례: 표를 카드로 접는 CSS에서
 * `width: 1%` 가 문자 그대로 1% 가 되어 삭제 버튼이 21px 삐져나간 건 — pitfalls 참고).
 * 그래서 문서가 아니라 **모든 요소**를 훑는다.
 *
 * ## 🔴 이 스크립트의 핵심은 "무엇을 세지 않느냐" 다
 *
 * `scrollWidth − clientWidth` 를 그대로 믿으면 이 레포에서는 **거의 전부가 거짓 양성**이다.
 * 2026-08-01 실측(390px `/`): 68개 요소가 걸렸고 그중 **진짜 레이아웃 결함은 0개**였다.
 * 세 부류를 규칙으로 걸러낸다.
 *
 * 1. **스크롤 컨테이너**(`overflow-x: auto|scroll`) — 저자가 명시적으로 "여기는 가로로 스크롤한다"고
 *    선언한 자리다. 내용은 도달 가능하고, 스크롤 컨테이너는 조상의 스크롤 영역에 넘침을 전파하지
 *    않으므로 **문서를 넓힐 수 없다.** 세지 않는다(대신 목록으로 보여준다 — §허용 목록).
 * 2. **클리핑 컨테이너**(`overflow-x: hidden|clip`) — 잘라내기로 끝난다. 새지 않는다.
 *    `sr-only`(1×1 + hidden)와 `text-overflow: ellipsis` 가 여기에 대량으로 걸린다.
 * 3. 🔴 **의사요소만 넘치는 경우 = 터치 타깃.** `shared/styles/surfaces.ts` 의 `hitArea`/
 *    `hitAreaWithin` 은 시각 크기는 그대로 두고 `::before` 로 **누를 수 있는 영역만** 넓힌다.
 *    그 `::before` 는 `position: absolute` + `translate(-50%,-50%)` 라 요소 좌우로 균등하게
 *    삐져나가고 `scrollWidth` 는 그것을 센다 — **보이지도 않고 레이아웃을 밀지도 않는다.**
 *    실측 지문: 38px 토글 트랙(`Toggle.styled.ts`)의 44px 히트 영역 → 좌우 **3px**,
 *    18px 도움말 버튼의 24px 히트 영역 → 좌우 **4px**, 28px 헤더 아이콘 버튼의 44px → 좌우 **8px**.
 *    판정법: 자손 **요소 박스**와 **텍스트 조각(Range)** 중 어느 것도 패딩 박스를 넘지 않으면
 *    넘친 주체는 의사요소다(요소·텍스트가 아니면 화면에 배치된 것이 없다).
 *
 * 남는 것만 실패로 센다: **`overflow-x: visible` 인데 실제 자손 박스나 텍스트가 밖으로 나간 요소.**
 * 그것만이 옆 요소를 덮거나 조상으로 전파되어 문서를 넓힌다.
 *
 * ## 이 도구가 **보지 않는** 것 (다음 사람이 오해하지 않게)
 * - **`overflow: hidden` 이 잘라먹는 내용.** "말줄임(의도)"과 "실수로 잘림"을 기하만으로는 구분할 수
 *   없다. 그 층은 `archclip`(아치 침범)과 눈(`uiprobe --shot`)이 본다.
 * - **세로 오버플로.** 이 도구는 가로만 본다.
 * - **스크롤 컨테이너의 도달성.** 가로 스크롤러가 키보드로 조작 가능한지는 별개 문제다
 *   (Chrome 127+ 는 스크롤러를 기본 포커서블로 만든다 — 그 이전 브라우저에선 `tabindex="0"` 이 필요하다).
 *
 * ## 허용 목록 (의도적 가로 스크롤)
 * `INTENTIONAL_SCROLLERS` 에 **근거와 함께** 적혀 있다. 목록에 없는 새 스크롤 컨테이너가 나타나면
 * 실패시키지 않고 `INFO` 로 찍는다 — 새 스크롤러 자체는 결함이 아니고, 다만 **의도한 것인지
 * 사람이 한 번 봐야** 하기 때문이다.
 *
 * ```sh
 * node tools/dev/overflowprobe.mjs                       # 기본 라우트 × 390,360
 * node tools/dev/overflowprobe.mjs --widths 390,360,320
 * node tools/dev/overflowprobe.mjs --routes /,/dividend/calendar --verbose
 * node tools/dev/overflowprobe.mjs --mutant              # 🔴 감도 자가검증(아래)
 * ```
 *
 * ## 감도 자가검증(`--mutant`)
 * "지우면 빨개지지만 더해도 초록인" 가드는 감도 0이다. `--mutant` 는 각 라우트에 **일부러 넘치는
 * 요소 3종**(고정폭 초과 자식 / 긴 무공백 텍스트 / 음수 마진)을 심고, 가드가 **세 종류를 모두**
 * 지목하는지 확인한 뒤 제거해 **기준선으로 정확히 되돌아오는지**까지 본다(양방향).
 *
 * ⚠ 잡히는 **건수**는 3보다 크다 — 넘침은 조상으로 전파되므로 심은 요소와 그 래퍼가 함께 걸린다
 * (실측: 3종을 심으면 6건). 그래서 건수가 아니라 **`data-testid` 세 개가 모두 나왔는가**로 단정한다.
 *
 * ⚠ **Git Bash(MSYS)에서 `--routes` 에 슬래시로 시작하는 값을 그대로 넘기지 마라** — MSYS 가
 * 윈도우 경로로 바꿔치기해 "Cannot navigate to invalid URL" 로 죽는다. `MSYS_NO_PATHCONV=1` 을
 * 앞에 붙이거나 PowerShell 에서 실행한다.
 *
 * 외부 의존성 0(Node 빌트인 fetch + WebSocket 으로 CDP 를 직접 말한다 — `headerprobe.mjs` 와 같은 방식).
 * 실패하면 종료 코드 1.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 계약 상수 ────────────────────────────────────────────────────────────── */

/**
 * 실패로 세는 최소 초과 폭(px).
 *
 * 서브픽셀 레이아웃 때문에 `scrollWidth`(정수)와 실제 박스(소수)는 상시 1px 미만으로 어긋난다.
 * 1px 은 사람 눈에 안 보이고 라운딩만으로도 나므로 **2px 부터** 결함으로 센다.
 * ⚠ 이 값을 0/1 로 낮추려면 먼저 `--mutant` 로 오발이 없는지 확인하라.
 */
const OVERFLOW_TOLERANCE = 2;

/** 자손 박스가 패딩 박스를 넘었다고 인정하는 최소 거리(px). 라운딩 잡음 차단용. */
const OFFENDER_TOLERANCE = 1;

/**
 * **의도적 가로 스크롤 허용 목록.** 각 항목은 "이 자리는 가로로 스크롤하는 것이 설계다"라는 근거다.
 * `match` 는 페이지 안에서 평가되는 CSS 선택자 — emotion 해시 클래스는 매 빌드 바뀌므로
 * **절대 쓰지 않고** 시맨틱 앵커(태그·역할·aria-label)로만 지목한다.
 */
const INTENTIONAL_SCROLLERS = [
  {
    /* 헤더 내비. 칩이 넘치면 가로 스크롤한다 — 줄바꿈으로 헤더가 두 줄 되는 것을 막는 설계다. 근거 components/common/NavScroller. */
    match: 'nav[aria-label="주요 메뉴"], nav[aria-label="주요 메뉴"] > *',
    why: 'NavScroller — 헤더 칩 내비의 가로 스크롤(줄바꿈 금지가 설계)'
  },
  {
    /* 표를 직접 감싼 래퍼. 대표 사례가 종목별 지급 월 표(13열)로, 좁은 화면에서 12칸 그리드를
       줄바꿈으로 구기지 않으려고 표만 자체 스크롤한다 — 근거
       components/MonthlyCashflow/components/PayoutScheduleStrip/PayoutScheduleStrip.styled.ts:21(ScheduleScroll)
       + 같은 파일 30행의 `min-width: 520px`. 연도별 결과 등 다른 넓은 표 래퍼도 같은 규칙이다. */
    match: 'div:has(> table), div:has(> * > table)',
    why: '표 래퍼 — 넓은 표는 접지 않고 자체 가로 스크롤한다(PayoutScheduleStrip 등)'
  }
];

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const BASE = arg('base', 'http://localhost:5173').replace(/\/$/, '');
const WIDTHS = arg('widths', '390,360')
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
const PORT = Number(arg('port', '9346'));
const WAIT = Number(arg('wait', '6500'));
const VERBOSE = flag('verbose');
const MUTANT = flag('mutant');
/** 보유 종목이 있는 상태로 `/dividend/portfolio` 를 재려면 켠다(기본 켜짐 — 빈 화면만 재는 것은 무의미). */
const SEED = !flag('no-seed');

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
    console.error('[overflowprobe] 크롬/엣지를 찾지 못했다.');
    process.exit(1);
  }
  const profile = resolve('node_modules/.cache/overflowprobe-profile');
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
  console.error('[overflowprobe] CDP 가 뜨지 않았다.');
  process.exit(1);
};

const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[overflowprobe] page 타겟이 없다.');
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

/* ── 페이지 안에서 도는 조각 ──────────────────────────────────────────────── */

/**
 * 요소 단위 오버플로 스캔. 위 문서의 3단 필터를 그대로 구현한다.
 * 반환: `{ doc, real[], scrollers[] }`.
 */
const buildScan = (allowlist, tolerance, offenderTolerance) => `(() => {
  const ALLOW = ${JSON.stringify(allowlist)};
  const TOL = ${tolerance};
  const OFF_TOL = ${offenderTolerance};

  const desc = (el) => {
    if (!el) return 'null';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const testid = el.getAttribute('data-testid') ? '[' + el.getAttribute('data-testid') + ']' : '';
    const aria = el.getAttribute('aria-label') ? '{' + el.getAttribute('aria-label') + '}' : '';
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24);
    return tag + id + testid + aria + (text ? ' «' + text + '»' : '');
  };
  const chain = (el) => {
    const out = [];
    let node = el.parentElement;
    while (node && node !== document.documentElement && out.length < 4) {
      out.push(desc(node));
      node = node.parentElement;
    }
    return out;
  };
  /** 자손 요소 + 텍스트 조각 중 패딩 박스 좌/우를 실제로 넘는 것. 없으면 넘친 주체는 의사요소다. */
  const findOffenders = (el, padLeft, padRight) => {
    const found = [];
    for (const node of el.querySelectorAll('*')) {
      const r = node.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const out = Math.max(r.right - padRight, padLeft - r.left);
      if (out > OFF_TOL) found.push({ what: desc(node), out: Math.round(out * 100) / 100, kind: 'element' });
    }
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue || !t.nodeValue.trim()) continue;
      range.selectNodeContents(t);
      for (const r of range.getClientRects()) {
        if (r.width === 0) continue;
        const out = Math.max(r.right - padRight, padLeft - r.left);
        if (out > OFF_TOL) {
          found.push({ what: 'text «' + t.nodeValue.trim().slice(0, 24) + '»', out: Math.round(out * 100) / 100, kind: 'text' });
          break;
        }
      }
    }
    found.sort((a, b) => b.out - a.out);
    return found;
  };

  /** 자신 또는 조상 중 **가장 가까운 가로 스크롤 컨테이너**. 넘침은 거기서 멈추고 스크롤로 도달 가능해진다. */
  // ⚠ body 는 제외한다 — body 가 가로로 스크롤하는 것은 "흡수"가 아니라 **페이지 가로 스크롤 사고** 그 자체다.
  const nearestScroller = (el) => {
    for (let node = el; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const ox = getComputedStyle(node).overflowX;
      if (ox === 'auto' || ox === 'scroll') return node;
    }
    return null;
  };
  const allowReason = (el) => {
    const rule = ALLOW.find((r) => {
      try { return el.matches(r.match); } catch { return false; }
    });
    return rule ? rule.why : null;
  };

  const real = [];
  const scrollers = [];
  const seenScrollers = new Set();

  for (const el of document.querySelectorAll('*')) {
    const over = el.scrollWidth - el.clientWidth;
    if (over < TOL) continue;
    const cs = getComputedStyle(el);

    // 필터 1 — 스크롤 컨테이너(자신 또는 조상). 내용은 스크롤로 도달 가능하고 그 위로 전파되지 않는다.
    // ⚠ 조상까지 보는 이유: 스크롤러는 보통 래퍼고 **실제로 넘치는 것은 그 안쪽 트랙 div** 다
    //    (NavScroller 가 그렇다 — nav 가 auto, 넘치는 것은 자식 div). 자신만 보면 트랙이 거짓 실패로 남는다.
    const scroller = nearestScroller(el);
    if (scroller) {
      // 스크롤러 자신이 가로로 넘치지 않으면(세로 전용 auto 등) 안쪽 신호는 의사요소였다 — 조용히 넘긴다.
      const scrollerOver = scroller.scrollWidth - scroller.clientWidth;
      if (scrollerOver >= TOL && !seenScrollers.has(scroller)) {
        seenScrollers.add(scroller);
        scrollers.push({
          el: desc(scroller),
          over: scrollerOver,
          client: scroller.clientWidth,
          scroll: scroller.scrollWidth,
          why: allowReason(scroller),
          chain: chain(scroller)
        });
      }
      continue;
    }
    // 필터 2 — 클리핑 컨테이너(sr-only·말줄임 포함). 새지 않는다.
    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') continue;

    const rect = el.getBoundingClientRect();
    const padLeft = rect.left + (parseFloat(cs.borderLeftWidth) || 0);
    const padRight = rect.right - (parseFloat(cs.borderRightWidth) || 0);
    const offenders = findOffenders(el, padLeft, padRight);

    // 필터 3 — 요소도 텍스트도 안 넘었다 = 넘친 주체는 의사요소(hitArea 터치 타깃). 보이지 않는다.
    if (offenders.length === 0) continue;

    real.push({
      el: desc(el),
      over,
      client: el.clientWidth,
      scroll: el.scrollWidth,
      offenders: offenders.slice(0, 3),
      chain: chain(el)
    });
  }

  real.sort((a, b) => b.over - a.over);
  scrollers.sort((a, b) => b.over - a.over);
  return {
    doc: { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth },
    real,
    scrollers
  };
})()`;

/** 보유 종목 시드 — `/dividend/portfolio` 를 빈 상태로만 재는 것은 무의미하다. */
const SEED_SCRIPT = `(async () => {
  // 스키마 근거: pages/Portfolio/utils/portfolioStorage.ts (DB 'snowball-portfolio' / store·key 'holdings' / v1)
  const record = {
    v: 1,
    holdings: [
      { ticker: 'SCHD', quantity: 120 },
      { ticker: 'DGRO', quantity: 85 },
      { ticker: 'JEPI', quantity: 40 },
      { ticker: 'O', quantity: 33 },
      { ticker: 'SCHY', quantity: 1234.5678 }
    ],
    taxPercent: 15.4,
    updatedAt: Date.now()
  };
  await new Promise((res, rej) => {
    const open = indexedDB.open('snowball-portfolio', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('holdings')) db.createObjectStore('holdings');
    };
    open.onerror = () => rej(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('holdings', 'readwrite');
      tx.objectStore('holdings').put(record, 'holdings');
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    };
  });
  return 'seeded';
})()`;

/**
 * 🔴 뮤턴트 — 일부러 넘치는 요소 3종을 심는다. 각각 다른 원인이다:
 * 고정폭 초과 자식 / 줄바꿈 불가 긴 텍스트 / 음수 마진.
 * 셋 다 `overflow-x: visible` 이라 실제로 옆을 덮는다 = 가드가 반드시 잡아야 하는 부류.
 */
const MUTANT_SCRIPT = `(() => {
  const host = document.createElement('div');
  host.id = '__overflow_mutant__';
  host.style.cssText = 'width:200px;margin:0 auto;';
  host.innerHTML =
    '<div data-testid="mutant-child" style="width:200px;overflow-x:visible"><div style="width:260px;height:8px;background:#f00"></div></div>' +
    '<div data-testid="mutant-text" style="width:200px;overflow-x:visible;white-space:nowrap;font-size:12px">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</div>' +
    '<div data-testid="mutant-margin" style="width:200px;overflow-x:visible"><div style="height:8px;margin-right:-40px;background:#00f"></div></div>';
  document.body.appendChild(host);
  return 'planted';
})()`;

const REMOVE_MUTANT = `(() => {
  const host = document.getElementById('__overflow_mutant__');
  if (host) host.remove();
  return 'removed';
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

const SCAN = buildScan(INTENTIONAL_SCROLLERS, OVERFLOW_TOLERANCE, OFFENDER_TOLERANCE);

console.log(`[overflowprobe] ${mode} · ${BASE}`);
console.log(
  `  계약: overflow-x:visible 요소가 자손 박스/텍스트로 ${OVERFLOW_TOLERANCE}px 이상 새면 실패` +
    ` · 스크롤/클리핑 컨테이너와 터치 타깃 의사요소는 세지 않는다`
);

if (SEED) {
  await cdp.send('Page.navigate', { url: `${BASE}/` });
  await sleep(1500);
  try {
    await evaluate(SEED_SCRIPT);
    console.log('  시드: 보유 종목 5건 (SCHD·DGRO·JEPI·O·SCHY)');
  } catch (error) {
    console.log(`  시드 실패(무시하고 진행): ${String(error).slice(0, 120)}`);
  }
}

const failures = [];
let mutantFailures = 0;

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

    const scan = await evaluate(SCAN);
    const label = `${route.padEnd(24)} ${String(width).padStart(4)}px`;

    if (scan.doc.scroll > scan.doc.client) {
      failures.push(`${label} — 문서 가로 오버플로 ${scan.doc.scroll} > ${scan.doc.client}`);
    }
    for (const hit of scan.real) {
      failures.push(
        `${label} — ${hit.el} 이 ${hit.over}px 샌다 (client ${hit.client} / scroll ${hit.scroll})\n` +
          `        원인: ${hit.offenders.map((o) => `${o.what} +${o.out}px`).join(' · ')}\n` +
          `        위치: ${hit.chain.join(' < ')}`
      );
    }

    const unknown = scan.scrollers.filter((s) => !s.why);
    if (scan.real.length) {
      console.log(`  ✗ ${label}  새는 요소 ${scan.real.length}개`);
      for (const hit of scan.real) console.log(`      ${hit.el} +${hit.over}px ← ${hit.offenders[0]?.what}`);
    } else {
      console.log(`  ✓ ${label}  새는 요소 0 · 의도적 스크롤 ${scan.scrollers.length}개(허용 ${scan.scrollers.length - unknown.length})`);
    }
    if (VERBOSE || unknown.length) {
      for (const s of scan.scrollers) {
        const tag = s.why ? `허용 — ${s.why}` : 'INFO 목록에 없는 스크롤 컨테이너 (의도한 것인지 확인하라)';
        console.log(`      ↔ ${s.el} ${s.client}→${s.scroll}  [${tag}]`);
      }
    }

    /* 🔴 감도 자가검증: 심은 뒤 정확히 3건 늘어나야 한다. */
    if (MUTANT) {
      await evaluate(MUTANT_SCRIPT);
      await sleep(200);
      const after = await evaluate(SCAN);
      await evaluate(REMOVE_MUTANT);
      await sleep(200);
      const restored = await evaluate(SCAN);

      const marks = ['mutant-child', 'mutant-text', 'mutant-margin'];
      const caughtMarks = marks.filter((m) => after.real.some((hit) => hit.el.includes(`[${m}]`)));
      const missed = marks.filter((m) => !caughtMarks.includes(m));
      const restoredOk = restored.real.length === scan.real.length;
      const ok = missed.length === 0 && restoredOk;
      console.log(
        `      뮤턴트: 심기 전 ${scan.real.length}건 → 심은 뒤 ${after.real.length}건` +
          `(${caughtMarks.length}/3종 지목: ${caughtMarks.join('·') || '없음'}) → 제거 후 ${restored.real.length}건 ${ok ? '✓' : '✗'}`
      );
      if (!ok) {
        mutantFailures += 1;
        failures.push(
          `${label} — 뮤턴트 감도 실패: ` +
            (missed.length ? `못 잡은 종류 ${missed.join('·')} · ` : '') +
            (restoredOk ? '' : `제거 후 ${restored.real.length}건 (기대 ${scan.real.length}건)`)
        );
      }
    }
  }
}

cdp.close();
if (child) child.kill();

if (failures.length) {
  console.error(`\n[overflowprobe] ${failures.length}건 실패${mutantFailures ? ` (뮤턴트 ${mutantFailures}건 포함)` : ''}`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log('\n[overflowprobe] 전부 통과');
