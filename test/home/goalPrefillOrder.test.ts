// @vitest-environment node — 소스 문자열로 배선을 본다 (렌더 불필요)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveUrlGoalTargetMonthlyDividend } from '@/pages/Main/hooks';
import { findLandingGoal } from '@/shared/constants/landingGoals';

/**
 * 🔴 **목표 프리필은 하이드레이션 *뒤*에 돌아야 한다.**
 *
 * ## 왜 소스를 보는 가드인가
 * 2026-08-30 사용자 신고: *"로그인 된 상태에서 1억·3억·5억, 배당도 마찬가지로 클릭하면 시뮬레이터의
 * 계산식이 다 동일해."* 원인은 순서였다 — 목표를 폼에 채우는 훅이 `Main.tsx` 에서 마운트 즉시 돌고,
 * 그 **뒤에** IndexedDB 읽기가 끝나면서 `applyPersistedPayload` 가 저장된 시나리오로 폼을 통째로
 * 덮었다. 저장된 작업이 없는 사람(첫 방문)에게는 멀쩡했고, 있는 사람(로그인·재방문)에게만 목표
 * 여섯이 전부 같은 화면이 됐다.
 *
 * ⚠ 2026-08-31 에 그 훅은 `useGoalPlanApply` 로 대체됐다 — 목표만 채우는 것이 아니라 **구성까지
 *   담고 적립금을 역산하는** 훅이다. 순서 계약은 그대로 이어진다(오히려 더 중요해졌다: 이제
 *   위로 올리면 저장된 워크스페이스가 계획 전체를 덮는다).
 *
 * ⚠ **단위 테스트로는 이 결함이 안 잡힌다.** 훅만 떼어 부르면 하이드레이션이 아예 없고, 통합 렌더도
 *   test 모드에서는 하이드레이션이 즉시 단락된다(`hydrationGate.test.tsx` 머리말). 그래서 이 계약은
 *   **호출 위치**로만 잠글 수 있다 — 그게 실제로 순서를 정하는 유일한 것이기 때문이다.
 *
 * ## 계약
 * `MainRightPanel` 은 `isPortfolioHydrated` 가 참일 때만 마운트된다(`Main.view.tsx`). 그러므로
 * 이 훅은 거기서 불려야 하고, 마운트 즉시 도는 `Main.tsx` 에서 불리면 안 된다.
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const MAIN = stripComments(readRepoFile('pages/Main/Main.tsx'));
const RIGHT_PANEL = stripComments(readRepoFile('pages/Main/components/MainRightPanel/MainRightPanel.tsx'));
const MAIN_VIEW = stripComments(readRepoFile('pages/Main/Main.view.tsx'));

describe('목표 프리필의 실행 순서', () => {
  it('🔴 하이드레이션 뒤에 마운트되는 곳(MainRightPanel)에서 부른다', () => {
    expect(RIGHT_PANEL).toMatch(/useGoalPlanApply\(/);
  });

  it('🔴 마운트 즉시 도는 Main.tsx 에서는 부르지 않는다 — 여기로 올리면 저장값이 계획을 덮는다', () => {
    expect(MAIN).not.toMatch(/useGoalPlanApply/);
  });

  it('그 패널이 정말 하이드레이션 게이트 뒤에 있다 (게이트가 사라지면 위 계약이 무의미해진다)', () => {
    // 게이트가 걷히면 MainRightPanel 이 즉시 마운트되고, 순서 보장이 조용히 사라진다.
    expect(MAIN_VIEW).toMatch(/isPortfolioHydrated[\s\S]{0,120}<MainRightPanel/);
  });
});

describe('프리셋 프리필도 같은 자리에 있다', () => {
  it('usePresetQueryApply 역시 하이드레이션 뒤에서 불린다 — 둘이 갈라지면 한쪽만 덮인다', () => {
    // 같은 종류의 결함을 같은 방식으로 막는다. 한쪽만 위로 올라가면 그쪽만 조용히 새기 시작한다.
    expect(MAIN).not.toMatch(/usePresetQueryApply/);
  });
});

/**
 * 🔴 **주소의 목표가 저장된 목표를 이긴다.**
 *
 * 위 호출 순서 가드가 하이드레이션만 막는 것과 달리, 이 규칙은 복원 경로 **셋 전부**를 막는다 —
 * 하이드레이션·세션 시작 클라우드 동기화·충돌 해소가 모두 `applyScenario` 를 지나기 때문이다.
 * 처음 고칠 때 순서만 손봤다가 클라우드 경로를 놓쳤고, 그 경로는 정확히 신고된 상황
 * (로그인 상태)에서만 도는 것이라 더 위험했다.
 */
describe('복원 vs 주소의 목표', () => {
  it.each([
    ['dividend-50', 500_000],
    ['dividend-100', 1_000_000],
    ['dividend-200', 2_000_000]
  ])('`?goal=%s` 이면 저장값 대신 그 목표를 쓴다', (goalId, expected) => {
    expect(resolveUrlGoalTargetMonthlyDividend(`https://x.test/simulator?goal=${goalId}`)).toBe(expected);
    // 테스트가 숫자를 따로 들고 있지 않다 — 데이터 정본과 같은 값인지 함께 본다.
    expect(expected).toBe(findLandingGoal(goalId)?.amount);
  });

  it('🔴 자산 목표는 저장값을 건드리지 않는다 — 폼에 목표 자산 칸이 없고, 배당으로 환산하지 않는다', () => {
    for (const id of ['asset-100m', 'asset-300m', 'asset-500m']) {
      expect(resolveUrlGoalTargetMonthlyDividend(`https://x.test/simulator?goal=${id}`)).toBeNull();
    }
  });

  it('목표가 없으면 저장값을 그대로 쓴다', () => {
    expect(resolveUrlGoalTargetMonthlyDividend('https://x.test/simulator')).toBeNull();
    expect(resolveUrlGoalTargetMonthlyDividend('https://x.test/simulator?goal=')).toBeNull();
    expect(resolveUrlGoalTargetMonthlyDividend('https://x.test/simulator?goal=없는-목표')).toBeNull();
  });

  it('주소가 깨져도 던지지 않는다 — 여기서 던지면 복원 전체가 멈춘다', () => {
    expect(() => resolveUrlGoalTargetMonthlyDividend('not-a-url')).not.toThrow();
    expect(resolveUrlGoalTargetMonthlyDividend('not-a-url')).toBeNull();
  });

  it('다른 쿼리와 섞여 있어도 찾는다 (공유 링크·프리셋과 함께 올 수 있다)', () => {
    expect(
      resolveUrlGoalTargetMonthlyDividend('https://x.test/simulator?preset=income&goal=dividend-100&s=abc')
    ).toBe(1_000_000);
  });
});

/**
 * 🔴 **탭 이름은 누른 카드의 이름이다** (2026-08-31 사용자 지시).
 *
 * `applyPresetSilently` 가 탭을 프리셋 제목("안정적 배당성장")으로 바꿔 버린다 — 사용자가 누른 것은
 * 프리셋이 아니라 목표("5억 만들기")라, 그대로 두면 자기가 무엇을 눌러서 생긴 탭인지 알 수 없다.
 * 그래서 계획 적용 훅이 **프리셋 적용 뒤에** 이름을 다시 붙인다.
 */
describe('목표 계획 탭의 이름', () => {
  const HOOK = stripComments(
    readRepoFile('pages/Main/components/MainRightPanel/hooks/useGoalPlanApply.ts')
  );

  it('목표 라벨을 붙인다 — 프리셋 제목이 아니라', () => {
    expect(HOOK).toMatch(/setPendingTabName\(goal\.label\)/);
    expect(HOOK).toMatch(/renameScenarioTab\(activeScenarioId, pendingTabName\)/);
  });

  it('🔴 이름 붙이기가 프리셋 적용 **뒤**에 온다 — 앞에 오면 프리셋 제목이 덮는다', () => {
    // ⚠ 선언(useState)이 아니라 **호출**을 견준다 — 선언은 당연히 위에 있다.
    expect(HOOK.indexOf('applyPresetSilently(preset)')).toBeLessThan(HOOK.indexOf('setPendingTabName(goal.label)'));
  });

  it('🔴 같은 프레임에 rename 하지 않는다 — 새 탭 직후의 activeScenarioId 는 이전 탭이다', () => {
    /*
     * 이름 붙이기는 두 번째 이펙트에서 한다. 첫 이펙트 안에서 바로 부르면 방금 만든 탭이 아니라
     * 그 전 탭의 이름이 바뀐다(그 렌더의 activeScenarioId 를 보기 때문이다).
     */
    const applyEffect = HOOK.slice(HOOK.indexOf('useEffect'), HOOK.indexOf('}, []);'));
    expect(applyEffect).not.toMatch(/renameScenarioTab\(/);
  });
});
