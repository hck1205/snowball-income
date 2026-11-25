// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler, JOBS } from '@/server/handlers/Wake';
import { handler as proxyHandler } from '@/server/handlers/Proxy/Proxy';

/**
 * `/api/wake/:job` — Vercel 예약 실행이 GitHub 워크플로를 시작시키는 깨우기(2026-11-25).
 *
 * 잠그는 것: ① 비밀값이 없거나 틀리면 아무것도 시작하지 않는다(공개 주소다) ② 목록에 없는 작업은 404
 * ③ 맞으면 정해진 워크플로 파일 하나에 main 으로 dispatch ④ vercel.json 의 예약·rewrite 가 목록과 어긋나지 않는다.
 */
const ENV = { CRON_SECRET: 'cron-secret', HUNGRY_HIPPO_GITHUB_DISPATCH_TOKEN: 'gh-token' } as NodeJS.ProcessEnv;
const request = (job: string, auth?: string) =>
  new Request(`https://hungry-hippo.xyz/api/proxy?surface=wake&job=${job}`, {
    method: 'POST',
    headers: auth ? { authorization: auth } : {}
  });

const stubGitHub = (status = 204) => {
  const fetchStub = vi.fn(async (_input: unknown, _init?: RequestInit) => new Response(null, { status }));
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('깨우기 — 인증', () => {
  it.each([
    ['헤더 없음', undefined, ENV],
    ['틀린 비밀값', 'Bearer wrong', ENV],
    ['서버에 비밀값이 없음', 'Bearer ', { HUNGRY_HIPPO_GITHUB_DISPATCH_TOKEN: 'gh-token' } as NodeJS.ProcessEnv]
  ])('🔴 %s → 401, GitHub 을 부르지 않는다', async (_label, auth, env) => {
    const fetchStub = stubGitHub();
    const response = await handler(request('ga-report', auth), env);
    expect(response.status).toBe(401);
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe('깨우기 — 작업', () => {
  it('🔴 목록에 없는 작업은 404 (요청이 워크플로 파일을 고를 수 없다)', async () => {
    const fetchStub = stubGitHub();
    const response = await handler(request('ci.yml', 'Bearer cron-secret'), ENV);
    expect(response.status).toBe(404);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('토큰이 없으면 503 — 등록 전 배포에서도 아무 일도 없다', async () => {
    const fetchStub = stubGitHub();
    const response = await handler(request('ga-report', 'Bearer cron-secret'), { CRON_SECRET: 'cron-secret' } as NodeJS.ProcessEnv);
    expect(response.status).toBe(503);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('🔴 GA 리포트는 mode=auto 로 main 에 dispatch 한다', async () => {
    const fetchStub = stubGitHub();
    const response = await handler(request('ga-report', 'Bearer cron-secret'), ENV);
    expect(response.status).toBe(202);
    const [url, init] = fetchStub.mock.calls[0]!;
    expect(String(url)).toBe('https://api.github.com/repos/hck1205/snowball-income/actions/workflows/ga-traffic-report.yml/dispatches');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer gh-token');
    expect(JSON.parse(String(init?.body))).toEqual({ ref: 'main', inputs: { mode: 'auto' } });
  });

  it('입력이 없는 워크플로는 ref 만 보낸다', async () => {
    const fetchStub = stubGitHub();
    await handler(request('reporter-publish', 'Bearer cron-secret'), ENV);
    expect(JSON.parse(String(fetchStub.mock.calls[0]![1]?.body))).toEqual({ ref: 'main' });
  });

  it('GitHub 이 거절하면 502 로 실패를 드러낸다', async () => {
    stubGitHub(403);
    const response = await handler(request('ga-report', 'Bearer cron-secret'), ENV);
    expect(response.status).toBe(502);
  });

  it('프록시 묶음의 wake 지면으로 들어온다(새 함수 칸을 쓰지 않는다)', async () => {
    stubGitHub();
    // 프록시는 process.env 를 본다 — 비밀값이 없는 테스트 환경이라 401 이면 배선이 닿은 것이다(404 = 배선 누락).
    const response = await proxyHandler(request('ga-report', 'Bearer x'));
    expect(response.status).toBe(401);
  });
});

describe('vercel.json 과 한 벌', () => {
  const config = JSON.parse(readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8')) as {
    rewrites: { source: string; destination: string }[];
    schedules: Record<string, { schedule: string; path: string }>;
  };

  it('🔴 /api/wake/:job 은 proxy 의 wake 지면으로 간다 (catch-all 보다 앞)', () => {
    const index = config.rewrites.findIndex((item) => item.source === '/api/wake/:job');
    expect(config.rewrites[index]?.destination).toBe('/api/proxy?surface=wake&job=:job');
    expect(index).toBeLessThan(config.rewrites.findIndex((item) => item.source === '/(.*)'));
  });

  it('🔴 예약마다 목록에 있는 작업을 부르고, 모든 작업에 예약이 있다', () => {
    const scheduled = Object.values(config.schedules).map((item) => item.path.replace('/api/wake/', ''));
    expect(scheduled.sort()).toEqual(Object.keys(JOBS).sort());
  });

  it('🔴 GA 리포트 예약은 00:00 UTC(= 09:00 KST)', () => {
    expect(config.schedules['wake-ga-report']?.schedule).toBe('0 0 * * *');
  });
});
