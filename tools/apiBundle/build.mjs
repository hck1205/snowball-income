/**
 * `server/handlers/*` 를 esbuild 로 번들해 **커밋되는 산출물** `api/*.js` 를 만든다.
 *
 * ## 왜 번들하는가 (2026-07-20 프로덕션 전면 장애)
 * Vercel 은 `api/*` 를 **번들하지 않고** 파일별로 트랜스파일해 네이티브 ESM 으로 실행한다.
 * `package.json` 의 `"type":"module"` 이 엄격 ESM 해석을 켜므로 **디렉터리 import(배럴)와 확장자 생략이
 * 둘 다 불법**이 되고, 6개 함수가 전부 `FUNCTION_INVOCATION_FAILED` 로 죽었다:
 *   ERR_UNSUPPORTED_DIR_IMPORT: Directory import '/var/task/shared/lib/og' ...
 *   ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/pages/Main/hooks/persistence/shareLink'
 * 앱 코드를 깊게 재사용하는 구조상 import 241곳에 `.js` 를 붙이는 길은 현실적이지 않아, **번들 1파일**로
 * 만들어 상대 import 자체를 없앤다.
 *
 * ## 왜 빌드 중 생성이 아니라 커밋인가
 * Vercel 이 `api/` 를 함수로 수집하는 시점이 buildCommand **전인지 후인지** 공식 문서가 명시하지 않는다
 * (커뮤니티 답변도 엇갈린다). 산출물을 커밋해 두면 그 미확인 변수 자체가 사라진다 — 배포 시점에 파일이
 * 이미 존재하므로 수집 순서와 무관하다.
 *
 * ## 결정성 (신선도 검사가 성립하는 근거)
 * 같은 입력 → 같은 바이트여야 `--check` 가 의미를 갖는다. 실측으로 확인한 조건:
 *   - esbuild 는 `package-lock.json` 이 0.28.1 로 고정한다.
 *   - 경로 주석은 **cwd 상대 + POSIX 슬래시**라 Windows 와 Linux 산출물이 같다.
 *   - `sourcemap` 을 켜면 절대경로가 섞이므로 **끄고**, 배너에는 타임스탬프·버전 같은
 *     비결정 요소를 절대 넣지 않는다.
 *   - ⚠ `.gitattributes` 의 `api/*.js -text` 가 함께 있어야 한다. `core.autocrlf=true` 인 Windows
 *     체크아웃에서 CRLF 로 변환되면 esbuild 의 LF 출력과 영원히 불일치한다.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { API_BUNDLES, API_EXTERNALS } from './manifest.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** 산출물 최상단 고정 배너. **비결정 요소(시각·버전·해시) 금지** — 신선도 검사가 깨진다. */
const banner = (entry) =>
  [
    '// ⚠ 자동 생성물 — 직접 편집하지 마라. 편집해도 다음 빌드가 덮어쓰고, 그 전에 빌드가 실패한다.',
    `// 소스: ${entry}`,
    '// 재생성: npm run api:bundle',
    ''
  ].join('\n');

/**
 * 한 엔트리를 번들해 **문자열로** 돌려준다(디스크에 쓰지 않는다).
 * `--check` 가 임시 파일 없이 메모리에서 바로 대조할 수 있게 하기 위해서다.
 */
const bundleOne = async ({ entry, out }) => {
  const result = await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    // `@/` alias 를 루트 tsconfig 의 paths 로 해석한다(vite.config.ts 의 loadApiHandler 와 동일 경로).
    tsconfig: join(ROOT, 'tsconfig.json'),
    // React 를 개발 빌드로 끌고 오지 않는다(실측 209KB 절감). 앱 번들과 동일한 전제.
    define: { 'process.env.NODE_ENV': '"production"' },
    external: API_EXTERNALS,
    // 결정성을 위해 끈다. 켜면 절대경로가 산출물에 섞인다.
    sourcemap: false,
    // 산출물을 사람이 읽고 리뷰할 수 있게 둔다(diff 가능). 크기보다 검토 가능성이 중요하다.
    minify: false,
    banner: { js: banner(entry) },
    absWorkingDir: ROOT,
    logLevel: 'warning'
  });
  return { out, code: result.outputFiles[0].text };
};

const bundleAll = () => Promise.all(API_BUNDLES.map(bundleOne));

const readCommitted = (out) => {
  try {
    return readFileSync(join(ROOT, out), 'utf8');
  } catch {
    return null;
  }
};

const STALE_HELP = [
  '',
  '  ┌─ api/ 산출물이 server/handlers/ 소스와 어긋난다 ────────────────────────────',
  '  │',
  '  │  해결: 아래 한 줄을 실행하고, 바뀐 api/*.js 를 **함께 커밋**하라.',
  '  │',
  '  │      npm run api:bundle',
  '  │',
  '  │  왜 이 검사가 있나: api/*.js 는 Vercel 이 실제로 실행하는 배포 산출물이고',
  '  │  git 에 커밋된다. 소스만 고치고 산출물을 안 만들면 프로덕션은 옛 코드를',
  '  │  계속 돌린다 — 그 불일치는 배포 후에야, 그것도 조용히 드러난다.',
  '  └────────────────────────────────────────────────────────────────────────────',
  ''
].join('\n');

const runCheck = async () => {
  const bundles = await bundleAll();
  const stale = [];

  for (const { out, code } of bundles) {
    const committed = readCommitted(out);
    if (committed === null) stale.push(`${out} — 산출물이 없다(커밋되지 않음)`);
    else if (committed !== code) stale.push(`${out} — 커밋된 산출물이 소스와 다르다`);
  }

  if (stale.length > 0) {
    console.error('[api:check] 실패 — 아래 산출물이 낡았다:');
    for (const line of stale) console.error(`  ✗ ${line}`);
    console.error(STALE_HELP);
    process.exit(1);
  }

  console.log(`[api:check] OK — api/*.js ${bundles.length}개가 server/handlers/ 와 일치한다.`);
};

const runWrite = async () => {
  const bundles = await bundleAll();
  for (const { out, code } of bundles) {
    const target = join(ROOT, out);
    mkdirSync(dirname(target), { recursive: true });
    // 개행은 esbuild 가 준 그대로(LF) 쓴다 — .gitattributes 의 `api/*.js -text` 와 짝을 이룬다.
    writeFileSync(target, code);
    console.log(`[api:bundle] ${out}  ${new TextEncoder().encode(code).length} bytes`);
  }
};

const main = process.argv.includes('--check') ? runCheck : runWrite;

main().catch((error) => {
  console.error('[apiBundle] 번들 실패:', error);
  process.exit(1);
});
