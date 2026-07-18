/**
 * 리치 텍스트(본문) 정화/발췌.
 *
 * ⚠ dompurify에 정적으로 의존한다 → 이 폴더는 **커뮤니티 청크에서만** import 해야 한다.
 *   `shared/lib/index.ts`에 재export하지 않는다(초기 번들에 dompurify가 딸려오면 안 된다).
 *   커뮤니티 화면/컴포넌트에서만 `@/shared/lib/richtext` 폴더 경로로 직접 import 한다.
 */
export * from './sanitize';
export * from './excerpt';
