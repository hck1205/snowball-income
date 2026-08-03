import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

export type PostGalleryCardProps = {
  item: PostListItem;
  /**
   * 게시 시점 시뮬 요약. 서버 jsonb 를 검증 파서에 통과시킨 값만 온다 —
   * `has_payload` 만으로 숫자판을 그리지 않는다(오염 값은 null → 텍스트 카드 폴백).
   */
  simSummary?: ScenarioSimSummary | null;
};
