/**
 * 회원 탈퇴 클라이언트 오케스트레이션 — **React 없는 순수 함수**로 분리해 테스트한다.
 *
 * 핵심 계약(스코핑 F3, "성공 위장 절대 금지"): 서버가 **정확히 200** 일 때만 `onDeleted`
 * (signOut·이동·안내)가 실행된다. 401/5xx/네트워크/API 부재는 전부 로그아웃하지 않고
 * 실패 이유만 돌려준다. 이 결정을 여기 순수 코드에 못 박아 훅/뷰가 우회할 수 없게 한다.
 */

export const ACCOUNT_DELETE_ENDPOINT = '/api/account-delete';

export type AccountDeleteOutcome =
  | { ok: true }
  /** 401(토큰 없음/만료) — 재로그인 유도. */
  | { ok: false; reason: 'session' }
  /** 5xx·네트워크·API 부재 등 그 외 실패 — 계정은 그대로 남아 있다. */
  | { ok: false; reason: 'failed' };

/** HTTP 상태 → 결과. 200 만 성공, 401 은 세션, 나머지는 실패. */
export const resolveAccountDeleteOutcome = (status: number): AccountDeleteOutcome => {
  if (status === 200) return { ok: true };
  if (status === 401) return { ok: false, reason: 'session' };
  return { ok: false, reason: 'failed' };
};

export type RunAccountDeleteDeps = {
  /** 현재 세션의 액세스 토큰. 없으면 요청을 보내지 않고 session 실패. */
  accessToken: string | null | undefined;
  /** 주입 가능한 fetch(테스트용). 기본은 전역 fetch. */
  fetchImpl?: typeof fetch;
  /** **성공(200) 시에만** 호출 — signOut + 이동 + 안내 배너. */
  onDeleted: () => Promise<void> | void;
};

/**
 * POST /api/account-delete (Bearer). 200 이면 onDeleted 를 실행하고 성공을 돌려준다.
 * 그 외에는 onDeleted 를 절대 부르지 않는다(로그아웃/성공 위장 금지).
 */
export const runAccountDelete = async ({
  accessToken,
  fetchImpl = fetch,
  onDeleted
}: RunAccountDeleteDeps): Promise<AccountDeleteOutcome> => {
  if (!accessToken) return { ok: false, reason: 'session' };

  let status: number;
  try {
    const response = await fetchImpl(ACCOUNT_DELETE_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` }
    });
    status = response.status;
  } catch {
    // 네트워크 실패 / 로컬 dev의 /api 부재 — 성공으로 위장하지 않는다.
    return { ok: false, reason: 'failed' };
  }

  const outcome = resolveAccountDeleteOutcome(status);
  if (outcome.ok) {
    await onDeleted();
  }
  return outcome;
};
