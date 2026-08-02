import { AlertCircle } from 'lucide-react';
import { useId } from 'react';
import { LANDING_COPY } from '../../copy';
import {
  CautionItem,
  CautionList,
  ChecklistCard,
  ChecklistColumn,
  ChecklistTitle,
  StepClosing,
  StepItem,
  StepList
} from './StartChecklist.styled';

const copy = LANDING_COPY.checklist;

/**
 * S7 — 시작하려면 무엇을 준비하나.
 *
 * 🔴 **특정 증권사·상품·매수 시점을 언급하지 않는다. 외부 금융사 링크 0건.**
 * 오른쪽 목록은 "우리 앱 밖에서 벌어지는 일"을 정직하게 적는 자리이지, 어디서 계좌를 만들라고
 * 안내하는 자리가 아니다.
 *
 * 두 목록의 성격이 다르다는 것이 눈에도 보여야 한다 — 왼쪽은 번호가 붙은 순서(ol),
 * 오른쪽은 각 항목 앞에 글리프가 붙은 점 목록(ul)이다.
 */
export default function StartChecklist() {
  const stepsId = useId();
  const cautionsId = useId();

  return (
    <ChecklistCard>
      <ChecklistColumn>
        <ChecklistTitle id={stepsId}>{copy.stepsTitle}</ChecklistTitle>
        <StepList aria-labelledby={stepsId}>
          {copy.steps.map((step) => (
            <StepItem key={step.slice(0, 12)}>{step}</StepItem>
          ))}
        </StepList>
        <StepClosing>{copy.stepsClosing}</StepClosing>
      </ChecklistColumn>

      <ChecklistColumn>
        <ChecklistTitle id={cautionsId}>{copy.cautionsTitle}</ChecklistTitle>
        <CautionList aria-labelledby={cautionsId}>
          {copy.cautions.map((caution) => (
            <CautionItem key={caution.slice(0, 12)}>
              <AlertCircle size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              <span>{caution}</span>
            </CautionItem>
          ))}
        </CautionList>
      </ChecklistColumn>
    </ChecklistCard>
  );
}
