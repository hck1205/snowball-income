#!/usr/bin/env node
// 코드 + 문서 인덱스를 재생성한다. (`npm run index` / .githooks/pre-commit 에서 호출)
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildCodeIndex } from './index-code.mjs';
import { buildDocsIndex } from './index-docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..'); // 저장소 루트
const OUT = resolve(ROOT, '.index');

const README = `# .index — 자동 생성 인덱스 (읽지 말고 검색하세요)

이 폴더는 \`npm run index\`가 **자동 생성**합니다. 직접 편집하지 마세요. git 추적 대상이 아닙니다.

- \`code.json\` — 심볼(함수/컴포넌트/훅/atom/타입) · 모듈 그래프 · 라우트 · 테스트 커버리지 맵
- \`docs.json\` — 마크다운/규칙 문서의 제목·헤딩·요약과 문서→코드 참조
- \`meta.json\` — 생성 시각·통계

## 사용

\`\`\`sh
npm run search -- runSimulation                # 코드+문서 통합 검색
npm run search -- kind:code atom               # 코드 심볼만
npm run search -- kind:pure allocation         # 순수 함수만
npm run search -- kind:test reinvest           # 테스트 케이스 제목으로
npm run search -- file:shared/lib/snowball/SnowballSimulation.ts  # 파일 카드
npm run search -- json limit:30 preset
npm run index                                  # 수동 재생성
\`\`\`

검색 결과는 \`path:line\`을 준다 — **그 위치만 Read**하면 된다.

> ⚠ \`kind:\` / \`limit:\` / \`file:\` 콜론 형태를 쓸 것. Windows PowerShell에서 \`npm run\`은
> \`--kind\` 같은 플래그를 npm 자신의 설정으로 삼켜서 스크립트까지 전달하지 않는다.
> (\`node tools/indexer/search.mjs --kind code atom\` 처럼 직접 실행할 땐 플래그도 동작한다.)
`;

async function main() {
  await mkdir(OUT, { recursive: true });

  const code = await buildCodeIndex(ROOT);
  const codeFileSet = new Set(code.files.map((f) => f.path));
  const docs = await buildDocsIndex(ROOT, codeFileSet);

  await writeFile(`${OUT}/code.json`, JSON.stringify(code) + '\n');
  await writeFile(`${OUT}/docs.json`, JSON.stringify(docs) + '\n');

  const meta = {
    generatedAt: new Date().toISOString(),
    code: {
      files: code.fileCount,
      symbols: code.symbolCount,
      exported: code.exportedCount,
      components: code.componentCount,
      hooks: code.hookCount,
      atoms: code.atomCount,
      pureFiles: code.pureFileCount,
      pureFns: code.pureFnCount,
      routes: code.routeCount,
      tests: code.testCount,
      untestedFiles: code.untested.length,
    },
    docs: { count: docs.count, codeRefs: docs.refCount },
    hint: '자동 생성물. 에이전트는 원문을 훑기 전에 `npm run search`로 위치를 먼저 찾는다.',
  };
  await writeFile(`${OUT}/meta.json`, JSON.stringify(meta, null, 2) + '\n');
  await writeFile(`${OUT}/README.md`, README);

  const c = meta.code;
  console.log(
    `[index] code: ${c.files} files, ${c.symbols} symbols (${c.exported} exported) — ` +
      `${c.components} components, ${c.hooks} hooks, ${c.atoms} atoms, ${c.pureFns} pure fns, ` +
      `${c.routes} routes, ${c.tests} tests | docs: ${meta.docs.count} files, ${meta.docs.codeRefs} code refs`
  );
}

main().catch((err) => {
  console.error('[index] 실패:', err);
  process.exit(1);
});
