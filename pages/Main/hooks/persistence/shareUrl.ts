import { SIMULATOR_PATH } from '@/shared/constants/routes';

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

/** 공유 링크를 식별하는 쿼리 파라미터 전체. 하나라도 있으면 "공유 링크 진입"으로 본다. */
const SHARE_ENTRY_PARAMS = [SHARE_QUERY_PARAM, SHARE_VERSION_QUERY_PARAM, S_QUERY_PARAM] as const;

/**
 * 공유 링크로 `/` 에 들어온 요청을 시뮬레이터로 넘길 목적지를 만든다. 공유 링크가 아니면 `null`.
 *
 * 🔴 **판정은 "값의 유효성"이 아니라 "파라미터 존재"로 한다.**
 * 깨진 페이로드(`?share=zz`)를 여기서 걸러 `/` 에 남기면, 실패를 사용자에게 말해 주는 경로가
 * 통째로 사라진다 — `decodeSharedScenarioResult` 가 실패를 값으로 돌려주고
 * `shareLinkFailureAtom` → `ShareLinkFailureNotice` 가 "공유 링크가 손상되었거나…"를 띄우는 흐름은
 * **시뮬레이터가 렌더돼야** 돈다(`pages/Main/hooks/persistence/shareLink.ts` 의 실패 처리 참고).
 * 유효성으로 거르면 그 배너가 뜨지 않는 **무음 실패**가 된다. 그러니 깨진 코드도 그대로 넘긴다.
 *
 * 파라미터 목록은 `stripShareParams` 와 같은 상수를 쓴다 — 4번째 포맷이 생겨도 한 곳만 고치면 된다.
 *
 * ⚠ 아직 소비처가 없다(`/` 도 시뮬레이터를 그리는 중간 상태). `/` 를 랜딩이 가져가는 시점에
 * `router/routes.tsx` 의 루트 분기 래퍼가 이 함수를 쓴다 — 계약은 단위 테스트로 먼저 잠가 둔다.
 */
export const resolveShareRedirectPath = (search: string): string | null => {
  const params = new URLSearchParams(search);
  if (!SHARE_ENTRY_PARAMS.some((param) => params.has(param))) return null;
  // 검색어는 손대지 않고 그대로 옮긴다 — 어떤 파라미터를 지우든 그건 시뮬레이터 쪽의 일이다.
  return `${SIMULATOR_PATH}${search.startsWith('?') ? search : search ? `?${search}` : ''}`;
};

/** 공유 관련 쿼리 파라미터를 제거한 URL 문자열을 만든다(구 share/sv + 신규 s). */
export const stripShareParams = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(SHARE_QUERY_PARAM);
  url.searchParams.delete(SHARE_VERSION_QUERY_PARAM);
  url.searchParams.delete(S_QUERY_PARAM);
  return url.toString();
};
