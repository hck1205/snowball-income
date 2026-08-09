import type { PostPayload } from '@/shared/lib/supabase';

export type FireLinkBlockProps = {
  /** 서버 jsonb 그대로. 🔴 화면은 `parseLinkPayload` 를 통과한 값만 쓴다. */
  payload: PostPayload | null;
};
