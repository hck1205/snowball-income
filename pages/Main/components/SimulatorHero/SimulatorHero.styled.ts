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
/**
 * 히어로 액션 줄에서 **캡처 버튼이 앉는 자리**. 설정 버튼 오른쪽에 선다.
 *
 * 🔴 `SettingsSlot` **바깥**에 두는 것이 요점이다 — 그 슬롯은 스크롤 시 안쪽 버튼을
 * `position: fixed` 로 승격시킨다. 캡처 버튼에는 그 고정을 걸지 않는다(사용자 지시 2026-07-29).
 *
 * `&&&` 로 특이도를 올리는 이유: 공용 `HeroActions` 가 좁은 폭에서 `> * { flex: 1 1 auto }` 로
 * 자식을 전폭으로 늘린다. 설정 버튼은 그래야 맞지만(주 CTA), 아이콘 하나짜리 캡처 버튼까지
 * 화면 폭만큼 늘어나면 어색하다 — 여기만 고유 폭을 지킨다.
 */
export const CaptureAction = styled.div`
  display: flex;
  align-items: center;

  &&& {
    flex: 0 0 auto;
  }
`;

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

    /*
     * 🔴 붙어 있는 동안에는 이 슬롯의 transform 을 없앤다. 히어로 액션 줄(HeroActions)이 자식에게
     * 거는 제목 잉크 보정 translateY(-3px) 이 남아 있으면, **이 슬롯이 fixed 자손의 컨테이닝
     * 블록**이 되어 아래 좌표가 뷰포트가 아니라 이 박스 기준으로 해석된다
     * (2026-07-31 실측 @1280: 버튼이 화면 밖 left 2043px, 문서 가로폭 2149px — 스크롤해야만
     * 드러나는 가로 오버플로였다). 특이도를 && 로 올려 HeroActions 의 자식 규칙을 확실히 이긴다.
     */
    && {
      transform: none;
    }

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
