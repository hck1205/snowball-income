import type { LucideIcon } from 'lucide-react';
import type { LandingGoal } from '@/shared/constants/landingGoals';

export type GoalPickerProps = {
  /** 목표를 고른 순간. **계측만** 한다 — 이동은 `Link` 가 이미 했다(부품 머리말 참고). */
  onSelectGoal: (goal: LandingGoal) => void;
};

/**
 * 카드가 미리 답해 주는 한 줄 — **리드와 값이 갈라져 있다.**
 *
 * 🔴 한 문장("월 100만 원씩이면 6년 7개월")으로 두면 방문자가 훑을 때 **숫자가 문장에 묻힌다**.
 * 이 화면에서 눈이 멈춰야 하는 것은 `6년 7개월` 이지 그 앞의 조건절이 아니다. 갈라 두면 화면이
 * 값만 크고 진하게 그릴 수 있다.
 */
export type GoalPreview = {
  /** 조건절. 작고 흐리다("월 100만 원씩이면" · "필요한 원금"). */
  lead: string;
  /** 답. 카드에서 두 번째로 큰 글자다("6년 7개월" · "약 3.5억 원"). */
  value: string;
};

/** 카드 한 장이 그리는 것. 계산 결과를 미리 문장으로 만들어 둔 형태다. */
export type GoalCardModel = {
  goal: LandingGoal;
  to: string;
  /** 🔴 계산할 수 없으면 `null` 이고, 그때 카드는 이 줄 **없이** 그린다(빈 자리를 남기지 않는다). */
  preview: GoalPreview | null;
  /** 카드의 얼굴. 목표마다 달라서 여섯 장이 서로 구별된다. */
  Icon: LucideIcon;
};
