// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * **가로로 미는 표는 첫 열을 고정한다** — 소스 레벨 계약.
 *
 * 좁은 화면에서 표를 지키는 길은 둘뿐이다: ①행 카드로 접거나(`thead { display: none }`)
 * ②가로로 밀되 **그 행의 이름이 되는 열을 붙여 두거나**. 둘 다 안 하면 사용자는 숫자만 보이는
 * 화면에서 "이게 어느 종목 줄이지?"를 잃는다 — 2026-08-07 대가 순위표, 2026-08-10 ETF 소개
 * 허브 표에서 같은 신고가 반복됐다.
 *
 * 렌더 테스트로는 못 잡는다. jsdom 은 레이아웃을 계산하지 않아 `position: sticky` 가 붙었는지
 * 안 붙었는지가 화면에 아무 차이도 만들지 않는다. 그래서 소스로 잠근다.
 *
 * ⚠ 이 테스트는 "고정 처방을 얹었나"만 본다 — 실제로 열이 안 흔들리는지는 실브라우저 검증이다.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const ROOTS = ['components', 'pages'];

/**
 * **가로로 민다**고 보는 최소폭. 이보다 좁으면 가장 좁은 실사용 화면(360px)에 대체로 들어간다.
 * 가이드의 설명 표(`pages/Guide/GuidePage/styled/table.ts`, 320px)가 여기서 빠지는데, 그 표는
 * 첫 열이 티커가 아니라 **산문 용어**라 고정하면 좁은 폭에서 설명 문장이 설 자리를 먹는다.
 */
const SCROLLING_MIN_WIDTH = 360;

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collect(full, out);
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  dir: relative(REPO_ROOT, join(file, '..')).split(sep).join('/'),
  source: readFileSync(file, 'utf-8')
}));

/** `styled.table` 을 선언하면서 화면보다 넓은 최소폭을 요구하는 파일 = 가로로 미는 표. */
const scrollingTableFiles = FILES.filter((file) => {
  if (!/styled\.table`/.test(file.source)) return false;

  const widths = [...file.source.matchAll(/min-width:\s*(\d+)px/g)].map((match) => Number(match[1]));
  if (!widths.some((width) => width >= SCROLLING_MIN_WIDTH)) return false;

  /* 좁은 폭에서 행 카드로 접는 표는 애초에 밀지 않는다 — 머리 행을 감추는 것이 그 처방의 표식이다. */
  const stacks = /thead\s*{\s*display:\s*none;/.test(file.source);
  return !stacks;
});

/** 고정 처방. 공용 헬퍼가 정본이지만, 자기 사정을 주석으로 적고 직접 쓴 곳도 계약은 지킨 것으로 본다. */
const hasStickyColumn = (source: string) =>
  /\$\{stickyColumn\(/.test(source) || /position:\s*sticky;[\s\S]{0,120}left:\s*0;/.test(source);

describe('가로로 미는 표는 첫 열을 고정한다', () => {
  it('대상 표를 실제로 찾아낸다 (스캔이 조용히 0건이 되면 이 테스트는 아무것도 안 지킨다)', () => {
    expect(scrollingTableFiles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(scrollingTableFiles.map((file) => file.path))('%s — 고정 열이 있다', (path) => {
    const file = scrollingTableFiles.find((candidate) => candidate.path === path);
    /* 표 몸통과 칸이 형제 파일로 갈린 곳이 있다(비교표: frame.ts ↔ cells.ts) — 폴더 단위로 본다. */
    const group = FILES.filter((candidate) => candidate.dir === file?.dir);

    expect(group.some((candidate) => hasStickyColumn(candidate.source))).toBe(true);
  });

  it('고정 열을 쓰는 표는 border-collapse 가 separate 다 (collapse 면 Chrome 이 sticky 를 무시한다)', () => {
    const offenders = scrollingTableFiles
      .filter((file) => hasStickyColumn(file.source))
      .filter((file) => /border-collapse:\s*collapse/.test(file.source))
      .map((file) => file.path);

    expect(offenders).toEqual([]);
  });
});
