#!/usr/bin/env node
/**
 * tintscan — 라우트마다 **틴트 면이 몇 개인지 실제로 그려서 센다**. 외부 의존성 0(Node 빌트인 fetch + WebSocket).
 *
 * 왜 있나. `DESIGN.md` §2-6 이 "한 화면에 틴트 면은 최대 2개"를 규칙으로 적어 뒀는데 **아무도 세지 않아서**
 * `/dividend/portfolio` 가 5개까지 늘어난 채로 배포돼 있었다(히어로 + 클라우드 안내 배너 + 빈 상태 보드 +
 * 목표 진행바 + 성공 상태 줄). 이건 **소스 스캔으로 잡을 수 없다** — 각 면은 각자의 파일에서 각자 옳고,
 * "한 화면에 몇 개가 동시에 서는가"는 라우트를 실제로 조립해야만 나오는 값이다. jsdom 도 못 잡는다
 * (레이아웃·`@media` 미평가라 `getBoundingClientRect` 가 전부 0).
 *
 * ```sh
 * node tools/dev/tintscan.mjs                                   # 기본 4시나리오 × 1280·390px
 * node tools/dev/tintscan.mjs --url http://localhost:5199       # dev 서버 포트가 다를 때
 * node tools/dev/tintscan.mjs --route /dividend/portfolio --width 390,1280
 * node tools/dev/tintscan.mjs --json                            # 기계용
 * ```
 *
 * ## 🔴 이 도구가 조용히 거짓말한 세 번째 방식 — "기본 라우트가 전부 상태 없는 화면"
 * 처음 두 번은 **빈 화면(0개 통과)**과 **폭에 따라 뒤집히는 판정**이었다(아래 각 주석 참고).
 * 세 번째는 더 얌전했다: 기본 3라우트는 저장소를 비우고 열기 때문에 **목표 미설정·경고 없음·
 * 보유 0** 인 화면이라 이 앱이 실제로 만드는 색 면의 절반을 애초에 안 만든다. 그래서 결과 카드에
 * 성공 틴트가 새로 생겨 **한 화면 4개**가 된 회귀가 가드 그린인 채로 통과했다(2026-07-31 리뷰 B1).
 * → 기본 목록에 **"이 화면이 가질 수 있는 최대 상태"** 시나리오를 고정 공유코드로 넣었고,
 *   폭도 1280 **과** 390 둘 다를 기본값으로 돌린다.
 *
 * ## 틴트 면의 정의(측정 가능한 형태로)
 * 스코프(`--scope`, 기본 `main`) 안에서 아래를 **전부** 만족하는 엘리먼트 하나 = 면 하나.
 *  1. 실제로 보인다(`display`/`visibility`/`opacity` + 면적).
 *  2. 폭 ≥ `--min-width`(기본 180px), 높이 ≥ `--min-height`(기본 8px).
 *  2-1. **클러스터 옵트인**(2026-08-03, D1 승인): 격자 부모가 `data-tint-cluster="<값>"` 을 내면
 *       그 안의 **같은 배경값을 가진 동형 형제들은 합쳐서 1면**으로 센다. 카드 6장의 컬러 캡이
 *       사람 눈에는 하나의 색 덩어리이기 때문이다. 🔴 상한은 올리지 않았다 — 세는 방법만 바뀐다.
 *       ⚠ 라우트당 표식은 **한 값**만 허용한다(다양성 자체가 우회 수단이라 집계 단계가 막는다).
 *     ⚠ 높이 하한이 8px 인 이유: **10px 짜리 진행바도 눈에는 색 면**이다(위 5개 중 하나였다).
 *     4px 짜리 오로라 리본은 여기서 빠진다 — 그건 "면"이 아니라 선이고, 리본은 이 앱의 시그니처다.
 *  3. 배경이 중립이 아니다 = `background-image !== none`(그라디언트) **또는** `background-color` 가
 *     중립 토큰 집합(`--sb-bg`·`surface`·`surface-raised`·`surface-muted`·`surface-sunken`·
 *     `surface-hover`·`progress-track`)이 아니다. 값은 **런타임 `:root` 에서 읽어** 비교하므로
 *     프리셋(8종)·다크모드를 갈아 끼워도 그대로 동작한다.
 *
 * ## 스코프에서 뺀 것 — 왜
 *  - **전역 헤더**(`AppHeader`, brand 틴트 글래스): 모든 라우트에 상시 서는 앱 크롬이라 라우트 간
 *    비교값에 상수로만 얹힌다. `<main>` 안쪽 = "이 페이지가 만든 면"만 센다.
 *  - **의사요소**(`::before` 리본·히어로 상단 4px 띠): DOM 열거 대상이 아니고, 위 높이 하한에도 걸린다.
 *
 * ## 한 라우트 = 한 화면으로 센다
 * 문서 전체를 센다(뷰포트 한 칸이 아니라). 스크롤 위치에 따라 값이 달라지면 가드로 못 쓰고,
 * "위에서부터 쭉 내리면서 색 면이 몇 번 나오나"가 사람이 실제로 겪는 것이기도 하다.
 * ⚠ 측정 전에 문서 끝까지 한 번 훑는다 — 이 레포의 공용 `Card` 는 `content-visibility: auto` 라
 * 뷰포트 밖이면 **DOM 측정까지 거짓말한다**(pitfalls 2026-07-29).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
/** `{ route, max?, label? }` — `--route` 로 들어온 것은 `max` 없이(= 전역 상한) 검사한다. */
const routes = [];
const clicks = [];
let baseUrl = 'http://localhost:5173';
let widths = [1280, 390];
let height = 900;
let max = 2;
let minWidth = 180;
let minHeight = 8;
let scope = 'main';
let waitMs = 2500;
let port = 9223;
let asJson = false;
let keepOpen = false;

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  const next = () => argv[(i += 1)];
  if (arg === '--url') baseUrl = next().replace(/\/$/, '');
  else if (arg === '--route') routes.push({ route: next() });
  else if (arg === '--width') widths = next().split(',').map((v) => Number(v.trim())).filter(Boolean);
  else if (arg === '--height') height = Number(next());
  else if (arg === '--max') max = Number(next());
  else if (arg === '--min-width') minWidth = Number(next());
  else if (arg === '--min-height') minHeight = Number(next());
  else if (arg === '--scope') scope = next();
  else if (arg === '--click') clicks.push(next());
  else if (arg === '--wait') waitMs = Number(next());
  else if (arg === '--port') port = Number(next());
  else if (arg === '--json') asJson = true;
  else if (arg === '--keep') keepOpen = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(`tintscan — 라우트별 틴트 면 개수를 실측한다 (DESIGN.md §2-6: 한 화면에 최대 2개)

  --url <u>         dev 서버 베이스. 기본 ${baseUrl}
  --route <path>    검사할 라우트(여러 번 지정 가능). 기본 4종(아래 DEFAULT_SCENARIOS)
  --width <n[,n]>   뷰포트 폭. 기본 1280,390 — 좁은 폭에서만 뒤집히는 판정이 실제로 있었다
  --height <n>      기본 900
  --max <n>         라우트당 허용 개수. 초과하면 exit 1. 기본 2
                    (기본 시나리오 중 '선재 부채' 표시가 붙은 것만 자기 상한을 따로 갖는다)
  --min-width <n>   면으로 칠 최소 폭. 기본 180
  --min-height <n>  면으로 칠 최소 높이. 기본 8 (진행바 포함, 4px 리본 제외)
  --scope <sel>     세는 범위. 기본 'main'(없으면 body) — 전역 헤더를 뺀다
  --click <text>    측정 전에 보이는 글자로 버튼을 누른다(여러 번 = 순서대로) — 빈 상태가 아닌 화면을 만든다
  --json            JSON 출력
  --keep            브라우저를 남긴다`);
    process.exit(0);
  }
}

/**
 * 시뮬레이터가 **가질 수 있는 최대 상태**를 담은 고정 공유코드.
 *
 * 이 코드를 열면 무엇이 서는가(다음 사람이 lz-string 을 못 읽는다 — 그래서 여기 적는다):
 *  - 종목 1개(SCHD)로 결과 카드 전부가 실제로 그려진다(빈 화면이 아니다).
 *  - **목표 월배당 50만원이 기간 안에 도달**한다 → 결과 요약 카드의 목표 타일이 '달성' 상태가 된다.
 *  - 투자 기간이 길어 **세전 연 배당이 2,000만원(금융소득 종합과세)을 넘는다** → 경고 배너가 뜬다.
 * 즉 "목표를 세우고 → 도달을 보고 → 종합과세 안내를 받는" 이 앱의 핵심 경로이고,
 * **예외 상태가 아니다**. 기본 3라우트는 저장소를 비우고 열기 때문에 이 셋 중 하나도 만들지 않는다.
 *
 * ⚠ 공유 링크 스키마는 사용자 자산이라 바뀌지 않는다(하위 호환 규칙) — 이 상수는 안정적이다.
 *   만약 이 코드가 열리지 않게 되면 그것 자체가 더 큰 회귀 신호다(가드는 '측정 불가'로 실패한다).
 */
const GOAL_REACHED_SHARE =
  '/simulator?share=N4IgbiBcDMA0IAcqgC5QNrpAZQMIAkAREWAJgHZZoA6ANlgA5YBOagVivkAihwHZaQBdfgF94AS2QgAhlACMABgWKF8AEaylykAGMobDfAAmUEKTmlaAWjkyrMkiACmUU-ABms+AHN1c+AAtZNmoAFjEoXxAAK3D4AGsYkAAbBIBbBIA7BIB7BKRIciEhIA';

/**
 * 기본 검사 대상. `/portfolio` 가 아니라 `/dividend/portfolio` 다(`*` 가 404 로 보낸다).
 *
 * `max` 는 **그 라우트의 현재 기준선**이다. 없는 항목은 전역 상한(§2-6 의 2개)을 따른다.
 * 🔴 기준선을 **올리지 마라** — 올리는 순간 이 가드는 장식이 된다. 내리는 방향만 허용한다.
 */
const DEFAULT_SCENARIOS = [
  { route: '/dividend/portfolio' },
  /* 🔴 시뮬레이터는 `/simulator` 다(2026-08-01 이전 완료). `/` 는 랜딩이라 여기서 재면 **다른 화면을
     시뮬레이터의 기준선으로** 재게 된다 — 그래서 둘을 **각각** 잰다(아래 랜딩 항목). */
  { route: '/simulator' },
  {
    route: '/',
    label: '/ (랜딩)',
    /*
     * 🔴 **랜딩의 기준선 2 는 실측값이다**(2026-08-01, 1280·390 둘 다 2개 — 폭에 따라 뒤집히지 않는다).
     * 내역: ①히어로 `header` gradient(rgb 222,236,246 → …) ②"앱에서 해보는 순서" 안내 블록
     * gradient(rgb 237,245,250 → …). 전역 상한과 같은 값이라 `max` 를 생략해도 동작은 같지만,
     * **재 봤다는 사실**을 남기려고 명시한다 — 목록에 없으면 세 번째 면이 생겨도 초록이었다.
     *
     * 랜딩은 이 앱에서 가장 큰 신규 지면이고 색을 얹고 싶은 유혹이 가장 큰 곳이다(FAQ 섹션 배경·
     * 검색 패널 액센트 면 등). 🔴 3 으로 **올리지 마라** — `.claude/knowledge/decisions.md` 가
     * "랜딩 틴트 면 정확히 2개"를 확정으로 적고 있고, 그 문장을 재는 유일한 도구가 이 항목이다.
     */
    max: 2
  },
  { route: '/dividend/calendar' },
  {
    /* 🔴 경로는 `/simulator?share=` 다 — 2026-08-01 에 `/` 의 리다이렉트를 걷어냈으므로 구 `/?share=`
       로 두면 이 항목이 **랜딩을 재고** 목표 도달 화면은 아무도 안 재는 상태가 된다(그때도 초록이라 조용하다). */
    route: GOAL_REACHED_SHARE,
    label: '/simulator?share=… (목표 도달 + 종합과세 경고)',
    /*
     * 🔴 3 은 **선재 부채**이고 이 시나리오의 기준선이다(2026-07-31 리뷰 B1 수리 시점 실측).
     * 내역: ①히어로 gradient-hero ②hero 타일 accent-subtle ③종합과세 warning 배너.
     * 여기서 4가 나오면 **새로 생긴 면**이라는 뜻이다 — 그게 이 항목을 넣은 이유다.
     * 2로 내리려면 hero 타일의 액센트 면을 중립으로 내려야 하는데 그건 결과 카드의 주인공
     * 표시를 약화시키는 결정이라 **사용자 결정 대기**다. 임의로 3→4 로 올리지 마라.
     */
    max: 3
  }
];

if (routes.length === 0) routes.push(...DEFAULT_SCENARIOS);

/*
 * Windows Git Bash(MSYS)는 `/dividend/portfolio` 같은 인자를 **윈도 경로로 바꿔치기한다**
 * (`C:/Program Files/Git/dividend/portfolio`). 그대로 두면 CDP 가 "invalid URL" 로 죽어서
 * 원인을 인자 파싱이 아니라 브라우저에서 찾게 된다 — 여기서 먼저 잡고 해법을 알려준다.
 */
const mangled = routes.filter((entry) => !entry.route.startsWith('/')).map((entry) => entry.route);
if (mangled.length > 0) {
  console.error(`[tintscan] 라우트가 '/' 로 시작하지 않는다: ${mangled.join(', ')}`);
  console.error("          Git Bash 라면 경로 변환 때문이다 — 'MSYS_NO_PATHCONV=1 node tools/dev/tintscan.mjs …' 로 실행하라.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 브라우저 (uiprobe 와 같은 부트스트랩) ─────────────────────────────────── */

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
    console.error('[tintscan] 크롬/엣지를 찾지 못했다. 설치 경로를 확인하라.');
    process.exit(1);
  }

  /*
   * uiprobe 와 프로파일을 나눈다 — 두 도구를 동시에 돌려도 서로의 세션을 잠그지 않는다.
   * ⚠ **포트까지 경로에 넣는다.** 한 프로파일은 한 크롬 인스턴스만 잠그므로, `--port` 만 나눠서는
   *   병렬 트랙 중 뒤에 뜬 쪽이 'CDP 가 뜨지 않았다' 로 죽는다(스크립트 버그처럼 보인다).
   *   overflowprobe 의 `overflowprobe-profile-${PORT}` 와 같은 어법이다.
   */
  const profile = resolve(`node_modules/.cache/tintscan-profile-${port}`);
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
  console.error('[tintscan] CDP 가 뜨지 않았다.');
  process.exit(1);
};

const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[tintscan] page 타겟이 없다.');
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

/** 보이는 글자로 버튼을 눌러 상태를 만든다(uiprobe 와 같은 어법). 빈 화면만 세면 가드가 반쪽이다. */
const clickByText = (needle) => `(() => {
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();
  const target = [...document.querySelectorAll('button, [role="button"], a')]
    .find((el) => name(el).includes(${JSON.stringify(needle)}));
  if (!target) return 'not-found';
  target.click();
  return 'clicked: ' + name(target).slice(0, 40);
})()`;

/**
 * 🔴 **화면이 실제로 떴는가.** 이게 없으면 가드가 거짓말을 한다 — 앱이 마운트되기 전에 세면
 * "틴트 면 0개 ✓"가 나온다(실측: 병렬 트랙의 HMR 무효화로 콜드 로드가 2.5초를 넘긴 순간
 * 세 라우트 전부 0개로 통과했다). **빈 화면은 통과가 아니라 측정 불가다.**
 */
const readyExpr = (scopeSelector) => `(() => {
  const root = document.querySelector(${JSON.stringify(scopeSelector)}) || document.body;
  return (root.innerText || '').trim().length > 40;
})()`;

/**
 * 틴트 면 수집기.
 *
 * 중복(같은 면을 부모·자식이 두 번 세는 것)은 **면적으로** 접는다: 틴트 조상이 이미 있고 그 조상을
 * 90% 이상 덮으면 같은 면이다(래퍼 + 안쪽 채움 = 한 덩어리로 보인다). 그 외의 안쪽 틴트(예: 카드 안
 * 성공 줄)는 사람 눈에도 별개의 면이라 따로 센다.
 */
const scanExpr = (options) => `(async () => {
  const OPT = ${JSON.stringify(options)};
  const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try { await document.fonts.ready; } catch {}

  // content-visibility: auto 대응 — 끝까지 한 번 훑어야 아래쪽 카드가 실제 크기를 말한다.
  const pageHeight = () => document.documentElement.scrollHeight;
  for (let y = 0; y < pageHeight(); y += window.innerHeight) {
    window.scrollTo(0, y);
    await raf();
  }
  window.scrollTo(0, 0);
  await raf();

  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const toRgb = (value) => { probe.style.color = ''; probe.style.color = value; return getComputedStyle(probe).color; };

  const rootStyle = getComputedStyle(document.documentElement);
  const neutral = new Set(['rgba(0, 0, 0, 0)', 'transparent']);
  for (const name of OPT.neutralVars) {
    const raw = rootStyle.getPropertyValue(name).trim();
    if (raw) neutral.add(toRgb(raw));
  }
  probe.remove();

  const root = document.querySelector(OPT.scope) || document.body;
  const faces = [];
  const label = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter((c) => c && !/^css-/.test(c));
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls.length ? '.' + cls.join('.') : '');
  };

  for (const el of [root, ...root.querySelectorAll('*')]) {
    /*
     * 누를 수 있는 것은 **액션이지 면이 아니다.** 채워진 CTA(gradient-cta)·칩·탭은 색을 갖는 것이
     * 정상이고 §2-6 이 말하는 대상이 아니다. 넣어 두면 좁은 폭에서만 거짓 양성이 난다
     * (실측 390px: 전폭이 된 "종목 추가" 버튼 316×40 이 면으로 잡혔다 — 1280px 에서는 180px 미만이라
     * 안 잡혀서 **폭에 따라 결과가 뒤집혔다**).
     * ⚠ 한계: 카드 전체가 링크인 큰 틴트 표면은 여기서 빠진다. 그런 화면은 눈으로 봐야 한다.
     */
    if (el.closest('button, a, input, select, textarea, summary, [role="button"], [role="tab"]')) continue;

    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < OPT.minWidth || rect.height < OPT.minHeight) continue;

    const image = cs.backgroundImage !== 'none';
    const colored = !neutral.has(cs.backgroundColor);
    if (!image && !colored) continue;

    const area = rect.width * rect.height;
    const parentFace = faces.find((f) => f.el.contains(el));
    // 조상 면을 거의 그대로 덮으면 같은 면이다(래퍼/채움) — 두 번 세지 않는다.
    if (parentFace && area >= parentFace.area * 0.9) continue;

    /*
     * 🔴 **클러스터 옵트인(D1, 2026-08-03 사용자 승인)** — 같은 격자 안의 **동형 형제 캡들은 합쳐서 1면**이다.
     *
     * 왜 필요한가: 개편안이 "고르는 면"(프리셋 카드·티커 허브 카드)에 컬러 캡을 두르는데, 카드 6장이면
     * 면이 6개로 세어져 상한 2를 즉시 깬다. 그런데 사람 눈에 그건 **하나의 색 덩어리**다 — 같은 값이
     * 반복되는 격자는 "면 여섯 개"가 아니라 "카드 목록 하나"로 읽힌다.
     *
     * 🔴 **상한은 한 줄도 올리지 않았다.** 바뀐 것은 세는 방법뿐이다. 그리고 **옵트인**이라
     *   조용한 예외가 아니다 — 표식이 없으면 종전대로 하나씩 세어진다.
     * ⚠ 표식은 격자 **부모**가 낸다(data-tint-cluster="pick-grid"). 자식마다 붙이면 의미가 없다.
     * ⚠ 이 블록은 템플릿 리터럴 안이다 — **주석에 백틱을 쓰지 마라.** 문자열이 그 자리에서 끊긴다.
     * ⚠ 라우트당 **한 값만** 허용한다 — 값을 여러 개 만들면 "묶어서 세기"를 상한 우회로 쓸 수 있다.
     *   그 검사는 아래 집계 단계가 한다.
     */
    const cluster = el.closest('[data-tint-cluster]');
    const clusterKey = cluster ? cluster.getAttribute('data-tint-cluster') : null;

    faces.push({
      el,
      area,
      clusterKey,
      selector: label(el),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top + window.scrollY),
      background: image ? cs.backgroundImage.slice(0, 48) : cs.backgroundColor,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 32)
    });
  }

  /*
   * 클러스터 접기 — 같은 표식값 + **같은 배경값**이면 한 면으로 접는다.
   * 🔴 배경값까지 같아야 하는 이유: 표식 하나로 서로 다른 색면을 무제한 숨길 수 있으면 그건 우회다.
   *   색이 다르면 눈에도 다른 덩어리라 따로 세는 것이 맞다.
   */
  const collapsed = [];
  const seenCluster = new Set();
  for (const face of faces) {
    if (face.clusterKey) {
      const key = face.clusterKey + '|' + face.background;
      if (seenCluster.has(key)) {
        collapsed[collapsed.length - 1].mergedCount += 1;
        continue;
      }
      seenCluster.add(key);
      collapsed.push({ ...face, mergedCount: 1 });
      continue;
    }
    collapsed.push({ ...face, mergedCount: 1 });
  }

  const clusterKeys = [...new Set(faces.map((f) => f.clusterKey).filter(Boolean))];

  return {
    scope: OPT.scope,
    count: collapsed.length,
    rawCount: faces.length,
    clusterKeys,
    faces: collapsed.map(({ el, area, ...rest }) => rest)
  };
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
 * 🔴 **라우트마다 저장소를 비운다 — 안 그러면 가드가 결정적이지 않다.**
 *
 * 두 가지가 새어 든다.
 *  ① 프로파일(`node_modules/.cache/tintscan-profile`)이 실행 사이에 살아남는다 — `--click` 으로
 *    종목을 한 번 추가하고 나면 다음 실행의 "기본 상태"가 조용히 달라진다(실측: 빈 상태 2개 → 4개).
 *  ② **공유 링크는 열리는 순간 그 시나리오를 영속 계층에 쓴다.** 그래서 목표 도달 시나리오를 한 번
 *    열고 나면 그 뒤의 `/`·`/dividend/portfolio` 가 남의 목표·보유를 물려받는다(실측: 둘 다 2 → 3,
 *    포트폴리오에는 있지도 않은 목표 진행바 193×8 이 생겼다). 실행 시작에 한 번만 지우면 못 막는다.
 *
 * 순서가 중요하다: **about:blank 로 먼저 떠난 뒤** 지운다. 이 앱은 언마운트에서 대기 중인 저장을
 * flush 하므로, 지우고 나서 이동하면 그 flush 가 지운 뒤에 다시 쓴다.
 *
 * 우리가 띄운 브라우저일 때만 지운다 — 붙은 경우(사람이 열어 둔 창)에는 그 사람의 로컬 데이터다.
 */
const resetOrigin = async () => {
  if (mode !== 'launched') return;
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(250);
  await cdp.send('Storage.clearDataForOrigin', { origin: baseUrl, storageTypes: 'all' });
};

if (mode !== 'launched') {
  console.warn('[tintscan] 기존 브라우저에 붙었다 — 저장소를 지우지 않으므로 화면 상태가 기본값이 아닐 수 있다.');
}

const NEUTRAL_VARS = [
  '--sb-bg',
  '--sb-surface',
  '--sb-surface-raised',
  '--sb-surface-muted',
  '--sb-surface-sunken',
  '--sb-surface-hover',
  '--sb-progress-track'
];

const report = [];

for (const width of widths) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });

  for (const entry of routes) {
    const { route } = entry;
    // 시나리오가 자기 기준선을 갖고 있으면 그것을, 없으면 전역 상한을 쓴다.
    const limit = entry.max ?? max;
    const label = entry.label ?? route;

    await resetOrigin();
    await cdp.send('Page.navigate', { url: `${baseUrl}${route}` });
    await sleep(waitMs);

    // 콜드 로드(dev 서버 첫 변환)는 몇 초씩 걸린다 — 뜰 때까지 기다리되, 안 뜨면 **실패로** 끝낸다.
    let mounted = await evaluate(readyExpr(scope));
    for (let attempt = 0; attempt < 16 && !mounted; attempt += 1) {
      await sleep(1500);
      mounted = await evaluate(readyExpr(scope));
    }
    if (!mounted) {
      report.push({ width, route, label, limit, clicked: [], scope, count: null, faces: [] });
      continue;
    }

    const clicked = [];
    for (const text of clicks) {
      clicked.push(`${text} → ${await evaluate(clickByText(text))}`);
      await sleep(800);
    }

    const result = await evaluate(scanExpr({ scope, minWidth, minHeight, neutralVars: NEUTRAL_VARS }));
    report.push({ width, route, label, limit, clicked, ...result });
  }
}

cdp.close();
if (child && !keepOpen) child.kill();

if (asJson) {
  console.log(JSON.stringify({ baseUrl, max, minWidth, minHeight, scope, results: report }, null, 2));
} else {
  console.log(`[tintscan] ${mode} · ${baseUrl} · 상한 ${max}개 · 면 기준 ≥${minWidth}×${minHeight}px · scope='${scope}'`);
  for (const entry of report) {
    if (entry.count === null) {
      console.log(`  ${String(entry.width).padStart(4)}px  ✗ 측정 불가  ${entry.label} — 화면이 뜨지 않았다(dev 서버·앱 오류를 먼저 보라)`);
      continue;
    }
    const mark = entry.count > entry.limit ? '✗' : '✓';
    // 기준선이 전역 상한보다 높으면 그 사실을 매 줄에 적는다 — 조용한 예외는 곧 잊힌 예외다.
    const debt = entry.limit > max ? ` (기준선 ${entry.limit} · 선재 부채)` : '';
    const trail = entry.clicked.length > 0 ? `  [${entry.clicked.join(' · ')}]` : '';
    /* 클러스터로 접힌 만큼을 **매 줄에 적는다** — 접었다는 사실이 안 보이면 그게 조용한 예외다. */
    const folded = entry.rawCount > entry.count ? ` (클러스터로 ${entry.rawCount}→${entry.count} 접힘)` : '';
    console.log(`  ${String(entry.width).padStart(4)}px  ${mark} ${String(entry.count).padStart(2)}개  ${entry.label}${debt}${folded}${trail}`);
    for (const face of entry.faces) {
      const merged = face.mergedCount > 1 ? `  ×${face.mergedCount}(클러스터 ${face.clusterKey})` : '';
      console.log(
        `           y=${String(face.top).padStart(5)}  ${face.width}×${face.height}  ${face.selector}  ${face.background}  "${face.text}"${merged}`
      );
    }
  }
}

// 측정 불가도 실패다 — "안 세어졌다"를 "0개라 통과"로 접으면 가드가 아니라 장식이 된다.
const unmeasured = report.filter((entry) => entry.count === null);
if (unmeasured.length > 0) {
  console.error(`[tintscan] 측정 불가 ${unmeasured.length}건 — ${unmeasured.map((e) => e.label).join(', ')}`);
  process.exit(1);
}

/*
 * 🔴 **라우트당 클러스터 표식은 한 값뿐이다.**
 * 값을 여러 개 만들면 "묶어서 세기"가 상한 우회 수단이 된다 — 격자마다 다른 이름을 붙이면
 * 면 N개가 전부 1개씩으로 접힌다. 그래서 표식의 **다양성 자체**를 여기서 막는다.
 * (같은 값 안에서 배경색이 다르면 접히지 않는 것은 수집기 쪽 규칙이다.)
 */
const multiCluster = report.filter((entry) => (entry.clusterKeys?.length ?? 0) > 1);
if (multiCluster.length > 0) {
  console.error(
    `[tintscan] 클러스터 표식 남용 ${multiCluster.length}건 — 라우트당 한 값만 허용한다: ` +
      multiCluster.map((e) => `${e.label} @${e.width}px [${e.clusterKeys.join(', ')}]`).join(', ')
  );
  process.exit(1);
}

const over = report.filter((entry) => entry.count > entry.limit);
if (over.length > 0) {
  console.error(
    `[tintscan] 상한 초과 ${over.length}건 — ${over.map((e) => `${e.label} @${e.width}px (${e.count}/${e.limit})`).join(', ')}`
  );
  process.exit(1);
}
