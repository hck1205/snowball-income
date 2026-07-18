/**
 * 커뮤니티 데이터 레이어 (Supabase).
 *
 * 사용법:
 *   import { isCommunityEnabled, getSupabaseClient, fetchGalleryPage } from '@/shared/lib/supabase';
 *
 *   if (!isCommunityEnabled) return null;          // 커뮤니티 진입점을 아예 렌더하지 않는다
 *   const client = await getSupabaseClient();      // SDK를 이 시점에 지연 로드
 *   if (!client) return null;
 *   const page = await fetchGalleryPage(client, { sort: 'recent' });
 *
 * ⚠ 이 폴더는 shared/lib/index.ts에서 재export하지 **않는다**.
 *   '@/shared/lib'는 앱 전역에서 import되는데, 거기에 물리면 커뮤니티 코드가 초기 번들로
 *   딸려 들어갈 수 있다. 반드시 '@/shared/lib/supabase' 폴더 경로로 직접 import할 것.
 */

export * from './client';
export * from './oauthCallback';
export * from './comments';
export * from './pagination';
export * from './payload';
export * from './queries';
export * from './userAppStates';
export * from './sharedSnapshots';
export * from './auth';
export * from './naver';
export type * from './types';
