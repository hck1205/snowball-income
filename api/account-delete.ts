import { createClient } from '@supabase/supabase-js';
/*
  ⚠ 배럴(`@/shared/lib/community`)만 가져온다. 이 배럴이 재export 하는 모듈(profile/avatar/
  accountDelete/display)은 전부 **순수**라 모듈 스코프에서 `import.meta.env` 를 읽지 않는다.
  (og.tsx 가 겪은 함정: analytics 처럼 모듈 평가 단계에서 import.meta.env 를 읽는 코드를 끌고 오면
   Vercel Node 런타임에서 함수 전체가 즉사한다. 그래서 여기서는 IO/DOM 없는 순수 모듈만 참조한다.)
*/
import {
  handleAccountDelete,
  avatarStorageFolder,
  AVATAR_BUCKET,
  type AccountDeleteDeps
} from '@/shared/lib/community';

/**
 * 회원 탈퇴 — `POST /api/account-delete`, Authorization: Bearer <액세스 토큰>.
 *
 * ## 런타임: Node.js (og.tsx 와 동일 규약 — `export const config` 없음 = 기본 Node)
 * service_role 키로 admin 삭제를 해야 하는데, **service_role 은 브라우저에 절대 노출하지 않는다**
 * (`.env.example` 경고). 그래서 클라이언트가 직접 auth.users 를 지우는 건 불가능하고, 이 서버 경로가 필요하다.
 *
 * ## 처리
 *   1) 토큰 검증(admin.auth.getUser) → uid 확정
 *   2) 본인 Storage 아바타 폴더 삭제(실패해도 계속 — 파일이 없을 수 있다)
 *   3) admin.auth.admin.deleteUser(uid) → DB CASCADE 로 프로필·글·댓글·좋아요 일괄 삭제
 *
 * ## 환경변수 (Vercel 서버 전용 — VITE_ 접두 금지, Sensitive)
 *   - SUPABASE_URL (없으면 VITE_SUPABASE_URL 로 폴백)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   둘 중 하나라도 없으면 500(성공 위장 금지 — 조용히 성공처럼 굴지 않는다).
 *
 * 같은 도메인 호출이라 CORS 불필요. 무인증 호출은 401 로 즉시 차단된다.
 */

const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const createAdminClient = () => {
  const url = readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

const jsonError = (status: number, code: string): Response =>
  new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

export default async function handler(request: Request): Promise<Response> {
  const admin = createAdminClient();
  if (!admin) {
    console.error('[account-delete] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다');
    return jsonError(500, 'internal_error');
  }

  const deps: AccountDeleteDeps = {
    authenticate: async (token) => {
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return null;
      return data.user.id;
    },
    removeAvatarFolder: async (userId) => {
      const folder = avatarStorageFolder(userId);
      const { data: files, error } = await admin.storage.from(AVATAR_BUCKET).list(folder);
      if (error || !files || files.length === 0) return;
      await admin.storage.from(AVATAR_BUCKET).remove(files.map((file) => `${folder}/${file.name}`));
    },
    deleteUser: async (userId) => {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message);
    }
  };

  return handleAccountDelete(request, deps);
}
