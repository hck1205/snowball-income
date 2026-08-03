import styled from '@emotion/styled';
import {
  appHeaderHeight,
  color,
  font,
  hiddenScrollbar,
  media,
  motion,
  radius,
  space,
  subtleScrollbar
} from '@/shared/styles';

/**
 * 목차의 모양. **한 벌의 DOM 이 두 개의 형태로 산다.**
 *
 *  - ~1024px: 히어로 바로 아래 **가로 스크롤 칩 줄**. 세로로 열네 줄을 쌓으면 본문이 화면 두 개
 *    아래로 밀려나 "문서를 열었는데 문서가 안 보이는" 화면이 된다.
 *  - 1024px~: 왼쪽 **고정 레일**. 헤더 아래에 붙어 스크롤을 따라오고, 지금 읽는 조항을 표시한다.
 *
 * 목록을 두 벌 그리지 않은 이유는 접근성이다 — 같은 링크가 DOM 에 두 번 있으면 스크린리더 사용자는
 * 열네 개가 아니라 스물여덟 개를 지나쳐야 한다(하나는 CSS 로 숨겨도 읽히는 쪽이 어느 쪽인지
 * 화면 폭에 따라 갈린다).
 *
 * 🔴 활성 표시에 **면(배경)을 쓰지 않는다.** 레일 폭이 236px 라 배경을 깔면 그것 자체가 화면의
 *    색 면 하나로 계산된다(tintscan 하한 180px × 8px). 대신 ①왼쪽 2px 막대 ②굵기 ③글자색
 *    세 가지로 말한다 — 회색조에서도 굵기와 막대로 읽힌다.
 */

export const TocRoot = styled.nav`
  min-width: 0;

  ${media.up('headerStack')} {
    position: sticky;
    top: calc(${appHeaderHeight} + 20px);
    max-height: calc(100vh - ${appHeaderHeight} - 48px);
    overflow-y: auto;
    padding-right: ${space[2]};
    ${subtleScrollbar}
  }
`;

export const TocTitle = styled.p`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  margin: 0 0 ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textSecondary};
`;

/** 조항 개수. 문서의 크기를 미리 알려 주는 값이라 숫자 서체로 낸다. */
export const TocCount = styled.span`
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0;
  color: ${color.textMuted};
  ${font.numeric}
`;

export const TocList = styled.ul`
  display: flex;
  gap: ${space[2]};
  margin: 0;
  padding: 0 0 ${space[1]};
  list-style: none;
  overflow-x: auto;
  ${hiddenScrollbar}

  ${media.up('headerStack')} {
    display: grid;
    gap: 2px;
    padding: 0;
    overflow: visible;
  }
`;

export const TocItem = styled.li`
  flex: 0 0 auto;
  min-width: 0;
`;

export const TocLink = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${({ $active }) => ($active ? color.brandBorder : color.border)};
  border-radius: ${radius.pill};
  white-space: nowrap;
  text-decoration: none;
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  transition: color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
    border-color: ${color.borderStrong};
  }

  ${media.up('headerStack')} {
    /* 레일에서는 알약이 아니라 **왼쪽 막대가 있는 줄**이다 — 알약 열넷은 레일을 계단으로 만든다. */
    border: none;
    border-left: 2px solid ${({ $active }) => ($active ? color.brand : 'transparent')};
    border-radius: 0 ${radius.sm} ${radius.sm} 0;
    padding: ${space[2]} ${space[3]};
    white-space: normal;
    word-break: keep-all;
    line-height: ${font.leading.snug};

    &:hover {
      border-left-color: ${color.borderStrong};
    }
  }
`;

/** 조항 번호. 장식이 아니라 본문 번호 기둥과 같은 축이므로 같은 숫자 서체로 낸다. */
export const TocOrdinal = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  ${font.numeric}

  ${media.up('headerStack')} {
    min-width: 34px;
  }
`;

export const TocLabel = styled.span`
  min-width: 0;
`;
