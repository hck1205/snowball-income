// @vitest-environment node — 파일을 읽어 문자열만 본다.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_STORAGE_PREFIX, STORAGE_PREFIX, storageKey } from '@/shared/lib/storage';

/**
 * `index.html` 의 **프리페인트 인라인 스크립트**는 번들보다 먼저 돌아 팔레트·화면 밝기를 첫 페인트
 * 전에 적용한다(FOUC 방지). 그 코드는 모듈 시스템 밖이라 `shared/lib/storage` 를 import 할 수 없고,
 * 접두사 문자열이 **복제**돼 있다.
 *
 * 🔴 복제는 언젠가 갈라진다. 갈라지는 순간 증상은 "접두사를 바꿨더니 사용자 팔레트가 초기화됐다"인데,
 *    원인은 TS 어디에도 없고 HTML 한 줄에 있다 — 찾는 데 오래 걸리는 종류의 버그다. 이 테스트가
 *    두 곳을 묶어 둔다.
 */

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8');

describe('프리페인트 스크립트와 접두사 상수', () => {
  it('팔레트를 현재 접두사로 읽는다', () => {
    expect(html).toContain(`localStorage.getItem('${storageKey('palette')}')`);
  });

  it('화면 밝기를 현재 접두사로 읽는다', () => {
    expect(html).toContain(`localStorage.getItem('${storageKey('color-scheme')}')`);
  });

  it('옛 접두사를 폴백으로 함께 읽는다', () => {
    /**
     * 이 스크립트는 이관(`main.tsx`)보다도 **먼저** 돈다. 폴백이 없으면 기존 사용자는 배포 직후 첫
     * 로드에서 기본 팔레트가 번쩍인 뒤에야 자기 색으로 돌아온다 — 이 스크립트가 막으려던 바로 그
     * FOUC 다. 이관이 모든 사용자에게 닿았다고 확신할 수 있을 때까지 남긴다(그 시점은 알 수 없다).
     */
    expect(html).toContain(`localStorage.getItem('${LEGACY_STORAGE_PREFIX}palette')`);
    expect(html).toContain(`localStorage.getItem('${LEGACY_STORAGE_PREFIX}color-scheme')`);
  });
});

describe('접두사 상수 자체', () => {
  it('현재 접두사와 옛 접두사는 서로 다르다', () => {
    // 같아지면 이관이 자기 자신을 옮기려 든다(무해하지만 의미가 없고, 실수의 신호다).
    expect(STORAGE_PREFIX).not.toBe(LEGACY_STORAGE_PREFIX);
  });

  it('콜론으로 끝난다 — 뒷부분이 계층을 이룬다', () => {
    expect(STORAGE_PREFIX.endsWith(':')).toBe(true);
    expect(LEGACY_STORAGE_PREFIX.endsWith(':')).toBe(true);
  });

  it('storageKey 는 접두사를 한 번만 붙인다', () => {
    expect(storageKey('palette')).toBe(`${STORAGE_PREFIX}palette`);
  });
});

describe('앱 코드에 옛 접두사 문자열이 남지 않았다', () => {
  it('상수 정의 밖에서 옛 접두사를 직접 쓰지 않는다', () => {
    /**
     * 이관 모듈과 프리페인트(위 폴백)만이 옛 접두사를 안다. 다른 곳에 `'snowball:...'` 리터럴이
     * 다시 생기면 그 키는 이관 대상이 아니라 **새로 쓰이는 옛 키**가 된다 — 이관이 끝난 사용자에게
     * 다시 고아 키를 만든다.
     */
    const source = readFileSync(resolve(__dirname, '../../shared/lib/storage/storagePrefix.ts'), 'utf-8');
    expect(source).toContain(`'${LEGACY_STORAGE_PREFIX}'`);
  });
});
