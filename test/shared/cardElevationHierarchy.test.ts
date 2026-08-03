// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { cardElevation } from '@/shared/styles';
import type { SurfaceTier } from '@/shared/styles';

/**
 * **카드 위계 3단 계약** — "유령 카드" 재발 방지.
 *
 * 2026-07-31 이전에는 모든 카드가 `border: 1px` **와** `box-shadow`(`e1`)를 **둘 다** 선언했다.
 * `e1` 은 오프셋 1px · 불투명도 0.05 라 흰 배경 위에서 사실상 보이지 않아, 실제로 위계를 만드는 건
 * 테두리뿐이었고 **테두리는 모든 카드가 똑같이 갖는다** → 결과 요약 카드와 곁가지 카드가 같은 무게로
 * 보였다. 지금은 층마다 수단이 하나다: 주역=그림자, 본문=테두리, 부속=면색.
 *
 * ⚠ **왜 렌더 테스트가 아니라 소스 계약인가** — jsdom(cssstyle)은 `border: 1px solid var(--sb-border)`
 * 처럼 **var() 가 든 단축 속성을 통째로 버린다**(실측: 4개 tone 전부 `getComputedStyle().border === ''`).
 * 즉 "테두리와 그림자를 동시에 갖는가"는 계산값으로 **원리적으로 관측할 수 없다**. box-shadow 는
 * 계산되므로 그쪽 절반은 `components/common/Card/Card.test.ts` 가 실제 렌더로 잡는다 — 두 파일이
 * 한 계약의 양쪽이다.
 */
const REPO_ROOT = resolve(__dirname, '../..');

const read = (path: string): string => readFileSync(join(REPO_ROOT, path), 'utf-8');

/** `prop: value` 쌍으로 자른다(주석·빈 줄 제거). */
const declarationsOf = (css: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const chunk of css.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const [prop, ...rest] = chunk.split(':');
    if (rest.length === 0) continue;
    map.set(prop.trim(), rest.join(':').trim());
  }
  return map;
};

const isDeclared = (value: string | undefined): boolean => value !== undefined && value !== 'none';

/**
 * 이름 붙은 CSS 템플릿 리터럴 한 덩어리를 소스에서 뽑는다.
 * `export const X = styled.section\`…\`` 과 `const x = \`…\`` 을 모두 받는다.
 */
const templateBlock = (source: string, name: string): string => {
  const opener = new RegExp(String.raw`(?:export\s+)?const ${name}\s*=\s*(?:styled\.\w+(?:<[^>]*>)?)?\s*\``);
  const start = source.search(opener);
  expect(start, `${name} 블록을 찾지 못했다 — 이름이 바뀌었으면 이 목록을 갱신할 것`).toBeGreaterThanOrEqual(0);
  const body = source.slice(start);
  const end = body.indexOf('\n`;');
  expect(end, `${name} 블록의 끝을 찾지 못했다`).toBeGreaterThan(0);
  return body.slice(0, end);
};

/**
 * 앱의 **카드 표면** 전수. 여기 있는 면은 배경·테두리·그림자를 스스로 적지 않고
 * `cardElevation` 에서 받아야 한다(= 위계 선언이 한 곳에만 있다).
 *
 * 새 카드 표면을 만들면 여기에 추가하라. 추가를 잊으면 그 카드만 조용히 옛 조합으로 돌아간다.
 */
const CARD_SURFACES: { file: string; block: string; tier: SurfaceTier }[] = [
  // 공용 카드: tone → tier 매핑을 거치므로 리터럴 tier 대신 매핑 표를 따로 검사한다(아래 별도 케이스).
  { file: 'pages/Portfolio/PortfolioPage/styled/cards.styled.ts', block: 'SummaryCard', tier: 'raised' },
  { file: 'pages/Portfolio/PortfolioPage/styled/cards.styled.ts', block: 'HoldingsCard', tier: 'base' },
  { file: 'pages/Portfolio/components/GoalCard/GoalCard.styled.ts', block: 'CardRoot', tier: 'base' }
];

describe('cardElevation — 층마다 수단은 하나다', () => {
  it.each(['raised', 'base', 'sunken'] as const)('%s 는 테두리와 그림자를 동시에 선언하지 않는다', (tier) => {
    const declared = declarationsOf(cardElevation(tier));
    const hasBorder = isDeclared(declared.get('border'));
    const hasShadow = isDeclared(declared.get('box-shadow'));

    expect(
      hasBorder && hasShadow,
      `${tier}: 테두리(${declared.get('border')})와 그림자(${declared.get('box-shadow')})를 둘 다 선언했다 — ` +
        '하나만 남겨라(둘 다면 약한 그림자가 묻혀 위계가 사라진다)'
    ).toBe(false);
    // 세 속성을 항상 함께 낸다 — 층을 갈아끼울 때 이전 층의 잔재가 남지 않게 한다.
    expect(declared.has('border')).toBe(true);
    expect(declared.has('box-shadow')).toBe(true);
    expect(declared.has('background')).toBe(true);
  });

  it('주역은 그림자로, 본문은 테두리로, 부속은 면색으로만 뜬다', () => {
    const raised = declarationsOf(cardElevation('raised'));
    const base = declarationsOf(cardElevation('base'));
    const sunken = declarationsOf(cardElevation('sunken'));

    expect(isDeclared(raised.get('box-shadow'))).toBe(true);
    expect(isDeclared(raised.get('border'))).toBe(false);

    expect(isDeclared(base.get('border'))).toBe(true);
    expect(isDeclared(base.get('box-shadow'))).toBe(false);

    expect(isDeclared(sunken.get('border'))).toBe(false);
    expect(isDeclared(sunken.get('box-shadow'))).toBe(false);
  });

  it('주역의 그림자는 e1 이 아니다 — e1(1px/0.05)은 흰 배경에서 위계를 못 만든다', () => {
    expect(cardElevation('raised')).not.toContain('--sb-shadow-1');
    expect(cardElevation('raised')).toContain('--sb-shadow-2');
  });

  it('다크 위계는 면 밝기가 만든다 — 주역 면은 surface-raised', () => {
    // 다크에서는 그림자가 물리적으로 보이지 않는다. 이 토큰이 아니면 다크에 위계가 아예 없다.
    expect(cardElevation('raised')).toContain('--sb-surface-raised');
    expect(cardElevation('base')).toContain('--sb-surface)');
    expect(cardElevation('sunken')).toContain('--sb-surface-sunken');
  });
});

describe('카드 표면은 위계를 스스로 선언하지 않는다', () => {
  it.each(CARD_SURFACES)('$file › $block 은 cardElevation($tier) 에서만 받는다', ({ file, block, tier }) => {
    const css = templateBlock(read(file), block);

    expect(css).toContain(`cardElevation('${tier}')`);
    expect(css, `${block} 이 테두리를 직접 선언한다 — cardElevation 이 소유해야 한다`).not.toMatch(/\bborder:/);
    expect(css, `${block} 이 그림자를 직접 선언한다 — cardElevation 이 소유해야 한다`).not.toMatch(/\bbox-shadow:/);
  });

  it('포트폴리오 카드의 공통 기하 블록도 위계를 적지 않는다', () => {
    const geometry = templateBlock(read('pages/Portfolio/PortfolioPage/styled/cards.styled.ts'), 'cardGeometry');

    expect(geometry).not.toMatch(/\bborder:/);
    expect(geometry).not.toMatch(/\bbox-shadow:/);
    expect(geometry).not.toMatch(/\bbackground:/);
  });

  it('공용 Card 도 위계를 직접 적지 않는다 (tone → tier 매핑만 갖는다)', () => {
    const source = read('components/common/Card/Card.styled.ts');
    const container = templateBlock(source, 'CardContainer');

    expect(container).toContain('cardElevation(TIER_BY_TONE[$tone])');
    expect(container).not.toMatch(/\bborder:/);
    expect(container).not.toMatch(/\bbox-shadow:/);
    // wash 는 본문 카드의 **장식 변형**이라 면색만 덮어쓴다 — 위계(테두리·그림자)는 base 그대로다.
    expect(source).toContain("raised: 'raised'");
    expect(source).toContain("default: 'base'");
    expect(source).toContain("sunken: 'sunken'");
    expect(source).toContain("wash: 'base'");
  });
});

/** 앱 소스만 본다 — 산출물·의존성 제외. */
const SCAN_ROOTS = ['components', 'pages'];

const collectSourceFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
};

/**
 * 🔴 **주석을 지우고 센다.** 처음 이 가드를 쓸 때 `source.includes('tone="raised"')` 로 셌더니,
 * 요약 카드에서 `tone="raised"` 를 **떼어낸 뮤턴트가 그대로 통과**했다 — 그 파일 JSDoc 이
 * "이 화면의 주역 카드(`tone="raised"`)"라고 적고 있어서 문자열이 계속 매치됐기 때문이다.
 * 소스 스캔 가드는 이렇게 자기 설명 주석에 속는다.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const SOURCE_FILES = SCAN_ROOTS.flatMap((root) => collectSourceFiles(join(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: stripComments(readFileSync(file, 'utf-8'))
}));

describe('주역 카드는 화면당 하나다', () => {
  it('시뮬레이터에서 tone="raised" 를 쓰는 카드는 결과 요약 카드 하나뿐이다', () => {
    // 둘이 되는 순간 어느 쪽도 주역이 아니다(hero 타일 규칙과 같은 논리).
    const raisedCallers = SOURCE_FILES.filter(({ source }) => source.includes('tone="raised"')).map(({ path }) => path);

    expect(raisedCallers).toEqual(['components/ResultSummaryCard/ResultSummaryCard.tsx']);
  });

  it('내 포트폴리오에서 raised 면은 요약 카드(hero 타일을 가진 카드) 하나뿐이다', () => {
    const raisedSurfaces = SOURCE_FILES.filter(
      ({ path, source }) => path.startsWith('pages/Portfolio/') && source.includes("cardElevation('raised')")
    ).map(({ path }) => path);

    expect(raisedSurfaces).toEqual(['pages/Portfolio/PortfolioPage/styled/cards.styled.ts']);
  });
});
