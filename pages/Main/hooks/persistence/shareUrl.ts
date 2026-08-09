export const SHARE_QUERY_PARAM = 'share';
export const SHARE_VERSION_QUERY_PARAM = 'sv';
/** DB key 기반 공유(트랙 E) 파라미터. 구 `share`(lz-string)와 파라미터 이름으로 포맷을 구분한다. */
export const S_QUERY_PARAM = 's';

/** href 문자열에서 공유 코드를 읽는다(구 lz-string `?share=`). window에 의존하지 않는다. */
export const readShareCodeFromHref = (href: string): string | null => new URL(href).searchParams.get(SHARE_QUERY_PARAM);

/** href 문자열에서 DB 공유 key를 읽는다(`?s=`). 없으면 null. */
export const readDbShareKeyFromHref = (href: string): string | null => new URL(href).searchParams.get(S_QUERY_PARAM);

/** 현재 href에 공유 코드를 붙인 URL 문자열을 만든다(구 lz-string). */
export const buildShareUrl = (href: string, shareCode: string): string => {
  const url = new URL(href);
  url.searchParams.set(SHARE_QUERY_PARAM, shareCode);
  return url.toString();
};

/**
 * 현재 href에 DB 공유 key를 붙인 URL 문자열을 만든다(`?s=<key>`).
 *
 * 🔴 **앱은 더 이상 이걸로 링크를 만들지 않는다**(2026-08-09, DB 쓰기 경로를 닫았다 —
 * 근거는 `usePortfolioPersistence` 의 `createShareLink` 주석). 그런데 지우지 않는다:
 * 이미 나간 `?s=` 링크를 **읽는** 쪽(`readDbShareKeyFromHref`)은 계속 살아 있어야 하고,
 * 그게 진짜 작동하는지는 짝이 되는 생성기로 **왕복**시켜야 증명된다. 없애면 테스트가 손으로
 * 적은 문자열에 기대게 되고, 그 문자열은 조용히 실제 포맷과 어긋난다.
 */
export const buildDbShareUrl = (href: string, key: string): string => {
  const url = new URL(href);
  url.searchParams.set(S_QUERY_PARAM, key);
  return url.toString();
};

/**
 * 공유 관련 쿼리 파라미터를 제거한 URL 문자열을 만든다(구 share/sv + 신규 s).
 *
 * 공유 링크는 **`/simulator` 에만 붙는다.** 한때 `/` 로 들어온 공유 링크를 시뮬레이터로 넘기는
 * `resolveShareRedirectPath` 가 여기 있었지만 2026-08-01 사용자 결정으로 걷어냈다
 * (사유·되살리는 법은 `router/routes.tsx` 의 `'/'` 라우트 주석).
 */
export const stripShareParams = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(SHARE_QUERY_PARAM);
  url.searchParams.delete(SHARE_VERSION_QUERY_PARAM);
  url.searchParams.delete(S_QUERY_PARAM);
  return url.toString();
};
