// @vitest-environment node — 소스 문자열만 본다.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GA4 페이지뷰 **전달 방식**을 잠근다.
 *
 * ## 왜 런타임이 아니라 소스를 읽는가
 * `isAnalyticsEnabled()` 는 DEV·localhost 에서 false 라, 테스트 환경에서 `sendPageView` 는 아무것도
 * 하지 않고 빠져나온다(그게 맞는 동작이다 — 로컬 클릭이 실측 지표를 오염시키면 안 된다).
 * 그래서 "무엇을 부르는가"는 소스에서 확인한다. 이 레포가 워크플로 계약을 YAML 을 읽어 잠그는 것과
 * 같은 방식이다.
 *
 * ## 무엇을 지키는가 (2026-08-22 실측으로 드러난 유실)
 * ```
 *   landingPage=(not set)   158 세션 (28일의 53%)   이탈률 76.6%
 *   /            페이지뷰 1  vs 사용자 9
 *   /simulator   페이지뷰 13 vs 사용자 17
 * ```
 * 페이지뷰가 사용자 수보다 적었다 — 대다수 방문이 페이지뷰를 한 건도 남기지 않았다는 뜻이고,
 * 그래서 GA4 가 세션의 첫 페이지를 정하지 못해 유입 분석의 절반이 눈이 멀어 있었다.
 * 원인은 라우트마다 `gtag("config", …)` 를 다시 부른 것이었다(gtag 는 그것을 **설정 갱신**으로
 * 취급해 이벤트를 내보내지 않을 수 있다).
 */

const source = readFileSync(resolve(__dirname, '../../shared/lib/analytics.ts'), 'utf8').replace(/\r\n/g, '\n');

/** `sendPageView` 의 본문만 잘라 낸다 — 파일 다른 곳의 `config` 호출에 걸리지 않게. */
const sendPageViewBody = (() => {
  const start = source.indexOf('export const sendPageView');
  expect(start).toBeGreaterThan(-1);
  const rest = source.slice(start);
  const end = rest.indexOf('\nexport const ', 1);
  return end < 0 ? rest : rest.slice(0, end);
})();

describe('GA4 페이지뷰 전달 방식', () => {
  it('🔴 page_view 를 이벤트로 보낸다', () => {
    expect(sendPageViewBody).toContain('gtag("event", "page_view"');
  });

  it('🔴 config 재호출로 보내지 않는다 — 그 방식이 페이지뷰를 유실시켰다', () => {
    /**
     * ⚠ 되돌리고 싶어지면 먼저 GA4 에서 `landingPage=(not set)` 비율과 페이지뷰/사용자 비를 봐라.
     *   이 방식으로 되돌아가는 순간 그 둘이 다시 망가진다.
     */
    expect(sendPageViewBody).not.toContain('gtag("config"');
  });

  it('페이지 주소·제목을 함께 싣는다 — 없으면 landingPage 가 다시 (not set) 이 된다', () => {
    expect(sendPageViewBody).toContain('page_location');
    expect(sendPageViewBody).toContain('page_title');
  });
});

describe('첫 화면 중복 방지', () => {
  it('🔴 부팅 config 는 send_page_view 를 끈다', () => {
    /**
     * 이걸 켜면 첫 화면이 **두 번** 세어진다(gtag 자동 페이지뷰 + 위 수동 페이지뷰).
     * 수동으로 보내기로 한 이상 자동은 반드시 꺼져 있어야 한다.
     */
    expect(source).toContain('send_page_view: false');
  });
});
