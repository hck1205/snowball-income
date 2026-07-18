import { describe, expect, it, vi } from 'vitest';
import {
  ACCOUNT_DELETE_ENDPOINT,
  resolveAccountDeleteOutcome,
  runAccountDelete
} from '@/pages/Community/CommunityProfilePage/hooks';

/**
 * 회원 탈퇴 오케스트레이션의 핵심 계약(스코핑 F3): **200 일 때만** onDeleted(=signOut·이동)가
 * 실행된다. 401/5xx/네트워크/토큰 없음은 전부 로그아웃하지 않고 실패 이유만 돌려준다.
 * "성공 위장 금지"를 순수 함수 수준에서 못 박는다.
 */

const okResponse = (status: number) => ({ status }) as Response;

describe('resolveAccountDeleteOutcome', () => {
  it('200 만 성공', () => {
    expect(resolveAccountDeleteOutcome(200)).toEqual({ ok: true });
  });
  it('401 은 세션 실패', () => {
    expect(resolveAccountDeleteOutcome(401)).toEqual({ ok: false, reason: 'session' });
  });
  it('그 외(405/500)는 일반 실패', () => {
    expect(resolveAccountDeleteOutcome(405)).toEqual({ ok: false, reason: 'failed' });
    expect(resolveAccountDeleteOutcome(500)).toEqual({ ok: false, reason: 'failed' });
  });
});

describe('runAccountDelete — 200 일 때만 로그아웃', () => {
  it('200: onDeleted 를 호출하고 성공을 돌려준다', async () => {
    const onDeleted = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => okResponse(200)) as unknown as typeof fetch;

    const outcome = await runAccountDelete({ accessToken: 'tok', fetchImpl, onDeleted });

    expect(outcome).toEqual({ ok: true });
    expect(onDeleted).toHaveBeenCalledTimes(1);
    // Bearer 토큰으로 올바른 엔드포인트에 POST 했는지
    expect(fetchImpl).toHaveBeenCalledWith(
      ACCOUNT_DELETE_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer tok' })
      })
    );
  });

  it('401: onDeleted 를 호출하지 않고 session 실패', async () => {
    const onDeleted = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => okResponse(401)) as unknown as typeof fetch;

    const outcome = await runAccountDelete({ accessToken: 'tok', fetchImpl, onDeleted });

    expect(outcome).toEqual({ ok: false, reason: 'session' });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('500: onDeleted 를 호출하지 않고 일반 실패', async () => {
    const onDeleted = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => okResponse(500)) as unknown as typeof fetch;

    const outcome = await runAccountDelete({ accessToken: 'tok', fetchImpl, onDeleted });

    expect(outcome).toEqual({ ok: false, reason: 'failed' });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('네트워크 예외(로컬 dev /api 부재): onDeleted 없이 실패 — 성공 위장 금지', async () => {
    const onDeleted = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => {
      throw new Error('Failed to fetch');
    }) as unknown as typeof fetch;

    const outcome = await runAccountDelete({ accessToken: 'tok', fetchImpl, onDeleted });

    expect(outcome).toEqual({ ok: false, reason: 'failed' });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('토큰이 없으면 요청조차 하지 않고 session 실패', async () => {
    const onDeleted = vi.fn(async () => {});
    const fetchImpl = vi.fn(async () => okResponse(200)) as unknown as typeof fetch;

    const outcome = await runAccountDelete({ accessToken: null, fetchImpl, onDeleted });

    expect(outcome).toEqual({ ok: false, reason: 'session' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
