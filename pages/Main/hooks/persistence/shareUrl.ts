export const SHARE_QUERY_PARAM = 'share';
export const SHARE_VERSION_QUERY_PARAM = 'sv';

/** href 문자열에서 공유 코드를 읽는다. window에 의존하지 않는다. */
export const readShareCodeFromHref = (href: string): string | null => new URL(href).searchParams.get(SHARE_QUERY_PARAM);

/** 현재 href에 공유 코드를 붙인 URL 문자열을 만든다. */
export const buildShareUrl = (href: string, shareCode: string): string => {
  const url = new URL(href);
  url.searchParams.set(SHARE_QUERY_PARAM, shareCode);
  return url.toString();
};

/** 공유 관련 쿼리 파라미터를 제거한 URL 문자열을 만든다. */
export const stripShareParams = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(SHARE_QUERY_PARAM);
  url.searchParams.delete(SHARE_VERSION_QUERY_PARAM);
  return url.toString();
};
