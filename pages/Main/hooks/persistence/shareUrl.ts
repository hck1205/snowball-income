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

/** 현재 href에 DB 공유 key를 붙인 URL 문자열을 만든다(`?s=<key>`). */
export const buildDbShareUrl = (href: string, key: string): string => {
  const url = new URL(href);
  url.searchParams.set(S_QUERY_PARAM, key);
  return url.toString();
};

/** 공유 관련 쿼리 파라미터를 제거한 URL 문자열을 만든다(구 share/sv + 신규 s). */
export const stripShareParams = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(SHARE_QUERY_PARAM);
  url.searchParams.delete(SHARE_VERSION_QUERY_PARAM);
  url.searchParams.delete(S_QUERY_PARAM);
  return url.toString();
};
