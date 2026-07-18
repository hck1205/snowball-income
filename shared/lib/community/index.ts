/**
 * 커뮤니티 표시용 순수 헬퍼. IO/컴포넌트/무거운 의존성 없음 — 테스트 대상.
 *
 * ⚠ 이 폴더는 `shared/lib/index.ts`에 재export하지 않는다(초기 번들 오염 방지).
 *   커뮤니티 화면에서만 `@/shared/lib/community` 폴더 경로로 직접 import 한다.
 */
export * from './display';
export * from './profile';
export * from './avatar';
export * from './accountDelete';
export * from './naverAuth';
