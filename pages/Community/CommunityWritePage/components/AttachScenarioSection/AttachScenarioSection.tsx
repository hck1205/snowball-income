import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ToggleField } from '@/components/common';
import { SimSummaryStats } from '@/components/community';
import { EditorHint, FieldError } from '../../CommunityWritePage.styled';
import { attachSummary } from '../../CommunityWritePage.utils';
import { countIncludedTickers } from '../../hooks';
import ScenarioPicker from '../ScenarioPicker';
import type { AttachScenarioSectionProps } from './AttachScenarioSection.types';
import {
  AttachCard,
  AttachEmpty,
  AttachEmptyCtaLink,
  AttachInfo,
  AttachPreviewInfo,
  AttachSection,
  AttachSectionHeader,
  AttachSectionTitle,
  AttachStates,
  AttachedHint
} from './AttachScenarioSection.styled';

const w = COMMUNITY_COPY.write;

/**
 * 시뮬레이션 첨부 섹션 — 헤더 "첨부" 토글로 활성/해제, 활성 시 1단계 택1 피커.
 * CommunityWritePage 뷰에서 조각만 분리했다 — 첨부 상태 배선(선택/해제 커밋)은 부모에 그대로 있다.
 */
export default function AttachScenarioSection({
  attachEnabled,
  onToggleAttach,
  attachedPayload,
  attachedCandidate,
  attachedSimSummary,
  candidates,
  onSelectScenario,
  error
}: AttachScenarioSectionProps) {
  // 외부 첨부(수정 모드) 카드용 요약 숫자 — 저장 요약과 같은 included 기준으로 센다.
  const ticker = attachedSimSummary?.tickerCount ?? countIncludedTickers(attachedPayload);
  const initial = attachedPayload?.investmentSettings?.initialInvestment ?? 0;
  const monthly = attachedPayload?.investmentSettings?.monthlyContribution ?? 0;

  return (
    <AttachSection>
      <AttachSectionHeader>
        <AttachSectionTitle>{w.fieldAttachment}</AttachSectionTitle>
        <ToggleField
          label={w.attachToggleLabel}
          checked={attachEnabled}
          onChange={(event) => onToggleAttach(event.target.checked)}
        />
      </AttachSectionHeader>
      <EditorHint>{w.attachSectionHint}</EditorHint>

      {attachEnabled ? (
        /* aria-live가 동작하도록 상태가 같은 부모(AttachStates) 안에서 교체된다. */
        <AttachStates aria-live="polite">
          {
            attachedPayload && !attachedCandidate ? (
              /* 외부 첨부(수정 모드) — 피커 후보와 매칭 안 되는 첨부. 요약만 노출(해제는 헤더 토글). */
              <AttachCard>
                <AttachInfo>
                  {attachedSimSummary ? <SimSummaryStats variant="attach" summary={attachedSimSummary} /> : null}
                  <span>{attachSummary(ticker, initial, monthly)}</span>
                  <AttachedHint>{w.attachedHint}</AttachedHint>
                </AttachInfo>
              </AttachCard>
            ) : candidates.status === 'ready' ? (
              /* 택1 피커 — 카드 선택 즉시 첨부(1단계). */
              <>
                <EditorHint>{w.attachPickerHeading}</EditorHint>
                <ScenarioPicker
                  candidates={candidates.candidates}
                  attachedCandidateId={attachedCandidate?.id ?? null}
                  onSelectScenario={onSelectScenario}
                />
                {attachedCandidate ? <AttachedHint>{w.attachedHint}</AttachedHint> : null}
              </>
            ) : candidates.status === 'empty' ? (
              /* 첨부할 시나리오 없음: 실패할 버튼 대신 길을 보여준다 */
              <AttachEmpty>
                <AttachPreviewInfo>
                  <strong>{w.attachEmptyTitle}</strong>
                  <span>{w.attachEmptyBody}</span>
                </AttachPreviewInfo>
                <AttachEmptyCtaLink to="/">{w.attachEmptyCta}</AttachEmptyCtaLink>
              </AttachEmpty>
            ) : null /* loading — 빈 상태 깜빡임 방지로 렌더 없음 */
          }
        </AttachStates>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </AttachSection>
  );
}
