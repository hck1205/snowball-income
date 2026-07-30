import { InputField } from '@/components/common';
import { PORTFOLIO_COPY } from '../../../copy';
import type { PortfolioAssumptionsProps } from './PortfolioAssumptions.types';
import {
  AssumptionsBody,
  AssumptionsDetails,
  AssumptionsGroupNote,
  AssumptionsGroupTitle,
  AssumptionsSummary,
  ConditionRow,
  ConditionTerm,
  ConditionValue,
  ConditionsList,
  TaxFieldSlot
} from './PortfolioAssumptions.styled';

const copy = PORTFOLIO_COPY;

/**
 * "가정 요약" 접힘 블록 — 세율 입력 + 계산에 쓰인 조건(가격 기준일·환율 등) + (목표가 있으면)
 * 예상 달성 시점의 계산 조건. `PortfolioPage.view.tsx`에서 뗐다 — 스타일 토큰(`ConditionsList` 등)이
 * 이 블록에서만 쓰여 다른 섹션과 공유가 없는 **완전히 독립된 잘라내기**다.
 *
 * 페이지의 `<details>`는 이 컴포넌트가 그리는 것 하나뿐이다(새 접기 블록을 만들지 않는다).
 */
export default function PortfolioAssumptions({
  summaryLabel,
  rows,
  isLoading,
  taxInput,
  onTaxInputChange,
  onTaxInputBlur,
  goalConditionRows
}: PortfolioAssumptionsProps) {
  return (
    <AssumptionsDetails>
      <AssumptionsSummary>{summaryLabel}</AssumptionsSummary>
      <AssumptionsBody>
        <TaxFieldSlot>
          {/* 세율도 하이드레이션 전에는 훅이 거절한다 — 입력은 받되 버려지는 상태를 만들지 않는다. */}
          <InputField
            label={copy.assumptions.taxLabel}
            type="number"
            value={taxInput}
            suffix="%"
            min={0}
            max={100}
            disabled={isLoading}
            hint={copy.assumptions.taxHint}
            onChange={(event) => onTaxInputChange(event.target.value)}
            onBlur={onTaxInputBlur}
          />
        </TaxFieldSlot>

        <ConditionsList>
          {rows.map((row) => (
            <ConditionRow key={row.label}>
              <ConditionTerm>{row.label}</ConditionTerm>
              <ConditionValue>{row.value}</ConditionValue>
            </ConditionRow>
          ))}
        </ConditionsList>

        {/*
          예상 달성 시점의 근거는 화면에서 여기 한 곳에만 있다 — 빼면 ETA 가 어디서 왔는지 알 길이 없다.
          세율 라벨이 두 번 나오지만 그룹 제목이 소속을 밝히므로 모순이 아니다(포트폴리오 세율 vs
          시뮬레이터에 저장된 세율).
        */}
        {goalConditionRows.length > 0 ? (
          <>
            <AssumptionsGroupTitle>{copy.goal.conditions.groupTitle}</AssumptionsGroupTitle>
            <AssumptionsGroupNote>{copy.goal.conditions.groupNote}</AssumptionsGroupNote>
            <ConditionsList>
              {goalConditionRows.map((row) => (
                <ConditionRow key={row.label}>
                  <ConditionTerm>{row.label}</ConditionTerm>
                  <ConditionValue>{row.value}</ConditionValue>
                </ConditionRow>
              ))}
            </ConditionsList>
          </>
        ) : null}
      </AssumptionsBody>
    </AssumptionsDetails>
  );
}
