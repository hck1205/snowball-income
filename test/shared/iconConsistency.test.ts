import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON, ICON_SIZES } from '@/shared/styles';

/**
 * 아이콘 일관성 계약 — **소스 레벨**로 잠근다.
 *
 * 렌더 테스트로는 못 잡는다. 굵기가 섞여 있어도 각 컴포넌트는 저 혼자 멀쩡히 동작하고,
 * 잘못됐다는 사실은 여러 아이콘이 **한 줄에 나란히 설 때**만 눈에 띈다.
 *
 * 2026-07-29 실측 당시: `size` 97곳이 12·14·15·16·18·20·24 로 흩어져 있었고(15 는 계단 밖),
 * `strokeWidth` 는 42곳에만 있어 나머지 55곳이 lucide 기본값 **2** 로 그려졌다.
 * 정렬 후 굵기는 98곳 전부 1.8(예외 1건은 아래 명시), 크기는 계단 안으로 들어왔다.
 *
 * 이 테스트가 막는 것은 **드리프트**다 — 새 코드가 아무 숫자나 쓰기 시작하면 원점으로 돌아간다.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const ROOTS = ['components', 'pages'];

/**
 * 굵기 예외 — 자리마다 이유가 있어야 한다.
 * `ThemePresetSwitcher` 의 선택 체크마크는 굵어야 "지금 이게 선택됨"이 한 눈에 읽힌다.
 */
const STROKE_EXCEPTIONS: Readonly<Record<string, number>> = {
  'components/ThemePresetSwitcher/ThemePresetSwitcher.tsx': 2.4
};

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collect(full, out);
    } else if (entry.endsWith('.tsx') && !/\.test\.tsx$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: readFileSync(file, 'utf-8')
}));

/** `<Xxx ... >` 여는 태그 하나(중첩 `{}` 한 겹 허용) — 대문자 컴포넌트만. */
const OPEN_TAG = /<([A-Z][A-Za-z0-9_]*)\b((?:[^<>{}]|\{[^{}]*\})*?)\/?>/g;

type IconUse = { path: string; component: string; size: number; stroke: number | null };

const ICON_USES: IconUse[] = FILES.flatMap(({ path, source }) => {
  const uses: IconUse[] = [];
  for (const match of source.matchAll(OPEN_TAG)) {
    const [, component, attrs] = match;
    const size = attrs.match(/\bsize=\{(\d+)\}/);
    if (!size) continue;
    /*
     * 스프레드(`{...GLYPH_PROPS}`)는 굵기를 대신 넣어 줄 수 있는데 소스만 봐서는 그 안을 못 본다.
     * 그런 자리는 감사 대상에서 뺀다 — 억지로 잡으려다 **중복 prop** 을 넣는 실수를 한 번 했다
     * (`PortfolioComposition`, 2026-07-29). 크기는 여전히 이 태그에 직접 적혀 있으므로 계단 검사는
     * 그대로 받는다.
     */
    if (/\{\.\.\./.test(attrs) && !/\bstrokeWidth=/.test(attrs)) {
      uses.push({ path, component, size: Number(size[1]), stroke: ICON.stroke });
      continue;
    }
    /*
     * 굵기를 **상수로** 주는 자리도 있다(`strokeWidth={PRESET_ICON_STROKE}`). 소스만 봐서는 값을
     * 모르지만 "명시했다"는 계약은 지킨 것이므로 통과시킨다 — 값까지 보려면 타입 체커의 일이다.
     */
    if (/\bstrokeWidth=\{[A-Za-z_]/.test(attrs)) {
      uses.push({ path, component, size: Number(size[1]), stroke: ICON.stroke });
      continue;
    }
    const stroke = attrs.match(/\bstrokeWidth=\{([\d.]+)\}/);
    uses.push({
      path,
      component,
      size: Number(size[1]),
      stroke: stroke ? Number(stroke[1]) : null
    });
  }
  return uses;
});

describe('아이콘 일관성', () => {
  it('감사 대상이 실제로 잡힌다 (정규식이 죽으면 아래 계약이 조용히 통과한다)', () => {
    expect(ICON_USES.length).toBeGreaterThan(80);
  });

  it('크기는 계단 값만 쓴다 — 임의의 숫자를 넣지 않는다', () => {
    const offScale = ICON_USES.filter((use) => !ICON_SIZES.includes(use.size)).map(
      (use) => `${use.path} <${use.component} size={${use.size}}>`
    );

    expect(offScale).toEqual([]);
  });

  it('굵기를 반드시 명시한다 — 빠뜨리면 lucide 기본값 2 로 그려져 다른 아이콘과 섞인다', () => {
    const missing = ICON_USES.filter((use) => use.stroke === null).map(
      (use) => `${use.path} <${use.component} size={${use.size}}>`
    );

    expect(missing).toEqual([]);
  });

  it('굵기는 1.8 로 통일한다 — 예외는 이유와 함께 이 파일에 적는다', () => {
    const violations = ICON_USES.filter((use) => {
      if (use.stroke === null) return false; // 위 테스트가 따로 잡는다
      const allowed = STROKE_EXCEPTIONS[use.path];
      return use.stroke !== ICON.stroke && use.stroke !== allowed;
    }).map((use) => `${use.path} <${use.component} strokeWidth={${use.stroke}}>`);

    expect(violations).toEqual([]);
  });
});
