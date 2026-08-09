// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 비정식 호스트(`snowball-income.vercel.app`)는 **루트까지** 정식 도메인으로 영구 이전한다.
 *
 * 🔴 `/:path*` 하나로는 **루트를 못 잡는다**(2026-08-10 실측). 빈 경로에서 이 패턴이 매칭되지
 *    않아 리디렉션이 그대로 미스되고, 그 사이로 `dist/index.html` 이 나가 앱 전체가 비정식
 *    주소로도 열린다 — 중복 콘텐츠다. 같은 날 실측:
 * ```
 *   snowball-income.vercel.app/ticker/all            308  ← 규칙 적중
 *   snowball-income.vercel.app/definitely-not-a-file 308  ← 규칙 적중
 *   snowball-income.vercel.app/                      200  ← 미스 (Cache-Control: no-cache 로도 동일)
 * ```
 * ⚠ 그래서 규칙이 **둘**이다. "중복이니 하나로 합치자"는 정리가 이 버그를 정확히 되살린다 —
 *   합치려면 위 세 줄을 다시 재고 루트가 308 인지 확인한 다음에 해라.
 * ⚠ Search Console 이 이 주소들을 "리디렉션이 포함된 페이지"로 보고하는 것은 **정상**이다.
 *   색인돼야 하는 것은 목적지 하나고, 둘 다 색인되면 그게 사고다.
 *
 * (`www` → 정식 도메인 이전은 Vercel 도메인 설정이 낸다 — 이 파일이 아니라 대시보드 소관이다.)
 */

const CANONICAL_ORIGIN = 'https://hungry-hippo.xyz';
const LEGACY_HOST = 'snowball-income.vercel.app';

type Redirect = {
  source: string;
  destination: string;
  permanent?: boolean;
  has?: { type: string; value: string }[];
};

const config = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')) as {
  redirects: Redirect[];
};

const legacyHostRedirects = config.redirects.filter((redirect) =>
  redirect.has?.some((condition) => condition.type === 'host' && condition.value === LEGACY_HOST)
);

describe('비정식 호스트 → 정식 도메인 이전', () => {
  it('루트를 담당하는 규칙이 따로 있다 (/:path* 는 빈 경로를 안 잡는다)', () => {
    const root = legacyHostRedirects.find((redirect) => redirect.source === '/');

    expect(root).toBeDefined();
    expect(root?.destination).toBe(`${CANONICAL_ORIGIN}/`);
  });

  it('나머지 경로를 담당하는 규칙도 함께 있다', () => {
    const rest = legacyHostRedirects.find((redirect) => redirect.source === '/:path*');

    expect(rest).toBeDefined();
    expect(rest?.destination).toBe(`${CANONICAL_ORIGIN}/:path*`);
  });

  it('전부 영구(308)다 — 임시로 두면 검색엔진이 신호를 옮기지 않고 계속 다시 확인한다', () => {
    expect(legacyHostRedirects.length).toBeGreaterThanOrEqual(2);
    for (const redirect of legacyHostRedirects) {
      expect(redirect.permanent).toBe(true);
    }
  });
});
