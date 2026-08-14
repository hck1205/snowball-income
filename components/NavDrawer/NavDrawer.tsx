import type { LucideIcon } from 'lucide-react';
import { SideDrawer } from '@/components/common';
import { buildNavTree } from '@/components/PrimaryNav';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
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
 * 🔴 목적지는 `components/PrimaryNav` 의 `buildNavTree()` 에서 **가져다 쓴다**. 여기서 다시 적으면
 * 메뉴가 두 벌이 되어 한쪽만 갱신되는 날 조용히 갈린다 — 항목을 추가할 곳은 언제나 저쪽이다.
 * ⚠ 표시 조건(`isCommunityEnabled`·`isGoogleSheetsEnabled`)도 그 함수 안에 있다. 꺼진 배포에서는
 *   라우트 자체가 없어 죽은 링크가 되므로, 여기서 따로 거르지 않고 트리가 준 것만 그린다.
 *
 * ## 헤더의 일곱 칸이 여기서는 일곱 소제목이다
 * 헤더는 눌러야 펼쳐지지만 드로어는 처음부터 펴 둔다 — 순서는 트리 순서 그대로라 두 진입점이
 * 어긋나지 않는다(위 "묶음을 펼쳐 둔다" 참고).
 */
export default function NavDrawer({ id, isOpen, onClose }: NavDrawerProps) {
  const groups = buildNavTree();

  const renderLink = (to: string, label: string, Icon: LucideIcon) => (
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
          🔴 **헤더 메뉴와 같은 목록·같은 순서여야 한다**(2026-08-14 여정 재편). 두 진입점이 같은
             목적지를 다른 이름·다른 자리에 두면 사용자는 두 개의 메뉴 체계를 배워야 한다.
             그래서 항목을 여기서 손으로 적지 않고 트리를 **그대로 편다** — 종전에는 시뮬레이터·
             가계부·ETF·비교 넷을 여기서 따로 적고 있었고, 그래서 헤더가 바뀔 때마다 이 파일이
             조용히 낡았다.
        */}
        {groups.map((group) => (
          <Group key={group.label}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.items.map((item) => renderLink(item.to, item.label, item.Icon))}
          </Group>
        ))}
      </DrawerNav>
    </SideDrawer>
  );
}
