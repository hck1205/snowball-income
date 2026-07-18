/**
 * DB 공유 스냅샷 key(트랙 E)의 형식 판별 — **순수, 의존성 0**.
 *
 * key 는 서버(`create_shared_snapshot`)가 gen_random_uuid 16바이트를 base64url 로 만든 ~22자
 * `[A-Za-z0-9_-]` 문자열이다(supabase/migrations/20260720000000_shared_snapshots.sql). 구 lz-string
 * `?share=` 코드는 `+ $ . _ ~ * ' ( ) !` 등을 포함하는 다른 문자셋이라, 이 패턴으로 둘을 값 수준에서도 구분한다
 * (파라미터 이름 `s` vs `share` 로 이미 구분하지만, 방어적으로 값도 검증한다).
 *
 * 정확히 22자로 고정하지 않고 16~64자를 허용한다 — key 생성 로직이 나중에 바뀌어도(엔트로피 조정 등)
 * middleware 가 조용히 rewrite 를 멈추지 않도록 여유를 둔다. 어차피 잘못된 key 는 조회에서 걸러져
 * 기본 카드로 폴백하므로, 이 게이트는 명백한 쓰레기(빈 값·구 share 코드)만 싸게 걸러내면 된다.
 */
export const DB_SHARE_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/** 값이 DB 공유 key 형식인지. null/빈 값/형식 불일치면 false. */
export const isDbShareKey = (value: string | null | undefined): value is string =>
  typeof value === 'string' && DB_SHARE_KEY_PATTERN.test(value);
