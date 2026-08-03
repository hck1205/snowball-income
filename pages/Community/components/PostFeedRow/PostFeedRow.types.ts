import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import type { PostListItem } from '@/shared/lib/supabase';

export type PostFeedRowProps = {
  item: PostListItem;
  /** 검증 파서를 통과한 게시 시점 시뮬 요약. 없으면 숫자 스트립 없이 텍스트 행으로 선다. */
  simSummary?: ScenarioSimSummary | null;
};
