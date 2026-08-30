import { Coins, Target, Wallet } from 'lucide-react';
import { ICON } from '@/shared/styles';
import {
  BannerAnswer,
  BannerBadge,
  BannerBody,
  BannerEstimate,
  BannerGoalName,
  BannerHead,
  BannerRoot
} from './GoalBanner.styled';
import type { GoalBannerProps } from './GoalBanner.types';

/**
 * 첫 화면에서 고른 목표를 계산기가 **되짚는 띠**.
 *
 * ## 왜 있는가 (2026-08-27 사용자 지적)
 * *"1억 3억 5억 마찬가지로 배당 만들기 카드들이 클릭하면 시뮬레이터 페이지에서 그에 맞는
 * 의미있는것들이 나와야하는데 지금은 그렇게 안나와."* 그전까지 `?goal=` 은 폼 값만 조용히 채웠고
 * 화면은 아무 말도 하지 않았다 — 방문자 입장에서는 고른 것이 사라진 것이다.
 *
 * ## 세 줄이 하는 일이 각각 다르다
 * ① **무엇을 골랐는가** — 목표 이름을 그대로 되짚는다(내가 누른 그것이 맞다).
 * ② **지금 조건의 답** — 담은 종목으로 다시 계산한 달성 시점. 배너의 주인공이다.
 * ③ **첫 화면이 말했던 값** — 일반 가정의 어림. 🔴 이 줄을 지우면 방문자는 "아까랑 왜 다르지"
 *    에서 멈춘다. 두 숫자의 전제가 다르다는 것을 말하는 자리가 여기밖에 없다.
 *
 * ## 🔴 목표가 없으면 아무것도 그리지 않는다
 * 주소에 `?goal=` 이 없거나 모르는 id 면 호출부가 이 부품을 마운트하지 않는다 — 계산기를 그냥
 * 쓰러 온 사람에게 빈 띠가 보이면 안 된다.
 *
 * ⚠ 판정은 순수 함수(`resolveGoalOutcome`)가 한다. 이 부품은 그리기만 한다.
 */
export default function GoalBanner({ outcome }: GoalBannerProps) {
  const { goal, status, answer, landingEstimate } = outcome;
  const tone = goal.kind;
  /* 아이콘은 종류를 말한다(목표 여섯 각각이 아니라). 배너는 한 번에 하나만 뜨므로 구별할 필요가
     없고, 오히려 자산/배당 축이 보이는 편이 첫 화면 묶음과 이어진다. */
  const Icon = goal.kind === 'asset' ? Coins : Wallet;

  return (
    <BannerRoot tone={tone} aria-label="선택한 목표">
      <BannerBadge tone={tone}>
        <Icon size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />
      </BannerBadge>

      <BannerBody>
        <BannerHead>
          <Target size={ICON.xs} strokeWidth={2} aria-hidden focusable={false} />
          목표
          <BannerGoalName>{goal.label}</BannerGoalName>
        </BannerHead>

        <BannerAnswer tone={tone} status={status}>
          {answer}
        </BannerAnswer>

        {/* 🔴 지우지 마라 — 위 머리말 ③. */}
        {landingEstimate === null ? null : <BannerEstimate>{landingEstimate}</BannerEstimate>}
      </BannerBody>
    </BannerRoot>
  );
}
