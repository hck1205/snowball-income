/**
 * 회원 탈퇴 서버 핸들러의 **분기 로직** — IO 없이 순수하게 테스트 가능하게 뺐다.
 *
 * 실제 admin 삭제/토큰 검증/Storage 삭제(=service_role 권한 필요, 브라우저 금지)는
 * `api/account-delete.ts` 가 process.env 로 클라이언트를 만들어 deps 로 주입한다.
 * 이 파일은 supabase-js 를 import 하지 않으므로 앱 번들/타입에 IO 가 새지 않는다.
 *
 * 계약 (스코핑 ④):
 *   POST /api/account-delete, Authorization: Bearer <액세스 토큰>
 *   200 { ok: true } | 401(토큰 없음/무효) | 405(POST 외) | 500(내부 오류 — 상세 비노출)
 */

export type AccountDeleteDeps = {
  /** 액세스 토큰 검증 → 사용자 uid. 무효면 null(→ 401). */
  authenticate: (accessToken: string) => Promise<string | null>;
  /** 본인 Storage 아바타 폴더 삭제. 실패해도 탈퇴는 계속한다(파일이 없을 수 있다). */
  removeAvatarFolder: (userId: string) => Promise<void>;
  /** auth.users 삭제 → DB CASCADE 로 프로필·글·댓글·좋아요가 함께 사라진다. */
  deleteUser: (userId: string) => Promise<void>;
};

/** `Authorization: Bearer <token>` → 토큰 문자열. 형식이 아니면 null. 스킴은 대소문자 무시. */
export const extractBearerToken = (headerValue: string | null | undefined): string | null => {
  if (!headerValue) return null;
  const match = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
};

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

/**
 * 요청 → 응답. 순수 분기:
 *   1) POST 아님        → 405
 *   2) 토큰 없음/형식 오류 → 401
 *   3) 토큰 검증 실패     → 401
 *   4) 아바타 삭제 실패    → 무시하고 진행(성공/실패로 치지 않는다)
 *   5) 계정 삭제 실패     → 500 (상세 비노출)
 *   6) 성공             → 200 { ok: true }
 */
export const handleAccountDelete = async (request: Request, deps: AccountDeleteDeps): Promise<Response> => {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) {
    return json(401, { error: 'unauthorized' });
  }

  let userId: string | null;
  try {
    userId = await deps.authenticate(token);
  } catch {
    userId = null;
  }
  if (!userId) {
    return json(401, { error: 'unauthorized' });
  }

  // 아바타 파일은 없을 수도, 버킷이 미설정일 수도 있다 — 실패해도 계정 삭제를 막지 않는다.
  try {
    await deps.removeAvatarFolder(userId);
  } catch {
    // 의도적 무시: 데이터 파기의 본질은 admin.deleteUser(아래)의 CASCADE 다.
  }

  try {
    await deps.deleteUser(userId);
  } catch {
    // 여기서 실패하면 계정이 남아 있으므로 절대 성공으로 위장하지 않는다(스코핑 F3).
    return json(500, { error: 'internal_error' });
  }

  return json(200, { ok: true });
};
