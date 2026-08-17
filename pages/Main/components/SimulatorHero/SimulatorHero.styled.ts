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
 * 히어로 액션 줄에서 **캡처 버튼이 앉는 자리**. 설정 버튼 **왼쪽**에 선다
 * (2026-08-17 사용자 지시로 둘의 좌우를 맞바꿨다 — 그전에는 오른쪽이었다).
 *
 * 🔴 `SettingsSlot` **바깥**에 두는 것이 요점이다 — 그 슬롯은 스크롤 시 안쪽 버튼을
 * `position: fixed` 로 승격시킨다. 캡처 버튼에는 그 고정을 걸지 않는다(사용자 지시 2026-07-29).
 * 그래서 스크롤하면 톱니 아이콘만 헤더 아래에 남고 캡처 버튼은 히어로와 함께 올라간다.
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

    /*
     * 🔴 **우측 고정 + 고유 폭**(2026-08-17 사용자 지시: "sticky 가 될 때 아이콘만 보여주고 맨우측에").
     * ⚠ 이 주석에 **백틱을 쓰지 마라** — Emotion 템플릿 리터럴 안이라 백틱 하나가 문자열을 끊는다.
     *
     * 붙는 순간 버튼이 아이콘만 남아(SettingsEntryButton 의 iconOnly) 106px → 40px 로 좁아진다.
     * 그래서 left + --pin-width 를 쓰면 안 된다 — 넓은 자리에 아이콘이 왼쪽 정렬로 남아 콘텐츠
     * 우측 끝선에서 66px 안쪽으로 들어오고, 같은 줄에 고정되는 시나리오 탭 바의 끝선과 어긋난다.
     * 우측을 못 박고 폭은 **Button 이 정한 정사각 크기**에 맡긴다(여기서 width 를 건드리면 패딩 0
     * 아이콘 버튼이 글리프 폭까지 쪼그라든다).
     * ⚠ 슬롯(부모)은 여전히 --pin-width / --pin-height 로 **흐름상의 자리를 그대로 붙들고 있다**
     *   (위 블록) — 그게 레이아웃 시프트 0 의 조건이고, 버튼이 좁아지는 것과는 별개다.
     *
     * 🔴 선택자를 && 로 올린 것이 핵심이다(2026-08-17 실측). Button 은 자기 클래스에
     *    position: relative 를 갖고, iconOnly 가 켜지는 순간 **새 클래스가 스타일시트 뒤쪽에
     *    삽입**된다. 단일 클래스끼리는 특이도가 같아 뒤에 온 쪽이 이기므로, 평범한 자식 선택자로는
     *    position: fixed 가 relative 에 덮여 버튼이 흐름에 남는다(실측: top/right 는 먹었는데
     *    position 만 relative — 그래서 "고정이 안 된다"로 보였다).
     */
    && > * {
      position: fixed;
      top: var(--pin-top);
      right: var(--pin-right);
      z-index: ${zIndex.stickyAction};
    }
  `
      : ''}
`;
