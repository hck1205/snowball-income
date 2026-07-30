import { font } from './tokens';

/**
 * ── 제목 크기 + 아이콘 세로 정렬의 정본 ─────────────────────────────────────────
 *
 * 두 가지를 여기 한 곳에서만 정한다.
 *  1. **제목 크기 스케일**(히어로 · 카드/섹션) — 화면이 좁아지면 같은 규칙으로 함께 줄어든다.
 *  2. **아이콘을 글자에 맞추는 광학 보정** — 한 줄 조합과 여러 줄 조합의 두 형제 유틸.
 *
 * 히어로는 지금 **3벌**이다 — 공용 `components/common/PageHero` 와 `pages/Portfolio` ·
 * `pages/DividendCalendar` 의 페이지 로컬 복제. 셋을 한 컴포넌트로 합치는 것은 전면 페이지 리모델링
 * 소관이라, 그 사이에도 **제목 크기와 아이콘 세로 정렬이 갈리지 않도록** 이 둘만 한 벌로 갖는다
 * (색·배경·리본은 그대로 각자 소유 — 시각 차이는 알려진 상태다).
 */

/* -------------------------------------------------------------------------- */
/* 1. 제목 크기                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 히어로 제목(h1/h2) 크기. 아래 광학 보정이 이 크기를 기준으로 하므로 둘은 항상 같이 움직인다.
 *
 * 유동 항에 **`rem` 을 섞는다**(`vw` 단독 금지). `vw` 만 쓰면 사용자가 브라우저 기본 글자 크기를
 * 키워도 제목이 그대로라 확대 설정이 무시된다 — WCAG 1.4.4(텍스트 200% 확대)의 실패 경로다.
 * `0.9rem + 1.8vw` → 355px 이하에서 하한 20px, 865px 이상에서 상한 30px, 그 사이는 선형.
 * (구 `4vw` 단독 대비 640px 근처 실측 차이 0.3px — 크기 인상은 그대로 두고 확대 대응만 얻었다.)
 */
export const heroTitleFontSize = `clamp(${font.size['2xl']}, calc(0.9rem + 1.8vw), ${font.size['4xl']})`;

/**
 * 카드·섹션 제목(차트 카드 헤더 등) 크기. **전 페이지 공통 규칙**이다 — 카드마다 다른 축소 곡선을
 * 쓰면 같은 화면 안에서 제목들이 서로 다른 속도로 줄어 위계가 무너진다.
 *
 * 상한 18px(`xl`) · 하한 16px(`lg`). 하한을 본문(`base` 14px)보다 **2단계 위에서 멈추는** 이유:
 * 헤딩 서체(`font.display`)에는 400~700 사이 중간 굵기가 없어 이 앱의 위계는 **크기로만** 만들어진다
 * (`tokens.ts` font.display 주석). 여기서 더 줄이면 320px 화면에서 제목과 본문이 구분되지 않는다.
 * `0.86rem + 0.56vw` → 400px 이하 16px, 760px 이상 18px.
 */
export const sectionTitleFontSize = `clamp(${font.size.lg}, calc(0.86rem + 0.56vw), ${font.size.xl})`;

/* -------------------------------------------------------------------------- */
/* 2. 아이콘 ↔ 글자 세로 정렬                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 라인박스 중심 ↔ 글자 잉크 중심의 어긋남(글자 크기 대비 비율). 아이콘을 이만큼 **위로** 올린다.
 *
 * 🔴 **헤딩 서체(`font.display`) 전용 상수다. 본문 서체에 쓰면 오히려 틀어진다** — 아래 실측 참고.
 *
 * 왜 어긋나는가: 한글에는 사실상 디센더가 없는데 폰트 메타데이터는 디센더 공간을 크게 잡는다
 * (`font.display` = 원본 Gmarket Sans 의 OS/2 `usWinDescent` 350, 그리고 **Chrome/Windows 는 이 win
 * 메트릭을 콘텐츠 영역으로 쓴다**). 그래서 라인박스 중심이 잉크 중심보다 아래에 있고,
 * `align-items: center` 로 정확히 정렬해도 아이콘이 그만큼 낮게 앉아 보인다.
 *
 * 🔴 **`line-height` 로는 못 고친다** — 콘텐츠 영역의 중심은 (ascent−descent)/2 로 정해져
 * `line-height` 와 무관하다. 늘리면 위아래로 같이 벌어질 뿐 중심은 그대로다.
 *
 * **실측(2026-07-30, 헤드리스 크롬 + `TextMetrics`, `Snowball Display` 800 / 30px).** 실제 히어로
 * 제목 7개로 잰 어긋남: 목표 달성 0.0875 · 내 포트폴리오/포트폴리오 갤러리/게시판 0.0953 ·
 * 배당 재투자 시뮬레이터/ETF 소개 0.1031 · 배당 캘린더 0.1187 → **평균 0.0997**. 문자열마다
 * 잉크 디센트가 달라 ±0.015em 폭으로 흔들리므로 한 값으로 고정하는 편이 옳고, `0.1` 이 그 평균이다
 * (덤으로 히어로 clamp 양 끝 20px·30px 에서 정확히 2px·3px 이라 배지 테두리가 반픽셀에 안 걸린다).
 *
 * ⚠ **헤딩 서체를 바꾸면 다시 재야 한다.** 재는 법(눈대중 금지): 헤드리스 크롬 + CDP 로
 * `measureText` 의 `fontBoundingBoxAscent/Descent`(라인박스 중심)와
 * `actualBoundingBoxAscent/Descent`(잉크 중심)를 구해 차를 본다 —
 * `shift = (actualAsc − actualDesc)/2 − (fontAsc − fontDesc)/2`, 전부 글자 크기로 나눈 값.
 */
const DISPLAY_ICON_OPTICAL_SHIFT = 0.1;

/**
 * **한 줄** 조합(헤딩 + 그 옆 아이콘)의 아이콘 보정. 부모는 `align-items: center` 여야 한다.
 *
 * 🔴 **헤딩 서체(`font.display`)로 그린 글자 옆에서만 쓴다.** 본문 서체(`font.sans` = Wanted Sans)는
 * 라인박스 중심과 잉크 중심이 사실상 같아(실측 ±0.004em) 보정이 필요 없다 — 거기에 이 유틸을 쓰면
 * 없던 오차 1.2px 을 만든다(아래 `iconFirstLineAlign` 주석의 실측표).
 *
 * `textFontSize` 는 **글자 크기**를 넘긴다 — 아이콘 자신의 `em` 으로 쓰면 안 된다(아이콘 폰트 크기와
 * 제목 폰트 크기는 대개 다르다. 히어로에서 배지 16px vs 제목 30px).
 */
export const iconOpticalAlign = (textFontSize: string) => `
  flex: 0 0 auto;
  transform: translateY(calc(${textFontSize} * -${DISPLAY_ICON_OPTICAL_SHIFT}));
`;

/** 히어로 제목 옆 아이콘 배지 — 위 유틸을 히어로 제목 크기로 적용한 것. */
export const heroIconOpticalAlign = iconOpticalAlign(heroTitleFontSize);

/**
 * **여러 줄** 조합(아이콘 + 여러 줄 설명문)의 아이콘 보정.
 *
 * 여러 줄 문구에 `align-items: center` 를 쓰면 아이콘이 **문단 한가운데**로 내려간다 — 아이콘은
 * 문단이 아니라 **첫 줄**에 붙어야 한다. 그래서 부모는 `align-items: flex-start` 로 두고 아이콘을
 * 첫 줄 라인박스 중심까지 내린다.
 *
 * 손으로 `margin-top: 2px` 를 적어 두던 자리를 대신한다. 그 상수는 어느 글자 크기·행간에서 잰
 * 값인지 아무도 모르고, 크기가 바뀌면 조용히 틀려진다.
 *
 * 🔴 **잉크 보정(`DISPLAY_ICON_OPTICAL_SHIFT`)을 여기에 쓰지 마라 — 2026-07-30 실측으로 걷어냈다.**
 * 이 유틸의 소비처는 전부 **본문 서체**(`font.sans` = Wanted Sans, 12px/1.4)인데 그 서체는
 * 라인박스 중심과 잉크 중심이 사실상 겹친다(실측 어긋남 **±0.0039em ≈ 0.05px @12px**,
 * `fontBoundingBox 0.952/0.241` vs `actualBoundingBox 0.797/0.094`). 헤딩 서체의 0.1em 을 그대로
 * 가져다 쓰면 아이콘을 1.2px 헛으로 들어올린다. 같은 DOM 을 세 벌 그려 잰 잔차(아이콘 중심 −
 * 첫 줄 잉크 중심):
 *
 *   A 구 유틸(margin + translateY −0.1em)  **−0.92px** (아이콘이 위로 뜸)
 *   B 현행(margin 만)                       **+0.28px**
 *   C 옛 `margin-top: 2px`                  **+1.89px**
 *
 * @param textFontSize 본문 글자 크기(CSS 길이). 예: `font.size.xs`
 * @param leading      본문 `line-height` 배수. 예: `font.leading.snug`
 * @param iconSize     아이콘 한 변(px). lucide `size` 와 같은 값을 넘긴다.
 */
export const iconFirstLineAlign = (textFontSize: string, leading: number, iconSize = 16) => `
  flex: 0 0 auto;
  align-self: flex-start;
  margin-top: calc((${textFontSize} * ${leading} - ${iconSize}px) / 2);
`;
