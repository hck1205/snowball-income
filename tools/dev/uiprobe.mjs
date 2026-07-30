#!/usr/bin/env node
/**
 * uiprobe — 돌아가는 앱을 **실제로 그려서** 재고 찍는다. 외부 의존성 0(Node 빌트인 fetch + WebSocket).
 *
 * 왜 있나. 이 레포에는 **렌더 테스트로는 못 잡는 결함**이 반복해서 난다 —
 * 아이콘 정렬 어긋남, 좁은 폭 가로 오버플로, 컨테이너 쿼리·컨테인먼트로 잘리는 카드.
 * jsdom 은 레이아웃을 계산하지 않으므로(`@media`·`getBoundingClientRect` 전부 0) 테스트가 통과해도
 * 화면은 깨져 있을 수 있다. 그때마다 CDP 스크립트를 즉석에서 다시 짜는 낭비가 매 세션 반복됐다
 * (2026-07-29 하루에만 8개). 그 일을 여기 한 곳으로 모은다.
 *
 * **가장 중요한 기능은 `--shot` 이다.** 결과를 PNG 로 남기면 사람이든 에이전트든 **눈으로 확인**할 수
 * 있다. 보지 않고 고치는 것이 이 레포에서 가장 비쌌던 실패였다.
 *
 * ```sh
 * npm run uiprobe -- --shot tmp/main.png --width 390
 * npm run uiprobe -- --overflow --width 320,360,390,768,1200
 * npm run uiprobe -- --eval "document.querySelectorAll('button').length"
 * npm run uiprobe -- --click "워렌 버핏" --click "적용" --wait 2000 --shot tmp/result.png
 * ```
 *
 * 옵션
 *   --url <u>        기본 http://localhost:5173/
 *   --width <n[,n]>  뷰포트 폭(쉼표로 여러 개 → 각각 순회). 기본 1280
 *   --height <n>     기본 900
 *   --wait <ms>      각 단계 뒤 대기. 기본 2500(첫 로드), 800(클릭 뒤)
 *   --click <text>   보이는 글자로 버튼을 찾아 누른다(여러 번 지정 가능, 순서대로)
 *   --eval <expr>    페이지 안에서 평가할 식. 결과를 JSON 으로 출력
 *   --shot <path>    스크린샷 PNG 저장(폭마다 파일명에 폭이 붙는다)
 *   --overflow       가로 오버플로 검사(scrollWidth > clientWidth) — 이 레포 단골 결함
 *   --align          한 줄 안 세로 정렬 검사(글자 잉크 중심 ↔ 아이콘·선·배지 중심) — 아래 참고
 *   --port <n>       CDP 포트. 기본 9222
 *   --keep           끝나고 브라우저를 남긴다(이어서 수동 확인할 때)
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const clicks = [];
let url = 'http://localhost:5173/';
let widths = [1280];
let height = 900;
let waitMs = null;
let evalExpr = null;
let shotPath = null;
let checkOverflow = false;
let checkAlign = false;
let port = 9222;
let keepOpen = false;

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  const next = () => argv[(i += 1)];
  if (arg === '--url') url = next();
  else if (arg === '--width') widths = next().split(',').map((v) => Number(v.trim())).filter(Boolean);
  else if (arg === '--height') height = Number(next());
  else if (arg === '--wait') waitMs = Number(next());
  else if (arg === '--click') clicks.push(next());
  else if (arg === '--eval') evalExpr = next();
  else if (arg === '--shot') shotPath = next();
  else if (arg === '--overflow') checkOverflow = true;
  else if (arg === '--align') checkAlign = true;
  else if (arg === '--port') port = Number(next());
  else if (arg === '--keep') keepOpen = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(`uiprobe — 앱을 실제로 그려서 재고 찍는다

  --url <u>        기본 ${url}
  --width <n[,n]>  뷰포트 폭(여러 개면 순회). 기본 1280
  --height <n>     기본 900
  --wait <ms>      단계 뒤 대기
  --click <text>   보이는 글자로 버튼을 눌러 상태를 만든다(여러 번 가능)
  --eval <expr>    페이지에서 평가할 식 → JSON 출력
  --shot <path>    PNG 저장(폭마다 파일명에 폭이 붙는다) ← 눈으로 확인하는 용도
  --overflow       가로 오버플로 검사
  --align          한 줄 세로 정렬 검사(잉크 중심 ↔ 아이콘 중심)
  --keep           브라우저를 남긴다`);
    process.exit(0);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 브라우저 ─────────────────────────────────────────────────────────────── */

/** 설치된 크로미움 계열을 찾는다. 없으면 사용자에게 경로를 알려주고 끝낸다(무음 실패 금지). */
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
  if (await cdpReady()) return 'attached'; // 이미 떠 있으면 그대로 붙는다(재기동 낭비 없음)

  const browser = findBrowser();
  if (!browser) {
    console.error('[uiprobe] 크롬/엣지를 찾지 못했다. 설치 경로를 확인하라.');
    process.exit(1);
  }

  const profile = resolve('node_modules/.cache/uiprobe-profile');
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
  console.error('[uiprobe] CDP 가 뜨지 않았다.');
  process.exit(1);
};

/** CDP 연결 하나. 메서드 호출은 전부 여기로 간다. */
const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[uiprobe] page 타겟이 없다.');
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

/** 보이는 글자로 버튼을 찾아 누른다. aria-label 과 textContent 를 모두 본다. */
const clickByText = (needle) => `(() => {
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();
  const target = [...document.querySelectorAll('button, [role="button"], a')]
    .find((el) => name(el).includes(${JSON.stringify(needle)}));
  if (!target) return 'not-found';
  target.click();
  return 'clicked: ' + name(target).slice(0, 40);
})()`;

/**
 * 가로 오버플로 검사. 이 레포 단골 결함이라 범인 후보까지 같이 준다 —
 * "문서가 넘쳤다"만 알면 어디를 봐야 할지 모른다.
 */
const OVERFLOW_EXPR = `(() => {
  const doc = document.documentElement;
  const overflowing = doc.scrollWidth > doc.clientWidth;
  const culprits = overflowing
    ? [...document.querySelectorAll('*')]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
        .slice(0, 8)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 24)
          };
        })
    : [];
  return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, overflowing, culprits };
})()`;

/**
 * 한 줄 세로 정렬 검사 — **이 레포에서 렌더 테스트로 원리적으로 못 잡는 결함**이다.
 * 소스에는 `align-items: center` 가 멀쩡히 있는데 화면이 틀리기 때문에 소스 스캔으로도 안 잡히고,
 * jsdom 은 레이아웃을 계산하지 않아 vitest 로도 안 잡힌다. 남은 방법은 실제로 그려서 재는 것뿐이다.
 *
 * 무엇을 재나: `align-items: center` 인 flex 행에서 **글자의 잉크 중심**과 **형제(아이콘·구분선·
 * 배지·체크박스)의 기하 중심**의 차. 사람 눈은 라인박스가 아니라 잉크를 기준으로 "가운데"를 본다.
 *
 *   baseline = 텍스트 Range rect.top + (rect.height − (fontAsc+fontDesc))/2 + fontAsc
 *   ink      = baseline − (actualAsc − actualDesc)/2
 *
 * ⚠ 잉크 비율은 **400px 에서 한 번 재서 축척한다** — Chrome 은 `actualBoundingBox*` 를 정수 픽셀로
 * 반올림해서 13px 에서 재면 ±0.5px 짜리 가짜 어긋남이 나온다. 반대로 라인박스(`fontBoundingBox*`)는
 * 그 크기에서 반올림된 값을 레이아웃이 **실제로 쓰므로** 원래 크기에서 잰 값을 그대로 써야 한다.
 *
 * 오탐을 걸러야 결과를 믿을 수 있다(전부 실제로 겪은 오탐이다):
 *   - 스크린리더 전용 텍스트(clip/clip-path/1px/화면 밖) → 화면에 없는 좌표를 잡는다
 *   - 여러 줄 텍스트 → 규칙이 "중심 정렬"이 아니라 "첫 줄 정렬"이라 비교 자체가 무의미하다
 *   - 세로로 안 겹치는 형제 → 애초에 같은 줄이 아니다
 */
const ALIGN_EXPR = `(() => {
  const ctx = document.createElement('canvas').getContext('2d');
  const REF = 400;
  const inkCache = new Map();
  const inkHalfEm = (style, weight, family, sample) => {
    const key = style + '|' + weight + '|' + family + '|' + sample;
    if (inkCache.has(key)) return inkCache.get(key);
    ctx.font = style + ' ' + weight + ' ' + REF + 'px ' + family;
    const m = ctx.measureText(sample);
    const v = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 / REF;
    inkCache.set(key, v);
    return v;
  };
  const hiddenish = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return true;
    if (cs.clipPath !== 'none' || cs.clip !== 'auto') return true;
    const r = el.getBoundingClientRect();
    return r.width <= 1 || r.height <= 1 || r.right < 0 || r.bottom < 0;
  };
  const inkFrom = (node, row) => {
    const parent = node.parentElement;
    for (let p = parent; p && p !== row.parentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') return null;
      if (cs.clipPath !== 'none' || cs.clip !== 'auto') return null;
      if (cs.position === 'absolute' || cs.position === 'fixed') {
        const pr = p.getBoundingClientRect();
        if (pr.width <= 1 || pr.height <= 1) return null;
      }
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) return null;
    const cs = getComputedStyle(parent);
    const size = parseFloat(cs.fontSize);
    const lineHeight = parseFloat(cs.lineHeight) || rects[0].height;
    const tops = new Set(rects.map((r) => Math.round(r.top)));
    if (tops.size > 1 || rects[0].height > lineHeight * 1.5) return null; // 여러 줄 → 첫 줄 정렬 규칙
    const sample = node.data.trim().slice(0, 40);
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
    const m = ctx.measureText(sample);
    const rect = rects[0];
    const baseline =
      rect.top + (rect.height - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    return {
      rect,
      size,
      text: sample,
      center: baseline - inkHalfEm(cs.fontStyle, cs.fontWeight, cs.fontFamily, sample) * size
    };
  };
  const firstInk = (el, row) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const ink = inkFrom(n, row);
      if (ink) return ink;
    }
    return null;
  };
  const findings = [];
  const rows = [...document.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el);
    return (
      (cs.display === 'flex' || cs.display === 'inline-flex') &&
      cs.alignItems === 'center' &&
      !cs.flexDirection.startsWith('column') &&
      !hiddenish(el)
    );
  });
  for (const row of rows) {
    const texts = [];
    const graphics = [];
    for (const node of row.childNodes) {
      if (node.nodeType === 3) {
        if (node.data.trim()) {
          const ink = inkFrom(node, row);
          if (ink) texts.push(ink);
        }
        continue;
      }
      if (node.nodeType !== 1) continue;
      const cs = getComputedStyle(node);
      if (cs.position === 'absolute' || cs.position === 'fixed' || hiddenish(node)) continue;
      const ink = firstInk(node, row);
      if (ink) {
        texts.push(ink);
        continue;
      }
      const svg = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
      const target = svg ?? node;
      const r = target.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      graphics.push({ rect: r, tag: target.tagName.toLowerCase(), cls: (target.getAttribute('class') || '').slice(0, 32) });
    }
    for (const t of texts) {
      for (const g of graphics) {
        const overlap = Math.min(t.rect.bottom, g.rect.bottom) - Math.max(t.rect.top, g.rect.top);
        if (overlap < Math.min(t.rect.height, g.rect.height) * 0.4) continue; // 같은 줄이 아니다
        const delta = g.rect.top + g.rect.height / 2 - t.center;
        if (Math.abs(delta) < 1) continue;
        findings.push({
          delta: Math.round(delta * 100) / 100,
          size: Math.round(t.size * 10) / 10,
          text: t.text,
          graphic: g.tag + ' ' + Math.round(g.rect.height) + 'px ' + g.cls
        });
      }
    }
  }
  findings.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { rows: rows.length, findings: findings.slice(0, 20) };
})()`;

/* ── 실행 ─────────────────────────────────────────────────────────────────── */

const mode = await launch();
const cdp = await connect();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  return result.result?.value;
};

console.log(`[uiprobe] ${mode} · ${url}`);

for (const width of widths) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768
  });
  await cdp.send('Page.navigate', { url });
  await sleep(waitMs ?? 2500);

  for (const text of clicks) {
    const outcome = await evaluate(clickByText(text));
    console.log(`  ${String(width).padStart(4)}px  click "${text}" → ${outcome}`);
    await sleep(waitMs ?? 800);
  }

  if (checkOverflow) {
    const report = await evaluate(OVERFLOW_EXPR);
    const mark = report.overflowing ? '✗ 넘침' : '✓ 정상';
    console.log(`  ${String(width).padStart(4)}px  ${mark}  scrollWidth=${report.scrollWidth} clientWidth=${report.clientWidth}`);
    for (const culprit of report.culprits) {
      console.log(`          범인 후보 <${culprit.tag}> right=${culprit.right} w=${culprit.width} "${culprit.text}"`);
    }
  }

  if (checkAlign) {
    // 서체가 늦게 오면 폴백으로 그려져 측정이 통째로 빗나간다.
    await evaluate('document.fonts.ready.then(() => 1)');
    const report = await evaluate(ALIGN_EXPR);
    const mark = report.findings.length ? `✗ ${report.findings.length}건` : '✓ 정상';
    console.log(`  ${String(width).padStart(4)}px  ${mark}  align-items:center 행 ${report.rows}개`);
    for (const f of report.findings) {
      console.log(`          ${String(f.delta).padStart(6)}px  [${f.size}px] "${f.text}" ↔ ${f.graphic}`);
    }
  }

  if (evalExpr) {
    const value = await evaluate(evalExpr);
    console.log(`  ${String(width).padStart(4)}px  ${JSON.stringify(value, null, 1)}`);
  }

  if (shotPath) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const target = widths.length > 1 ? shotPath.replace(/(\.png)?$/i, `.${width}.png`) : shotPath;
    mkdirSync(dirname(resolve(target)), { recursive: true });
    writeFileSync(resolve(target), Buffer.from(shot.data, 'base64'));
    console.log(`  ${String(width).padStart(4)}px  📸 ${target}`);
  }
}

cdp.close();
if (child && !keepOpen) child.kill();
