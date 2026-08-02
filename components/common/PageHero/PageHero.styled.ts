import styled from '@emotion/styled';
import {
  color,
  font,
  heroIconOpticalAlign,
  heroTitleFontSize,
  iconOpticalAlign,
  media,
  pageHue,
  pageHueMix,
  radius,
  space
} from '@/shared/styles';
import type { PageHeroTone } from './PageHero.types';

/**
 * 히어로 안쪽 여백.
 *
 * **아래 `HeroTitleAction` 의 절대 좌표가 이 값을 그대로 써야 한다.** 절대 배치의 기준은
 * `HeroRoot` 의 **패딩 박스**라서 `top/right: 0` 은 "여백 안쪽 맨 위"가 아니라 **카드의 모서리**,
 * 즉 `radius.xl`(20px) 로 둥근 구간에 앉는다. 그래서 40px 액션 버튼이 히어로의 둥근 모서리를
 * 가로질러 4.6px 삐져나와 있었다(2026-07-30 실측, ≤640px). 두 자리에 손으로 적으면 어긋나므로
 * 한 곳에서 파생한다.
 */
const HERO_PADDING = 'clamp(20px, 3vw, 32px)';

/**
 * 페이지 첫 화면. 전 페이지가 **같은 자리에서 같은 것**(무엇을 하는 화면인가 → 근거 → 액션)을 말하게 해
 * 사용자가 화면을 옮길 때 "어디를 봐야 하는지"를 다시 배우지 않게 한다.
 *
 * ✅ **히어로는 이제 이 한 벌뿐이다(2026-07-31 수렴).** 구 페이지 로컬 히어로 2벌
 * (`pages/Portfolio/PortfolioPage` · `pages/DividendCalendar/DividendCalendarPage` 이 각자 갖고 있던
 * `PageHero`/`HeroTitleRow`/`HeroIconBadge`/`HeroTitle`/`HeroLede`/`AsOfLine`)은 이 컴포넌트로
 * 흡수됐다 — 캘린더의 `HeroDisclaimer`(`role="note"`)는 아래 `HeroNotice` = `notice` 슬롯이 받는다.
 * **다시 복제하지 마라**: 같은 심볼명을 export 하는 로컬 히어로는 import 경로로만 구분돼
 * 심볼명 grep 이 여러 벌을 한꺼번에 잡는다(그게 3벌이 오래 살아남은 이유였다).
 *
 * ── 페이지 정체성 hue ──────────────────────────────────────────────────────────
 * 이전에는 세 화면의 히어로가 **같은 배경·같은 테두리**라 탭을 옮겨도 화면이 바뀐 느낌이 없었다.
 * 이제 히어로 크롬은 라우트가 발행하는 `--sb-page-hue`(`shared/hooks/usePageHue`)를 읽는다:
 * **①상단 4px 리본 ②아이콘 배지 ③메타 줄 밑줄 ④테두리** 네 곳. 배경(`gradientHero`)은 전 페이지
 * 공통으로 남겨 "같은 앱"을 유지하고, 색만 페이지마다 갈린다.
 *
 * 🔴 **hue 파생 면 위에 텍스트를 얹지 마라** — `color-mix` 결과는 대비 테스트가 못 보는 값이다.
 *    제목·리드·메타는 전부 검증된 토큰 면(히어로 배경) 위의 `text`/`text-secondary` 다.
 * 🔴 **hue 를 배지에 *솔리드*로 채우지 않는 이유**: hue 4종은 라이트/다크에서 명암이 **반대로**
 *    간다(라이트 accent-alt `#26a14f` vs 다크 `#6ee7a0`). 흰 글리프를 얹으면 다크에서 1.3:1 로
 *    사라진다. 그래서 "옅은 틴트 면 + hue 글리프" — 티커 상세의 `--tk-soft`/`--tk-text` 와 같은 처방.
 */
export const HeroRoot = styled.header<{ $tone: PageHeroTone }>`
  display: grid;
  gap: ${space[3]};
  /* 좁은 폭에서 titleAction 이 흐름에서 빠져 제목 줄 오른쪽에 붙는다 — 그 좌표 기준. */
  position: relative;
  /* 상단 리본이 둥근 모서리를 넘지 않게 자른다. position:fixed 자손(스티키 액션)은
     transform 조상이 없으므로 이 클리핑에 걸리지 않는다(2026-07-31 실측으로 확인). */
  overflow: hidden;
  padding: ${HERO_PADDING};
  /*
   * 테두리도 리본·배지와 **같은 축**(페이지 hue)이다. 예전에는 accent 고정이라 어느 화면에서나
   * 같은 색이었고, 그래서 "탭을 옮겨도 같은 화면"으로 읽혔다. 경계는 텍스트가 아니므로
   * hue 파생(color-mix)을 써도 대비 계약을 건드리지 않는다.
   */
  border: 1px solid ${pageHueMix(38, 'transparent')};
  border-radius: ${radius.xl};
  background: ${({ $tone }) => ($tone === 'gradient' ? color.gradientHero : color.surface)};
  min-width: 0;

  /* 페이지 얼굴색을 가장 크게 말하는 자리. 4px 은 구 로컬 히어로의 오로라 리본과 같은 두께다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: ${pageHue};
  }
`;

export const HeroTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HeroTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
  /* titleAction 이 이 줄의 **맨 오른쪽**까지 밀려나려면 그룹이 남는 폭을 가져야 한다. */
  flex: 1 1 auto;
`;

/**
 * 제목 **같은 줄**의 맨 오른쪽에 서는 작은 액션(아이콘 버튼 한 개 수준).
 *
 * `actions` 와 다른 점: `actions` 는 좁은 폭(mobileWide↓)에서 제목 아래로 내려가 전폭을 쓰지만,
 * 이 슬롯은 **어느 폭에서도 제목 줄에 남는다.** 넓은 화면에서는 결과적으로 `actions` 바로 옆에
 * 서므로 두 자리가 같아 보이고, 좁은 화면에서만 차이가 드러난다.
 */
export const HeroTitleAction = styled.div`
  display: flex;
  align-items: center;
  /*
   * 제목 줄에 같이 서므로 배지와 **같은 잉크 보정**을 받는다. 안 그러면 배지만 올라가고 이 슬롯은
   * 라인박스 중심에 남아, 제목 옆에서 3.1px 낮게 앉는다(2026-07-30 실측 @1280).
   */
  ${iconOpticalAlign('display', heroTitleFontSize)}

  /*
   * 좁은 폭에서 HeroTitleRow 가 column 이 되면 이 슬롯도 아래로 떨어진다 — 그러면 "제목 줄에
   * 남는다"는 존재 이유가 사라진다. 그래서 이 구간에서만 흐름에서 빼 **제목 줄 오른쪽**에 붙인다.
   * 좌표 기준은 HeroRoot(아래에서 position: relative 를 준다).
   *
   * top 은 제목 줄 높이의 중앙이 아니라 위쪽에 맞춘다 — 제목이 두 줄이 돼도 아이콘이 첫 줄 옆에
   * 남는 편이 읽기 흐름과 맞다(이 레포의 iconFirstLineAlign 과 같은 판단).
   *
   * 좌표는 0 이 아니라 히어로 여백만큼 들여야 한다 — 0 은 패딩 박스의 모서리(둥근 구간)라
   * 버튼이 카드의 라운드를 덮고 밖으로 삐져나온다. HERO_PADDING 주석 참고.
   */
  ${media.down('mobileWide')} {
    position: absolute;
    top: ${HERO_PADDING};
    right: ${HERO_PADDING};
    /* 이 구간에서는 제목 줄의 **중심**이 아니라 히어로 여백 위쪽에 맞춘다 — 잉크 보정은 중심
       정렬을 전제한 것이라 여기서는 버튼을 여백 밖으로 밀어낼 뿐이다. */
    transform: none;
  }
`;

/**
 * 장식 배지. 페이지 hue 를 입는 세 자리 중 하나다 — 글리프는 `aria-hidden` 이라 **비텍스트**이고,
 * 그래서 hue 파생 면을 써도 된다(위 HeroRoot 주석의 두 번째 🔴 참고).
 */
export const HeroIconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  background: ${pageHueMix(14)};
  border: 1px solid ${pageHueMix(38, 'transparent')};
  color: ${pageHue};
  ${heroIconOpticalAlign}
`;

/**
 * 제목. 레벨은 `titleAs` 로 바뀌어도 **크기는 이 규칙 하나**다.
 *
 * 📝 `font.display`(원본 Gmarket Sans)에는 400~700 사이 중간 굵기가 없어 **600/700/800 이 전부 같은
 *    굵기로 렌더된다** — 그래서 이 컴포넌트의 위계는 굵기가 아니라 **크기**로만 잡는다.
 *    헤딩 굵기가 카드 제목과 비슷해 보이는 것은 버그가 아니다(2026-07-28 확정, tokens.ts font.display 참고).
 */
export const HeroTitle = styled.h2`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.03em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 좁은 폭에서는 제목 아래로 내려가 **전폭**을 쓴다 — 320px 에서 제목과 같은 줄에 두면 둘 다 잘린다.
 */
export const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;

  /*
   * 넓은 폭에서는 제목과 같은 줄에 서므로 제목의 잉크 중심에 맞춘다(위 HeroTitleAction 과 같은 이유).
   *
   * 🔴 보정 transform 은 **자식에게** 건다 — 이 박스 자신에 걸면 그 순간 이 요소가
   * position:fixed 자손의 **컨테이닝 블록**이 된다(CSS Transforms L1, 이 레포의 backdrop-filter
   * 함정과 같은 부류). 시뮬레이터 히어로의 "투자 설정" 버튼은 스크롤 시 fixed 로 승격돼 헤더 아래에
   * 붙는데(useStickyHeroAction), 그 좌표가 뷰포트가 아니라 이 박스 기준이 되어 **화면 밖**으로
   * 나가 있었다(2026-07-31 실측 @1280: 버튼 left 2043px, 문서 가로폭 2149px — 스크롤한 상태에서만
   * 드러나는 가로 오버플로였다). 자식으로 옮기면 보이는 결과는 같고(모든 자식이 같은 만큼 올라간다)
   * 컨테이닝 블록만 사라진다.
   */
  > * {
    ${iconOpticalAlign('display', heroTitleFontSize)}
  }

  ${media.down('mobileWide')} {
    width: 100%;

    > * {
      /* 제목 아래로 내려가 전폭을 쓰는 구간 — 더 이상 제목 줄이 아니므로 보정을 되돌린다. */
      transform: none;
      flex: 1 1 auto;
      justify-content: center;
    }
  }
`;

export const HeroLede = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: clamp(${font.size.base}, 2vw, ${font.size.lg});
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/**
 * 히어로 안의 **고지·주의**(예: 캘린더의 "예상 지급일" 안내). 구
 * `DividendCalendarPage.styled.ts` 의 `HeroDisclaimer` 를 흡수한 자리다.
 * 경고 배너가 아니라 본문이므로 면·색으로 강조하지 않고 크기로만 리드 아래에 둔다
 * (`role="note"` 는 컴포넌트가 붙인다).
 */
export const HeroNotice = styled.p`
  margin: 0;
  width: 100%;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/**
 * 계산의 근거(기준일·환율). 숫자가 섞이므로 데이터 서체 + 자릿수 정렬.
 *
 * 페이지 hue 를 입는 세 번째 자리 — **글자 폭만큼의 밑줄**이다. 그래서 `justify-self: start`
 * (grid item 은 기본이 stretch 라 두면 밑줄이 히어로 전폭을 가로질러 구분선처럼 보인다).
 *
 * ⚠ **`p` 가 아니라 `div` 인 것은 의도다**(2026-08-01, 랜딩 트랙). `p` 의 콘텐츠 모델은 phrasing
 * content 뿐이라 이 슬롯에 목록·폼을 넣으면 **DOM 이 무효**가 된다(브라우저 파서는 `p` 를
 * 조기에 닫아 DOM 을 재구성한다). 그래서 법무 문서의 메타 목록은 `ul` 대신 `span` 으로 우회하고
 * 있었다(`LegalDocument.styled.ts` MetaList). 시각 결과는 완전히 동일하다 — 이 요소는 grid item
 * 이고 `margin: 0` 이라 `p` 기본 여백에 의존한 적이 없다.
 *
 * 🔴 그렇다고 **아무 덩어리나 담는 슬롯이 아니다.** 이 요소는 위의 밑줄·`justify-self: start`·
 * 데이터 서체를 항상 갖는다. 자식에서 `border-bottom: none` 으로 그것을 취소할 수 없고
 * (상속 속성이 아니다) 폭도 내용에 맞춰 줄어든다 — 랜딩이 검색 폼을 여기 넣었다가 두 증상을
 * 모두 겪고 히어로 **밖 형제**로 내렸다(2026-08-01). 근거 pages/Landing/LandingPage/LandingPage.styled.ts.
 */
export const HeroMeta = styled.div`
  margin: 0;
  justify-self: start;
  max-width: 100%;
  padding-bottom: ${space[1]};
  border-bottom: 2px solid ${pageHueMix(55, 'transparent')};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
    /*
   * 히어로 면(accent-subtle) 위라 'text-muted' 를 쓰지 않는다 — velog 다크에서 4.04:1 로
   * AA 미달이다(2026-07-31 실측). 위계는 크기(xs/sm)와 'text-secondary' 로 충분히 낮아진다.
   * 가드: shared/styles/contrast.test.ts 의 [text-muted, accent-subtle] 쌍.
   */
  color: ${color.textSecondary};
  ${font.numeric}
`;
