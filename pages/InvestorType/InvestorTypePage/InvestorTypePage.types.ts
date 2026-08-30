import type { InvestorAxisScores, InvestorTypeProfile } from '@/shared/constants/investorType';

/**
 * 두 화면의 props.
 *
 * 🔴 화면 둘은 **순수 뷰**다 — 저장도, 라우팅도, 계측도 하지 않는다. 전부 컨테이너
 * (`InvestorTypePage.tsx`)가 하고 여기로는 콜백만 내려온다(`pages/Main` 이 쓰는 것과 같은 규약).
 */

export type QuizViewProps = {
  /** 지금 답할 문항의 1-based 번호. 진행률 표시와 계측이 같은 값을 쓴다. */
  humanIndex: number;
  /** 고른 순간. 컨테이너가 저장·계측·다음 문항 이동을 전부 맡는다. */
  onAnswer: (questionId: string, optionIndex: number, axis: string, humanIndex: number) => void;
  /** 직전 문항으로. 첫 문항에서는 화면이 이 버튼을 그리지 않는다. */
  onBack: () => void;
};

export type ResultViewProps = {
  profile: InvestorTypeProfile;
  scores: InvestorAxisScores;
  /** 복사 안내. 🔴 무음 성공 금지 — 눌렀는데 아무 일도 없어 보이면 사용자는 다시 누른다. */
  shareNotice: string | null;
  onShare: () => void;
  onRestart: () => void;
  /** 결과에서 다음 행동을 고른 순간(프리필·이어보기). 계측은 컨테이너가 한다. */
  onNext: (action: 'prefill' | 'next') => void;
};
