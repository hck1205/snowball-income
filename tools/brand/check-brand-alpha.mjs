#!/usr/bin/env node
/**
 * brand:check — `public/` 브랜드 래스터의 **알파가 살아 있는지** 실측한다. 외부 의존성 0(zlib 만).
 *
 *   npm run brand:check
 *
 * ## 왜 있나 (이 가드가 없어서 결함이 배포까지 갔다)
 * `assets/brand/app_icon.png` 은 투명 원본이 아니라 **체커보드가 구워진 합성물**이다. 그래서
 * "흰 배경을 색상 키로 지우는" 방식이 이빨·눈 흰자·물 하이라이트까지 함께 뚫었고, 그 자산이
 * BrandGlyph 15개 호출부와 헤더 로고에 그대로 실려 나갔다(다크 모드 44px 에서 눈이 검은 구멍).
 * 레포에 PNG 를 읽는 테스트가 하나도 없어서 **아무도 못 잡았다.**
 *
 * ## 무엇을 보나 (둘 다 눈으로 못 볼 만큼 작은 회귀를 잡는다)
 *  1. **안쪽 밝은 픽셀의 불투명도** — 알파>8 을 2px 침식한 안쪽에서 lum>230 인 픽셀 중
 *     알파가 255 인 비율. 정상 자산 99~100%, 색상 키로 망가진 자산 16.7%(mark) / 41.1%(hippo).
 *     하한 90% 는 그 사이에 크게 벌어진 골짜기다.
 *  2. **프레이밍(겉보기 크기)** — 알파 bbox 가 폭을 꽉 채우는지. 타이트 크롭 없이 마스터를 그냥
 *     축소하면 로고가 **18% 작아지는데 파일 크기는 그대로**라 어떤 테스트도 못 잡는다.
 *
 * 고치는 법: `npm run brand:assets` (tools/brand/rebuild-brand-assets.py — 알고리즘 근거가 거기 있다).
 *
 * ⚠ 여기서 디코드하는 범위는 **8bit·컬러타입 6(RGBA)·비인터레이스** 뿐이다. 재생성 스크립트가
 *   내는 형식이 그거다. 다른 형식이 들어오면 조용히 통과시키지 않고 에러로 알린다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** 검사 대상 — 알파를 쓰는 자산만. 흰 면에 구운 파비콘·PWA 아이콘은 알파가 없어 대상이 아니다. */
const TARGETS = [
  { file: 'hippo-mark.png', minOpaque: 0.9, fullBleedWidth: true },
  { file: 'hippo.png', minOpaque: 0.9, fullBleedWidth: true },
  /* 금화는 원본이 진짜 알파를 갖고 있어 추출을 거치지 않는다 — 그래도 축소 회귀는 여기서 본다. */
  { file: 'coin.png', minOpaque: 0.9, fullBleedWidth: false }
];

/* ── 최소 PNG 디코더 ───────────────────────────────────────────────────────── */

function decodeRgba(buffer, label) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error(`${label}: PNG 시그니처가 아니다`);
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12]
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += length + 12;
  }
  if (!header) throw new Error(`${label}: IHDR 이 없다`);
  const { width, height, depth, colorType, interlace } = header;
  if (depth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`${label}: 8bit/RGBA/비인터레이스가 아니다 (depth=${depth} colorType=${colorType} interlace=${interlace})`);
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`${label}: 알 수 없는 필터 ${filter}`);
      cur[x] = value & 0xff;
    }
  }
  return { width, height, pixels: out };
}

/* ── 지표 ─────────────────────────────────────────────────────────────────── */

/** 반지름 2 원판 오프셋 — 재생성 스크립트의 `_disk(2)` 와 같은 모양이라야 수치가 비교된다. */
const DISK2 = [];
for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) if (dy * dy + dx * dx <= 4) DISK2.push([dy, dx]);

function measure({ width, height, pixels }) {
  const alphaAt = (x, y) => pixels[(y * width + x) * 4 + 3];
  let bright = 0;
  let opaque = 0;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      // 2px 침식: 원판 안이 전부 알파>8 이어야 "안쪽"이다.
      let inside = true;
      for (const [dy, dx] of DISK2) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny < 0 || nx < 0 || ny >= height || nx >= width || alphaAt(nx, ny) <= 8) { inside = false; break; }
      }
      if (!inside) continue;
      if ((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 <= 230) continue;
      bright += 1;
      if (pixels[i + 3] === 255) opaque += 1;
    }
  }
  return { bright, ratio: bright === 0 ? 1 : opaque / bright, bbox: { minX, minY, maxX, maxY } };
}

/* ── 실행 ─────────────────────────────────────────────────────────────────── */

let failed = 0;
for (const target of TARGETS) {
  const path = join(ROOT, 'public', target.file);
  const image = decodeRgba(readFileSync(path), target.file);
  const { bright, ratio, bbox } = measure(image);
  const spanX = (bbox.maxX - bbox.minX + 1) / image.width;
  const problems = [];
  if (ratio < target.minOpaque) {
    problems.push(`안쪽 밝은 픽셀 ${bright}개 중 알파 255 가 ${(ratio * 100).toFixed(1)}% (하한 ${target.minOpaque * 100}%) — 알파가 흰 그림을 먹었다`);
  }
  if (target.fullBleedWidth && spanX < 0.98) {
    problems.push(`알파 bbox 가 폭의 ${(spanX * 100).toFixed(1)}% 밖에 안 된다 — 타이트 크롭을 빠뜨려 로고가 작아졌다`);
  }
  const mark = problems.length ? 'FAIL' : 'ok  ';
  console.log(`${mark} ${target.file.padEnd(16)} ${image.width}×${image.height}  밝은 픽셀 ${String(bright).padStart(5)}개 · 알파255 ${(ratio * 100).toFixed(1).padStart(5)}%  · bbox 폭 ${(spanX * 100).toFixed(1)}%`);
  for (const problem of problems) console.log(`     ↳ ${problem}`);
  failed += problems.length ? 1 : 0;
}

if (failed) {
  console.error(`\n${failed}개 자산이 회귀했다. 고치는 법: npm run brand:assets`);
  process.exit(1);
}
console.log('\n브랜드 래스터 알파 정상.');
