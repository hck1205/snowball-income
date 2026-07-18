/**
 * 프로필 편집용 순수 헬퍼 — 닉네임 검증. IO/컴포넌트/무거운 의존성 없음(테스트 대상).
 *
 * 검증은 클라이언트 1차 방어선이다. DB CHECK(char_length(btrim) 1~40 —
 * 20260714000000_community.sql:108)가 2차 방어선으로 남지만, 여기서 더 엄격한 2~20자를
 * 강제해 헤더/카드 레이아웃이 깨지지 않게 한다(스코핑 결정 D1a). 마이그레이션은 불필요하다.
 */

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export type NicknameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'length' };

/** 앞뒤 공백만 제거한다(가운데 공백은 사용자 의도로 존중). DB CHECK 도 btrim 후 길이를 잰다. */
export const normalizeNickname = (raw: string): string => raw.trim();

/**
 * trim 후 코드포인트 길이가 2~20 이면 통과(이모지/서러게이트 안전 — getAvatarInitial 과 같은 방식).
 * 실패 시 요청을 보내지 않고 인라인 오류만 띄우도록 discriminated union 을 돌려준다.
 */
export const validateNickname = (raw: string): NicknameValidation => {
  const value = normalizeNickname(raw);
  const length = [...value].length;
  if (length < NICKNAME_MIN_LENGTH || length > NICKNAME_MAX_LENGTH) {
    return { ok: false, reason: 'length' };
  }
  return { ok: true, value };
};

/**
 * 저장 버튼 활성 판정용 — 현재 닉네임과 (trim 비교) 다를 때만 true.
 * 같은 값 저장으로 불필요한 요청/트리거 갱신이 나가지 않게 한다(스코핑 F1: 값이 같으면 disabled).
 */
export const isNicknameChanged = (raw: string, current: string | null | undefined): boolean =>
  normalizeNickname(raw) !== normalizeNickname(current ?? '');
