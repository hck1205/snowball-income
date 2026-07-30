import styled from '@emotion/styled';
import { Link, NavLink } from 'react-router-dom';
import { color, font, media, radius, shadow, space, subtleScrollbar } from '@/shared/styles';

/**
 * 전역 nav 랜드마크 — 브랜드 링크 + 라우트 링크를 한 줄로. 좁아지면 라벨이 접혀 아이콘만 남는다.
 *
 * 레이아웃 = **3컬럼 그리드 `1fr auto 1fr`**: 브랜드가 1열(좌측 고정), 라우트 링크가 2열(가운데),
 * 3열은 빈 채로 남겨 브랜드/우측 컨트롤의 폭 변화와 무관하게 메뉴가 **헤더 가로폭의 시각적 중앙**에
 * 고정된다(flex + margin auto 방식은 브랜드 폭에 따라 중앙이 흔들린다).
 * 두 헤더 모두 이 nav를 세로 스택(column, align-items:stretch)의 자식으로 두므로 nav가 헤더 폭을
 * 그대로 차지한다 — 그래서 grid 중앙이 곧 헤더 중앙이다.
 *
 * 좁은 화면(drawer↓)에선 가운데 정렬이 브랜드를 밀어 압박하므로 **기존 flex 흐름으로 폴백**한다.
 */
export const Nav = styled.nav`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
  }
`;

/** 브랜드(워드마크) 공통 레이아웃 — 링크(Brand)와 비링크 폴백(BrandFallback)이 공유한다. */
const brandLayout = `
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  /* 그리드 1열에서 좌측 고정 — stretch되면 클릭 영역이 빈 공간까지 넓어진다. */
  justify-self: start;
`;

/** 워드마크를 감싸는 홈(`/`) 링크 — 워드마크 텍스트가 곧 이 링크의 접근명이다. */
export const Brand = styled(Link)`
  ${brandLayout}
  text-decoration: none;
  border-radius: ${radius.sm};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * Router 컨텍스트가 없는 렌더(일부 단위 테스트/비라우터 임베드)용 브랜드 폴백 — 비링크 span.
 * 프로덕션은 루트가 RouterProvider라 항상 링크(Brand)를 쓴다.
 */
export const BrandFallback = styled.span`
  ${brandLayout}
`;

/**
 * 브랜드 워드마크("스노우볼 인컴") — **심볼 아이콘 없이 텍스트 단독**(2026-07-27 확정).
 * `as='h1'`(시뮬레이터)이면 랜드마크 제목을 겸하므로 margin을 0으로 리셋한다.
 *
 * 크기는 폭 예산으로 정했다(한글 표기는 영문 2줄보다 가로로 길다):
 * Gmarket Sans Bold 의 한글 한 글자 = 0.962em, 공백 = 0.28em → "스노우볼 인컴" = 6.052em,
 * 자간 -0.02em × 7자 = -0.14em → **5.912em**.
 *  - 17px → 100.5px  (구 워드마크 블록 = 로고 28 + gap 8 + "Snowball" 4.2223em×13px 54.9 ≈ 90.9px)
 *  - 15px →  88.7px  → 좁은 폭에서는 구 블록보다 **좁다**(폭 회귀 없음).
 * 그래서 mobileWide↓에서만 15px로 내린다 — 이 구간이 헤더(브랜드+토글+우측 컨트롤)가 가장 빡빡하다.
 */
export const BrandWordmark = styled.span`
  margin: 0;
  font-family: ${font.display};
  font-size: 17px;
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  line-height: 1.2;
  white-space: nowrap;
  text-align: left;

  ${media.down('mobileWide')} {
    font-size: 15px;
  }
`;

/**
 * 워드마크 두 파트("스노우볼"·"인컴")가 **공유하는 단일 헬퍼**. 그라디언트 텍스트는
 * 세 환경에서 글자를 통째로 지우므로 폴백 3종이 한 세트다 — 회귀 시 여기 한 곳만 고친다.
 *
 *  ① `background-clip: text` 미지원 → 단색
 *  ② Windows 고대비(forced-colors) → 투명 텍스트가 사라진다 → 시스템 전경색
 *  ③ 인쇄 → 배경 이미지를 안 그리는 엔진이 있어 백지로 나간다 → 단색
 *
 * `background-size: 135%`는 hex를 바꾸지 않고 밝은 끝 stop을 글자 밖으로 미는 레버다
 * (presets.ts `buildWordmarkGradient` JSDoc이 남긴 방법 — 글자 안에는 그라디언트의 0~74%만
 * 렌더돼 라이트 테마 헤더에서 끝이 흐려지는 정도를 줄인다. 선언 hex 불변 → 회귀 플로어 테스트 그대로).
 *
 * **이 레버는 라이트를 위한 것인데 전 테마에 건다 — 일부러 그렇게 뒀다.**
 *  - 라이트는 밝은 끝이 최악 지점이라 이득이 실측된다: 헤더 표면 위 끝 stop 1.57~1.79 → 1.72~1.97.
 *  - 다크는 두 낱말 모두 램프가 뒤집혀 **최악 지점이 x=0의 첫 stop**이고(전 프리셋 최저: 스노우볼
 *    brand300 6.98 / 인컴 teal400 7.19), 그 픽셀은 background-size와 무관하게 항상 렌더된다 →
 *    다크 최저는 레버 유무와 동일하다(플로어 6.9). 레버가 깎는 건 밝은 끝(9.26 → 8.66)뿐이라
 *    **대비 손실이 아니라 램프 폭 26% 압축**이고, 두 stop이 한 칸 차이(#79c5e6→#aadcf2)라
 *    15~17px 워드마크에서는 사실상 단색으로 읽힌다.
 *  - 반면 라이트에만 걸려면 이 앱의 모드 판정을 여기서 세 갈래로 복제해야 한다
 *    (`@media (prefers-color-scheme: dark)` + `:root[data-theme='light'] &` + `:root[data-theme='dark'] &`
 *    — TickerDetailPage.styled.ts 선례). 장식 한 줄 때문에 모드 판정이 한 곳 더 생기면 나중에 모드
 *    해석이 바뀔 때 여기만 조용히 뒤처진다. **이득(눈에 안 보이는 26%) < 비용(영구 분기 3개)** 이라
 *    전 테마 적용을 유지한다.
 */
const wordmarkGradientText = (gradient: string, solid: string) => `
  background-image: ${gradient};
  background-size: 135% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;

  @supports not ((background-clip: text) or (-webkit-background-clip: text)) {
    background-image: none;
    color: ${solid};
  }

  @media (forced-colors: active) {
    background-image: none;
    color: CanvasText;
  }

  @media print {
    background-image: none;
    color: ${solid};
  }
`;

/** 워드마크 앞 낱말 — 아이스 블루 램프. */
export const WordmarkSnow = styled.span`
  ${wordmarkGradientText(color.gradientWordmarkSnow, color.wordmarkSnowSolid)}
`;

/** 워드마크 뒤 낱말 — 틸→그린(액센트 축). */
export const WordmarkIncome = styled.span`
  ${wordmarkGradientText(color.gradientWordmarkIncome, color.wordmarkIncomeSolid)}
`;

/**
 * 2줄째 메뉴 스크롤 컨테이너(nav 랜드마크). 스크롤바는 얇게 두되 없애지 않는다 —
 * 넘칠 수 있다는 사실 자체가 UI 정보다.
 */
export const NavScroller = styled.nav`
  width: 100%;
  display: flex;
  overflow-x: auto;
  /* 상하 여백 — 윗줄 컨트롤·헤더 하단 경계와 메뉴 줄 사이 숨통(사용자 요청 2026-07-25).
     좌우 2px 는 포커스 링이 스크롤 클리핑에 잘리지 않게 하는 최소값 그대로 둔다. */
  padding: ${space[2]} 2px;
  -webkit-overflow-scrolling: touch;
  ${subtleScrollbar}
`;

export const NavItems = styled.div<{ $scrollRow?: boolean }>`
  display: inline-flex;
  align-items: center;
  /* 그리드 2열의 정중앙에 놓는다(Nav 주석 참고). drawer↓ flex 폴백에선 무시된다. */
  justify-self: center;
  /* 라우트 링크 사이를 넉넉히 벌린다(요구사항 — 너무 붙어있지 않게). */
  gap: ${space[4]};
  min-width: 0;

  /* 좁은 화면에선 넓은 간격이 브랜드/컨트롤을 밀어내므로 원래 간격으로 되돌린다. */
  ${media.down('drawer')} {
    gap: ${space[3]};
  }

  ${media.down('mobileWide')} {
    gap: ${space[1]};
  }

  /* 스크롤 줄 모드: 남으면 정중앙(margin auto), 넘치면 좌측부터 스크롤(NavScroller 주석 참고). */
  ${({ $scrollRow }) =>
    $scrollRow
      ? `
    margin-inline: auto;
    flex-wrap: nowrap;
  `
      : ''}
`;

/**
 * ── 활성 표기 스타일(현재 페이지) — **A안: 브랜드 채움 pill** ────────────────────────────────
 *
 * 활성 표기를 한 블록에 모아 둔다(다른 안으로 갈아끼울 때 여기만 바꾸면 된다 — 대안 B/C는 핸드오프 참고).
 * A안 = 브랜드 색으로 꽉 채운 pill + 살짝 뜬 그림자. 라벨/아이콘은 반드시 `color.onBrand`
 * (브랜드 채움 위 라벨 규칙 — velog·sunset·ink 다크에서 흰색 하드코딩은 대비가 깨진다).
 * 아이콘은 `currentColor`(lucide 기본)라 색이 자동으로 따라온다.
 */
const navItemActiveStyle = `
  background: ${color.brand};
  color: ${color.onBrand};
  font-weight: ${font.weight.bold};
  box-shadow: ${shadow.e1};
`;

/**
 * 라우트 링크(NavLink). 활성 라우트에서 react-router가 `aria-current="page"`와 `.active`를 붙인다.
 * 좁은 화면(mobileWide↓)에선 라벨을 접어 아이콘 버튼이 된다 — 이름은 NavItem의 `aria-label`이 준다.
 */
export const NavItem = styled(NavLink)`
  /* 활성 인디케이터(::after)를 쓰는 대안 안(B/C)을 위해 좌표계를 미리 잡아 둔다. */
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  min-height: 32px;
  border-radius: ${radius.sm};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  /* 활성(현재 페이지) — 위 navItemActiveStyle 한 블록이 정본. */
  &.active,
  &[aria-current='page'] {
    ${navItemActiveStyle}
  }

  /* 활성 항목 위 hover가 비활성 hover 규칙에 덮이지 않도록(동일 특이도 → 뒤에 선언). */
  &.active:hover,
  &[aria-current='page']:hover {
    background: ${color.brandHover};
    color: ${color.onBrand};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  /* 좁은 폭: 라벨은 유지한 채(표시 결정) 패딩만 줄인다. 넘치면 스크롤 줄이 받는다. */
  ${media.down('mobileWide')} {
    padding: ${space[1]} ${space[2]};
  }
`;

/**
 * 라우트 링크 라벨 — **어떤 폭에서도 숨기지 않는다**(사용자 결정 2026-07-25: 아이콘만 남기지 말 것).
 * 좁은 화면에선 글자를 줄이고, 넘치는 만큼은 NavScroller 의 가로 스크롤이 받는다.
 */
export const NavLabel = styled.span`
  ${media.down('mobileWide')} {
    font-size: 12px;
  }
`;
