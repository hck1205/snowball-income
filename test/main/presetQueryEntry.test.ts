// @vitest-environment node — 순수 판정 함수만 본다.
import { describe, expect, it } from 'vitest';
import { resolveScenarioPrefillPresetId } from '@/pages/Main/hooks/persistence';
import { buildDefaultPayload } from '@/jotai';
import type { PersistedAppStatePayload } from '@/jotai';

/**
 * `/simulator?preset=<id>` 진입 규칙.
 *
 * 🔴 이 경로를 읽는 곳이 **둘**이라 역할이 갈려 있다:
 *   · 빈 워크스페이스  → 영속 계층이 프리필로 조용히 연다(여기서 판정)
 *   · 이미 포폴이 있음 → 우패널 훅이 확인 모달을 띄운다(`usePresetQueryApply`)
 *
 * 둘 다 돌면 **조용히 적용된 화면 위에 확인 모달까지 뜬다**(2026-08-23 실제로 그랬다).
 * 아래 단정이 그 경계를 지킨다.
 */

const emptyPayload = (): PersistedAppStatePayload => buildDefaultPayload();

const payloadWithPortfolio = (): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile = {
    id: 't1',
    ticker: 'SCHD',
    name: '',
    initialPrice: 27,
    dividendYield: 3.6,
    dividendGrowth: 6.4,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  };
  const portfolio = {
    tickerProfiles: [profile],
    includedTickerIds: [profile.id],
    weightByTickerId: { [profile.id]: 100 },
    fixedByTickerId: { [profile.id]: false },
    selectedTickerId: profile.id
  };
  return { ...base, portfolio, scenarios: base.scenarios.map((s) => ({ ...s, portfolio })) };
};

const at = (href: string) => href;

describe('빈 워크스페이스 — 영속 계층이 맡는다', () => {
  it('🔴 지목이 없으면 프리필하지 않는다 — 택일 화면이 뜨도록', () => {
    expect(resolveScenarioPrefillPresetId(emptyPayload(), at('https://x.test/simulator'))).toBeNull();
  });

  it('성향 테스트가 지목한 구성으로 연다', () => {
    expect(
      resolveScenarioPrefillPresetId(emptyPayload(), at('https://x.test/simulator?preset=warren-buffett-style'))
    ).toBe('warren-buffett-style');
  });

  it('⚠ 모르는 id 도 그대로 통과시킨다 — 거르는 일은 화면 계층 몫이다', () => {
    /**
     * 여기서 검증하려면 프리셋 목록을 알아야 하는데, 그 모듈은 **lucide 아이콘 컴포넌트를 끌고 온다**.
     * 저장 경로에 아이콘 번들이 딸려 오는 것은 `pages/Main/utils/preset.ts` 가 애초에 피하려던 일이다.
     * 화면 계층(`usePresetPrefill`)이 목록에서 못 찾으면 프리필을 내려 빈 워크스페이스를 남기므로
     * 사용자가 보는 결과는 같다 — 택일 화면.
     */
    expect(resolveScenarioPrefillPresetId(emptyPayload(), at('https://x.test/simulator?preset=nope'))).toBe(
      'nope'
    );
  });

  it('파싱 불가한 주소도 죽지 않는다', () => {
    expect(() => resolveScenarioPrefillPresetId(emptyPayload(), at('not a url'))).not.toThrow();
    expect(resolveScenarioPrefillPresetId(emptyPayload(), at('not a url'))).toBeNull();
  });
});

describe('덮어쓸 것이 있으면 — 영속 계층은 비켜선다', () => {
  it('🔴 저장된 포트폴리오가 있으면 지목이 있어도 프리필하지 않는다', () => {
    /**
     * 복원이 언제나 우선이다. 이 경우 확인 모달을 띄우는 것은 우패널 훅의 몫이라,
     * 여기서 `null` 이 아니면 두 경로가 겹친다.
     */
    expect(
      resolveScenarioPrefillPresetId(
        payloadWithPortfolio(),
        at('https://x.test/simulator?preset=warren-buffett-style'))
    ).toBeNull();
  });
});

describe('공유 링크가 우선한다', () => {
  it('공유 링크로 들어오면 프리필하지 않는다 — 화면이 두 번 바뀌지 않게', () => {
    for (const href of ['https://x.test/simulator?s=abc', 'https://x.test/simulator?share=xyz']) {
      expect(resolveScenarioPrefillPresetId(emptyPayload(), at(href))).toBeNull();
    }
  });
});
