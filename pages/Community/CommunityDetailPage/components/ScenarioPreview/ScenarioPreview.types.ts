import type { PostPayload } from '@/shared/lib/supabase';

export type ScenarioPreviewProps = {
  /**
   * 첨부 시나리오 payload(`{ portfolio, investmentSettings }`). 상세 페이지가 CTA와
   * 같은 조건(`post.payload && openInSimulatorHref`)에서만 넘긴다.
   * 컴포넌트가 여기서 요약 숫자와 비중 파이를 파생한다(재계산·저장 아님, 표시 전용).
   */
  payload: PostPayload;
};
