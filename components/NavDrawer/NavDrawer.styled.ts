import styled from '@emotion/styled';
import { NavLink } from 'react-router-dom';
import { color, font, media, radius, space } from '@/shared/styles';

export const DrawerNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
  min-width: 0;
`;

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 묶음 이름("포트폴리오"·"캘린더"…).
 *
 * 🔴 헤더에서는 이 이름이 **누르면 열리는 메뉴**지만 드로어에서는 **그냥 소제목**이다. 좁은
 * 화면에서 한 번 더 눌러 펼치게 하면 목적지까지 두 번 눌러야 하고, 드로어는 세로로 길어도
 * 되는 자리라 접어 둘 이유가 없다.
 */
export const GroupLabel = styled.h3`
  margin: 0;
  padding: 0 ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
`;

/**
 * 목적지 한 줄.
 *
 * ⚠ 줄 전체가 누르는 자리다 — 좁은 화면에서 글자 폭만 대상이면 손가락이 자주 빗나간다
 * (같은 처방을 배당 캘린더의 "표로 보기" 줄에서 썼다).
 */
export const DrawerLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-height: 44px;
  padding: 0 ${space[2]};
  border-radius: ${radius.md};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }

  /*
   * 🔴 현재 위치는 **면 + 굵기 + 색** 셋으로 말한다. 색 하나로만 말하면 색각 이상에서 사라진다
   * (이 레포 공통 규율).
   */
  &.active {
    background: ${color.brandSubtle};
    color: ${color.brandText};
    font-weight: ${font.weight.bold};
  }

  svg {
    flex: none;
  }
`;

/** 링크 글자 — 길면 말줄임. 드로어 폭은 화면을 따라가므로 아주 좁은 기기에서 넘칠 수 있다. */
export const DrawerLinkLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 헤더의 드로어 여는 버튼.
 *
 * 🔴 **좁은 폭에서만 보인다.** 넓은 폭에는 헤더에 메뉴 줄이 그대로 서 있어서, 같은 목적지로
 * 가는 길이 둘이 되면 어느 쪽이 정본인지 알 수 없어진다.
 */
export const DrawerToggle = styled.button`
  /*
   * 🔴 **로고 왼쪽의 자기 열**에 선다(2026-08-09 사용자 신고로 옮겼다).
   *
   * 종전에는 grid-area: logo 로 로고와 같은 칸을 쓰면서 align-self: end 로 아래에 붙었다.
   * 넓은 폭에서는 그 칸이 두 줄을 가로질러 세로로 포개졌지만, 이 버튼이 보이는 구간(≤640)에서는
   * 로고가 브랜드 줄로 들어와 **한 칸이 되면서 둘이 겹쳤다.**
   * 그래서 헤더 격자에 menu 열을 하나 만들고 여기로 왔다(shared/styles/headerSurface.ts).
   *
   * ⚠ 이 주석에 **백틱을 쓰지 마라.** 여기는 Emotion 템플릿 리터럴 안이라 백틱 하나가 문자열을
   *   끊는다 — 실제로 이 파일에서 그렇게 깨뜨렸다(2026-08-09).
   *
   * ⚠ 아랫줄로 내리지 않은 이유: 헤더가 65px → 113px 이 된다(headerprobe 실측, 390px).
   * ⚠ 로고 슬롯 안에 넣지 않는다. 그건 홈으로 가는 링크라 링크 안에 버튼을 중첩하게 된다.
   */
  grid-area: menu;
  align-self: center;
  justify-self: start;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  /*
   * 넓은 폭에는 헤더에 메뉴 줄이 그대로 서 있다 — 길이 둘이면 어느 쪽이 정본인지 알 수 없어진다.
   *
   * 🔴 경계는 **mobileWide(≤640)** 다(2026-08-07 사용자 지시: 로고가 작아지는 폭에 맞춰라).
   * 그 폭이 헤더가 성격을 바꾸는 지점이다 — 로고가 두 줄을 가로지르길 그만두고 브랜드 줄
   * 안으로 들어오면서 88px → 40px 로 줄어든다(AppHeader.styled 의 BrandHippo). 헤더가
   * "한 줄짜리 모바일 헤더"가 되는 그 순간이 메뉴도 서랍으로 접힐 순간이라, 두 전환을 같은
   * 값에 묶는다. 따로 두면 어중간한 폭에서 큰 로고 옆에 서랍 버튼이 서는 구간이 생긴다.
   */
  ${media.up('mobileWide')} {
    display: none;
  }
`;
