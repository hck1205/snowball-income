import { Fragment, useId } from 'react';
import { HintText } from '@/components/common';
import type { LedgerViewTabsProps } from './LedgerViewTabs.types';
import { TabButton, TabDescription, TabDivider, TabList, TabsRoot } from './LedgerViewTabs.styled';

/**
 * 화면 탭바 — 시트의 네 입력 탭(`가계부`·`자산`·`투자`·`분류 규칙`)을 앱에서도 탭으로.
 *
 * ## 🔴 이 컴포넌트는 `LedgerTabPicker` 와 다른 것이다
 *
 * `LedgerTabPicker` 는 **사용자 스프레드시트의 워크시트**를 고른다(1~20+개, 네이티브 셀렉트,
 * "가로 탭바로 바꾸지 마라"). 여기는 앱이 아는 **네 가지 관심사**를 전환한다 — 개수가 넷으로
 * 닫혀 있어 좁은 폭에서도 전부 보이고, 스크롤 뒤로 숨는 항목이 없다. 근거 전문은
 * `pages/Ledger/utils/ledgerViewTabs.ts` 머리말.
 *
 * ## 접근성
 *
 * `role="tablist"` / `role="tab"` 을 쓴다. 각 탭이 아래 패널을 가리키므로 `aria-controls` 로 잇고,
 * 고른 탭은 `aria-selected` 로 말한다 — 색과 굵기만으로는 보조기기가 알 수 없다.
 *
 * 🔴 **무음 비활성 금지**: 막힌 탭은 `disabled` 지만 사유가 아래에 문장으로 서고,
 * `aria-describedby` 로 그것을 가리킨다(`LedgerMappingCard`·`LedgerTabPicker` 와 같은 처방).
 * 사유는 **고른 탭이 막혔을 때만** 그리지 않는다 — 막힌 탭을 누르려는 순간에 이미 보여야 하므로,
 * 막힌 탭이 하나라도 있으면 그 사유를 함께 세운다.
 */
export default function LedgerViewTabs({ tabs, selected, onSelect }: LedgerViewTabsProps) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const reasonId = `${baseId}-reason`;

  const current = tabs.find((tab) => tab.id === selected);
  /*
   * 막힌 탭들의 사유는 **하나로 접는다.** 세 탭이 같은 이유로 막히므로(앱 시트가 아니다)
   * 세 문장을 나란히 세우면 같은 말이 세 번 된다.
   */
  const blockedReason = tabs.find((tab) => !tab.isAvailable)?.unavailableReason;

  return (
    <TabsRoot>
      <TabList role="tablist" aria-label="가계부 탭">
        {tabs.map((tab, index) => (
          <Fragment key={tab.id}>
            {/*
              🔴 **적는 탭과 보는 탭 사이에 칸막이**를 세운다(2026-08-09 사용자 지적).
                 앞의 넷은 시트의 탭과 1:1 이라 적는 곳이고, 한눈에 보기는 시트에 없는 보는 곳이다.
              ⚠ `aria-hidden` 이다 — 보조기기에는 아래 각 탭의 이름만 읽히면 되고, 칸막이는
                시각적 구획일 뿐이라 낭독되면 소음이다.
            */}
            {index > 0 && tabs[index - 1].role !== tab.role ? <TabDivider aria-hidden /> : null}
            <TabButton
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={tab.id === selected}
              aria-controls={panelId}
              data-selected={tab.id === selected}
              data-role={tab.role}
              disabled={!tab.isAvailable}
              aria-describedby={tab.isAvailable ? undefined : reasonId}
              onClick={() => onSelect(tab.id)}
            >
              {tab.label}
            </TabButton>
          </Fragment>
        ))}
      </TabList>

      {current ? <TabDescription>{current.description}</TabDescription> : null}

      {/* 🔴 막힌 탭이 있으면 사유가 언제나 함께 선다 — 누르기 전에 알아야 한다. */}
      {blockedReason ? <HintText id={reasonId}>{blockedReason}</HintText> : null}
    </TabsRoot>
  );
}
