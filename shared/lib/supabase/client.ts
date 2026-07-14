import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase 클라이언트 — **환경변수가 없으면 존재하지 않는다.**
 *
 * 이 앱의 강점은 "백엔드 없이 정적 배포되고, 데이터는 IndexedDB + 공유 URL에만 산다"는 것이다.
 * 커뮤니티는 그 위에 **덧붙이는** 기능이라, VITE_SUPABASE_* 가 없으면 앱은 지금과 100% 동일하게
 * 동작해야 한다. 그래서:
 *
 *   1. 둘 다 있을 때만 클라이언트를 만든다 (하나만 있으면 설정 실수 → 비활성).
 *   2. `@supabase/supabase-js`는 **동적 import**로만 불러온다.
 *      정적 import를 쓰면 커뮤니티를 안 쓰는 사용자의 초기 번들에도 SDK가 통째로 들어간다.
 *      (초기 JS 517KB를 지켜야 한다 — 이 파일에서 그 규칙이 깨진다)
 */

export type CommunityEnv = {
  url: string;
  anonKey: string;
};

/** 문자열이고, 공백 제거 후 비어있지 않을 때만 값으로 인정한다. */
const readString = (source: Record<string, unknown>, key: string): string | undefined => {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * 순수 함수 — 환경변수 소스에서 커뮤니티 설정을 읽는다.
 * (import.meta.env를 직접 읽지 않고 주입받아서 테스트 가능하게 만든다)
 *
 * 둘 중 하나라도 없으면 null → 커뮤니티 비활성.
 */
export const readCommunityEnv = (source: Record<string, unknown>): CommunityEnv | null => {
  const url = readString(source, 'VITE_SUPABASE_URL');
  const anonKey = readString(source, 'VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  return { url, anonKey };
};

const COMMUNITY_ENV = readCommunityEnv(import.meta.env as unknown as Record<string, unknown>);

/**
 * UI가 읽는 플래그. false면 커뮤니티 관련 진입점(갤러리 탭·로그인 버튼·댓글)을
 * 아예 렌더하지 않으면 된다.
 */
export const isCommunityEnabled: boolean = COMMUNITY_ENV !== null;

/** 커뮤니티가 꺼져 있는데 서버를 호출하려 했을 때. UI가 이걸 볼 일은 없어야 정상이다. */
export class CommunityDisabledError extends Error {
  constructor() {
    super('커뮤니티 기능이 비활성화되어 있습니다 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 미설정)');
    this.name = 'CommunityDisabledError';
  }
}

let clientPromise: Promise<SupabaseClient<Database>> | null = null;

/**
 * 클라이언트를 지연 생성한다. 비활성이면 null.
 *
 * SDK는 첫 호출 시점에만 네트워크로 받아온다 (별도 청크). 갤러리를 열지 않는 사용자는
 * 이 코드를 절대 실행하지 않으므로 SDK를 내려받지도 않는다.
 */
export const getSupabaseClient = async (): Promise<SupabaseClient<Database> | null> => {
  if (!COMMUNITY_ENV) return null;

  if (!clientPromise) {
    const { url, anonKey } = COMMUNITY_ENV;
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient<Database>(url, anonKey, {
        auth: {
          // OAuth 리다이렉트로 돌아왔을 때 URL의 토큰을 세션으로 흡수한다.
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      })
    );
  }

  return clientPromise;
};

/** 클라이언트가 반드시 있어야 하는 호출부용. 없으면 던진다. */
export const requireSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  const client = await getSupabaseClient();
  if (!client) throw new CommunityDisabledError();
  return client;
};

/** 테스트용 — 메모이즈된 클라이언트를 버린다. */
export const resetSupabaseClientForTest = (): void => {
  clientPromise = null;
};
