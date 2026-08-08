import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, pageHue, pageHueMix, radius, space, surface, topRail } from '@/shared/styles';

/**
 * 이 화면이 세우는 면의 패딩. `surface()` 가 이 값에서 안쪽 라운드까지 파생하므로 상수로 둔다
 * (`TickerComparePage/styled/` 가 같은 이유로 같은 형태를 쓴다).
 */
const PANEL_PAD = space[4];

/** 히어로 아래 본문. 섹션 간격 하나만 여기서 정한다 — 섹션마다 margin 을 흩뿌리지 않는다. */
export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  margin-top: ${space[6]};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Body = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.7;
  max-width: 72ch;
`;

/**
 * 기준 배지 — "연속 증배 50년 이상". 이 화면에서 **가장 먼저 읽혀야 하는 사실**이라 본문이 아니라
 * 자기 면을 갖는다.
 */
export const CriterionBadge = styled.p`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
`;

/** 읽기 주의 — 경고가 아니라 "이 목록을 어떻게 읽어야 하는가"라 중립 면에 둔다. */
export const CautionPanel = styled.div`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;
`;

/**
 * 마스코트가 앉을 **폭**.
 *
 * 🔴 2026-08-05 에 키웠다(88~168 → **112~236**, 사용자 지시 "이미지도 좀 더 확대"). 종전 크기는
 * 카드 구석의 작은 아이콘처럼 보여 제목과 한 장면을 이루지 못했다. 상한 236px 은 1280 에서
 * 제목·리드가 쓸 폭(약 700px)을 남기는 선이고, 하한 112px 은 390 에서 캐릭터의 얼굴이 뭉개지지
 * 않는 최소치다.
 */
const MASCOT_WIDTH = 'clamp(112px, 17vw, 236px)';

/** 카드 테두리와의 거리. 그림의 발끝·오른팔이 둥근 모서리에 닿지 않을 만큼만. */
const MASCOT_INSET = 'clamp(14px, 2vw, 32px)';

/** 상단 hue 리본 두께. PageHero 의 것과 같은 값이다(같은 신호라 굵기가 갈리면 안 된다). */
const HERO_RAIL_HEIGHT = '4px';

/**
 * 히어로 두 열 — **그림(맨 왼쪽) + 글(그 뒤)**.
 *
 * 🔴 세 목록이 **전부 같은 배치**다(2026-08-06 사용자 지시: 그림을 맨 좌측, 텍스트를 그 뒤로).
 * 종전에는 목록마다 좌우를 갈랐고(킹·챔피언 오른쪽 / 귀족 왼쪽) 글이 남는 폭을 다 먹어, 글과 그림
 * 사이에 빈 폭이 넓게 남았다 — 둘이 한 장면으로 읽히지 않았다.
 *
 * ⚠ 글 열 상한(68ch)이 없으면 리드가 긴 목록에서 글이 카드 끝까지 늘어난다(이 레포가 본문에 쓰는
 *   읽는 폭과 같은 대역이다).
 * ⚠ 문자열을 **밖에서** 조립한다 — styled 템플릿 안 중첩 템플릿 리터럴은 백틱 가드가 문맥을 닫지 못한다.
 */
/* 🔴 글이 먼저, 그림이 뒤다(2026-08-07 사용자 지시로 좌↔우를 뒤집었다). DOM 순서(글 → 그림)와
   보이는 순서가 같아져, 아래 header/HeroMascot 의 grid-column 재배치도 함께 사라졌다. */
const HERO_COLUMNS = 'minmax(0, min(68ch, 100%)) auto';

/**
 * 히어로 + 마스코트 한 덩어리 — **허브(`/dividend/lists`)의 소개 블록과 같은 배치**
 * (2026-08-06 사용자 지시: "목록 페이지 스타일의 이미지·텍스트 배치로").
 *
 * ## 무엇이 바뀌었나 — 겹침 → **진짜 두 열**
 * 종전에는 그림과 히어로가 **같은 그리드 셀**에 겹쳐 있었고, 글이 그림 밑으로 흐르지 않도록 카드에
 * 그림 폭만큼 패딩을 줘서 자리를 비웠다. 그 방식은 두 가지를 낳았다: ①글 덩어리가 남는 여백 속에
 * 어정쩡하게 떠서 "정렬을 뒤집는" 보정이 또 필요했고(귀족의 우측 정렬) ②그림은 카드 바닥에 붙고
 * 글은 위에 있어 **둘의 시선 높이가 어긋났다.**
 *
 * 지금은 허브와 같다 — 그림과 글이 **각자의 열**을 갖고 세로 가운데에서 마주 본다. 패딩으로 자리를
 * 비울 일도, 정렬을 뒤집을 일도 없다(열의 경계가 그 일을 한다).
 *
 * ⚠ 그림은 **항상 맨 왼쪽**이고 글이 그 뒤다(2026-08-06). 종전에는 목록마다 좌우를 갈랐는데,
 *   그 배치는 글과 그림 사이에 빈 폭을 만들었다 — 지금은 셋 다 같은 배치이고 리듬은 그림이 만든다.
 * ⚠ 좁은 폭에서는 한 열로 접히고 그림이 아래로 내려간다. 그 폭에서 그림을 위에 두면 첫 화면이
 *   전부 그림이 된다.
 */
export const HeroBlock = styled.div`
  display: grid;
  align-items: center;
  gap: clamp(12px, 2vw, 28px);
  min-width: 0;
  position: relative;
  isolation: isolate;
  border-radius: ${radius.xl};
  /* 🔴 상단 리본(아래 ::after)이 둥근 모서리를 넘지 않게 자른다. 반경과 **같은 자리**에 적는다 —
     geometry 가드가 부모 자신의 선언부에서 이 짝을 찾는다(리본만 있고 자르지 않으면 red). */
  overflow: hidden;

  /*
   * 🔴 **좁은 폭에서도 두 열을 유지한다**(2026-08-06 사용자 지시: 화면이 작아지면 그림이 아래로
   * 내려가는데 그러지 않게). 종전에는 tablet 아래에서 한 열로 접혀 그림이 글 밑으로 갔다 —
   * 그러면 첫 화면의 절반이 그림이 되고, 제목이 접힘 아래로 밀린다.
   * 대신 **그림이 줄어든다**(아래 HeroMascot 의 폭이 vw 를 따라간다). 자리가 바뀌는 대신
   * 크기가 바뀌는 쪽이 이 히어로에서는 맞다 — 배치가 폭마다 달라지면 같은 화면으로 안 읽힌다.
   */
  grid-template-columns: ${HERO_COLUMNS};
  /* 두 열을 **왼쪽으로 몰아** 붙인다 — 남는 폭은 오른쪽에 남기고 글·그림은 붙어 있게 한다. */
  justify-content: start;

  /*
   * 🔴 **그림 뒤의 후광**(2026-08-05 사용자 지시: "타이틀과 어우러지게").
   *
   * 그전에는 흰 카드 위에 그림이 **붙여 놓은 스티커**처럼 떠 있었다 — 캐릭터의 보라색이 카드의
   * 흰 면과 아무 접점 없이 끝나서다. 그림이 앉는 쪽에만 페이지 hue 를 아주 옅게 깔면 캐릭터의
   * 색이 면으로 번져 나가며 제목과 같은 판 위에 있는 것으로 읽힌다.
   *
   * ⚠ **글자 쪽에는 번지지 않는다.** 후광은 그림 쪽 45% 안에서 끝나고 제목·리드가 앉는 자리는
   *   원래의 검증된 면 그대로다 — pageHue.ts 가 못 박은 규율(색 혼합 면 위에 텍스트 금지)을
   *   지키는 방법이다. 대비 테스트가 보는 조합이 달라지지 않는다.
   * ⚠ z-index: -1 + 부모 isolation: isolate — 후광이 카드 배경 **아래**로 가되 페이지의 다른
   *   쌓임 맥락으로 새지 않는다.
   */
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      110% 90% at 16% 82%,
      ${pageHueMix(22)} 0%,
      ${pageHueMix(8)} 38%,
      transparent 62%
    );
  }

  /*
   * 🔴 **상단 hue 리본은 이제 블록이 그린다**(2026-08-06). 열이 갈리면서 히어로가 한쪽 열만
   * 차지하게 됐고, 그러자 PageHero 가 그리던 리본이 **글자 열 위에서만** 시작해 그림과 끊겨
   * 보였다("여기가 도입부"라는 신호가 절반만 그어진 셈이다). 리본을 블록으로 올려 두 열을
   * 가로지르게 하고, 히어로 자신의 리본은 아래에서 끈다 — 같은 선이 두 번 그려지지 않는다.
   * ⚠ 리본은 직사각형이라 둥근 모서리를 넘는다. 자르는 것은 이 블록의 overflow 다(위 선언).
   */
  &::after {
    ${topRail(HERO_RAIL_HEIGHT)}
    background: ${pageHue};
  }

  > header {
    /*
     * 카드의 불투명 흰 면을 **걷어 낸다** — 그래야 위 후광이 제목 뒤까지 하나의 판으로 이어진다.
     * (면을 남기면 카드 안은 희고 바깥만 물들어 오히려 두 겹으로 갈라 보인다.)
     */
    background: transparent;
    border-color: transparent;
    box-shadow: none;

    /* 리본은 위에서 블록이 그린다 — 여기 것을 켜 두면 짧은 선이 한 번 더 그어진다. */
    &::before {
      display: none;
    }

    /* 글은 첫 번째 열이다 — DOM 순서와 같아 재배치가 없다(2026-08-07 좌↔우 반전). */
    grid-column: 1;
    grid-row: 1;
  }
`;

/**
 * 목록별 마스코트.
 *
 * 🔴 **장식이다** — `alt=""`. 바로 옆의 `<h1>`("배당킹")이 이미 이 그림의 이름을 말하고 있어서,
 * 대체 텍스트를 달면 스크린리더 사용자는 같은 말을 두 번 듣는다.
 * 🔴 클릭을 통과시킨다. 이 상자는 그리드 셀을 채우느라 카드 오른쪽 위를 덮는데, 그림은 읽는 것도
 *    누르는 것도 아니다(랜딩 히어로에서 그림이 CTA 를 먹었던 실측 사고와 같은 처방).
 * ⚠ `width`/`height` 속성은 **원본 픽셀**을 그대로 준다 — 실제 폭은 CSS 가 정하지만, 두 값이 있어야
 *   브라우저가 비율대로 자리를 미리 잡아 이미지가 도착할 때 글자가 튀지 않는다(CLS).
 * ⚠ 세로 가운데다(종전에는 카드 바닥에 붙였다). 열이 갈린 뒤로는 글과 눈높이를 맞추는 쪽이 맞다.
 */
export const HeroMascot = styled.img`
  /*
   * 🔴 겹침이 아니라 **자기 열**에 선다(2026-08-06). 종전에는 히어로와 같은 그리드 셀에 얹혀 있어서
   * position: relative 로 페인트 단계를 끌어올려야 카드 배경 위로 나왔다(2026-08-04 실측 사고).
   * 열이 갈린 지금은 그 보정이 필요 없다 — 겹치는 것이 없으므로 쌓임을 만들 이유도 없다.
   */
  /* 맨 오른쪽 열(2026-08-07 사용자 지시). DOM 순서와 자리가 같다 — 재배치가 필요 없다. */
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  /* 세로 가운데 — 글과 눈높이를 맞춘다(허브 소개 블록과 같은 규율). */
  align-self: center;
  width: 100%;
  max-width: ${MASCOT_WIDTH};
  height: auto;
  /*
   * 🔴 **왼쪽 끝에서 살짝 띄운다**(2026-08-06 사용자 지시). 여백이 없으면 캐릭터의 팔·발이 카드의
   * 둥근 모서리에 닿아 "잘린 것"처럼 보인다. 오른쪽(글자 쪽)은 열 사이 gap 이 이미 벌려 주므로
   * **왼쪽 한 변에만** 준다 — 양쪽에 주면 그림이 그만큼 작아진다.
   */
  margin: ${MASCOT_INSET} 0 ${MASCOT_INSET} ${MASCOT_INSET};
  pointer-events: none;

  /*
   * 🔴 **좁은 폭에서는 위로 붙인다**(2026-08-07 사용자 지시: "히포 사진 위치를 통일, 귀족 히포를
   * 위로"). 두 지시는 사실 한 원인이다 — 킹·귀족·챔피언은 같은 이 컴포넌트를 쓰지만 **그림마다
   * 세로 비율이 다르다**(귀족 440x432 는 거의 정사각, 나머지는 세로가 길다). 가운데 정렬은
   * "중심을 맞추는" 규칙이라 높이가 다르면 **윗변이 제각각인 자리**에 온다. 좁아질수록 글 열이
   * 길어져 그 차이가 눈에 띄고, 특히 귀족이 아래로 처져 보였다.
   *
   * 윗변을 맞추면 세 페이지가 같은 자리에서 시작한다 — 그림 높이와 무관하게 통일된다.
   * ⚠ 넓은 폭은 그대로 가운데다. 거기서는 글이 짧아 위로 붙이면 오히려 카드가 위로 쏠린다.
   */
  ${media.down('tablet')} {
    align-self: start;
  }
`;

/** 표 위의 한 줄 — 지금 몇 종목이 보이는지. 필터를 걸면 사용자가 잃는 맥락을 여기서 되돌려준다. */
export const TableMeta = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/** 출처 목록. `<dl>` 이 아니라 `<ul>` 인 이유: 각 항목이 "자료 하나"라는 동등한 낱개다. */
export const SourceList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const SourceItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const SourceRole = styled.span`
  padding: 1px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

export const SourceLink = styled.a`
  color: ${color.brandText};
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export const SourceDate = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 출처 목록 아래의 한 줄. 지금은 위키피디아 CC BY-SA 4.0 표기가 여기 산다 —
 * 라이선스 고지는 "자료 하나"가 아니라 목록 전체에 걸리는 조건이라 `<ul>` 항목이 아니다.
 */
export const SourceNote = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

/** 다른 목록으로 가는 카드 줄. 세 목록이 서로를 알고 있어야 하나만 보고 나가지 않는다. */
export const RelatedGrid = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RelatedCard = styled(Link)`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
  }
`;

export const RelatedTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

export const RelatedMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const HubLink = styled(Link)`
  align-self: flex-start;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

/* ── 이달의 히든스타 ──────────────────────────────────────────────────────────
 * 🔴 표가 아니라 **목록**이다. 달마다 한 종목뿐이라 열을 세우면 빈칸이 더 많아지고, 읽는 순서도
 *    "언제 → 무엇 → 왜"라는 문장에 가깝다. 그래서 줄마다 세로로 쌓는다.
 * 🔴 손익색을 쓰지 않는다 — 이 서비스는 종목을 평가하지 않는다. */

export const MonthlyList = styled.ol`
  display: grid;
  gap: ${space[4]};
  margin: ${space[3]} 0 0;
  padding: 0;
  list-style: none;
`;

export const MonthlyRow = styled.li`
  display: grid;
  gap: ${space[1]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

export const MonthlyMonth = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.03em;
  color: ${color.textMuted};
`;

export const MonthlyName = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/** 세 숫자 한 줄. 데이터 서체로 두어 표와 같은 값임을 형태가 말한다. */
export const MonthlyFacts = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  font-variant-numeric: tabular-nums;
`;

/** 🔴 주의 한 줄. 색이 아니라 **문장**이 채널이다(색 단독 채널 금지). */
export const MonthlyNotice = styled.p`
  margin: ${space[1]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const MonthlyAsOf = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;
