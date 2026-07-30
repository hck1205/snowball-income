#!/usr/bin/env node
/**
 * 라우트 × 화면폭 스크린샷 세트를 한 번에 찍는다 — 디자인 개편의 **before/after 비교판**.
 *
 * 왜 있는가: 리모델링은 "좋아졌나"를 말로 다투기 쉽다. 같은 라우트를 같은 폭으로 찍어 두면
 * 다투지 않는다. `uiprobe` 는 한 장을 찍고, 이 스크립트는 **세트**를 찍는다.
 *
 *   node tools/dev/shotset.mjs --out .shots/before --base http://localhost:5174
 *   node tools/dev/shotset.mjs --out .shots/after  --base http://localhost:5174
 *
 * 옵션
 *   --base <url>    개발 서버 (기본 http://localhost:5173)
 *   --out <dir>     저장 폴더 (필수)
 *   --widths <n,n>  기본 1280,768,390
 *   --routes <a,b>  기본 아래 ROUTES
 *   --wait <ms>     라우트당 대기 (기본 2500 — 차트·폰트가 늦다)
 *
 * ⚠ `content-visibility: auto` 때문에 화면 밖 카드는 전체 스샷에 안 그려진다.
 *   그래서 라우트마다 **끝까지 스크롤한 뒤** 찍는다(uiprobe 의 --eval 로 처리).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const BASE = arg('base', 'http://localhost:5173').replace(/\/$/, '');
const OUT = arg('out');
const WIDTHS = arg('widths', '1280,768,390').split(',').map((w) => w.trim());
const WAIT = arg('wait', '2500');

/** 찍을 라우트. 이름은 파일명이 된다. */
const ROUTES = [
  ['simulator', '/'],
  ['portfolio', '/dividend/portfolio'],
  ['calendar', '/dividend/calendar'],
  ['ticker-hub', '/ticker/all'],
  ['ticker-detail', '/ticker/schd'],
  ['community', '/community/portfolio']
];

if (!OUT) {
  console.error('--out <dir> 가 필요하다');
  process.exit(1);
}

const routes = arg('routes')
  ? arg('routes')
      .split(',')
      .map((r) => [r.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root', r])
  : ROUTES;

fs.mkdirSync(OUT, { recursive: true });

let ok = 0;
let failed = 0;

for (const [name, route] of routes) {
  for (const width of WIDTHS) {
    const file = path.join(OUT, `${name}@${width}.png`);
    try {
      execFileSync(
        process.execPath,
        [
          'tools/dev/uiprobe.mjs',
          '--url',
          `${BASE}${route}`,
          '--width',
          width,
          '--wait',
          WAIT,
          /*
           * 지연 렌더(`content-visibility: auto`)를 깨우려고 끝까지 훑는다. 훑기만 하면
           * **sticky 헤더가 스크롤된 위치에 박힌 채로** 전체 스샷에 찍히므로(실측) 맨 위로
           * 되돌리고 한 프레임 기다린 뒤 찍는다.
           */
          '--eval',
          '(async () => { window.scrollTo(0, document.body.scrollHeight);' +
            ' await new Promise((r) => setTimeout(r, 700));' +
            ' window.scrollTo(0, 0);' +
            ' await new Promise((r) => setTimeout(r, 400)); return 1; })()',
          '--shot',
          file
        ],
        { stdio: 'pipe', timeout: 120000 }
      );
      ok += 1;
      console.log(`  ✓ ${name}@${width}`);
    } catch (error) {
      failed += 1;
      const reason = String(error.stderr ?? error.message).split('\n')[0].slice(0, 120);
      console.log(`  ✗ ${name}@${width}  ${reason}`);
    }
  }
}

console.log(`\n${OUT} — 성공 ${ok} / 실패 ${failed}`);
process.exit(failed > 0 && ok === 0 ? 1 : 0);
