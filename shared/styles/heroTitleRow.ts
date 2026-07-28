import { font } from './tokens';

/**
 * ── 히어로 제목 줄(아이콘 배지 + 제목) 공통 레시피 ──────────────────────────────
 *
 * 히어로는 지금 **3벌**이다 — 공용 `components/common/PageHero` 와 `pages/Portfolio` ·
 * `pages/DividendCalendar` 의 페이지 로컬 복제. 셋을 한 컴포넌트로 합치는 것은 전면 페이지 리모델링
 * 소관이라, 그 사이에도 **제목 크기와 아이콘 세로 정렬이 갈리지 않도록** 이 둘만 한 벌로 갖는다
 * (색·배경·리본은 그대로 각자 소유 — 시각 차이는 알려진 상태다).
 */

/** 히어로 제목(h1/h2) 크기. 아래 광학 보정이 이 크기를 기준으로 하므로 둘은 항상 같이 움직인다. */
export const heroTitleFontSize = `clamp(${font.size['2xl']}, 4vw, ${font.size['4xl']})`;

/**
 * 제목 옆 아이콘 배지를 **글자의 광학 중심**에 맞추는 세로 보정.
 *
 * `align-items: center` 는 배지를 제목의 **라인박스** 중심에 맞춘다. 그런데 헤딩 서체
 * `font.display`(Snowball Display = 원본 Gmarket Sans Bold)는 OS/2 `usWinDescent` 가 350(0.35em)로
 * hhea descent(200)보다 훨씬 크고, **Chrome/Windows 는 이 win 메트릭을 콘텐츠 영역으로 쓴다**
 * (실측: 30px 에서 `TextMetrics.fontBoundingBoxAscent/Descent` = 24 / 11 → 0.8em / 0.367em).
 * 한글에는 사실상 디센더가 없어(글리프 잉크 bbox −104~750 / 1000upm) 라인박스 아래쪽이 통째로 비고,
 * 그 결과 라인박스 중심(베이스라인 +0.217em)이 글자 잉크 중심(+0.323em)보다 **0.106em 아래**에 있다.
 * = 30px 제목 옆의 배지가 그만큼 낮게 앉는다(헤드리스 크롬 실측 3.0~3.2px).
 *
 * 그래서 `align-items: center` + `flex: 0 0 auto` 만으로는 못 맞춘다 — 정렬 자체는 정확하고,
 * **기준(라인박스 중심)이 눈이 보는 중심과 다른 것**이라 그 차이만큼 되돌려야 한다.
 * 레이아웃을 건드리지 않는 `transform` 으로 올려 행 높이·간격은 그대로 둔다.
 *
 * 0.106em 대신 0.1em 을 쓰는 이유: clamp 양 끝(20px·30px)에서 정확히 2px·3px 이 되어 배지 테두리가
 * 반픽셀에 걸리지 않는다(잔차 0.2px 이하 — 눈으로 구분 불가).
 *
 * ⚠ 헤딩 서체(`font.display`)나 `heroTitleFontSize` 를 바꾸면 이 값을 **다시 재야 한다**.
 *   재는 법: 실브라우저에서 제목 요소의 `TextMetrics`(fontBoundingBox·actualBoundingBox)로 잉크 중심을,
 *   배지의 `getBoundingClientRect()` 로 배지 중심을 구해 차이를 본다.
 */
export const heroIconOpticalAlign = `
  transform: translateY(calc(${heroTitleFontSize} * -0.1));
`;
