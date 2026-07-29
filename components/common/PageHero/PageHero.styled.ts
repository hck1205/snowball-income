import styled from '@emotion/styled';
import {
  color,
  font,
  heroIconOpticalAlign,
  heroTitleFontSize,
  media,
  radius,
  space
} from '@/shared/styles';
import type { PageHeroTone } from './PageHero.types';

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
  padding: clamp(20px, 3vw, 32px);
  border: 1px solid ${color.brandBorder};
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
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    width: 100%;

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
  color: ${color.textMuted};
  ${font.numeric}
`;
