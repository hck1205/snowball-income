// @vitest-environment node — 순수 함수 + 소스 문자열만 본다.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_OPT_OUT_KEY,
  GA_SESSION_TIMEOUT_MS,
  isLikelyBotUserAgent,
  resolveAnalyticsOptOutChange,
  shouldResumeWithPageView
} from '@/shared/lib/analytics';

/**
 * GA4 실측을 오염시키던 두 경로의 계약(2026-11-05).
 *
 * 1. **운영자 기기** — 실제 도메인에서 운영자가 누른 기록이 섞였다(`allocation_changed` 2,021건 / 4명).
 * 2. **오래 열어 둔 탭** — 30분 뒤 조작이 페이지뷰 없는 새 세션을 열어 `landingPage=(not set)` 이 됐다
 *    (28일 39세션, 전체의 약 3분의 1).
 *
 * ⚠ 런타임 경로는 `isAnalyticsEnabled()` 가 테스트 환경(DEV)에서 false 라 그대로 돌릴 수 없다
 *   (pageView.test.ts 와 같은 사정). 판단은 순수 함수로, 배선은 소스로 확인한다.
 */

const source = readFileSync(resolve(__dirname, '../../shared/lib/analytics.ts'), 'utf8').replace(/\r\n/g, '\n');

const bodyOf = (name: string): string => {
  const start = source.indexOf(`export const ${name}`);
  expect(start).toBeGreaterThan(-1);
  const rest = source.slice(start);
  const end = rest.indexOf('\nexport const ', 1);
  return end < 0 ? rest : rest.slice(0, end);
};

describe('운영자 기기 제외 스위치', () => {
  it('`?analytics=off` 는 끄고 `?analytics=on` 은 되돌린다', () => {
    expect(resolveAnalyticsOptOutChange('?analytics=off')).toBe('optOut');
    expect(resolveAnalyticsOptOutChange('?goal=asset-100m&analytics=on')).toBe('optIn');
  });

  it('스위치가 없거나 모르는 값이면 아무것도 바꾸지 않는다 — 공유 링크의 다른 쿼리를 오해하지 않는다', () => {
    expect(resolveAnalyticsOptOutChange('')).toBeNull();
    expect(resolveAnalyticsOptOutChange('?goal=dividend-100')).toBeNull();
    expect(resolveAnalyticsOptOutChange('?analytics=maybe')).toBeNull();
  });

  it('🔴 값에 딸려 온 기호·대소문자는 무시한다 — 실측에서 `off`+백틱으로 열려 스위치가 안 켜졌다', () => {
    expect(resolveAnalyticsOptOutChange('?analytics=off`')).toBe('optOut');
    expect(resolveAnalyticsOptOutChange('?analytics=off%60')).toBe('optOut');
    expect(resolveAnalyticsOptOutChange('?analytics=OFF')).toBe('optOut');
    expect(resolveAnalyticsOptOutChange('?analytics=%22on%22')).toBe('optIn');
  });

  it('저장 키는 브랜드 접두사를 쓴다(storageKey)', () => {
    expect(ANALYTICS_OPT_OUT_KEY.startsWith('hungryhippo:')).toBe(true);
  });

  it('🔴 꺼진 브라우저는 모든 전송이 막힌다 — 판정이 공용 게이트 안에 있다', () => {
    expect(source).toMatch(/const isAnalyticsEnabled = \(\): boolean =>[^;]*!isOptedOut\(\)/);
  });

  it('🔴 부팅은 게이트보다 스위치를 먼저 읽는다 — `?analytics=off` 로 연 첫 화면부터 막힌다', () => {
    const init = bodyOf('initGoogleAnalytics');
    expect(init.indexOf('syncAnalyticsOptOutFromUrl()')).toBeGreaterThan(-1);
    expect(init.indexOf('syncAnalyticsOptOutFromUrl()')).toBeLessThan(init.indexOf('isAnalyticsEnabled()'));
  });
});

describe('오래 열어 둔 탭의 세션 이어 붙이기', () => {
  const t0 = 1_700_000_000_000;

  it('30분이 지나면 페이지뷰를 먼저 세운다', () => {
    expect(shouldResumeWithPageView(t0, t0 + GA_SESSION_TIMEOUT_MS)).toBe(true);
    expect(shouldResumeWithPageView(t0, t0 + 2 * 60 * 60 * 1000)).toBe(true);
  });

  it('30분 안이면 세우지 않는다 — 평소 조작마다 페이지뷰가 붙지 않는다', () => {
    expect(shouldResumeWithPageView(t0, t0 + GA_SESSION_TIMEOUT_MS - 1)).toBe(false);
    expect(shouldResumeWithPageView(t0, t0 + 1000)).toBe(false);
  });

  it('아직 아무것도 보내지 않았으면 이어 붙일 세션이 없다', () => {
    expect(shouldResumeWithPageView(null, t0)).toBe(false);
  });

  it('🔴 이벤트 전송이 판정을 거치고, 페이지뷰를 이벤트보다 먼저 보낸다', () => {
    const track = bodyOf('trackEvent');
    const resume = track.indexOf('shouldResumeWithPageView(lastHitAt, Date.now())');
    expect(resume).toBeGreaterThan(-1);
    expect(resume).toBeLessThan(track.indexOf('window.gtag("event", eventName'));
    expect(track).toContain('lastHitAt = Date.now()');
  });

  it('🔴 페이지뷰도 마지막 전송 시각을 갱신한다 — 안 그러면 라우트 이동 뒤에도 30분을 오판한다', () => {
    expect(bodyOf('sendPageView')).toContain('lastHitAt = Date.now()');
  });
});

describe('봇 제외', () => {
  it('🔴 흔한 크롤러·자동화 UA 는 집계하지 않는다', () => {
    const bots = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)',
      'Mozilla/5.0 (compatible; Daum/4.1; +http://cs.daum.net/faq/15/4118.html?faqId=28966) Daumoa',
      'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36 Chrome-Lighthouse',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
    ];
    for (const ua of bots) expect(isLikelyBotUserAgent(ua), ua).toBe(true);
  });

  it('🔴 실제 브라우저는 집계한다 — 사람을 봇으로 잘못 걸러 지표를 깎지 않는다', () => {
    const people = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Whale/3.28.266.14 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.10.3)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.5',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0'
    ];
    for (const ua of people) expect(isLikelyBotUserAgent(ua), ua).toBe(false);
  });

  it('🔴 판정이 공용 게이트 안에 있다 — 페이지뷰·이벤트·사용자 속성이 함께 막힌다', () => {
    expect(source).toMatch(/const isAnalyticsEnabled = \(\): boolean =>[^;]*!isLikelyBot\(\)/);
    expect(source).toContain('navigator.webdriver === true');
  });
});
