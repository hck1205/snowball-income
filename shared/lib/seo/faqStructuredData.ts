/**
 * **`/about` 전용 `FAQPage` JSON-LD 를 다른 라우트의 DOM 에서 떼어 낸다.**
 *
 * 🔴 2026-08-27 까지 이 주소는 `/` 였다. 첫 화면이 목표 여섯을 고르는 화면으로 바뀌면서 FAQ 가
 * 보이는 곳은 `/about` 하나가 됐고, 마크업도 함께 옮겼다(아래 "페이지 수준" 문단이 그 이유다).
 *
 * `index.html` 은 SPA 전 라우트가 공유하는 셸이다. `WebSite`·`WebApplication` 은 **사이트 수준**
 * 엔티티라 어느 주소에서 읽혀도 참이지만, `FAQPage` 는 **페이지 수준** 타입이라 성격이 다르다 —
 * 그 FAQ 가 화면에 없는 `/simulator`·`/community/board`·`/ticker/schd` 의 렌더 결과에 남아 있으면
 * 리치 결과 테스트·Search Console 이 "보이지 않는 콘텐츠 마크업"으로 판정할 수 있고, 그 판정은
 * FAQ 리치 결과를 사이트 전체에서 무효화할 수 있다.
 *
 * 🔴 **호출 지점은 `router/routes.tsx` 의 `RootLayout` 한 곳뿐이다**(라우트 전환마다 도는 유일한
 * 지점). 라우트별 분기를 다른 곳에 더 심지 마라 — 구글 판정이 관대한 것으로 밝혀지면 그 한 줄을
 * 지우는 것으로 이 처방 전체가 되돌아가야 한다.
 *
 * ⚠ **노드를 버리지 않고 보관했다가 되돌려 붙인다.** JSON 본문은 `tools/seo/shells/about.head.html`
 * 에만 있고 빌드가 그것을 `/about` 정적 셸에 굽는다(정본 1곳).
 * 여기서 다시 만들면 문자열이 두 벌이 되어 FAQ 카피 개정이 조용히 갈라진다. 그리고 SPA 는
 * `/simulator → /about` 처럼 되돌아오므로 제거가 편도면 그 화면이 자기 마크업을 잃는다.
 *
 * ⚠ **SPA 로 `/about` 에 들어오면 붙일 노드가 애초에 없다** — 그때 문서는 `index.html` 이고 거기엔
 * 이 script 가 없다(2026-08-27 이후). 그건 결함이 아니다: 크롤러는 주소를 직접 받아 가므로
 * `dist/about.html` 을 읽고, 그 파일에는 script 가 들어 있다. 이 함수는 그 경우 아무것도 하지 않는다.
 *
 * ⚠ JS 를 실행하지 않는 크롤러는 이 제거를 보지 않는다. 그쪽에는 셸 본문(`.app-shell-fallback`)의
 * FAQ 가 **함께** 내려가므로 "보이지 않는 콘텐츠"가 아니다.
 */

/** `index.html` 의 script id 와의 계약. 한쪽만 바꾸면 이 함수는 조용히 아무것도 하지 않는다. */
export const FAQ_STRUCTURED_DATA_ID = 'faq-structured-data';

/**
 * FAQ 마크업이 유효한 유일한 경로 — **FAQ 가 화면에 보이는 곳**이다.
 *
 * 🔴 `shared/constants/routes` 의 `ABOUT_PATH` 와 같은 값이어야 한다. 여기서 다시 적는 이유는
 * 이 모듈이 **의존성 0** 을 유지하기 때문이고(라우트 상수를 끌어오면 그 캐스케이드가 따라온다),
 * 둘의 일치는 `test/seo/faqStructuredDataScope.test.tsx` 가 잠근다.
 */
export const FAQ_STRUCTURED_DATA_PATHNAME = '/about';

/** 떼어 둔 노드. 붙어 있던 문서와 함께 들고 있어야 다른 문서(테스트·SSR 잔재)에 잘못 붙이지 않는다. */
let detached: { doc: Document; node: Element } | null = null;

/**
 * 현재 라우트에 맞게 FAQ JSON-LD 를 붙이거나 뗀다.
 *
 * @param pathname 현재 라우트 경로(`useLocation().pathname`).
 */
export const syncFaqStructuredData = (pathname: string): void => {
  if (typeof document === 'undefined') return;

  const attached = document.getElementById(FAQ_STRUCTURED_DATA_ID);

  if (pathname === FAQ_STRUCTURED_DATA_PATHNAME) {
    if (attached) return;
    if (detached && detached.doc === document) {
      document.head.appendChild(detached.node);
      detached = null;
    }
    return;
  }

  if (!attached) return;

  detached = { doc: document, node: attached };
  attached.remove();
};
