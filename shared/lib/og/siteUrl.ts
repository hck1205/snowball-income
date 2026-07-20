/**
 * 서버 함수에서 **canonical 도메인**을 정한다 — 순수 함수 + `process.env` 만 읽는다(모듈 스코프에서
 * `import.meta.env` 를 읽지 않는다, og.tsx 함정).
 *
 * ## 왜 요청 origin 을 그대로 쓰면 안 되는가
 * Vercel 프리뷰 배포는 `https://<sha>-<project>.vercel.app` 로 뜬다. 그 origin 을 사이트맵 `<loc>` 이나
 * canonical 에 그대로 박으면 **프리뷰 도메인이 색인**되거나(중복 콘텐츠) 사이트맵이 크로스도메인이라
 * 통째로 거부된다. 그래서 `VITE_SITE_URL`(vite.config.ts 의 단일 진실 공급원과 같은 변수)을 우선한다.
 *
 * ⚠ Vercel 은 `VITE_*` 빌드 변수를 Node 함수 런타임에도 노출한다(pitfalls: shared_snapshots 조회가
 *   같은 이유로 새 서버 env 없이 동작한다). 그래도 **미설정 폴백은 요청 origin** — 사이트맵이 아예
 *   안 나오는 것보다 낫고, 로컬/프리뷰에서 눈으로 확인할 수 있다.
 */
const readServerEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

export const resolveSiteUrl = (requestUrl: string): string => {
  const configured = readServerEnv('SITE_URL') ?? readServerEnv('VITE_SITE_URL');
  if (configured) return stripTrailingSlash(configured);
  return stripTrailingSlash(new URL(requestUrl).origin);
};
