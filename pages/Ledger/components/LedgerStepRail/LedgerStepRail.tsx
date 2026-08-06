import { Check } from 'lucide-react';
import { LEDGER_COPY } from '../../copy';
import type { LedgerStepRailProps } from './LedgerStepRail.types';
import type { StepState } from './LedgerStepRail.styled';
import { StepBadge, StepItem, StepRailRoot, StepText } from './LedgerStepRail.styled';

const copy = LEDGER_COPY;

/** 순서가 곧 절차다 — 배열 순서를 바꾸면 화면의 흐름이 바뀐다. */
const STEPS = [copy.connect.steps.pick, copy.connect.steps.map, copy.connect.steps.record] as const;

/**
 * **연결 절차 표시줄** — "시트 고르기 → 열 지정 → 기록 시작".
 *
 * 왜 있나: 예전에는 연결 화면과 열 지정 화면이 서로를 모르는 두 장의 카드였다. 사용자는 시트를 고른
 * 직후 갑자기 나타난 셀렉트 다섯 개 앞에서 "이게 몇 단계 중 어디인가"를 알 방법이 없었고, 뒤로
 * 돌아갈 수 있는지도 화면이 말하지 않았다. 같은 줄을 두 화면이 공유하면 그 사실이 상시로 보인다.
 *
 * 🔴 **인터랙션이 아니다.** 단계를 눌러 이동시키지 않는다 — 1단계로 돌아가는 길은 `다른 시트 고르기`
 * 버튼 하나뿐이고(§4.2), 여기에 두 번째 길을 만들면 같은 동작의 진입점이 둘이 된다.
 * 🔴 상태는 색이 아니라 **글리프 + 굵기 + 테두리**가 말한다(회색조에서도 읽힌다).
 */
export default function LedgerStepRail({ current, tone = 'plain' }: LedgerStepRailProps) {
  return (
    <StepRailRoot aria-label={copy.connect.stepsLabel}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const state: StepState = step < current ? 'done' : step === current ? 'current' : 'todo';

        return (
          <StepItem key={label} $tone={tone} $state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <StepBadge $tone={tone} $state={state} aria-hidden>
              {state === 'done' ? <Check size={14} strokeWidth={1.8} focusable={false} /> : step}
            </StepBadge>
            <StepText $state={state}>{label}</StepText>
          </StepItem>
        );
      })}
    </StepRailRoot>
  );
}
