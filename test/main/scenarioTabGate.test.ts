import { describe, expect, it } from 'vitest';
import { evaluateScenarioTabCreation, FREE_SCENARIO_TAB_LIMIT } from '@/pages/Main/hooks';

/**
 * 비로그인 1탭 게이트의 **순수 판정**을 결정론적으로 고정한다(모듈 mock 불필요).
 * 훅은 이 함수에 런타임 값(로그인/커뮤니티 활성/탭 수)만 넘긴다.
 */
const MAX = 10;

describe('evaluateScenarioTabCreation — 탭 생성 게이트', () => {
  it('하드 상한(10)에 도달하면 로그인 여부와 무관하게 limit-reached', () => {
    expect(
      evaluateScenarioTabCreation({ tabCount: MAX, maxTabs: MAX, isCommunityEnabled: true, isLoggedIn: true })
    ).toBe('limit-reached');
    expect(
      evaluateScenarioTabCreation({ tabCount: MAX, maxTabs: MAX, isCommunityEnabled: false, isLoggedIn: false })
    ).toBe('limit-reached');
  });

  it('로그인 가능 배포 + 비로그인은 무료 상한(1개) 초과 생성 시 login-required', () => {
    // 첫 탭(0개 → 1개)은 허용.
    expect(
      evaluateScenarioTabCreation({ tabCount: 0, maxTabs: MAX, isCommunityEnabled: true, isLoggedIn: false })
    ).toBe('allowed');
    // 이미 1개 있으면 2번째부터 로그인 유도.
    expect(
      evaluateScenarioTabCreation({ tabCount: FREE_SCENARIO_TAB_LIMIT, maxTabs: MAX, isCommunityEnabled: true, isLoggedIn: false })
    ).toBe('login-required');
  });

  it('로그인 상태는 게이트 없이 하드 상한까지 허용(현행 10탭 유지)', () => {
    expect(
      evaluateScenarioTabCreation({ tabCount: 1, maxTabs: MAX, isCommunityEnabled: true, isLoggedIn: true })
    ).toBe('allowed');
    expect(
      evaluateScenarioTabCreation({ tabCount: 9, maxTabs: MAX, isCommunityEnabled: true, isLoggedIn: true })
    ).toBe('allowed');
  });

  it('로그인 불가 배포(커뮤니티 비활성)는 게이트가 없어 2번째 탭도 허용', () => {
    expect(
      evaluateScenarioTabCreation({ tabCount: 1, maxTabs: MAX, isCommunityEnabled: false, isLoggedIn: false })
    ).toBe('allowed');
    expect(
      evaluateScenarioTabCreation({ tabCount: 5, maxTabs: MAX, isCommunityEnabled: false, isLoggedIn: false })
    ).toBe('allowed');
  });
});
