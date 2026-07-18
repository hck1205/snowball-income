import { describe, expect, it } from 'vitest';
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  isNicknameChanged,
  normalizeNickname,
  validateNickname
} from '@/shared/lib/community';

/**
 * 닉네임 검증(스코핑 F1 / 결정 D1a: trim 후 2~20자, DB 는 1~40 2차 방어선).
 * 요청을 보내지 않는 경계값을 못 박는다.
 */
describe('validateNickname', () => {
  it('앞뒤 공백을 제거한 값을 통과 값으로 준다', () => {
    const result = validateNickname('  스노우볼러  ');
    expect(result).toEqual({ ok: true, value: '스노우볼러' });
  });

  it('빈 문자열과 공백만 있는 입력은 length 오류(요청 미발생)', () => {
    expect(validateNickname('')).toEqual({ ok: false, reason: 'length' });
    expect(validateNickname('   ')).toEqual({ ok: false, reason: 'length' });
  });

  it('하한 경계: 1자는 실패, 2자는 성공', () => {
    expect(validateNickname('a')).toEqual({ ok: false, reason: 'length' });
    expect(validateNickname('ab')).toEqual({ ok: true, value: 'ab' });
  });

  it('상한 경계: 20자는 성공, 21자는 실패', () => {
    const twenty = 'a'.repeat(NICKNAME_MAX_LENGTH);
    const twentyOne = 'a'.repeat(NICKNAME_MAX_LENGTH + 1);
    expect(validateNickname(twenty)).toEqual({ ok: true, value: twenty });
    expect(validateNickname(twentyOne)).toEqual({ ok: false, reason: 'length' });
  });

  it('trim 후 길이로 판정한다 (공백 패딩은 길이에 안 든다)', () => {
    // 실제 내용 2자 + 양옆 공백 → 통과
    expect(validateNickname('   ab   ')).toEqual({ ok: true, value: 'ab' });
  });

  it('길이는 코드포인트 단위 — 이모지 1개는 1자로 세어 하한 미달', () => {
    expect(validateNickname('🙂')).toEqual({ ok: false, reason: 'length' });
    expect(validateNickname('🙂🙂')).toEqual({ ok: true, value: '🙂🙂' });
  });

  it('경계 상수는 2~20 이다', () => {
    expect(NICKNAME_MIN_LENGTH).toBe(2);
    expect(NICKNAME_MAX_LENGTH).toBe(20);
  });
});

describe('normalizeNickname', () => {
  it('앞뒤 공백만 제거하고 가운데 공백은 보존한다', () => {
    expect(normalizeNickname('  스노우 볼러 ')).toBe('스노우 볼러');
  });
});

describe('isNicknameChanged', () => {
  it('trim 비교로 같으면 false (저장 버튼 비활성)', () => {
    expect(isNicknameChanged('  스노우볼러 ', '스노우볼러')).toBe(false);
  });

  it('다르면 true', () => {
    expect(isNicknameChanged('새 이름', '스노우볼러')).toBe(true);
  });

  it('현재 값이 null/undefined 면 빈 문자열과 비교한다', () => {
    expect(isNicknameChanged('  ', null)).toBe(false);
    expect(isNicknameChanged('ab', undefined)).toBe(true);
  });
});
