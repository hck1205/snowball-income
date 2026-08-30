import { useEffect, useRef } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { GoalOutcome } from '../GoalBanner.types';

/**
 * 목표 배너가 **실제로 답을 보여 준 순간**을 한 번 쏜다.
 *
 * ⚠ 부품 폴더가 아니라 `hooks/` 하위에 산다 — 컴포넌트 폴더의 파일 세트(`.tsx`/`.styled.ts`/
 *   `.types.ts`/`.utils.ts`…)에 훅 접미사가 없어서다. `MainRightPanel/hooks/` 와 같은 관례이고,
 *   구조 가드(test/shared/structureRules.test.ts)가 그 세트를 잠근다.
 *
 * ## 왜 마운트가 아니라 "답이 정해진 뒤"인가
 * 배너는 하이드레이션 직후 잠깐 `unknown`(종목 없음)으로 떴다가, 저장된 포트폴리오가 올라오면
 * `reached`/`missed` 로 바뀐다. 마운트에 한 번만 쏘면 **거의 모든 세션이 `unknown` 으로 기록**되어
 * status 가 재려던 것(목표값이 현실적인가)을 못 잰다.
 *
 * 🔴 그래서 **판정이 바뀔 때마다** 쏘되, 같은 (목표, 판정) 쌍은 다시 쏘지 않는다. 사용자가 조건을
 *   만지면 판정이 실제로 뒤집힐 수 있고 그건 새 정보다 — 반면 리렌더는 정보가 아니다.
 * ⚠ 그래서 이벤트 수는 세션당 1~3건이다(unknown → reached, 또는 조건 변경으로 reached → missed).
 *   그 이상 늘면 판정이 매 타건 흔들린다는 뜻이므로 이 훅이 아니라 판정 쪽을 봐야 한다.
 */
export const useGoalBannerAnalytics = (outcome: GoalOutcome | null): void => {
  /** 이미 쏜 (목표, 판정) 쌍. 리렌더로 같은 사실을 두 번 보내지 않는다. */
  const sentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (outcome === null) return;

    const key = `${outcome.goal.id}:${outcome.status}`;
    if (sentRef.current.has(key)) return;
    sentRef.current.add(key);

    trackEvent(ANALYTICS_EVENT.GOAL_BANNER_VIEW, {
      goal_id: outcome.goal.id,
      goal_kind: outcome.goal.kind,
      status: outcome.status
    });
  }, [outcome]);
};
