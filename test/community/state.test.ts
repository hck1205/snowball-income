import { createStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  COMMUNITY_VIEW_STORAGE_KEY,
  isLoggedInAtom,
  likedPostIdsAtom,
  profileAtom,
  sessionAtom,
  viewTypeAtom
} from '@/jotai/community';
import type { Session } from '@supabase/supabase-js';

/** 커뮤니티 상태는 순수 컨테이너다 — IO 없이 초기값/파생/저장만 검증한다. */
describe('jotai/community 상태', () => {
  beforeEach(() => {
    // atomWithStorage는 localStorage를 읽는다. 테스트 간 오염을 막기 위해 키를 비운다.
    window.localStorage.removeItem(COMMUNITY_VIEW_STORAGE_KEY);
  });

  it('초기값: 로그아웃 / 프로필 없음 / 좋아요 비어있음 / 카드 뷰', () => {
    const store = createStore();
    expect(store.get(sessionAtom)).toBeNull();
    expect(store.get(profileAtom)).toBeNull();
    expect(store.get(isLoggedInAtom)).toBe(false);
    expect(store.get(likedPostIdsAtom).size).toBe(0);
    expect(store.get(viewTypeAtom)).toBe('card');
  });

  it('세션을 set하면 isLoggedIn이 true로 파생된다', () => {
    const store = createStore();
    store.set(sessionAtom, { access_token: 'x' } as unknown as Session);
    expect(store.get(isLoggedInAtom)).toBe(true);

    store.set(sessionAtom, null);
    expect(store.get(isLoggedInAtom)).toBe(false);
  });

  it('viewType 변경은 localStorage에 유지된다', () => {
    const store = createStore();
    store.set(viewTypeAtom, 'inline');
    expect(store.get(viewTypeAtom)).toBe('inline');
    expect(window.localStorage.getItem(COMMUNITY_VIEW_STORAGE_KEY)).toContain('inline');
  });
});
