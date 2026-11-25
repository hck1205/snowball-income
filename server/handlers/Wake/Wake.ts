/*
  ⚠ 다른 핸들러와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면 Vercel Node
  런타임에서 함수가 즉사한다. 이 파일은 `process.env` 와 fetch 만 쓴다.
*/
import { timingSafeEqual } from 'node:crypto';

/**
 * **예약 깨우기** — Vercel 예약 실행(vercel.json `schedules`)이 부르면 GitHub Actions 워크플로를
 * `workflow_dispatch` 로 시작시킨다(2026-11-25).
 *
 * ## 왜 필요한가
 * GitHub 의 `schedule` 트리거는 시각을 보장하지 않는다. 실측: 09:00 예약이 12:15~16:09 에 돌았고(11/15~11/24),
 * 2시간마다 도는 발행 워크플로가 6시간 동안 한 번도 안 돌았다(11/25). Vercel 예약은 Hobby 에서도 정해진 시각
 * **15분 안에** 시작한다. 반면 `workflow_dispatch` 는 수 초 안에 시작한다. 그래서 시계는 Vercel 이, 일은 GitHub 이 한다.
 *
 * ## 계약
 * - 🔴 Vercel 이 보내는 `Authorization: Bearer <CRON_SECRET>` 이 맞을 때만 동작한다. 이 주소는 공개라
 *   누구나 부를 수 있다 — 비밀값이 없거나 틀리면 401, 아무것도 시작하지 않는다.
 * - 🔴 시작할 수 있는 워크플로는 아래 `JOBS` 목록뿐이다. 요청이 파일 이름을 고를 수 없다.
 * - 비밀값(Vercel 프로젝트 환경 변수): `CRON_SECRET` · `GITHUB_DISPATCH_TOKEN`(이 저장소의 Actions: write 권한만
 *   가진 fine-grained 토큰). 토큰이 없으면 503 — 등록 전에 배포돼도 아무 일도 일어나지 않는다.
 * - GitHub 예약은 **지우지 않고 백업으로 남긴다**(Vercel 이 실패한 날을 위해). 같은 날 두 번 보내지 않는
 *   중복 방지는 각 워크플로 쪽에 있다(GA 리포트: "Skip if already sent today" 단계).
 */
export const JOBS = {
  'ga-report': { workflow: 'ga-traffic-report.yml', inputs: { mode: 'auto' } },
  'reporter-publish': { workflow: 'ai-reporter-publish.yml' },
  'market-candidates': { workflow: 'ai-reporter-market-candidates.yml' }
} as const satisfies Record<string, { workflow: string; inputs?: Record<string, string> }>;

export type WakeJob = keyof typeof JOBS;

const REPOSITORY = 'hck1205/snowball-income';

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

const isJob = (value: string | null): value is WakeJob => value !== null && Object.prototype.hasOwnProperty.call(JOBS, value);

/** 길이가 달라도 시간 차로 새지 않게 비교한다. */
const sameSecret = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function handler(request: Request, env: NodeJS.ProcessEnv = process.env): Promise<Response> {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (!secret || !sameSecret(auth, `Bearer ${secret}`)) return json(401, { error: 'unauthorized' });

  const job = new URL(request.url).searchParams.get('job');
  if (!isJob(job)) return json(404, { error: 'unknown job' });

  const token = env.GITHUB_DISPATCH_TOKEN;
  if (!token) return json(503, { error: 'GITHUB_DISPATCH_TOKEN not set' });

  const { workflow, ...rest } = JOBS[job];
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'hungry-hippo-wake',
      'x-github-api-version': '2022-11-28'
    },
    body: JSON.stringify({ ref: 'main', ...('inputs' in rest ? { inputs: rest.inputs } : {}) })
  });

  if (!response.ok) {
    // 실패를 숨기지 않는다 — Vercel 로그에 남고, 그날은 GitHub 예약(백업)이 대신 돈다.
    console.error(`[wake] ${job} 시작 실패: GitHub HTTP ${response.status}`);
    return json(502, { error: 'dispatch failed', job, status: response.status });
  }
  console.log(`[wake] ${job} 시작`);
  return json(202, { ok: true, job });
}
