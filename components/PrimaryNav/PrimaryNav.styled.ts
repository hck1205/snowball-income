import styled from '@emotion/styled';
import { Link, NavLink } from 'react-router-dom';
import { color, font, media, pageHueMix, radius, shadow, space, subtleScrollbar } from '@/shared/styles';

/**
 * 전역 nav 랜드마크 — 브랜드 링크(+ 선택적으로 라우트 링크)를 한 줄로.
 *
 * 앱 헤더(`AppHeader`)는 **브랜드만**(`withLinks={false}`) 넘긴다 — 라우트 링크는 헤더가 자기
 * 그리드 트랙(`NavSlot`)에 따로 배치하기 때문이다. 그때 이 요소는 워드마크 딱 하나를 감싸는
 * 껍데기이므로 **자기 콘텐츠 폭만** 차지해야 한다(`$brandOnly`).
 *
 * ⚠ 예전에는 여기가 항상 `1fr auto 1fr` 3컬럼이었고, 브랜드만 있어도 빈 트랙이 자리를 먹어
 * 101px 워드마크가 **225px** 을 차지했다(실측). 한 줄 헤더에서는 그 124px 이 그대로 메뉴 폭을
 * 깎는다 — 링크를 함께 그릴 때만 3컬럼을 쓴다.
 */
export const Nav = styled.nav<{ $brandOnly?: boolean }>`
  display: ${({ $brandOnly }) => ($brandOnly ? 'inline-flex' : 'grid')};
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ $brandOnly }) => ($brandOnly ? '0' : space[3])};
  min-width: 0;

  ${media.down('drawer')} {
    display: ${({ $brandOnly }) => ($brandOnly ? 'inline-flex' : 'flex')};
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
 * 라우트 메뉴 스크롤 컨테이너(nav 랜드마크). 스크롤바는 얇게 두되 없애지 않는다 —
 * 넘칠 수 있다는 사실 자체가 UI 정보다.
 *
 * 상하 여백은 모드에 따라 다르다. **한 줄 헤더(≥1024)에서는 이 패딩이 곧 헤더 높이**라
 * 포커스 링이 살 최소치(4px)만 둔다. **두 줄(≤1023)에서는** 윗줄 컨트롤·헤더 하단 경계와
 * 메뉴 줄 사이의 숨통이 필요해 한 단계 넓힌다(사용자 요청 2026-07-25).
 * 좌우 2px 는 포커스 링이 스크롤 클리핑에 잘리지 않게 하는 최소값 그대로 둔다.
 */
export const NavScroller = styled.nav`
  width: 100%;
  display: flex;
  min-width: 0;
  overflow-x: auto;
  padding: ${space[1]} 2px;
  -webkit-overflow-scrolling: touch;
  ${subtleScrollbar}

  ${media.down('headerStack')} {
    padding: ${space[2]} 2px;
  }
`;

export const NavItems = styled.div<{ $scrollRow?: boolean }>`
  display: inline-flex;
  align-items: center;
  /* 그리드 2열의 정중앙에 놓는다(Nav 주석 참고). drawer↓ flex 폴백에선 무시된다. */
  justify-self: center;
  /* 라우트 링크 사이 간격. 한 줄 헤더(≥1024)에서는 브랜드·컨트롤과 같은 줄을 나눠 쓰므로 8px 로
     좁힌다 — 16px 이면 로그인한 사용자의 1024px 화면에서 메뉴가 곧바로 가로 스크롤로 밀린다(실측).
     항목 안쪽 패딩(12px)은 그대로라 칩끼리 붙어 보이지는 않는다. */
  gap: ${space[2]};
  min-width: 0;

  /* 두 줄 모드에서는 메뉴가 줄 전체를 쓰므로 원래의 넉넉한 간격으로 돌아간다. */
  ${media.down('headerStack')} {
    gap: ${space[4]};
  }

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
 * 현재 라우트의 색(`--sb-page-hue`)을 헤더 표면 쪽으로 섞은 **장식용 파생값**.
 * 값·폴백·비율 관례는 `shared/styles/pageHue.ts` 가 소유한다 — 변수가 없는 라우트에서는
 * 브랜드 색으로 떨어져 현행 그대로 보인다. 55% 는 그 파일이 말하는 "경계" 대역이다.
 */
const navPageHueRing = pageHueMix(55);

/**
 * ── 활성 표기 스타일(현재 페이지) — **A안: 브랜드 채움 pill + 페이지 hue 헤일로** ──────────────
 *
 * 활성 표기를 한 블록에 모아 둔다(다른 안으로 갈아끼울 때 여기만 바꾸면 된다).
 * A안 = 브랜드 색으로 꽉 채운 pill + 살짝 뜬 그림자. 라벨/아이콘은 반드시 `color.onBrand`
 * (브랜드 채움 위 라벨 규칙 — velog·sunset·ink 다크에서 흰색 하드코딩은 대비가 깨진다).
 * 아이콘은 `currentColor`(lucide 기본)라 색이 자동으로 따라온다.
 *
 * **페이지 hue 연동** — 라우트마다 `usePageHue` 가 `--sb-page-hue` 를 문서 루트에 발행한다
 * (`/`=identity 쿨블루 · 포트폴리오=accentAlt 그린 · 캘린더=accent 틸 · 커뮤니티=brand).
 * 활성 pill 은 그 색을 **헤일로(링)로만** 읽는다 — 그래서 히어로와 상단 내비가 같은 말을 한다.
 * 변수가 없는 라우트·아직 안 붙은 화면에서는 `color.brand` 로 떨어져 현행 그대로 보인다.
 *
 * 🔴 **왜 채움이 아니라 링인가** — hue 로 pill 을 채우면 그 위 라벨의 대비가 검증 대상 밖으로 나간다.
 * 특히 `/` 의 identity 채움은 **다크에서 흰 라벨 2.79:1** 이라고 semantic.ts 가 명시적으로 금지한다
 * (`identity` 채움 위 텍스트 금지). 그래서 텍스트는 대비가 검증된 brand 채움 위에 그대로 두고,
 * 텍스트가 얹히지 않는 링에만 hue 를 쓴다. 같은 이유로 링 색은 `color-mix` 파생이어도 안전하다
 * (파생 면 위에는 아무 글자도 없다).
 *
 * ⚠ `box-shadow` 를 두 번 선언하는 것은 의도다 — `color-mix` 를 모르는 엔진에서 두 번째 선언이
 * 통째로 무시되고 첫 줄(그림자만)이 남는다.
 */
const navItemActiveStyle = `
  background: ${color.brand};
  color: ${color.onBrand};
  font-weight: ${font.weight.bold};
  box-shadow: ${shadow.e1};
  box-shadow: 0 0 0 2px ${navPageHueRing}, ${shadow.e1};
`;

/**
 * nav 항목 한 칸의 생김새 — **링크(NavItem)와 드롭다운 트리거(NavMenuTrigger)가 공유한다.**
 *
 * 🔴 둘이 같은 줄에 나란히 서므로 여기 한 곳에서만 정한다. 복사해 두면 언젠가 한쪽만 고쳐져
 * 같은 줄에서 높이·패딩이 어긋난다(그 어긋남은 스크린샷으로만 잡히고 테스트로는 안 잡힌다).
 */
const navItemBaseStyle = `
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
 * 라우트 링크(NavLink). 활성 라우트에서 react-router가 `aria-current="page"`와 `.active`를 붙인다.
 * 좁은 화면(mobileWide↓)에선 라벨을 접어 아이콘 버튼이 된다 — 이름은 NavItem의 `aria-label`이 준다.
 */
export const NavItem = styled(NavLink)`
  ${navItemBaseStyle}

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
`;

/* ── 묶음 메뉴(드롭다운) ───────────────────────────────────────────────────────
 *
 * nav 항목이 8개에 닿아 "더 늘리려면 접기·묶기를 먼저 설계하라"고 적어 둔 그 설계다
 * (2026-08-02 사용자 결정 — 헤더는 2단 그대로 두고 묶음만 도입).
 *
 * 🔴 트리거는 **목적지가 아니다.** 눌러도 이동하지 않고 메뉴만 연다 — 그래서 `NavLink` 가 아니라
 *   `button` 이고, 활성 표시도 react-router 가 아니라 호출부가 `$active` 로 넘긴다(자식 라우트 중
 *   하나에 있으면 켠다). 링크로 만들면 "포트폴리오"라는 페이지가 있는 것처럼 읽힌다.
 */

export const NavMenuRoot = styled.div`
  position: relative;
  display: inline-flex;
`;

export const NavMenuTrigger = styled.button<{ $active: boolean }>`
  ${navItemBaseStyle}
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;

  ${({ $active }) =>
    $active
      ? `
  ${navItemActiveStyle}
  &:hover {
    background: ${color.brandHover};
    color: ${color.onBrand};
  }`
      : ''}
`;

/** 열림 상태를 방향으로도 말한다(색만으로 말하지 않는다). */
export const NavMenuChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  transition: transform 120ms ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

/**
 * 펼친 목록.
 *
 * 🔴 **트리거 옆에 절대배치하지 마라 — 잘린다.** nav 줄(`NavScroller`)은 `overflow-x: auto` 인데,
 * CSS 는 한 축이 visible 이 아니면 **다른 축도 auto 로 계산한다**. 즉 세로로도 스크롤 컨테이너라
 * 그 안의 팝오버는 줄 높이(약 40px)에서 잘린다. `overflow-y: visible` 을 덧붙여도 무시된다
 * (그 조합 자체가 auto 로 계산된다 — 스펙이 그렇다).
 *
 * 그래서 이 메뉴는 **body 로 포털**되고 좌표는 트리거의 뷰포트 좌표(`position: fixed`)로 받는다.
 * 위치는 호출부가 인라인 style 로 넘긴다 — 좌표마다 클래스를 새로 만들지 않기 위해서다.
 */
export const NavMenu = styled.div`
  position: fixed;
  z-index: 30;
  display: grid;
  gap: 2px;
  min-width: 12rem;
  padding: ${space[1]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  box-shadow: ${shadow.e2};
`;

export const NavMenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]};
  border-radius: ${radius.sm};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  /* 메뉴 안에서는 채움 pill 이 과하다 — 글자 굵기와 색으로만 현재 위치를 말한다. */
  &.active,
  &[aria-current='page'] {
    background: ${color.accentSubtle};
    color: ${color.accentText};
    font-weight: ${font.weight.bold};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
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
