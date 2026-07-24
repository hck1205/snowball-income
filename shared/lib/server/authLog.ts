/**
 * OAuth 로그인 실패의 **서버 측 단일 기록 지점**.
 *
 * 왜 필요한가: 소셜 로그인 콜백은 실패해도 브라우저가 곧바로 `location.replace` 로 떠나기 때문에
 * 클라이언트 콘솔이 지워진다(Preserve log 를 켜지 않는 한). 실제로 카카오 로그인이 간헐적으로 깨졌을 때
 * 사유를 못 봐서 원인 추적이 여러 차례 막혔다. 서버 로그는 리다이렉트와 무관하게 남으므로,
 * **모든 실패 응답을 나가기 직전에 여기서 한 번 찍는다**(단계별 개별 로깅에 의존하지 않는다).
 *
 * ⚠ 로그에 담기는 것은 **상태 코드와 우리 에러 코드 본문뿐**이다. 성공(2xx) 응답은 찍지 않는다 —
 *   성공 본문에는 `token_hash` 가 들어 있어 그대로 찍으면 세션 탈취용 값이 로그에 남는다.
 *   access_token·client_secret 도 애초에 이 본문에 실리지 않는다.
 */
export const logAuthFailure = async (tag: string, response: Response): Promise<Response> => {
  if (response.ok) return response;

  // 원본 스트림을 소비하면 호출부가 응답을 못 쓴다 — 반드시 clone 을 읽는다.
  const detail = await response
    .clone()
    .text()
    .catch(() => '');

  console.error(`[${tag}] 로그인 실패 status=${response.status} ${detail}`.trimEnd());

  return response;
};
