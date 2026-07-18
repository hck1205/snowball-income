// 인덱서 공용 유틸 — 순수 Node(ESM), 외부 의존성 0.
import { readdir } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';

/** 재귀적으로 파일 경로를 수집한다. 숨김 폴더(.git 등)는 allowHidden에 없으면 건너뛴다. */
export async function walk(root, { exts, ignoreDirs = [], allowHidden = [] } = {}) {
  const out = [];
  const ignore = new Set(ignoreDirs);
  const hiddenOk = new Set(allowHidden);

  async function recur(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // 없는 폴더는 조용히 건너뜀
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (ignore.has(e.name)) continue;
        if (e.name.startsWith('.') && !hiddenOk.has(e.name)) continue;
        await recur(full);
      } else if (e.isFile()) {
        if (!exts || exts.some((x) => e.name.toLowerCase().endsWith(x))) out.push(full);
      }
    }
  }

  await recur(root);
  return out;
}

/** 저장소 기준 상대경로를 항상 슬래시(/)로 반환한다. */
export function relPosix(root, file) {
  return relative(root, file).split(sep).join('/');
}

/**
 * import 지정자를 저장소 상대 모듈 경로로 정규화한다.
 * '@/shared/lib' → 'shared/lib' | './x' → 같은 폴더 기준 해석 | 'react' → null(외부 패키지)
 */
export function normalizeSpecifier(fromRel, spec) {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const dir = posix.dirname(fromRel);
    return posix.normalize(posix.join(dir, spec)).replace(/^\.\//, '');
  }
  return null; // 외부 패키지
}

const RESOLVE_EXTS = ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json', '.d.ts'];

/**
 * 확장자 없는 모듈 경로를 실제 파일(fileSet에 존재하는 경로)로 해석한다.
 * 폴더 경로면 index.* 로 해석 (이 레포는 폴더 단위 import 규칙을 쓴다).
 */
export function resolveModule(modPath, fileSet) {
  if (fileSet.has(modPath)) return modPath;
  for (const ext of RESOLVE_EXTS) {
    if (fileSet.has(modPath + ext)) return modPath + ext;
  }
  for (const ext of RESOLVE_EXTS) {
    const idx = `${modPath}/index${ext}`;
    if (fileSet.has(idx)) return idx;
  }
  return null;
}

/** 한 줄에서 import/re-export 지정자를 뽑는다. (다중 행 import도 `from '...'` 줄에서 잡힌다) */
export function extractSpecifier(line) {
  let m = line.match(/\bfrom\s+['"]([^'"]+)['"]/); // import X from '…' / export * from '…'
  if (m) return m[1];
  m = line.match(/^\s*import\s+['"]([^'"]+)['"]/); // side-effect import
  if (m) return m[1];
  m = line.match(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/); // dynamic import
  if (m) return m[1];
  return null;
}

/** 주석/문자열만 있는 줄인지(심볼 추출 제외용). */
export function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('<!--');
}

// ---------- 마크다운(docs) 유틸 ----------

/** 최소 YAML 프론트매터 파서(스칼라 / 인라인 배열 / 블록 배열). */
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { data: {}, body: content };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: content };
  const raw = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};
  let currentKey = null;
  let blockScalar = false; // `key: >-` / `key: |` 뒤의 들여쓴 여러 줄
  for (const line of raw.split(/\r?\n/)) {
    if (blockScalar && /^\s+\S/.test(line)) {
      data[currentKey] = (data[currentKey] ? data[currentKey] + ' ' : '') + line.trim();
      continue;
    }
    blockScalar = false;

    if (/^\s*-\s+/.test(line) && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripQuotes(line.replace(/^\s*-\s+/, '').trim()));
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (!m) continue;
    currentKey = m[1];
    const val = m[2].trim();
    if (/^[|>][-+]?$/.test(val)) {
      // 블록 스칼라 시작 — 이어지는 들여쓴 줄들을 한 문장으로 접는다
      blockScalar = true;
      data[currentKey] = '';
    } else if (val === '') data[currentKey] = '';
    else if (val.startsWith('[') && val.endsWith(']')) {
      data[currentKey] = val
        .slice(1, -1)
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
    } else data[currentKey] = stripQuotes(val);
  }
  return { data, body };
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, '');
}

/** 마크다운 헤딩 목록. */
export function extractHeadings(body) {
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
}

/** 첫 번째 유의미한 문장을 요약으로(최대 len자). */
export function firstSummary(body, len = 180) {
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('---') || t.startsWith('|') || t.startsWith('```')) continue;
    if (/^[-*>]\s/.test(t)) continue;
    const clean = t
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*`_]/g, '')
      .trim();
    if (!clean) continue;
    return clean.length > len ? clean.slice(0, len) + '…' : clean;
  }
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('#')) return t.replace(/^#+\s*/, '');
  }
  return '';
}

/**
 * 문서 본문이 참조하는 "코드 경로"를 뽑는다 — 문서↔코드 그래프의 간선.
 * 마크다운 링크, 백틱 코드 스팬, 맨 텍스트 안의 경로 모두 대상.
 */
export function extractCodeRefs(body, fileSet) {
  const refs = new Set();
  const re = /[`(\[\s"']((?:@\/)?(?:components|pages|shared|jotai|router|utils|scripts|test|tools)\/[\w./@-]+)/g;
  let m;
  while ((m = re.exec(body))) {
    const raw = m[1].replace(/^@\//, '').replace(/[.,)]+$/, '');
    const hit = resolveModule(raw, fileSet) || (fileSet.has(raw) ? raw : null);
    if (hit) refs.add(hit);
    else if (/\/$/.test(raw) || !raw.includes('.')) refs.add(raw); // 폴더 참조는 그대로
  }
  return [...refs];
}

/** 문서가 언급하는 npm 스크립트/명령. */
export function extractCommands(body) {
  const cmds = new Set();
  const re = /\b(npm run [\w:-]+|npx [\w@/.-]+)/g;
  let m;
  while ((m = re.exec(body))) cmds.add(m[1]);
  return [...cmds];
}

export function uniq(arr) {
  return [...new Set(arr)];
}
