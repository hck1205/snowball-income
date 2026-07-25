import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostPayload } from '@/shared/lib/supabase';
import type { ScenarioCandidate, ScenarioCandidates } from '../../hooks';

export type AttachScenarioSectionProps = {
  /** "첨부" 토글 상태 — ON이면 피커/첨부 카드 노출, OFF면 미첨부. */
  attachEnabled: boolean;
  onToggleAttach: (enabled: boolean) => void;
  /** 현재 첨부된 payload(없으면 null). */
  attachedPayload: PostPayload | null;
  /** 첨부 payload가 피커 후보 중 하나일 때 그 후보. null이면 외부 첨부(수정 모드) 또는 미첨부. */
  attachedCandidate: ScenarioCandidate | null;
  /** 외부 첨부(수정 모드) 표시용 시뮬 요약 — **표시 전용, 저장 아님**. */
  attachedSimSummary: ScenarioSimSummary | null;
  candidates: ScenarioCandidates;
  onSelectScenario: (candidate: ScenarioCandidate) => void;
  /** composer.errors.attach */
  error?: string;
};
