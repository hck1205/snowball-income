import { describe, expect, it } from 'vitest';
import { font } from './tokens';
import { getChartTheme, getPrintChartTheme } from './chartTheme';

/**
 * 서체 **역할 4종**의 스택 계약.
 *
 * ## 왜 이 파일이 필요한가 (실측 근거)
 * 서체는 전부 CSS `font-family` 문자열로만 존재한다 — jsdom 은 실제 글리프를 그리지 않으므로
 * "표 안 한글이 엉뚱한 서체로 떨어진다" 류의 회귀는 **렌더 테스트로 절대 잡히지 않는다.**
 * 실제로 QA 뮤테이션에서 `dataNumeric` 의 한글 폴백(`'Wanted Sans'` 이하)을 통째로 지웠을 때
 * 전체 스위트 4,519건이 **한 건도 실패하지 않았다.** Inter 에는 한글 글리프가 없으므로 그 변경은
 * 표 안 "3종"·"미정" 같은 한글을 OS 기본 서체로 떨어뜨리는 명백한 시각 회귀다.
 *
 * 그래서 여기서는 **문자열 계약**을 직접 판다. 이 파일이 막는 것은 두 가지다:
 *  1. 라틴 전용 서체(Inter)를 1순위로 두면서 **한글 폴백을 빼먹는 것**
 *  2. 역할이 서로 뭉개지는 것(hero 와 data 가 같은 서체가 되면 위계가 사라진다)
 *
 * 값 자체(어떤 서체를 쓸지)는 디자인 결정이라 여기서 못 박지 않는다 — 1순위 서체 이름만 확인하고,
 * 나머지는 "한글이 살아 있는가 / 역할이 갈리는가" 라는 **성질**로 검사한다.
 */

/** 스택을 쉼표로 쪼개 따옴표·공백을 벗긴 패밀리 목록. */
const familiesOf = (stack: string): string[] =>
  stack.split(',').map((family) => family.trim().replace(/^['"]|['"]$/g, ''));

/**
 * 한글 글리프를 실제로 가진 폴백 후보.
 * 이 중 하나라도 스택에 있어야 라틴 전용 1순위 뒤의 한글이 OS 기본값으로 떨어지지 않는다.
 */
const HANGUL_CAPABLE = [
  'Wanted Sans Variable',
  'Wanted Sans',
  'Apple SD Gothic Neo',
  'Malgun Gothic',
  'Noto Sans KR'
];

/** CSS 제네릭 패밀리 — 스택의 마지막은 반드시 여기서 끝나야 한다. */
const GENERIC_FAMILIES = ['sans-serif', 'serif', 'monospace', 'system-ui'];

const ROLES = ['sans', 'display', 'heroNumeric', 'dataNumeric'] as const;

/** 각 역할의 **1순위** 서체 — 역할이 뒤바뀌면 여기서 걸린다. */
const PRIMARY_BY_ROLE: Record<(typeof ROLES)[number], string> = {
  sans: 'Wanted Sans Variable',
  // 자체 서브셋의 family 명(원본은 Gmarket Sans / Inter) — tools/fonts/build.mjs 가 이 이름으로 선언한다.
  display: 'Snowball Display',
  heroNumeric: 'LINE Seed Sans KR',
  dataNumeric: 'Snowball Numeric'
};

describe('서체 역할 토큰', () => {
  it.each(ROLES)('%s 의 1순위 서체가 역할에 맞는 얼굴이다', (role) => {
    expect(familiesOf(font[role])[0]).toBe(PRIMARY_BY_ROLE[role]);
  });

  /**
   * 🔴 이 파일의 존재 이유. Inter·LINE Seed 숫자 서브셋·Gmarket 은 모두 그 자체로는 본문 한글을
   * 다 덮지 못한다(특히 Inter 는 한글 글리프가 아예 없다). 스택 뒤에 한글 폴백이 남아 있어야
   * 같은 셀 안의 한글이 본문 서체로 이어진다.
   */
  it.each(ROLES)('%s 스택에 한글 폴백이 남아 있다 (라틴 전용 1순위 뒤의 한글 보호)', (role) => {
    const families = familiesOf(font[role]);

    expect(
      families.some((family) => HANGUL_CAPABLE.includes(family)),
      `${role} 스택에 한글 폴백이 없다: ${font[role]}`
    ).toBe(true);
  });

  it.each(ROLES)('%s 스택은 제네릭 패밀리로 끝난다', (role) => {
    const families = familiesOf(font[role]);

    expect(GENERIC_FAMILIES).toContain(families[families.length - 1]);
  });

  /** 숫자 역할 2종이 같아지면 hero 위계가 사라진다(StatTile hero 규칙과 같은 제약). */
  it('heroNumeric 과 dataNumeric 은 서로 다른 얼굴이다', () => {
    expect(familiesOf(font.heroNumeric)[0]).not.toBe(familiesOf(font.dataNumeric)[0]);
  });

  /** 헤딩과 본문이 같아지면 display 역할 자체가 무의미해진다. */
  it('display 와 sans 는 서로 다른 얼굴이다', () => {
    expect(familiesOf(font.display)[0]).not.toBe(familiesOf(font.sans)[0]);
  });

  /**
   * Pretendard 는 이 브랜치에서 **전면 제거**됐다(npm 의존성·main.tsx import·OG otf 전부).
   * 어느 역할에든 남아 있으면 로드되지 않는 서체를 가리키는 죽은 스택이다.
   */
  it.each(ROLES)('%s 에 제거된 Pretendard 가 남아 있지 않다', (role) => {
    expect(font[role]).not.toMatch(/Pretendard/i);
  });
});

describe('차트 서체', () => {
  /**
   * 캔버스(ECharts)는 `var()` 를 못 읽고 font-family **문자열**만 해석한다. 축 라벨의 한글("2028년")이
   * 살아 있으려면 여기에도 한글 폴백이 그대로 실려야 한다 — 차트는 렌더 테스트가 캔버스를 못 보므로
   * 이 문자열 계약이 유일한 방어선이다.
   */
  it.each([
    ['화면(getChartTheme)', () => getChartTheme()],
    ['인쇄·PDF(getPrintChartTheme)', () => getPrintChartTheme('aurora')]
  ])('%s 축·툴팁 서체가 dataNumeric 스택 그대로다 (한글 폴백 포함)', (_label, build) => {
    const theme = build();

    expect(theme.fontFamily).toBe(font.dataNumeric);
    expect(familiesOf(theme.fontFamily).some((family) => HANGUL_CAPABLE.includes(family))).toBe(true);
  });
});
