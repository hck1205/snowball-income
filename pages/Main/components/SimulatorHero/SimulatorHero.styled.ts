import styled from '@emotion/styled';
import { zIndex } from '@/shared/styles';

/**
 * 히어로 제목 우측의 설정 버튼이 앉는 **자리(슬롯)**.
 *
 * 평상시에는 아무것도 하지 않는 투명한 래퍼다. 스크롤로 히어로가 헤더 위로 올라가면
 * (`useStickyHeroAction`) 안쪽 버튼만 `position: fixed` 로 승격되어 헤더 바로 아래에 머문다 —
 * **같은 버튼 하나**이고, 슬롯이 그 순간의 크기를 그대로 붙들고 있어 **레이아웃 시프트가 없다**.
 *
 * 좌표(`--pin-*`)는 훅이 흐름상의 자리에서 실측해 넣는다. CSS 의 `100vw` 계산은 스크롤바 폭만큼
 * 어긋나 데스크톱에서 콘텐츠 우측 끝선과 안 맞는다.
 *
 * `HeroActions` 는 좁은 폭(mobileWide↓)에서 자식을 전폭으로 늘린다 — 그 규칙이 버튼까지 닿도록
 * 슬롯도 같은 flex 규칙을 그대로 넘겨준다(래퍼가 생겼다고 모바일 모양이 달라지면 안 된다).
 *
 * 층위는 `zIndex.stickyAction`(10): 결과 카드 위 · 헤더(30)와 드로어(55~60) 아래. 드로어가 열리면
 * 드로어가 이 버튼을 덮는다. 전환 애니메이션은 두지 않는다(`prefers-reduced-motion` 이 볼 것이 없다).
 */
export const SettingsSlot = styled.div<{ $pinned: boolean }>`
  display: flex;
  min-width: 0;

  > * {
    flex: 1 1 auto;
  }

  ${({ $pinned }) =>
    $pinned
      ? `
    width: var(--pin-width);
    height: var(--pin-height);

    > * {
      position: fixed;
      top: var(--pin-top);
      left: var(--pin-left);
      width: var(--pin-width);
      z-index: ${zIndex.stickyAction};
    }
  `
      : ''}
`;
