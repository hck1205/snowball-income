/**
 * 크롤러용 HTML 핸들러의 **공통 계층**.
 *
 * 🔴 아래 조각들은 종전에 핸들러 6개에 **글자까지 같은 사본**으로 흩어져 있었다
 * (`htmlResponse` 6벌 · `redirectToRoot` 5벌 · `jsonLdScript` 3벌 · 셸 fetch 6벌).
 * 복사본이 갈리는 것이 이 레포에서 **실제로 사고를 만든 경로**다 — 2026-08-14 에 랜딩 본문 제거를
 * 한 곳만 빠뜨려 그 페이지에 h1 이 둘 남았고, 화면에는 아무 증상이 없어 눈으로는 잡히지 않았다.
 *
 * ⚠ 이 파일은 **서버 전용**이다(`Response` 를 만든다). 화면 코드에서 import 하지 마라.
 */
import { escapeHtmlAttribute, escapeHtmlText } from '@/shared/lib/og';

/**
 * 정적 콘텐츠 성공 캐시 — 24시간 신선 / 7일 stale 허용.
 * 콘텐츠가 배포로만 바뀌므로 길게 잡아도 안전하다. 새 배포는 함수 코드 자체를 교체한다.
 */
export const CACHE_STATIC_CONTENT = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';

/**
 * 무치환 셸(모르는 슬러그·파라미터 부재) — **캐시하지 않는다.**
 * 다음 배포에 콘텐츠가 생기면 바로 반영돼야 하기 때문이다(404 를 쓰지 않는 이유와 한 쌍).
 */
export const CACHE_NO_STORE = 'no-store';

export const htmlResponse = (html: string, status: number, cache: string): Response =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache }
  });

/** 셸 자체를 못 읽는 극단(자기 도메인 정적 파일 장애)의 폴백. 전 핸들러가 루트로 302 한다. */
export const redirectToRoot = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL('/', origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/**
 * `index.html` 셸을 읽는다. 실패(응답 실패·네트워크)면 `null` — 호출부가 `redirectToRoot` 한다.
 *
 * ⚠ 이 경로(`/index.html`)는 **rewrite 대상이 아니다** — 그래서 핸들러가 자기 자신을 다시 부르는
 * 재진입이 없다(508 INFINITE_LOOP_DETECTED 회피). rewrite 를 넓힐 때 이 전제를 함께 본다.
 */
export const fetchShellHtml = async (origin: string): Promise<string | null> => {
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
};

/**
 * JSON-LD `<script>`.
 *
 * 🔴 `<` 를 전부 유니코드 이스케이프한다 — 데이터에 `</script>` 가 들어가면 **스크립트가 거기서
 * 끝나고** 나머지가 문서 본문으로 흘러나온다(표준 기법).
 */
export const jsonLdScript = (graph: unknown): string =>
  `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;

/**
 * 크롤러 HTML 의 한 절(節). 제목 + 문단들 — 핸들러들이 같은 모양으로 쓰던 조립을 한곳에 둔다.
 *
 * 🔴 `id` 도 **이스케이프한다.** 지금 호출부가 넘기는 값은 전부 하드코딩 리터럴이지만, 이 함수는
 * 공개 헬퍼라 언젠가 콘텐츠에서 온 슬러그가 들어온다 — 그때 속성 밖으로 빠져나갈 구멍을 미리 막는다
 * (`GuideHtml`·`TickerHtml` 의 자체 `renderSection` 이 이미 같은 처방을 쓰고 있다).
 *
 * ⚠ 이름이 같은 함수가 셋이다 — 여기, `GuideHtml`, `TickerHtml`. **일부러 합치지 않았다**:
 *   Guide 는 표·주의문, Ticker 는 불릿·지표·템플릿 치환을 함께 그린다. 겉모양이 같아 보인다고
 *   합치면 세 화면의 마크업이 서로를 붙잡는다. 이 함수는 **제목+문단만** 있는 절 전용이다.
 */
export const renderSection = (id: string, heading: string, paragraphs: readonly string[]): string =>
  `<section id="${escapeHtmlAttribute(id)}"><h2>${escapeHtmlText(heading)}</h2>` +
  paragraphs.map((paragraph) => `<p>${escapeHtmlText(paragraph)}</p>`).join('') +
  '</section>';
