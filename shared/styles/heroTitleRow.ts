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
 * **서체 역할 → "잉크 중심이 라인박스 중심보다 얼마나 위인가"(글자 크기 대비 비율).**
 *
 * 한 줄에 글자와 다른 것(아이콘·버튼·구분선·배지)이 섞이면 `align-items: center` 는 **라인박스**를
 * 기준으로 맞춘다. 그런데 사람 눈이 "가운데"로 보는 것은 **잉크**다. 둘이 어긋난 만큼 옆에 선
 * 형제가 낮게(또는 높게) 앉아 보인다 — 정렬 선언이 옳아도 화면은 틀린다.
 *
 * 왜 어긋나는가: 한글에는 사실상 디센더가 없는데 폰트 메타데이터는 디센더 공간을 크게 잡는다
 * (`font.display` = 원본 Gmarket Sans 의 OS/2 `usWinDescent` 350, 그리고 **Chrome/Windows 는 이 win
 * 메트릭을 콘텐츠 영역으로 쓴다**).
 *
 * 🔴 **`line-height` 로는 못 고친다** — 콘텐츠 영역의 중심은 (ascent−descent)/2 로 정해져
 * `line-height` 와 무관하다. 늘리면 위아래로 같이 벌어질 뿐 중심은 그대로다.
 *
 * 🔴 **역할마다 값이 다르고 부호까지 다르다. 한 상수를 전 화면에 뿌리면 지금 옳은 자리를 망친다.**
 * 실측(2026-07-30, 헤드리스 크롬 150 + `TextMetrics`, 실제 로드된 웹폰트, 문자열 5종):
 *
 * | 역할 | (잉크 중심 − 라인박스 중심)/em | 판정 |
 * |---|---|---|
 * | `font.display` (Gmarket) | +0.072 ~ +0.134, 평균 **+0.100** | 보정한다 |
 * | `font.sans` (Wanted) | −0.028 ~ +0.003 | **보정하지 않는다** |
 * | `font.heroNumeric` (LINE Seed) | −0.030 ~ −0.132, 한글 **−0.061** | 반대 방향 |
 * | `font.dataNumeric` (Inter) | −0.037 ~ +0.010 | **보정하지 않는다** |
 *
 * ⚠ **재려면 큰 크기에서 재라.** Chrome 은 `actualBoundingBox*` 를 **정수 픽셀로 반올림**해서
 * 13px 에서 잰 값은 ±0.04em 짜리 가짜 어긋남을 만든다(400px 에서 재면 ±0.00125em). 재는 식:
 * `shift = (actualAsc − actualDesc)/2 − (fontAsc − fontDesc)/2`, 전부 글자 크기로 나눈 값.
 *
 * ⚠ 같은 서체라도 **문자열마다 ±0.03em 흔들린다**(잉크 자체가 글자에 따라 다르다). 어떤 방식으로도
 * 0 으로 만들 수 없는 몫이라 역할마다 **한 값**으로 고정하는 편이 옳다.
 */
const INK_ABOVE_LINE_BOX = {
  display: 0.1,
  sans: 0,
  heroNumeric: -0.06,
  dataNumeric: 0
} as const;

/** 위 표의 서체 역할. `shared/styles/tokens.ts` 의 `font.*` 이름과 1:1 이다. */
export type TextInkRole = keyof typeof INK_ABOVE_LINE_BOX;

/**
 * **한 줄** 조합에서 글자 옆에 서는 형제(아이콘·아이콘 버튼·구분선·배지·체크박스)를 글자의
 * **잉크 중심**에 맞춘다. 부모는 `align-items: center` 여야 한다.
 *
 * 어느 자리에 무엇을 적을지 고민하지 않게 하려고 **역할을 받는다** — 보정이 필요 없는 역할
 * (`sans`·`dataNumeric`)에는 `transform` 을 **아예 내보내지 않는다**. 불필요한 보정은 그 자체로
 * 결함이고(본문 서체에 헤딩 상수를 쓰면 없던 오차 1.2px 이 생긴다), 빈 `transform` 은 합성 레이어를
 * 공짜로 만들지 않기 위해서다.
 *
 * `textFontSize` 는 **글자 크기**를 넘긴다 — 형제 자신의 `em` 으로 쓰면 안 된다(아이콘 16px vs
 * 제목 30px 처럼 대개 다르다).
 */
export const iconOpticalAlign = (role: TextInkRole, textFontSize: string) => {
  const shift = INK_ABOVE_LINE_BOX[role];
  if (shift === 0) return `flex: 0 0 auto;`;
  return `
  flex: 0 0 auto;
  transform: translateY(calc(${textFontSize} * ${-shift}));
`;
};

/** 히어로 제목 옆 아이콘 배지 — 위 유틸을 헤딩 서체 · 히어로 제목 크기로 적용한 것. */
export const heroIconOpticalAlign = iconOpticalAlign('display', heroTitleFontSize);

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
 * 🔴 **잉크 보정(`INK_ABOVE_LINE_BOX`)을 여기에 쓰지 마라 — 2026-07-30 실측으로 걷어냈다.**
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
