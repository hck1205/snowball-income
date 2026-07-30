// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { subtleScrollbar } from '@/shared/styles';

/**
 * 스크롤바 모양 계약 — **소스 레벨**로 잠근다.
 *
 * 렌더 테스트로는 못 잡는다. jsdom 은 스크롤바를 그리지 않고, `::-webkit-scrollbar` 는 실제
 * Chromium 이 아니면 존재조차 안 한다. 그래서 "새로 만든 스크롤 박스가 각진 네이티브 스크롤바를
 * 쓴다"는 회귀는 **전 스위트가 초록인 채로** 들어온다 — 실제로 그렇게 들어왔다.
 *
 * 2026-07-30 사용자 신고("박스 오른쪽 라인이 그냥 직사각형이야"): 얇고 둥근 레시피가 이미 있었는데
 * 소비처가 3곳뿐이었다. 원인은 게으름이 아니라 **배치** — 그 믹스인이 `pages/Main` 로컬 파일에 살아
 * 다른 페이지가 가져다 쓸 수 없었다(페이지 간 직접 import 금지). 승격 후 이 테스트가 전파를 지킨다.
 *
 * 계약 3개:
 *  1) 스크롤 컨테이너를 선언한 파일은 그만큼 공용 믹스인(`subtleScrollbar`/`hiddenScrollbar`)을 쓴다.
 *  2) 스크롤바 CSS 를 손으로 다시 쓰는 곳이 없다(믹스인이 유일한 출처).
 *  3) 믹스인 안에서 **표준 속성이 `@supports` 가림 밖으로 나오지 않는다** — 나오면 Chromium 이
 *     `::-webkit-scrollbar` 규칙을 통째로 무시해 라디우스가 조용히 죽는다(그게 이 버그였다).
 *
 * ⚠ 이 테스트는 "믹스인을 얹었나"만 본다 — 실제 색·라디우스가 예쁜지는 실브라우저 육안 검증이다.
 */

const REPO_ROOT = resolve(__dirname, '../..');

/** 앱이 그리는 화면만 본다(`depthTokens.test.ts` 와 같은 범위). `api/*.js` 는 산출물이라 제외. */
const ROOTS = ['components', 'pages', 'shared'];

/** 믹스인의 **정의**가 사는 곳 — 생 스크롤바 CSS 가 여기 말고 어디에 있을 수는 없다. */
const MIXIN_SOURCE = 'shared/styles/scrollbar.ts';

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collect(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: readFileSync(file, 'utf-8')
}));

/** 스크롤 컨테이너를 만드는 선언. `hidden`/`visible`/`clip` 은 스크롤하지 않으므로 대상이 아니다. */
const SCROLL_CONTAINER = /overflow(?:-x|-y)?:\s*(?:auto|scroll)\s*;/g;

/** 믹스인을 실제로 **얹은** 자리. import 문은 매칭되지 않는다(보간만 센다). */
const MIXIN_USE = /\$\{(?:subtleScrollbar|hiddenScrollbar)\}/g;

/**
 * 믹스인을 못 얹는 예외를 **여기에 이유와 함께** 적는다(이 레포 관례: 이탈은 이탈로 적는다).
 * 지금은 비어 있다 — 스크롤바를 일부러 감추는 곳(`Tabs`·`ScenarioTabs` 모바일)도 예외가 아니라
 * `hiddenScrollbar` 라는 **선언**으로 표현하기 때문이다. 그래야 "왜 안 보이나"를 코드가 답한다.
 */
const EXEMPT: Record<string, string> = {};

const count = (source: string, pattern: RegExp): number => [...source.matchAll(pattern)].length;

const SCROLLERS = FILES.map(({ path, source }) => ({
  path,
  containers: count(source, SCROLL_CONTAINER),
  mixins: count(source, MIXIN_USE)
})).filter((file) => file.containers > 0);

describe('스크롤바 모양', () => {
  it('감사 대상이 실제로 잡힌다 (정규식이 죽으면 아래 계약이 조용히 통과한다)', () => {
    expect(SCROLLERS.length).toBeGreaterThan(12);
    expect(SCROLLERS.reduce((sum, file) => sum + file.containers, 0)).toBeGreaterThan(15);
  });

  it('스크롤 컨테이너는 공용 믹스인으로 모양을 정한다 — 생 overflow 만 두면 각진 네이티브 스크롤바가 나온다', () => {
    const violations = SCROLLERS.filter(
      (file) => !(file.path in EXEMPT) && file.mixins < file.containers
    ).map((file) => `${file.path}: 스크롤 컨테이너 ${file.containers}개 / 믹스인 ${file.mixins}개`);

    expect(violations).toEqual([]);
  });

  it('스크롤바 CSS 를 손으로 다시 쓰지 않는다 — 믹스인이 유일한 출처다', () => {
    const RAW = /::-webkit-scrollbar|scrollbar-width:|scrollbar-color:/;

    const violations = FILES.filter(
      ({ path, source }) => path !== MIXIN_SOURCE && RAW.test(source)
    ).map(({ path }) => path);

    expect(violations).toEqual([]);
  });

  /**
   * 이 계약이 이번 버그의 **정확한 재발 방지선**이다. 헤드리스 Chrome 150 실측: 표준 속성과
   * `::-webkit-scrollbar` 를 같이 선언하면 스크롤바가 10px 네이티브(화살표 버튼 포함)로 나오고,
   * 표준을 `@supports` 안으로 옮기면 6px 우리 thumb 가 나온다.
   */
  /*
   * ⚠ 믹스인 안에는 **왜 이렇게 썼는지 설명하는 주석**이 있고 그 주석이 `@supports`·`-webkit-` 같은
   * 문자열을 그대로 담는다. 주석을 걷어내지 않고 `indexOf` 로 찾으면 **실제 at-rule 이 아니라
   * 주석을 잡는다**(실제로 이 테스트를 처음 쓸 때 그렇게 틀렸다). 선언부만 보고 판정한다.
   */
  const declarations = subtleScrollbar.replace(/\/\*[\s\S]*?\*\//g, '');

  it('표준 스크롤바 속성은 @supports 가림 안에만 있다 — 밖에 두면 webkit 규칙이 무시된다', () => {
    const guardIndex = declarations.indexOf('@supports');

    expect(guardIndex).toBeGreaterThan(-1);
    expect(declarations.slice(0, guardIndex)).not.toMatch(/scrollbar-width:|scrollbar-color:/);
  });

  /*
   * 가드의 **내용**까지 잠근다. 2026-07-31 에 `@supports not selector(::-webkit-scrollbar)` 가
   * Firefox 에서 `not true` = false 로 평가돼(그 브라우저가 선택자에 true 를 반환한다 —
   * bugzil.la/1977511) 폴백이 어느 엔진에도 닿지 않는 죽은 조건이었음이 드러났다.
   * 위 테스트는 "가림 안에 있다"만 보므로 그 사고를 못 잡았다 — 이 테스트가 그 구멍이다.
   */
  it('Firefox 폴백 가드는 webkit 접두 선택자로 엔진을 가르지 않는다', () => {
    const guard = declarations.slice(declarations.indexOf('@supports'));

    // 파싱 가능성만 묻는 조건은 Firefox 에서도 참이라 판별에 쓸 수 없다.
    expect(guard).not.toMatch(/selector\(\s*::-webkit-/);
    expect(guard).not.toMatch(/\(\s*-webkit-appearance/);
    // 엔진 판별은 Chromium 에서 거짓인 `-moz-` 접두 속성으로 한다(Chrome 150 실측).
    expect(guard).toMatch(/-moz-/);
  });
});
