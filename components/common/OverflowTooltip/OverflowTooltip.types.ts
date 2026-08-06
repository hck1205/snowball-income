import type { ReactElement } from 'react';

export type OverflowTooltipProps = {
  /**
   * 전체 문자열. 화면에는 이 값이 **그대로** 그려지고(줄임은 CSS 가 한다),
   * 실제로 잘렸을 때만 같은 값이 툴팁 내용이 된다.
   */
  text: string;
  /**
   * 텍스트를 그리는 단일 요소. `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
   * 은 **이 요소가** 갖는다 — 여기서는 자식(text)·측정용 ref·잘렸을 때의 `tabIndex` 만 주입한다.
   * (그래서 호출부는 `<AgendaName />` 처럼 빈 요소를 넘긴다.)
   *
   * 🔴 **호출자 계약**: 이 요소의 상자 폭은 툴팁으로 감싸든 안 감싸든 같아야 한다.
   * 감싸면 `Tooltip` 의 앵커 span 이 한 겹 끼는데(`flex-grow: 0` 인 inline-flex),
   * 그 앵커가 폭을 바꾸면 잘림 판정이 자기 결과를 뒤집어 **감쌈↔풂이 반복**된다.
   * 폭을 고정하는 슬롯(`AgendaNameSlot`) 안에 두는 것이 그 계약을 지키는 방법이다.
   */
  children: ReactElement;
};
