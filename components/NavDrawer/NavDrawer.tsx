import { LineChart } from 'lucide-react';
import { SideDrawer } from '@/components/common';
import {
  CALENDAR_GROUP_ITEMS,
  COMMUNITY_GROUP_ITEMS,
  DIVIDEND_LIST_GROUP_ITEMS,
  MARKET_GROUP_ITEMS,
  PERSONAL_GROUP_ITEMS,
  PORTFOLIO_GROUP_ITEMS,
  TICKER_GROUP_ITEMS
} from '@/components/PrimaryNav';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { ICON } from '@/shared/styles';
import type { NavDrawerProps } from './NavDrawer.types';
import { DrawerLink, DrawerLinkLabel, DrawerNav, Group, GroupLabel } from './NavDrawer.styled';

const n = COMMUNITY_COPY.nav;

/**
 * 좁은 폭의 좌측 메뉴 드로어(2026-08-07 사용자 지시).
 *
 * ## 왜 드로어인가
 * 헤더의 메뉴 줄은 항목이 여덟이라 좁은 폭에서 **가로 스크롤**로 흡수된다. 그런데 가로로 숨은
 * 항목은 사용자에게 아무 신호도 주지 않는다 — 스크롤 막대가 뜨기 전에는 더 있다는 사실 자체가
 * 안 보인다(이 레포 pitfalls 2026-07-31 실측이 같은 말을 한다). 드로어는 열면 전부 보인다.
 *
 * ## 묶음을 펼쳐 둔다
 * 헤더에서 "포트폴리오"·"캘린더"는 눌러서 여는 메뉴지만, 여기서는 **소제목 + 목록**이다.
 * 좁은 화면에서 한 번 더 눌러 펼치게 하면 목적지까지 두 번 눌러야 한다. 드로어는 세로로 길어도
 * 되는 자리라 접어 둘 이유가 없다.
 *
 * ## 목록의 출처는 하나다
 * 🔴 목적지 배열은 `components/PrimaryNav` 에서 **가져다 쓴다**. 여기서 다시 적으면 메뉴가 두
 * 벌이 되어 한쪽만 갱신되는 날 조용히 갈린다 — 항목을 추가할 곳은 언제나 저쪽이다.
 * ⚠ 같은 이유로 표시 조건(`isCommunityEnabled`·`isGoogleSheetsEnabled`)도 저쪽과 같은 값을 본다.
 *   꺼진 배포에서는 라우트 자체가 없어 죽은 링크가 된다.
 */
export default function NavDrawer({ id, isOpen, onClose }: NavDrawerProps) {
  /* 가계부는 라우트가 없는 배포가 있다 — 헤더와 **같은 조건**으로 거른다(PERSONAL_GROUP_ITEMS 주석). */
  const personalItems = PERSONAL_GROUP_ITEMS.filter((item) => !item.sheetsOnly || isGoogleSheetsEnabled);
  const portfolioItems = PORTFOLIO_GROUP_ITEMS.filter(
    (item) => !item.communityOnly || isCommunityEnabled
  );

  const renderLink = (to: string, label: string, Icon: typeof LineChart) => (
    /* 🔴 누르면 닫는다 — 열린 채로 두면 이동한 화면이 드로어에 가려 "아무 일도 안 일어난" 것처럼 보인다. */
    <DrawerLink key={to} to={to} end={to === SIMULATOR_PATH} onClick={onClose}>
      <Icon size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
      <DrawerLinkLabel>{label}</DrawerLinkLabel>
    </DrawerLink>
  );

  return (
    <SideDrawer
      id={id}
      side="left"
      isOpen={isOpen}
      title={n.drawerTitle}
      closeLabel={n.drawerClose}
      onClose={onClose}
    >
      <DrawerNav aria-label={n.primaryLabel}>
        {/*
          🔴 **헤더 메뉴와 같은 묶음·같은 순서여야 한다**(2026-08-09 대개편). 두 진입점이 같은
             목적지를 다른 이름·다른 자리에 두면 사용자는 두 개의 메뉴 체계를 배워야 한다.
             그래서 항목을 여기서 손으로 적지 않고 PrimaryNav 의 상수를 **그대로 가져다 쓴다** —
             종전에는 시뮬레이터·가계부·ETF·비교 넷을 여기서 따로 적고 있었고, 그래서 헤더가
             바뀔 때마다 이 파일이 조용히 낡았다.
        */}
        <Group>
          <GroupLabel>{n.personalGroup}</GroupLabel>
          {personalItems.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>

        <Group>
          <GroupLabel>{n.portfolioGroup}</GroupLabel>
          {portfolioItems.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>

        <Group>
          <GroupLabel>{n.marketGroup}</GroupLabel>
          {MARKET_GROUP_ITEMS.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>

        <Group>
          <GroupLabel>{n.calendarGroup}</GroupLabel>
          {CALENDAR_GROUP_ITEMS.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>

        <Group>
          <GroupLabel>{n.dividendListGroup}</GroupLabel>
          {DIVIDEND_LIST_GROUP_ITEMS.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>

        {isCommunityEnabled ? (
          <Group>
            <GroupLabel>{n.communityGroup}</GroupLabel>
            {COMMUNITY_GROUP_ITEMS.map((item) => renderLink(item.to, item.label, item.Icon))}
          </Group>
        ) : null}

        <Group>
          <GroupLabel>{n.tickerGroup}</GroupLabel>
          {TICKER_GROUP_ITEMS.map((item) => renderLink(item.to, item.label, item.Icon))}
        </Group>
      </DrawerNav>
    </SideDrawer>
  );
}
