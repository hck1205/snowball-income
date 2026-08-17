// @vitest-environment jsdom — localStorage/sessionStorage 가 필요하다.
import { beforeEach, describe, expect, it } from 'vitest';
import { LEGACY_STORAGE_PREFIX, STORAGE_PREFIX, migrateLegacyStorageKeys } from '@/shared/lib/storage';

/**
 * 접두사 이관은 **사용자 자산을 옮기는 코드**다(팔레트·장부 연결·동기화 기준선). 여기서 지키는 계약:
 *
 *  1. 옛 키의 **값이 그대로** 새 키로 간다 — 이관은 이사이지 초기화가 아니다.
 *  2. 옛 키는 **사라진다** — 남으면 다음 사람이 어느 쪽이 정본인지 모른다.
 *  3. 신 키가 이미 있으면 **덮지 않는다** — 새 코드가 방금 쓴 값이 옛 값에 밀리면 안 된다.
 *  4. 접두사 **스캔**이라 동적 꼬리표(`cloud-sync-base:<userId>`)도 따라온다.
 *  5. 접두사가 없는 키는 **건드리지 않는다** — 우리 것이 아니다.
 *  6. **멱등** — 두 번 돌아도 같은 결과다(배포 직후 옛 탭과 새 탭이 공존하는 구간이 실제로 있다).
 */

const legacy = (suffix: string) => `${LEGACY_STORAGE_PREFIX}${suffix}`;
const current = (suffix: string) => `${STORAGE_PREFIX}${suffix}`;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('접두사 이관: localStorage', () => {
  it('옛 키의 값을 그대로 새 키로 옮기고 옛 키를 지운다', () => {
    window.localStorage.setItem(legacy('palette'), 'forest');

    const moved = migrateLegacyStorageKeys();

    expect(moved).toBe(1);
    expect(window.localStorage.getItem(current('palette'))).toBe('forest');
    expect(window.localStorage.getItem(legacy('palette'))).toBeNull();
  });

  it('계층 키(`ledger:links`)의 뒷부분을 보존한다', () => {
    window.localStorage.setItem(legacy('ledger:links'), '{"sheetId":"abc"}');

    migrateLegacyStorageKeys();

    expect(window.localStorage.getItem(current('ledger:links'))).toBe('{"sheetId":"abc"}');
  });

  it('동적 꼬리표가 붙는 키도 접두사 스캔으로 따라온다', () => {
    // 🔴 회귀: 키 **목록**을 손으로 적어 옮기던 설계였다면 이 키는 영영 남는다 — userId 를 모르기 때문이다.
    window.localStorage.setItem(legacy('cloud-sync-base:user-42'), '{"rev":7}');

    migrateLegacyStorageKeys();

    expect(window.localStorage.getItem(current('cloud-sync-base:user-42'))).toBe('{"rev":7}');
    expect(window.localStorage.getItem(legacy('cloud-sync-base:user-42'))).toBeNull();
  });

  it('여러 키를 한 번에 옮긴다 (지우면서 훑다가 절반을 빠뜨리지 않는다)', () => {
    // 🔴 회귀: `storage.key(i)` 로 훑으면서 같은 루프에서 지우면 인덱스가 밀려 격 항목이 누락된다.
    const suffixes = ['palette', 'color-scheme', 'display-currency', 'has-workspace', 'viewer-token'];
    for (const suffix of suffixes) window.localStorage.setItem(legacy(suffix), suffix);

    const moved = migrateLegacyStorageKeys();

    expect(moved).toBe(suffixes.length);
    for (const suffix of suffixes) {
      expect(window.localStorage.getItem(current(suffix))).toBe(suffix);
      expect(window.localStorage.getItem(legacy(suffix))).toBeNull();
    }
  });

  it('새 키가 이미 있으면 옛 값으로 덮지 않고, 옛 키만 치운다', () => {
    window.localStorage.setItem(current('palette'), 'aurora');
    window.localStorage.setItem(legacy('palette'), 'forest');

    migrateLegacyStorageKeys();

    expect(window.localStorage.getItem(current('palette'))).toBe('aurora');
    expect(window.localStorage.getItem(legacy('palette'))).toBeNull();
  });

  it('접두사가 없는 키는 건드리지 않는다', () => {
    window.localStorage.setItem('unrelated', 'keep-me');
    window.localStorage.setItem('snowballish', 'keep-me-too');

    migrateLegacyStorageKeys();

    expect(window.localStorage.getItem('unrelated')).toBe('keep-me');
    expect(window.localStorage.getItem('snowballish')).toBe('keep-me-too');
  });

  it('두 번 돌려도 결과가 같다 (멱등)', () => {
    window.localStorage.setItem(legacy('palette'), 'forest');

    migrateLegacyStorageKeys();
    const second = migrateLegacyStorageKeys();

    expect(second).toBe(0);
    expect(window.localStorage.getItem(current('palette'))).toBe('forest');
  });

  it('빈 문자열 값도 값이다 — 잃지 않는다', () => {
    window.localStorage.setItem(legacy('display-currency'), '');

    migrateLegacyStorageKeys();

    expect(window.localStorage.getItem(current('display-currency'))).toBe('');
  });
});

describe('접두사 이관: sessionStorage', () => {
  it('세션 영역도 함께 옮긴다', () => {
    // ⚠ OAuth state 가 여기 산다. 한쪽만 옮기면 로그인 왕복 중인 사용자가 state 를 잃는다.
    window.sessionStorage.setItem(legacy('kakao_oauth_state'), 'state-token');

    migrateLegacyStorageKeys();

    expect(window.sessionStorage.getItem(current('kakao_oauth_state'))).toBe('state-token');
    expect(window.sessionStorage.getItem(legacy('kakao_oauth_state'))).toBeNull();
  });

  it('두 영역을 합산해 옮긴 수를 돌려준다', () => {
    window.localStorage.setItem(legacy('palette'), 'forest');
    window.sessionStorage.setItem(legacy('compare-selection'), '["SCHD"]');

    expect(migrateLegacyStorageKeys()).toBe(2);
  });
});
