import { Banknote, Coins, HandCoins, Landmark, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  LANDING_GOAL_ASSUMPTIONS,
  landingGoalPath,
  type LandingGoal
} from '@/shared/constants/landingGoals';
import { formatMonths, monthsToReachAmount, principalForMonthlyDividend } from '@/shared/lib/goalPlan';
import type { GoalCardModel, GoalPreview } from './GoalPicker.types';

/**
 * 목표마다 다른 아이콘 — **여섯 장을 서로 구별시키는 유일한 그림**이다.
 *
 * 묶음마다 하나씩만 주면 같은 그림이 세 번 반복돼 카드가 서로 붙어 보인다. 각 줄 안에서
 * 그림이 **커지는 순서**(동전 → 저금통 → 금고 / 지갑 → 지폐 → 두 손)라, 금액이 커지는 것을
 * 글자를 읽기 전에 알 수 있다.
 * ⚠ 여기 없는 id 가 들어오면 그 묶음의 첫 아이콘으로 떨어진다(빈 자리를 만들지 않는다).
 */
const GOAL_ICONS: Record<string, LucideIcon> = {
  'asset-100m': Coins,
  'asset-300m': PiggyBank,
  'asset-500m': Landmark,
  'dividend-50': Wallet,
  'dividend-100': Banknote,
  'dividend-200': HandCoins
};

/**
 * 목표 여섯을 **카드 모델**로 만든다 — 순수 함수. 화면은 이 결과를 그리기만 한다.
 *
 * ## 🔴 카드가 답을 먼저 말한다
 * "1억 만들기" 만 적힌 버튼은 링크지 후킹이 아니다. 그 아래 **"월 100만 원씩이면 6년 7개월"**이
 * 붙는 순간 버튼이 이미 무언가를 알려 준다 — 그것이 이 교체의 목적이었다(2026-08-27 사용자 피드백:
 * "직관적인 버튼 6개 만들고 그거 먼저 시작해야 재밌을 것 같다").
 *
 * ## 어림이지 예측이 아니다
 * 여기 숫자는 **종목을 모른다**. 계산 엔진(`shared/lib/snowball`)이 하는 일 — 지급 주기, 종목별
 * 배당률, 재투자 타이밍 — 을 하나도 하지 않는 단순 연금 산수다. 그래서 카드는 목적지가 아니라
 * **입구**이고, 정확한 답은 사용자가 도착한 계산기가 낸다.
 * 🔴 그래서 가정을 화면에 **반드시 함께** 적는다. 근거 없는 숫자는 투자 권유로 읽힌다.
 *
 * ⚠ 이 함수는 계산 엔진을 import 하지 않는다(앞으로도). 엔진을 끌어오면 첫 화면 번들에 시뮬레이션
 *   코드가 통째로 실린다 — 첫 화면이 계산을 하지 않는 것이 이 화면의 설계다.
 */
export const buildGoalCards = (goals: readonly LandingGoal[]): GoalCardModel[] =>
  goals.map((goal) => ({
    goal,
    to: landingGoalPath(goal),
    preview: buildGoalPreview(goal),
    Icon: GOAL_ICONS[goal.id] ?? (goal.kind === 'asset' ? Coins : Wallet)
  }));

/** 미리 보기. 자산은 **얼마나 걸리는지**, 배당은 **얼마가 필요한지**를 답한다. */
const buildGoalPreview = (goal: LandingGoal): GoalPreview | null => {
  const { annualReturnRate, dividendYield, taxRate, monthlyContributions } = LANDING_GOAL_ASSUMPTIONS;

  if (goal.kind === 'asset') {
    /* 세 단계 중 **가운데**를 기준으로 말한다. 가장 낮은 값은 기간이 너무 길어 겁을 주고, 가장 높은
       값은 아무나 낼 수 없는 금액이라 남 얘기가 된다. 셋 다 적으면 카드가 표가 된다. */
    const monthly = monthlyContributions[Math.floor(monthlyContributions.length / 2)];
    const months = monthsToReachAmount({
      target: goal.amount,
      monthlyContribution: monthly,
      annualReturnRate
    });
    if (months === null) return null;

    /* ⚠ **짧게 유지해라.** 390px 에서 카드 내용폭은 ~98px 다 — "월 100만 원씩이면"(10자)은 두 줄로
       접히면서 답과의 간격을 무너뜨린다. 조건절은 8자 안쪽이어야 한 줄에 선다. */
    return { lead: `${formatManwon(monthly)}씩`, value: formatMonths(months) };
  }

  const principal = principalForMonthlyDividend({
    monthlyDividend: goal.amount,
    dividendYield,
    taxRate
  });
  if (principal === null) return null;

  return { lead: '필요한 원금', value: `약 ${formatEok(principal)}` };
};

/** 만 원 단위. `1_000_000` → `월 100만원`. ⚠ `만 원` 을 띄우지 않는다 — 한 글자가 줄바꿈을 부른다. */
const formatManwon = (won: number): string => `월 ${Math.round(won / 10_000).toLocaleString('ko-KR')}만원`;

/**
 * 억 단위 한 자리. `355_000_000` → `3.6억 원`.
 * ⚠ 반올림해서 `.0` 이 되면 소수점을 떼어 낸다(`3.0억` 은 사람이 쓰지 않는 표기다).
 */
const formatEok = (won: number): string => {
  const eok = Math.round((won / 100_000_000) * 10) / 10;
  return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억 원`;
};

/**
 * 카드 아래 **가정 셋**.
 *
 * 🔴 숨기거나 접지 마라 — 위 머리말의 이유. 한 문장으로 흘려 두었더니 "하나도 안 읽힌다"는
 * 지적을 받아(2026-08-27) 이름·값을 갈라 돌려준다. 화면은 이 셋을 각각 칩으로 세운다 —
 * 서로 다른 가정임이 형태로 보여야 읽힌다.
 * ⚠ 문구를 손으로 적지 않고 상수에서 만드는 이유는 하나다: 가정을 고치면 이 줄이 따라온다.
 */
export const buildGoalAssumptions = (): ReadonlyArray<{ label: string; value: string }> => {
  const { annualReturnRate, dividendYield, taxRate } = LANDING_GOAL_ASSUMPTIONS;

  return [
    { label: '연 수익률', value: formatPercent(annualReturnRate) },
    { label: '배당률', value: formatPercent(dividendYield) },
    { label: '배당소득세', value: formatPercent(taxRate) }
  ];
};

/** `0.154` → `15.4%`. 소수 한 자리까지, 딱 떨어지면 소수점을 떼어 낸다. */
const formatPercent = (rate: number): string => `${Math.round(rate * 1000) / 10}%`;
