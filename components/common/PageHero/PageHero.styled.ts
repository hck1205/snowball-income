import styled from '@emotion/styled';
import {
  color,
  font,
  heroIconOpticalAlign,
  heroTitleFontSize,
  iconOpticalAlign,
  media,
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
 * 상단 4px 리본은 두지 않는다 — 그라디언트 배경 자체가 이미 시그니처라 장식이 겹친다.
 *
 * ⚠ **이 파일은 지금 "3벌째 히어로"다(2026-07-28 시점).** 같은 구조의 **페이지 로컬 히어로가 2벌 더
 *   살아 있다**:
 *     - `pages/Portfolio/PortfolioPage/PortfolioPage.styled.ts:17-31`
 *     - `pages/DividendCalendar/DividendCalendarPage/DividendCalendarPage.styled.ts:10-24`
 *   셋 다 `PageHero`·`HeroTitleRow`·`HeroIconBadge`·`HeroTitle`·`HeroLede` 라는 **같은 심볼명**을
 *   export 한다 — **import 경로로만 구분된다**. 심볼명으로 grep 하면 세 벌이 한꺼번에 걸린다.
 *
 *   **시각이 갈린다**: 공용(이 파일) = `gradientHero` 배경 + 상단 리본 없음 /
 *   로컬 2벌 = `brandSubtle` 배경 + `::before` 4px `gradientAurora` 리본.
 *   이관 전까지 시뮬레이터와 나머지 두 화면의 **첫인상이 다르다**(알려진 상태, 버그 아님).
 *
 *   단 **제목 크기와 아이콘 세로 정렬만은 3벌이 공유**한다(`shared/styles/heroTitleRow.ts`) —
 *   여기서 갈리면 화면을 옮길 때마다 같은 요소가 다른 위치에 있는 것으로 보인다.
 *
 *   **지금 이관하지 마라 — 10단계(전면 페이지 리모델링) 소관이다.**
 *   이관 설계 힌트: 캘린더의 `HeroDisclaimer`(`DividendCalendarPage.styled.ts:69`, `role="note"`)는
 *   **`notice?: ReactNode` 옵셔널 슬롯 1개**로 흡수 가능하다(2026-07-28 리뷰 판정) — 로컬 히어로를
 *   남겨둘 이유로 쓰지 마라.
 */
export const HeroRoot = styled.header<{ $tone: PageHeroTone }>`
  display: grid;
  gap: ${space[3]};
  /* 좁은 폭에서 titleAction 이 흐름에서 빠져 제목 줄 오른쪽에 붙는다 — 그 좌표 기준. */
  position: relative;
  padding: ${HERO_PADDING};
  /*
   * 테두리도 아이콘 배지와 **같은 축**이다(아래 HeroIconBadge 주석: "브랜드는 장식에서 물러난다").
   * 배지만 accent 이고 테두리는 brand 였을 때 같은 카드 안에서 두 축이 어긋나 보였다 —
   * 히어로는 누를 수 없는 표면이므로 크롬 전체를 accent 로 통일한다.
   */
  border: 1px solid ${color.accentBorder};
  border-radius: ${radius.xl};
  background: ${({ $tone }) => ($tone === 'gradient' ? color.gradientHero : color.surface)};
  min-width: 0;
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
 * 장식 배지. 브랜드 블루는 인터랙션(누를 수 있는 것)의 축이라 장식에서는 물러나고 accent 계열을 쓴다.
 */
export const HeroIconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  background: ${color.surface};
  border: 1px solid ${color.accentBorder};
  color: ${color.accentText};
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
  /* 넓은 폭에서는 제목과 같은 줄에 서므로 제목의 잉크 중심에 맞춘다(위 HeroTitleAction 과 같은 이유). */
  ${iconOpticalAlign('display', heroTitleFontSize)}

  ${media.down('mobileWide')} {
    width: 100%;
    /* 제목 아래로 내려가 전폭을 쓰는 구간 — 더 이상 제목 줄이 아니므로 보정을 되돌린다. */
    transform: none;

    > * {
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

/** 계산의 근거(기준일·환율). 숫자가 섞이므로 데이터 서체 + 자릿수 정렬. */
export const HeroMeta = styled.p`
  margin: 0;
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
