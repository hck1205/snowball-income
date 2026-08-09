import type { PersistedScenarioState, PostPayload } from './types';

/**
 * 시나리오 페이로드 변환/검증 — **순수 함수**. IO 없음, 테스트 대상.
 *
 * 서버 CHECK 제약(public.is_valid_post_payload)과 **같은 규칙**을 클라이언트에도 둔다.
 * 이유는 보안이 아니라 UX다 — 서버가 400을 뱉기 전에 "티커가 너무 많습니다" 같은 말을
 * 사용자에게 해주기 위한 것. **보안 경계는 어디까지나 서버의 CHECK다.**
 */

/** 서버 CHECK와 동일한 값. 바꾸려면 마이그레이션도 같이 바꿔야 한다. */
export const POST_PAYLOAD_MAX_BYTES = 65_536;
export const POST_MAX_TICKERS = 50;
export const POST_TITLE_MAX_LENGTH = 80;
export const POST_DESCRIPTION_MAX_LENGTH = 500;
export const COMMENT_BODY_MAX_LENGTH = 2_000;

/**
 * 앱의 시나리오 → 서버 페이로드.
 *
 * 로컬 탭 id/name은 **버린다**: 서버에선 posts.title이 제목의 정본이고,
 * 로컬 id를 넣어봐야 다른 사용자에게 의미가 없다 (게다가 페이로드 크기만 먹는다).
 */
/**
 * 이 `payload` 가 **시뮬 시나리오**인가.
 *
 * 🔴 `payload` 는 jsonb 한 칸에 **여러 종류**가 들어온다 — 갤러리 글은 시나리오이고, 파이어족들
 *    글은 링크 메타(`{url,title,image,source}`)다. 그래서 "payload 가 있으면 시나리오"라고
 *    단정하면 안 된다. 실제로 그렇게 단정한 자리가 있어서, 링크 글 상세를 열면 시뮬 미리보기가
 *    `portfolio.tickerProfiles` 를 읽다 터졌다(2026-08-09 사용자 신고).
 * ⚠ 이 판정은 **모양**으로 한다. `kind` 를 화면까지 배선해 판단하면 종류가 하나 늘 때마다
 *   그 배선이 함께 늘어난다 — 모양은 데이터가 스스로 말한다.
 */
export const isScenarioPayload = (payload: PostPayload | null | undefined): payload is PostPayload =>
  Boolean(payload && typeof payload === 'object' && 'portfolio' in payload && payload.portfolio);

export const toPostPayload = (scenario: PersistedScenarioState): PostPayload => ({
  portfolio: scenario.portfolio,
  investmentSettings: scenario.investmentSettings
});

/**
 * 서버 페이로드 → 앱의 시나리오 (갤러리에서 "내 시뮬레이터로 가져오기").
 *
 * 여기서 나온 값은 그대로 쓰지 말고 기존 sanitize 계층
 * (jotai/snowball/persistence의 sanitizeScenarioState)에 한 번 통과시켜야 한다.
 * 서버 CHECK는 구조만 보지 숫자 범위까지 보지는 않기 때문이다.
 */
export const fromPostPayload = (
  payload: PostPayload,
  meta: { id: string; name: string }
): PersistedScenarioState => ({
  id: meta.id,
  name: meta.name,
  portfolio: payload.portfolio,
  investmentSettings: payload.investmentSettings
});

/**
 * 페이로드의 UTF-8 바이트 크기.
 * 서버는 octet_length(payload::text)로 재므로 문자 수가 아니라 **바이트 수**를 세야 한다
 * (한글 티커명은 문자당 3바이트다 — length로 재면 한참 과소평가한다).
 */
export const getPostPayloadByteSize = (payload: PostPayload): number =>
  new TextEncoder().encode(JSON.stringify(payload)).length;

export type PostPayloadIssue =
  | 'payload-too-large'
  | 'too-many-tickers'
  | 'missing-portfolio'
  | 'missing-investment-settings';

/**
 * 서버가 거절할 페이로드를 미리 잡아낸다. 문제가 없으면 빈 배열.
 * (서버 CHECK의 클라이언트측 거울 — 실패 이유를 사용자에게 설명하기 위한 것)
 */
export const validatePostPayload = (payload: PostPayload): PostPayloadIssue[] => {
  const issues: PostPayloadIssue[] = [];

  if (!payload.portfolio || typeof payload.portfolio !== 'object') {
    issues.push('missing-portfolio');
  }
  if (!payload.investmentSettings || typeof payload.investmentSettings !== 'object') {
    issues.push('missing-investment-settings');
  }

  const tickers = payload.portfolio?.tickerProfiles;
  if (Array.isArray(tickers) && tickers.length > POST_MAX_TICKERS) {
    issues.push('too-many-tickers');
  }

  if (getPostPayloadByteSize(payload) > POST_PAYLOAD_MAX_BYTES) {
    issues.push('payload-too-large');
  }

  return issues;
};

export const isPostPayloadPublishable = (payload: PostPayload): boolean =>
  validatePostPayload(payload).length === 0;
