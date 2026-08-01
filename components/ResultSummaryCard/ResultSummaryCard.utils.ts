import { useEffect, useRef, useState } from 'react';
import type { SimulationOutput } from '@/shared/types';

/**
 * 도달 연도가 **투자 몇 년차**인지 (1-based). 찾지 못하면 `undefined`.
 *
 * 엔진이 주는 것은 달력 연도(`targetMonthDividendReachedYear`)뿐이라, "2028년"이 사용자 기준으로
 * 얼마나 먼 미래인지는 `yearly` 배열에서의 위치로만 안다. **표시 파생값이라 계산 엔진을 건드리지
 * 않는다** — 이미 나온 결과를 읽어 순서만 센다.
 *
 * 소비처는 목표 StatTile의 hint 한 곳이다 — 도달 서사는 내 포트폴리오(`/dividend/portfolio`)의
 * 목표 달성 카드가 맡아 이 카드에서 제거됐다(그 카드가 구 `/dividend/goal` 페이지를 흡수했다).
 */
export const findTargetReachYearIndex = (
  yearly: SimulationOutput['yearly'],
  reachedYear: number | undefined
): number | undefined => {
  if (reachedYear === undefined) return undefined;

  const index = yearly.findIndex((row) => row.year === reachedYear);
  return index < 0 ? undefined : index + 1;
};

/**
 * **"목표에 막 도달한 그 순간"인가** — 한 세션에 한 번만 참이 되는 판정.
 *
 * 목표 타일은 도달하면 면색이 `success-surface` 로 바뀌고 체크 글리프가 들어온다. 그 등장 모션이
 * **언제 돌아야 하는가**를 여기서 정한다.
 *
 * | 상황 | 결과 |
 * |---|---|
 * | 첫 렌더부터 이미 도달 (저장값 복원·새로고침·공유 링크) | `false` — 축하는 이미 지난 일이다 |
 * | 세션 중 미달성 → 달성으로 넘어감 | `true` — 사용자가 방금 만든 변화 |
 * | 그 뒤의 모든 리렌더 | `false` — 잠긴다 |
 *
 * 🔴 **"리렌더마다 재생"이 이 연출의 유일한 실패 모드다.** 결과 카드는 슬라이더를 한 칸 움직일
 * 때마다 다시 그려진다 — 잠그지 않으면 100번째 조정에서 축하는 소음이 된다. 값이 오르내려
 * 도달을 여러 번 왕복해도 **최초 1회만** 참이다.
 *
 * 🔴 판정은 **effect 가 아니라 렌더 중**이다. effect 로 켜면 체크 글리프가 한 번 제 크기로
 * 그려진 뒤 다음 커밋에서 scale 0.25 부터 다시 들어온다 — 등장이 아니라 깜빡임이 된다.
 * 렌더 중 `setState` 는 React 가 커밋 전에 다시 그려 주므로 첫 프레임부터 모션이 붙는다.
 *
 * (훅이지만 이 폴더의 파일 세트에 `.hooks.ts` 가 없어 여기 산다 — `.cursor/rules` §3,
 *  가드 `test/shared/structureRules.test.ts`.)
 */
export const useGoalReachCelebration = (isReached: boolean): boolean => {
  /**
   * 직전 렌더의 도달 여부. **상태**로 들고 있어야 한다(ref 아님) — StrictMode 는 렌더를 두 번
   * 돌리므로 ref 를 렌더 중에 덮으면 두 번째 패스에서 전이가 사라진다. 초기값이 `isReached` 라
   * "처음부터 달성"은 전이가 아니게 되어 저절로 걸러진다.
   */
  const [wasReached, setWasReached] = useState(isReached);
  /** 이미 한 번 축하했는가. */
  const hasCelebratedRef = useRef(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // 상태가 아니라 **전이**를 본다 — "달성이다"로 두면 다른 값이 바뀌는 렌더에서도 조건이 참이다.
  if (wasReached !== isReached) {
    setWasReached(isReached);

    if (isReached && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      setIsCelebrating(true);
    }
  }

  useEffect(() => {
    if (!isCelebrating) return undefined;

    /*
     * 등장 모션이 끝나면 표식을 내린다 — 애니메이션 선언이 DOM 에 남아 있지 않아야
     * 이후의 클래스 변화(간략히 토글 등)에 끌려 다시 재생될 여지가 없다.
     * 260ms 는 글리프 모션(150ms)과 면 전환(250ms)을 모두 덮는다.
     */
    const timer = window.setTimeout(() => setIsCelebrating(false), 260);
    return () => window.clearTimeout(timer);
  }, [isCelebrating]);

  return isCelebrating;
};
