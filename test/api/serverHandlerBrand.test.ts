// @vitest-environment node — 파일을 읽어 문자열만 훑는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 서버 핸들러의 **브랜드 표기 가드** — 소스 레벨로 잠근다.
 *
 * ## 왜 소스를 읽나
 * 이 표면들은 **렌더 결과로는 못 잡는다**.
 * - `api/og` 는 satori + resvg.wasm 로 PNG 를 굽는다. 카드에 그려지는 워드마크·기본 문구를 단정하려면
 *   폰트 바이트와 wasm 래스터라이저가 필요해 유닛 대상이 아니다(og.test.tsx 상단 주석 참고).
 *   그래서 **가장 많이 공유되는 브랜드 표면인데 아무 테스트도 지키지 않는 구멍**이 있었다.
 * - `TickerHtml`·`PostHtml`·`PostList` 의 `SITE_SUFFIX` 는 각 핸들러 테스트가 정확일치로 잠그지만,
 *   그건 "제목이 이렇게 조립된다"는 계약이지 "구 브랜드가 남지 않았다"는 계약은 아니다.
 *   새 핸들러가 늘면 그 파일만 조용히 옛 표기로 돌아갈 수 있다.
 *
 * ## 무엇을 보나
 * - 대상: `server/handlers/**` 중 사용자에게 보이는 브랜드 문자열을 가진 핸들러(아래 `BRAND_SOURCES`).
 * - **주석은 뺀다** — 설계 메모는 카피가 아니고, 이 규칙을 설명하려면 금지어를 적어야 한다
 *   (`test/shared/copyTone.test.ts` 와 같은 방침).
 *
 * ## 금지 대상과 예외
 * - 🔴 `스노우볼`·`눈덩이` 비유는 **전 표면 완전 금지**다. 제품명이 `Snowball Income` 이던 시절의
 *   "브랜드 워드마크는 예외" 단서는 사라졌다(2026-08-03 확정 결정).
 * - 🔴 구 제품명 `Snowball Income` 도 남으면 안 된다.
 * - ⚠ 소문자 `snowball` 은 **금지하지 않는다.** 그건 브랜드가 아니라 식별자다 —
 *   `@/shared/lib/snowball` 임포트 경로, OAuth 합성 이메일 도메인(`*-oauth.snowball.invalid`,
 *   기존 계정 식별자라 바꾸면 사용자 데이터가 깨진다) 이 여기 걸린다.
 */

const REPO_ROOT = resolve(__dirname, '../..');

/** 현재 제품명. 영문 표기 하나로 통일한다 — 한글 음차를 만들지 않는다(확정 결정). */
const BRAND = 'Hungry Hippo';

/** 은퇴한 제품명. 영문 표기 그대로만 잡는다(소문자 `snowball` 식별자는 정상). */
const RETIRED_BRAND = /Snowball Income/;

/** 한글 비유. 브랜드 예외는 없다. */
const FORBIDDEN_METAPHORS = [/스노우볼/, /눈덩이/] as const;

/**
 * 사용자에게 보이는 브랜드 문자열을 담은 핸들러.
 * - `Og.tsx` — OG 카드에 그려지는 워드마크와 기본 카드 문구.
 * - 나머지 셋 — `<title>`/`og:title`/`twitter:title` 접미(`SITE_SUFFIX`)와 폴백 설명.
 *
 * 새 핸들러가 브랜드 문자열을 갖게 되면 여기에 추가한다.
 */
const BRAND_SOURCES = [
  'server/handlers/Og/Og.tsx',
  'server/handlers/TickerHtml/TickerHtml.ts',
  'server/handlers/PostHtml/PostHtml.ts',
  'server/handlers/PostList/PostList.ts'
] as const;

/** 주석 제거. `https://` 처럼 콜론 뒤의 `//` 는 URL 이라 남긴다(copyTone 과 동일 규칙). */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const readSource = (path: string): string => stripComments(readFileSync(resolve(REPO_ROOT, path), 'utf-8'));

const SOURCES = BRAND_SOURCES.map((path) => ({ path, code: readSource(path) }));

describe('서버 핸들러 브랜드 표기', () => {
  it('스캔 대상 파일을 실제로 읽는다 (경로가 바뀌면 무음 통과하지 않게)', () => {
    expect(SOURCES).toHaveLength(BRAND_SOURCES.length);
    for (const { path, code } of SOURCES) {
      expect(code.length, `${path} 가 비어 있다`).toBeGreaterThan(0);
    }
  });

  it.each(SOURCES)('$path 는 현재 제품명을 쓴다', ({ code }) => {
    expect(code).toContain(BRAND);
  });

  it.each(SOURCES)('$path 에 구 제품명이 남아 있지 않다', ({ code }) => {
    expect(RETIRED_BRAND.test(code)).toBe(false);
  });

  it.each(SOURCES)('$path 에 "눈덩이·스노우볼" 비유가 없다', ({ code }) => {
    for (const pattern of FORBIDDEN_METAPHORS) {
      expect(pattern.test(code)).toBe(false);
    }
  });

  /**
   * 탐지기 자체 검증 — 규칙이 무음으로 망가지지 않게(주석 제거가 본문까지 지우는 회귀 등).
   * 소문자 식별자는 통과해야 한다는 것까지 함께 못 박는다.
   */
  it('탐지기는 식별자를 통과시키고 브랜드 잔재만 잡는다', () => {
    const identifiers = "import { runSimulation } from '@/shared/lib/snowball'; // snowball.invalid";
    const stripped = stripComments(identifiers);
    expect(RETIRED_BRAND.test(stripped)).toBe(false);
    for (const pattern of FORBIDDEN_METAPHORS) {
      expect(pattern.test(stripped)).toBe(false);
    }

    expect(RETIRED_BRAND.test("const SITE_SUFFIX = 'Snowball Income';")).toBe(true);
    expect(FORBIDDEN_METAPHORS.some((p) => p.test("'스노우볼 효과를 계산합니다'"))).toBe(true);
    expect(FORBIDDEN_METAPHORS.some((p) => p.test("'눈덩이처럼 불어납니다'"))).toBe(true);
  });
});
