import type { ScenarioCandidate } from '../../hooks';

export type ScenarioPickerProps = {
  candidates: ScenarioCandidate[];
  /** 첨부된 후보 id(피커에 있을 때). null = 아직 아무 카드도 안 고름. */
  attachedCandidateId: string | null;
  onSelectScenario: (candidate: ScenarioCandidate) => void;
};
