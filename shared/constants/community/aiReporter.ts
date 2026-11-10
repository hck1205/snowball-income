/**
 * **AI 리포터** — AI 가 사이트 데이터로 글을 쓰는 자동 작성 계정(2026-11-10 사용자 결정).
 *
 * 🔴 AI 임을 **숨기지 않는다.** 글 문체는 자연스럽게 쓰되, 계정 이름·배지로 누가 썼는지는 늘 드러낸다.
 *   "사람인 척하는 계정"(합성 페르소나 시딩)은 2026-07-19 에 접은 방식이고 되살리지 않는다.
 *
 * ## 판별은 계정 ID 로 한다 — DB 컬럼이 아니라
 * 화면·사이트맵·크롤러 HTML 은 이 목록으로 봇 글을 알아본다. `profiles.is_bot`(마이그레이션
 * 20261110000000)은 글 개수 상한 예외에만 쓰고 화면은 읽지 않는다 — 마이그레이션 적용 전에 배포돼도
 * 커뮤니티 조회가 깨지지 않게 하려는 것이다.
 * ⚠ `userIds` 가 비어 있으면 **어떤 글도 봇 글로 보지 않는다**(계정 생성 전 안전한 기본값).
 *
 * ## 색인(`indexable`)
 * 처음 4주는 false — 봇 글을 사이트맵에서 빼고 크롤러 HTML 에 noindex 를 단다. 구글의 대량 자동 생성
 * 콘텐츠 정책과 애드센스 심사 리스크를 피하려는 것이다. 품질을 확인한 뒤 사용자 결정으로 true 로 바꾼다.
 */
export const AI_REPORTER = {
  displayName: 'AI 리포터',
  badgeLabel: 'AI 리포터',
  badgeTitle: 'AI가 사이트 데이터로 자동 작성한 글입니다',
  /** 글 상세 본문 아래 고지 상자(`AiReporterNote`) 문구. AI 가 썼다는 사실과 권유가 아니라는 사실을 함께 말한다. */
  disclaimer:
    'AI 리포터가 Hungry Hippo의 데이터와 계산으로 작성한 글입니다. 투자 권유가 아닌 계산 예시이며, 배당·주가는 바뀝니다.',
  /** 2026-11-10 생성(ai-reporter@hungry-hippo.xyz). profiles.is_bot=true 는 운영자가 SQL 로 켠다. */
  userIds: ['44792963-f012-4df0-881c-769b971605cc'] as readonly string[],
  indexable: false
} as const;

/** 판별에 쓰는 설정 — 기본은 `AI_REPORTER`. 테스트가 계정 id·색인 여부를 바꿔 넣을 수 있게 인자로 연다. */
export type AiReporterConfig = { readonly userIds: readonly string[]; readonly indexable: boolean };

export const isAiReporterUserId = (
  userId: string | null | undefined,
  config: AiReporterConfig = AI_REPORTER
): boolean => typeof userId === 'string' && config.userIds.includes(userId);

/** 이 글을 지금 검색엔진에 색인시켜도 되는가. 봇 글이고 아직 색인 허용 전이면 false. */
export const isPostIndexable = (
  authorUserId: string | null | undefined,
  config: AiReporterConfig = AI_REPORTER
): boolean => config.indexable || !isAiReporterUserId(authorUserId, config);
