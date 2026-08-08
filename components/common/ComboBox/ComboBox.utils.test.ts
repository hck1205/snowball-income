import { describe, expect, it } from 'vitest';
import { filterComboOptions, isExactMatch, nextActiveIndex } from './ComboBox.utils';

/**
 * 콤보박스의 **순수 규칙**. DOM 없이 돈다.
 *
 * 🔴 여기서 잠그는 것은 "예쁘게 걸러지나"가 아니라 **"사용자가 적은 것이 사라지지 않나"** 다 —
 *    이 컨트롤은 자유 입력이고, 목록은 제안일 뿐이다.
 */

const OPTIONS = ['식비', '외식', '카페', '프랜차이즈카페', '식료/생필품비', '교통비'];

describe('검색', () => {
  it('⭐ 검색어가 비면 전부 보여 준다 — 감추면 무엇을 고를 수 있는지 알 방법이 없다', () => {
    expect(filterComboOptions(OPTIONS, '')).toEqual(OPTIONS);
    expect(filterComboOptions(OPTIONS, '   ')).toEqual(OPTIONS);
  });

  it('⭐ 앞에서 시작하는 것이 먼저다 — `카페` 가 `프랜차이즈카페` 보다 위여야 한다', () => {
    expect(filterComboOptions(OPTIONS, '카페')).toEqual(['카페', '프랜차이즈카페']);
  });

  it('가운데에 들어 있어도 찾는다', () => {
    expect(filterComboOptions(OPTIONS, '생필품')).toEqual(['식료/생필품비']);
  });

  it('⭐ 구분기호를 무시한다 — `식료생필품` 으로도 찾힌다', () => {
    expect(filterComboOptions(OPTIONS, '식료생필품')).toEqual(['식료/생필품비']);
  });

  it('없으면 빈 목록이다 (오류가 아니다 — 그대로 적어도 저장된다)', () => {
    expect(filterComboOptions(OPTIONS, 'zzz')).toEqual([]);
  });
});

describe('정확히 같은 값', () => {
  it('입력이 제안 하나와 같으면 목록을 열어 둘 이유가 없다', () => {
    expect(isExactMatch(OPTIONS, '카페')).toBe(true);
    expect(isExactMatch(OPTIONS, '식료생필품비')).toBe(true);
  });

  it('부분만 같으면 아니다', () => {
    expect(isExactMatch(OPTIONS, '카')).toBe(false);
  });

  it('빈 값은 아니다 — 빈 입력에서 목록이 닫히면 안 된다', () => {
    expect(isExactMatch(OPTIONS, '')).toBe(false);
  });
});

describe('키보드 이동', () => {
  it('⭐ 감싸 돈다 — 끝에서 멈추면 컨트롤이 죽은 건지 끝인지 구분할 수 없다', () => {
    expect(nextActiveIndex(2, 3, 1)).toBe(0);
    expect(nextActiveIndex(0, 3, -1)).toBe(2);
  });

  it('아직 아무것도 안 골랐을 때 아래는 첫째, 위는 **마지막**이다', () => {
    expect(nextActiveIndex(-1, 3, 1)).toBe(0);
    expect(nextActiveIndex(-1, 3, -1)).toBe(2);
  });

  it('목록이 비면 활성 항목이 없다', () => {
    expect(nextActiveIndex(-1, 0, 1)).toBe(-1);
  });
});
