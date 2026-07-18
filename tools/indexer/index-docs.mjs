// 문서(마크다운 + .cursor/rules) → 경량 그래프 인덱스 (.index/docs.json)
// "graphify" 역할: 사람은 원문 md를 읽고, 에이전트는 이 인덱스로 위치를 먼저 찾는다.
// 이 레포엔 Obsidian 볼트가 없다 — 루트 md, .claude/agents, .cursor/rules 정도가 전부라 가볍게 유지한다.
import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { walk, relPosix, parseFrontmatter, extractHeadings, firstSummary, extractCodeRefs, extractCommands, uniq } from './lib.mjs';

// 인덱싱 대상: 루트 md + 이 폴더들 하위의 md (있으면). 없으면 조용히 건너뜀.
const DOC_DIRS = ['docs', '.docs', '.claude', '.github'];
// 확장자가 없어 walk에 안 잡히는 규칙 파일은 명시적으로 추가.
const EXTRA_FILES = ['.cursor/rules'];
const IGNORE_DIRS = ['node_modules', 'dist', 'coverage', 'output'];

export async function buildDocsIndex(root, codeFileSet = new Set()) {
  const found = new Map(); // rel → 절대경로

  // 1) 루트 직속 마크다운 (CLAUDE.md, README.md, PR_DESCRIPTION.md …)
  for (const f of await walk(root, { exts: ['.md'], ignoreDirs: IGNORE_DIRS })) {
    const rel = relPosix(root, f);
    if (!rel.includes('/')) found.set(rel, f);
  }
  // 2) 문서 폴더들 (숨김 폴더도 허용)
  for (const dir of DOC_DIRS) {
    for (const f of await walk(resolve(root, dir), { exts: ['.md', '.mdx'], ignoreDirs: IGNORE_DIRS, allowHidden: ['.claude', '.docs', '.github', '.cursor'] })) {
      found.set(relPosix(root, f), f);
    }
  }
  // 3) 확장자 없는 규칙 파일
  for (const rel of EXTRA_FILES) {
    const abs = resolve(root, rel);
    try {
      if ((await stat(abs)).isFile()) found.set(rel, abs);
    } catch {
      /* 없으면 건너뜀 */
    }
  }

  const docs = [];
  for (const [rel, abs] of found) {
    let content;
    try {
      content = await readFile(abs, 'utf8');
    } catch {
      continue;
    }
    const { data, body } = parseFrontmatter(content);
    const headings = extractHeadings(body);
    const title = data.name || data.title || (headings.find((h) => h.level === 1) || headings[0] || {}).text || basename(rel);

    docs.push({
      path: rel,
      title: String(title).replace(/[#*`]/g, '').trim(),
      type: docType(rel),
      // .claude/agents/*.md 프론트매터의 description은 그대로 살린다(에이전트 검색용)
      summary: data.description || firstSummary(body),
      tags: uniq([...toArray(data.tags), ...toArray(data.tools)]).slice(0, 12),
      headings: headings.map((h) => h.text),
      // 백틱으로 감싼 식별자 — 문서가 언급하는 심볼(runSimulation, ANALYTICS_EVENT …) 검색용
      terms: extractBacktickTerms(body),
      // 문서가 가리키는 코드 위치 — 문서↔코드 그래프 간선
      codeRefs: extractCodeRefs(body, codeFileSet),
      commands: extractCommands(body),
      loc: content.split(/\r?\n/).length,
    });
  }

  // 코드 → 이 코드를 설명하는 문서 (역방향)
  const documentedBy = {};
  for (const d of docs) for (const ref of d.codeRefs) (documentedBy[ref] ||= []).push(d.path);

  return {
    kind: 'docs',
    generatedAt: new Date().toISOString(),
    count: docs.length,
    refCount: docs.reduce((a, d) => a + d.codeRefs.length, 0),
    docs,
    documentedBy,
  };
}

/** 본문의 `백틱` 인라인 코드 중 식별자처럼 보이는 것만(경로/명령은 제외 — 별도 필드로 잡는다). */
function extractBacktickTerms(body) {
  const terms = new Set();
  const re = /`([^`\n]{2,60})`/g;
  let m;
  while ((m = re.exec(body))) {
    const t = m[1].trim();
    if (!/^[A-Za-z_$][\w$.]*$/.test(t)) continue; // 공백/슬래시 포함(경로·명령)은 제외
    if (t.includes('.')) continue;
    terms.add(t);
  }
  return [...terms].slice(0, 60);
}

function docType(rel) {
  if (rel.startsWith('.claude/agents/')) return 'agent';
  if (rel === '.cursor/rules') return 'rules';
  if (rel === 'CLAUDE.md') return 'guide';
  if (rel.startsWith('.github/')) return 'ci-doc';
  if (/README/i.test(rel)) return 'readme';
  return 'doc';
}

function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
