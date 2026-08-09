/**
 * 시장 온도의 경로.
 *
 * 🔴 문자열을 화면·라우터·사이트맵이 각자 적으면 한 곳만 고쳐질 때 조용히 어긋난다
 *    (라우트는 살아 있는데 메타의 canonical 만 옛 주소를 가리키는 식이다).
 * ⚠ `/market/` 아래에 둔다 — 미국 증시 캘린더(`/market/us-calendar`)와 같은 "시장 전체" 축이다.
 *   `/dividend/` 는 내가 고른 종목의 배당을 보는 축이라 성격이 다르다.
 */
export const MARKET_PULSE_PATH = '/market/pulse';
