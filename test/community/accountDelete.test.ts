import { describe, expect, it, vi } from 'vitest';
import { extractBearerToken, handleAccountDelete, type AccountDeleteDeps } from '@/shared/lib/community';

/**
 * 회원 탈퇴 서버 핸들러의 **분기 로직**만 순수하게 검증한다(스코핑 F3).
 * 실제 admin 삭제/토큰 검증/Storage 삭제는 api/account-delete.ts 가 service_role 로 주입하는
 * deps 이며 로컬(vitest) 에서 실행할 수 없다 — 여기서는 가짜 deps 로 분기·순서·성공위장금지를 못 박는다.
 */

const req = (method: string, authorization?: string): Request =>
  new Request('https://example.com/api/account-delete', {
    method,
    headers: authorization ? { authorization } : {}
  });

const makeDeps = (overrides: Partial<AccountDeleteDeps> = {}): AccountDeleteDeps => ({
  authenticate: vi.fn(async () => 'uid-1'),
  removeAvatarFolder: vi.fn(async () => {}),
  deleteUser: vi.fn(async () => {}),
  ...overrides
});

describe('extractBearerToken', () => {
  it('Bearer 토큰을 뽑는다(스킴 대소문자 무시, 공백 정리)', () => {
    expect(extractBearerToken('Bearer abc.def')).toBe('abc.def');
    expect(extractBearerToken('bearer abc.def')).toBe('abc.def');
    expect(extractBearerToken('  Bearer   abc.def  ')).toBe('abc.def');
  });

  it('형식이 아니면 null', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer ')).toBeNull();
  });
});

describe('handleAccountDelete', () => {
  it('POST 가 아니면 405 (검증도 삭제도 하지 않는다)', async () => {
    const deps = makeDeps();
    const res = await handleAccountDelete(req('GET', 'Bearer good'), deps);
    expect(res.status).toBe(405);
    expect(deps.authenticate).not.toHaveBeenCalled();
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it('Authorization 헤더가 없으면 401 (검증 미발생)', async () => {
    const deps = makeDeps();
    const res = await handleAccountDelete(req('POST'), deps);
    expect(res.status).toBe(401);
    expect(deps.authenticate).not.toHaveBeenCalled();
  });

  it('토큰 검증 실패(null)면 401, 계정은 그대로', async () => {
    const deps = makeDeps({ authenticate: vi.fn(async () => null) });
    const res = await handleAccountDelete(req('POST', 'Bearer bad'), deps);
    expect(res.status).toBe(401);
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it('토큰 검증이 던져도 401 로 처리한다(내부 오류로 성공시키지 않음)', async () => {
    const deps = makeDeps({
      authenticate: vi.fn(async () => {
        throw new Error('network');
      })
    });
    const res = await handleAccountDelete(req('POST', 'Bearer boom'), deps);
    expect(res.status).toBe(401);
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it('성공: 아바타 폴더 삭제 후 계정 삭제, 200 { ok: true }', async () => {
    const order: string[] = [];
    const deps = makeDeps({
      authenticate: vi.fn(async () => 'uid-42'),
      removeAvatarFolder: vi.fn(async (uid: string) => {
        order.push(`avatar:${uid}`);
      }),
      deleteUser: vi.fn(async (uid: string) => {
        order.push(`delete:${uid}`);
      })
    });

    const res = await handleAccountDelete(req('POST', 'Bearer good'), deps);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(deps.deleteUser).toHaveBeenCalledWith('uid-42');
    // 아바타 삭제가 계정 삭제보다 먼저(계정이 사라지면 Storage 정책 주체도 사라진다)
    expect(order).toEqual(['avatar:uid-42', 'delete:uid-42']);
  });

  it('아바타 삭제가 실패해도 계정 삭제는 진행되고 200 이다(아바타 실패 무시)', async () => {
    const deps = makeDeps({
      removeAvatarFolder: vi.fn(async () => {
        throw new Error('bucket missing');
      })
    });
    const res = await handleAccountDelete(req('POST', 'Bearer good'), deps);
    expect(res.status).toBe(200);
    expect(deps.deleteUser).toHaveBeenCalledTimes(1);
  });

  it('계정 삭제가 실패하면 500 — 성공으로 위장하지 않는다', async () => {
    const deps = makeDeps({
      deleteUser: vi.fn(async () => {
        throw new Error('admin failure');
      })
    });
    const res = await handleAccountDelete(req('POST', 'Bearer good'), deps);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'internal_error' });
  });
});
