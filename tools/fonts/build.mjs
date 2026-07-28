/**
 * 셀프호스팅 웹폰트 서브셋 빌더 (수동 실행 — 앱 빌드는 이 스크립트를 부르지 않는다).
 *
 *   node tools/fonts/build.mjs
 *
 * 무엇을 만드나:
 *   public/fonts/gmarket/*.woff2      Gmarket Sans (display) — 92분할 동적 서브셋
 *   public/fonts/line-seed/*.woff2    LINE Seed Sans KR (heroNumeric) — 숫자·기호·단위만
 *   public/fonts/inter/*.woff2        Inter (dataNumeric) — 라틴 기본 + 통화/수학 기호
 *   shared/styles/selfHostedFonts.css 위 세 폰트의 @font-face 선언(생성물, 커밋)
 *
 * 파일명에는 **콘텐츠 해시**가 붙는다(`…split.7.<8자 해시>.woff2`) — 이유는 아래 `subsetHashed` 참고.
 *
 * 왜 스크립트로 남기나: 산출물은 커밋하지만 "어떤 원본을 어떤 범위로 잘랐는가"가 코드로 남아야
 * 폰트 버전을 올리거나 서브셋 범위를 넓힐 때 재현 가능하다. **앱 빌드에 네트워크 의존을 만들지
 * 않는다** — 다운로드/서브셋은 사람이 이 스크립트를 돌릴 때만 일어난다.
 *
 * 의존성:
 *   - Node 18+ (전역 fetch). 압축 해제는 zlib 만 쓴다(외부 npm 패키지 0 — tools/indexer 선례).
 *   - Python + fonttools + brotli (서브셋·woff2 인코딩). 없으면 안내하고 종료한다:
 *       python -m pip install --user fonttools brotli
 *   - `npm install` 이 끝나 있어야 한다 — 92분할 unicode-range 표를 wanted-sans 패키지의
 *     동적 서브셋 CSS 에서 그대로 읽어 온다(세 폰트가 같은 분할 아키텍처를 공유하도록).
 *
 * 라이선스: 원본 4종 모두 SIL Open Font License 1.1. 서브셋 산출물에도 OFL 이 그대로 따라붙는다
 * (출처·고지 원문은 public/fonts/README.md 와 public/fonts/OFL-*.txt).
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const CACHE_DIR = join(HERE, '.cache');
const PUBLIC_FONTS = join(ROOT, 'public/fonts');
const CSS_OUT = join(ROOT, 'shared/styles/selfHostedFonts.css');
const WANTED_SANS_CSS = join(ROOT, 'node_modules/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css');

/* -------------------------------------------------------------------------- */
/* 원본 (공식 배포처 — 미러 금지, 링크가 죽으면 여기부터 고친다)                   */
/* -------------------------------------------------------------------------- */

const ARCHIVES = {
  gmarket: {
    url: 'https://corp.gmarket.com/fonts/GmarketSansOTF.zip',
    bytes: 1_627_786,
    file: 'GmarketSansOTF.zip'
  },
  lineSeed: {
    url: 'https://seed.line.me/src/images/fonts/LINE_Seed_Sans_KR.zip',
    bytes: 12_466_705,
    file: 'LINE_Seed_Sans_KR.zip'
  },
  inter: {
    url: 'https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip',
    bytes: 33_707_794,
    file: 'Inter-4.1.zip'
  }
};

/**
 * heroNumeric(LINE Seed) 서브셋 문자 집합.
 *
 * hero 표면은 **포맷된 금액·퍼센트만** 그린다(StatTile hero 값 / GoalMeter 퍼센트). 실제로 나올 수 있는
 * 문자열은 포맷터가 전부 결정한다: `formatKRW`(₩1,234,567) · `formatApproxKRW`(약 9.2억 / 약 187만 /
 * 약 1,234원) · `formatUSD`($1,234 / $12.34) · `formatApproxUSD`(약 $1.4M / 약 $271K) · 퍼센트(`82%`) ·
 * 빈 값 대시(—). 여기 없는 글자는 본문 서체(Wanted Sans)로 폴백된다 — 의도된 동작이다.
 *
 * 라틴 대소문자를 통째로 넣는 이유: M·K 만 넣으면 예상 못 한 라벨 한 조각이 폴백돼 **한 문자열 안에서
 * 서체가 갈린다**(가장 눈에 띄는 종류의 깨짐). 알파벳 전체를 넣어도 수백 바이트 차이다.
 */
const HERO_NUMERIC_CHARS = [
  ' 0123456789',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '.,%+-/()~:$₩',
  '−–—', // − – —
  '약원만억천조년월일개주회차'
].join('');

/**
 * dataNumeric(Inter) 서브셋 문자 집합 = ASCII 인쇄가능 전체 + 통화/수학 기호.
 *
 * ⚠ npm `@fontsource-variable/inter` 를 그대로 쓰지 않는 이유: 그 패키지는 라틴(48,256B)과
 * 라틴확장(85,068B)을 unicode-range 로 가르는데 **원화기호 ₩(U+20A9)가 라틴확장 쪽**에 있다.
 * 이 앱의 표 셀은 `formatKRW` 로 항상 ₩ 를 찍으므로, 글리프 하나 때문에 85KB 를 더 받는다.
 * 한 파일로 직접 자르면 ASCII 전체 + ₩ 를 합쳐도 그 1/5 이하다.
 */
const DATA_NUMERIC_UNICODES = [
  'U+0020-007E', // ASCII 인쇄가능 (티커 SCHD·라벨 영문·기호)
  'U+00A0', // NBSP
  'U+00B0', // °
  'U+00B7', // ·
  'U+00D7', // ×
  'U+2013-2014', // – —
  'U+2018-2019', // ‘ ’
  'U+201C-201D', // “ ”
  'U+2026', // …
  'U+2030', // ‰
  'U+2190-2193', // ← ↑ → ↓
  'U+20A9', // ₩
  'U+20AC', // €
  'U+2212' // −
].join(',');

/* -------------------------------------------------------------------------- */
/* 유틸                                                                         */
/* -------------------------------------------------------------------------- */

const log = (...args) => console.log('[fonts]', ...args);

const die = (message) => {
  console.error(`\n[fonts] ✗ ${message}\n`);
  process.exit(1);
};

const ensureDir = (dir) => mkdirSync(dir, { recursive: true });

const formatBytes = (n) => `${n.toLocaleString('en-US')}B`;

/** 공식 배포처에서 1회 내려받아 `.cache/` 에 둔다(gitignore). 크기가 다르면 세운다 — 조용한 교체 방지. */
const download = async ({ url, bytes, file }) => {
  const target = join(CACHE_DIR, file);
  if (existsSync(target) && statSync(target).size === bytes) return readFileSync(target);

  log(`다운로드 ${url}`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) die(`다운로드 실패 ${response.status} — ${url}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== bytes) {
    die(`원본 크기가 기대와 다르다: ${url}\n  기대 ${formatBytes(bytes)} / 실제 ${formatBytes(buffer.length)}\n  배포처가 폰트를 갱신했을 수 있다. 내용을 확인하고 이 스크립트의 bytes 를 갱신하라.`);
  }

  ensureDir(CACHE_DIR);
  writeFileSync(target, buffer);
  return buffer;
};

/**
 * 최소 ZIP 리더 (외부 의존성 0).
 *
 * 중앙 디렉터리를 훑어 원하는 엔트리만 꺼낸다. deflate(method 8)와 무압축(method 0)만 지원 —
 * 이 세 배포본이 쓰는 형식이다. zip64·암호화는 대상이 아니다.
 */
const readZipEntries = (buffer, wanted) => {
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 22 - 0xffff; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) die('ZIP 중앙 디렉터리를 찾지 못했다(손상된 아카이브?).');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const found = new Map();

  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) die('ZIP 중앙 디렉터리 레코드가 깨졌다.');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);

    const match = wanted.find((entry) => name.endsWith(entry) && !name.startsWith('__MACOSX'));
    if (match) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const raw = buffer.subarray(start, start + compressedSize);
      found.set(match, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  for (const entry of wanted) if (!found.has(entry)) die(`ZIP 안에서 ${entry} 를 찾지 못했다.`);
  return found;
};

/* -------------------------------------------------------------------------- */
/* Python(fonttools) 다리 — 서브셋·cmap 조회                                     */
/* -------------------------------------------------------------------------- */

const PYTHON = process.env.PYTHON ?? 'python';

const runPython = (args, label) => {
  try {
    return execFileSync(PYTHON, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } });
  } catch (error) {
    die(`${label} 실패.\n  ${String(error.stderr || error.message).trim()}\n\n  fonttools 가 없으면: ${PYTHON} -m pip install --user fonttools brotli`);
    return '';
  }
};

const assertFontTools = () => {
  runPython(['-c', 'import fontTools, brotli'], 'fonttools/brotli 확인');
};

/** 폰트가 실제로 담고 있는 코드포인트 집합 — 빈 서브셋 조각을 만들지 않기 위해 미리 본다. */
const readCoveredCodepoints = (fontPath) => {
  const json = runPython(
    ['-c', 'import json,sys;from fontTools.ttLib import TTFont;print(json.dumps(sorted(TTFont(sys.argv[1],lazy=True).getBestCmap())))', fontPath],
    'cmap 조회'
  );
  return new Set(JSON.parse(json));
};

/**
 * 폰트 name 테이블의 라이선스 전문(ID13)을 텍스트 파일로 뽑는다.
 *
 * Gmarket·LINE Seed 배포 zip 에는 **라이선스 파일이 들어 있지 않다**(폰트 파일뿐). OFL 조건2는
 * 배포본마다 고지와 라이선스 사본을 요구하므로, 원본 폰트가 자기 안에 싣고 있는 전문을 그대로
 * 꺼내 `public/fonts/OFL-*.txt` 로 동봉한다(2차 가공 없이 원문 그대로 = 가장 신뢰할 수 있는 사본).
 */
const dumpLicense = (fontPath, outPath) => {
  const text = runPython(
    [
      '-c',
      'import sys;from fontTools.ttLib import TTFont;'
        + 'ns=TTFont(sys.argv[1],lazy=True)["name"].names;'
        + 'seen=[];'
        + 'out=[r.toUnicode() for r in ns if r.nameID in (0,13,14) and (r.toUnicode() not in seen and not seen.append(r.toUnicode()))];'
        + 'sys.stdout.write("\\n\\n".join(out))',
      fontPath
    ],
    '라이선스 전문 추출'
  );
  writeFileSync(outPath, `${text.replace(/\r\n/g, '\n').trim()}\n`, 'utf8');
};

/**
 * pyftsubset 호출.
 *
 * - `--layout-features+=tnum` : `tnum`(자릿수 정렬)이 기본 보존 목록에 없다. 숫자 서체에서 이게 빠지면
 *   `font-variant-numeric: tabular-nums` 가 조용히 무효가 된다. ⚠ `=*`(전부 보존)로 하면 `aalt`/`salt`/
 *   `ss01~`/`cv01~` 이 참조하는 **대체 글리프까지 딸려 와** Inter 가 3배 넘게 부푼다(실측 22KB→78KB).
 * - name 테이블: 저작권 고지(ID0)는 fonttools 기본값이 이미 남기고, 여기에 라이선스 URL(ID14)을 더한다.
 *   **라이선스 전문(ID13)은 `licenseText: true` 인 산출물에만** 싣는다 — 그 자체로 완결된 폰트 파일
 *   (LINE Seed·Inter)은 파일 하나만 떼어 가도 라이선스가 따라가야 하지만, Gmarket 의 91개 조각은
 *   어느 하나도 단독으로 쓸 수 없는 파편인데 전문(한·영 약 15,000자)이 조각마다 복사돼
 *   **배포 총량 +190KB / 첫 화면 +21KB** 를 먹는다(실측). 전문은 public/fonts/OFL-*.txt 로 배포본에
 *   동봉한다 — OFL 조건2가 요구하는 "고지 + 라이선스 동봉"은 그쪽이 정본이다.
 */
const subset = ({ input, output, unicodes, text, licenseText = false }) => {
  ensureDir(dirname(output));
  const args = [
    '-m',
    'fontTools.subset',
    input,
    `--output-file=${output}`,
    '--flavor=woff2',
    '--layout-features+=tnum',
    `--name-IDs+=${licenseText ? '13,14' : '14'}`,
    '--notdef-outline'
  ];
  if (unicodes) args.push(`--unicodes=${unicodes}`);
  if (text) args.push(`--text=${text}`);
  runPython(args, `서브셋 ${output.replace(ROOT, '')}`);
  return statSync(output).size;
};

/**
 * 서브셋 결과에 **콘텐츠 해시를 박아** 저장한다 → `GmarketSans-Bold.split.7.a1b2c3d4.woff2`.
 *
 * 왜 필요한가: `vercel.json` 이 `/fonts/(.*)` 에 `max-age=31536000, immutable` 을 건다. immutable 은
 * 재검증 자체를 하지 않으므로, **파일명이 그대로면 내용이 바뀌어도 재방문자는 최대 1년간 낡은 조각을
 * 쓴다**(강제 새로고침으로도 안 풀린다). 이 스크립트를 다시 돌렸을 때 원본 폰트 버전이나 split 경계가
 * 달라지면 그 조각에 없는 음절이 생겨 **헤딩 일부가 폴백 서체·두부(□)로 섞인다** — 눈에 띄지만 원인은
 * 찾기 어려운 종류의 고장이다.
 *
 * 왜 수동 버전 세그먼트(`/fonts/gmarket/v2/…`)가 아니라 해시인가: 버전은 사람이 올려야 해서 한 번
 * 깜빡하면 같은 사고가 그대로 난다. 해시는 자가관리될 뿐 아니라 **바뀐 조각만 이름이 바뀌어** 나머지
 * 90개의 캐시가 유지된다(버전 세그먼트는 한 글자만 고쳐도 91개를 전부 다시 받게 한다).
 *
 * 옛 해시 파일이 쌓이지 않는 이유: 각 빌더가 출력 디렉터리를 `rmSync` 로 비우고 시작하고, 참조하는
 * CSS 도 **같은 실행에서** 다시 만들어진다(파일 ↔ 선언이 어긋날 수 없다).
 *
 * ⚠ 예외 — OG 용 `dist/fonts/WantedSans-{Regular,Bold}.otf` 는 이 스크립트가 아니라 `vite.config.ts` 의
 * `ogFontsPlugin` 이 빌드 때 node_modules 에서 복사하고, `server/handlers/Og/Og.tsx` 가 **런타임에 고정
 * 파일명으로 fetch** 한다. 브라우저 캐시가 아니라 콜드 컨테이너가 매번 새로 받는 경로라 낡은 캐시의
 * 피해가 "OG PNG 가 한 버전 낡은 서체로 그려짐"(육안 무차)에 그치고, 해시를 붙이면 서버 핸들러가
 * 빌드 산출물의 해시를 런타임에 알아야 해서 어긋나는 순간 **OG 가 정적 이미지로 조용히 폴백**한다 —
 * 실패 모드가 더 나빠지므로 그대로 둔다.
 */
const subsetHashed = ({ dir, base, ...rest }) => {
  const temp = join(dir, `${base}.tmp.woff2`);
  subset({ ...rest, output: temp });
  const bytes = readFileSync(temp);
  const file = `${base}.${createHash('sha256').update(bytes).digest('hex').slice(0, 8)}.woff2`;
  renameSync(temp, join(dir, file));
  return { file, size: bytes.length };
};

/* -------------------------------------------------------------------------- */
/* 92분할 unicode-range 표                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Wanted Sans 동적 서브셋 CSS 에서 분할 표를 그대로 읽는다.
 *
 * 왜 하드코딩하지 않나: 본문(Wanted Sans)과 헤딩(Gmarket)이 **같은 경계로 잘려 있어야** 같은 글자를
 * 그릴 때 두 폰트가 같은 조각 수만큼만 내려온다. 표를 두 벌 관리하면 반드시 어긋난다.
 */
const readSplitRanges = () => {
  if (!existsSync(WANTED_SANS_CSS)) {
    die(`wanted-sans 동적 서브셋 CSS 가 없다: ${WANTED_SANS_CSS}\n  먼저 \`npm install\` 을 돌려라.`);
  }
  const css = readFileSync(WANTED_SANS_CSS, 'utf8');
  const ranges = [...css.matchAll(/unicode-range:\s*([^;]+);/g)].map((match) => match[1].trim());
  if (ranges.length === 0) die('unicode-range 를 하나도 읽지 못했다 — wanted-sans 패키지 구조가 바뀌었나?');
  return ranges;
};

/** "U+ac00-ac01, U+ac04" → 코드포인트 개수 계산용 [start, end] 쌍. */
const parseRange = (range) =>
  range.split(',').map((part) => {
    const [from, to] = part.trim().replace(/^U\+/i, '').split('-');
    const start = Number.parseInt(from, 16);
    return [start, to === undefined ? start : Number.parseInt(to, 16)];
  });

const rangeIntersectsFont = (range, covered) =>
  parseRange(range).some(([start, end]) => {
    for (let cp = start; cp <= end; cp += 1) if (covered.has(cp)) return true;
    return false;
  });

/* -------------------------------------------------------------------------- */
/* 빌드                                                                         */
/* -------------------------------------------------------------------------- */

/** @font-face 한 벌. `font-display: swap` 은 전 폰트 공통(폰트가 늦어도 글은 먼저 읽힌다). */
const fontFace = ({ family, weight, url, unicodeRange, format = 'woff2' }) =>
  [
    '@font-face {',
    `  font-family: '${family}';`,
    '  font-style: normal;',
    '  font-display: swap;',
    `  font-weight: ${weight};`,
    `  src: url('${url}') format('${format}');`,
    ...(unicodeRange ? [`  unicode-range: ${unicodeRange};`] : []),
    '}'
  ].join('\n');

const buildGmarket = async (splitRanges) => {
  const buffer = await download(ARCHIVES.gmarket);
  const entries = readZipEntries(buffer, ['GmarketSansBold.otf']);
  const outDir = join(PUBLIC_FONTS, 'gmarket');
  rmSync(outDir, { recursive: true, force: true });
  ensureDir(outDir);

  const faces = [];
  let total = 0;

  /**
   * **Bold 한 벌만 싣는다.**
   *
   * Gmarket 은 Light(300)·Medium(400)·Bold(700) 세 벌뿐이라 400 과 700 사이가 비어 있는데, 이 앱의
   * 헤딩은 실측상 semibold(600)·bold(700)·extrabold(800) 뿐이다(400·500 헤딩 0건). 즉 어떤 조합으로
   * 나눠도 현재 헤딩은 전부 Bold 로 떨어지므로, Medium 을 함께 실으면 **아무도 내려받지 않는 조각
   * 91개(1.16MB)** 를 레포에 커밋하게 된다. 선언 범위를 `100 1000` 으로 넓게 잡아 어떤 굵기 요청도
   * 이 페이스에 정확히 매칭시킨다 → 브라우저가 가짜 굵기(faux bold)를 합성하지 않는다.
   *
   * display 역할에 400~500 이 필요해지면 아래 배열에 Medium 줄을 되살리고 범위를 100 500 / 501 1000
   * 으로 나누면 된다(한 줄).
   */
  for (const [entry, name, weight] of [['GmarketSansBold.otf', 'GmarketSans-Bold', '100 1000']]) {
    const source = join(CACHE_DIR, entry);
    writeFileSync(source, entries.get(entry));
    dumpLicense(source, join(PUBLIC_FONTS, 'OFL-Gmarket.txt'));
    const covered = readCoveredCodepoints(source);

    let weightTotal = 0;
    let slices = 0;
    splitRanges.forEach((range, index) => {
      if (!rangeIntersectsFont(range, covered)) return;
      const { file, size } = subsetHashed({ dir: outDir, base: `${name}.split.${index}`, input: source, unicodes: range });
      weightTotal += size;
      slices += 1;
      faces.push(fontFace({ family: 'Gmarket Sans', weight, url: `/fonts/gmarket/${file}`, unicodeRange: range }));
    });
    total += weightTotal;
    log(`Gmarket ${name} (${weight}) — ${slices} 조각 ${formatBytes(weightTotal)}`);
  }

  return { faces, total, files: readdirSync(outDir).length };
};

const buildLineSeed = async () => {
  const buffer = await download(ARCHIVES.lineSeed);
  const entries = readZipEntries(buffer, ['OTF/LINESeedKR-Bd.otf']);
  const outDir = join(PUBLIC_FONTS, 'line-seed');
  rmSync(outDir, { recursive: true, force: true });

  const source = join(CACHE_DIR, 'LINESeedKR-Bd.otf');
  writeFileSync(source, entries.get('OTF/LINESeedKR-Bd.otf'));

  /**
   * ⚠ LINE Seed 만 예외 처리가 필요하다: 배포 zip 에도, 폰트 name 테이블(ID13)에도 **전문이 없고**
   * "SIL OFL 1.1 을 따른다"는 참조 문장뿐이다(Gmarket 은 name ID13 에 영문+한글 전문을 통째로 싣고
   * 있어 추출만으로 충분하다). OFL 조건2 는 사본 동봉을 요구하므로 표준 OFL 1.1 전문을 이어 붙인다 —
   * 전문은 폰트별로 다르지 않은 고정 텍스트라 이미 로컬에 있는 사본(wanted-sans/fonts/OFL.txt)의
   * 본문부를 그대로 쓴다(저작권 헤더는 각 폰트 자신의 것을 쓴다).
   */
  const notice = runPython(
    [
      '-c',
      'import sys;from fontTools.ttLib import TTFont;ns=TTFont(sys.argv[1],lazy=True)["name"].names;seen=[];'
        + 'out=[r.toUnicode() for r in ns if r.nameID in (0,13,14) and (r.toUnicode() not in seen and not seen.append(r.toUnicode()))];'
        + 'sys.stdout.write("\\n\\n".join(out))',
      source
    ],
    'LINE Seed 고지 추출'
  );
  const canonicalOfl = readFileSync(join(ROOT, 'node_modules/wanted-sans/fonts/OFL.txt'), 'utf8');
  const bodyStart = canonicalOfl.indexOf('-----------------------------------------------------------');
  if (bodyStart < 0) die('표준 OFL 전문을 wanted-sans/fonts/OFL.txt 에서 찾지 못했다.');
  writeFileSync(
    join(PUBLIC_FONTS, 'OFL-LINESeed.txt'),
    `${notice.replace(/\r\n/g, '\n').trim()}\n\n${canonicalOfl.slice(bodyStart).replace(/\r\n/g, '\n').trim()}\n`,
    'utf8'
  );

  const { file, size: total } = subsetHashed({
    dir: outDir,
    base: 'LINESeedSansKR-Bold.subset',
    input: source,
    text: HERO_NUMERIC_CHARS,
    licenseText: true
  });

  return {
    faces: [
      // 700 800 으로 클램프: hero 값은 bold/extrabold 로만 그린다. 그 밖의 굵기를 요청하면
      // 이 페이스가 아니라 스택 다음 서체(Wanted Sans)가 받는다 — 가짜 굵기 합성이 생기지 않는다.
      fontFace({ family: 'LINE Seed Sans KR', weight: '700 800', url: `/fonts/line-seed/${file}` })
    ],
    total,
    files: 1
  };
};

const buildInter = async () => {
  const buffer = await download(ARCHIVES.inter);
  const entries = readZipEntries(buffer, ['InterVariable.ttf', 'LICENSE.txt']);
  const outDir = join(PUBLIC_FONTS, 'inter');
  rmSync(outDir, { recursive: true, force: true });

  const source = join(CACHE_DIR, 'InterVariable.ttf');
  writeFileSync(source, entries.get('InterVariable.ttf'));
  writeFileSync(join(PUBLIC_FONTS, 'OFL-Inter.txt'), entries.get('LICENSE.txt'));

  /**
   * 광학 크기(opsz) 축을 16 으로 고정한 뒤 자른다.
   *
   * Inter 는 opsz(14~32)·wght(100~900) 2축인데, dataNumeric 이 실제로 그리는 크기는 표·칩·차트 라벨의
   * 12~20px 대다 — 이 좁은 구간에서 opsz 의 차이는 눈에 띄지 않는 반면 축 하나가 가변 델타를 통째로
   * 들고 온다(실측 47,708B → 31,340B, -34%). wght 축은 그대로 남긴다(400~800 을 한 파일로 덮는다).
   *
   * ⚠ `--no-recalc-timestamp` 가 필수다: instancer 는 기본으로 출력 폰트의 `head.modified` 에 **현재 시각**을
   * 찍는데, 그러면 입력이 하나도 안 바뀌어도 매 실행 결과가 달라져 **콘텐츠 해시가 무의미하게 바뀐다**
   * (실측: 같은 입력·같은 글리프인데 head.modified 만 달라 파일이 108B 차이 났다). pyftsubset 은 원본
   * 타임스탬프를 그대로 두므로 Gmarket·LINE Seed 에는 이 문제가 없다 — Inter 만 이 한 단계를 더 탄다.
   */
  const pinned = join(CACHE_DIR, 'InterVariable.opsz16.ttf');
  runPython(['-m', 'fontTools.varLib.instancer', '--no-recalc-timestamp', source, 'opsz=16', '-o', pinned], 'Inter opsz 고정');

  const { file, size: total } = subsetHashed({
    dir: outDir,
    base: 'InterVariable.subset',
    input: pinned,
    unicodes: DATA_NUMERIC_UNICODES,
    licenseText: true
  });

  return {
    faces: [
      // 가변 축(wght 100~900)이 서브셋 후에도 그대로 남는다 — 표·칩·차트가 쓰는 400~800 을 한 파일이 덮는다.
      fontFace({
        family: 'Inter Variable',
        weight: '100 900',
        url: `/fonts/inter/${file}`,
        format: 'woff2-variations'
      })
    ],
    total,
    files: 1
  };
};

const CSS_HEADER = `/*
 * 자동 생성물 — 직접 편집하지 마라. \`node tools/fonts/build.mjs\` 로 다시 만든다.
 *
 * public/fonts/ 에 커밋된 서브셋 woff2 의 @font-face 선언이다. Emotion(globalStyles.ts)이 아니라
 * 평범한 CSS 파일인 이유: 선언이 수백 벌이라 런타임 직렬화를 태울 이유가 없고, 이 파일 자체가
 * 빌드 스크립트의 산출물이기 때문이다. main.tsx 가 import 하면 Vite 가 앱 CSS 번들에 합친다.
 *
 * 파일명 끝의 8자는 **콘텐츠 해시**다 — vercel.json 이 /fonts/ 에 1년 immutable 캐시를 걸기 때문에
 * 내용이 바뀌면 이름도 바뀌어야 재방문자가 낡은 조각을 계속 쓰지 않는다(build.mjs subsetHashed 주석).
 *
 * 폰트 스택·역할은 shared/styles/tokens.ts 의 \`font\` 토큰이 정한다(여기는 적재만 한다).
 * 라이선스 고지: public/fonts/README.md · public/fonts/OFL-*.txt (SIL OFL 1.1).
 */
`;

const main = async () => {
  assertFontTools();
  ensureDir(CACHE_DIR);
  ensureDir(PUBLIC_FONTS);

  const splitRanges = readSplitRanges();
  log(`분할 표 ${splitRanges.length}개 (wanted-sans 동적 서브셋과 동일)`);

  // Wanted Sans 는 npm 패키지를 그대로 쓰지만(서브셋 불필요), OFL 고지는 같은 자리에 모아 둔다.
  const wantedSansOfl = join(ROOT, 'node_modules/wanted-sans/fonts/OFL.txt');
  if (!existsSync(wantedSansOfl)) die(`wanted-sans OFL.txt 를 찾지 못했다: ${wantedSansOfl}`);
  writeFileSync(join(PUBLIC_FONTS, 'OFL-WantedSans.txt'), readFileSync(wantedSansOfl));

  const gmarket = await buildGmarket(splitRanges);
  const lineSeed = await buildLineSeed();
  const inter = await buildInter();

  writeFileSync(
    CSS_OUT,
    `${CSS_HEADER}\n/* Gmarket Sans — display(워드마크·헤딩). 92분할 동적 서브셋 */\n${gmarket.faces.join('\n\n')}\n\n/* LINE Seed Sans KR — heroNumeric(화면당 1곳의 주인공 숫자) */\n${lineSeed.faces.join('\n\n')}\n\n/* Inter — dataNumeric(표·칩·차트의 모든 숫자) */\n${inter.faces.join('\n\n')}\n`
  );

  log('');
  log(`Gmarket   ${gmarket.files.toString().padStart(4)} 파일  ${formatBytes(gmarket.total)}`);
  log(`LINE Seed ${lineSeed.files.toString().padStart(4)} 파일  ${formatBytes(lineSeed.total)}`);
  log(`Inter     ${inter.files.toString().padStart(4)} 파일  ${formatBytes(inter.total)}`);
  log(`CSS       → ${CSS_OUT.replace(ROOT, '')}`);
};

await main();
