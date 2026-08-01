/**
 * **토글되는 아이콘의 등장** — 한 줄로 얹는 공용 믹스인.
 *
 * 상태가 바뀌며 글리프가 갈리는 자리(선택 ✓ · 설치됨 · 목표 달성 체크)에서, 새 아이콘이
 * 아무 예고 없이 **딱 나타나면** 사용자는 "무엇이 바뀌었나"를 눈으로 되짚어야 한다.
 * 작게·흐리게 시작해 제자리로 오는 0.15초가 시선을 그 자리로 데려온다.
 *
 * 값(`scale .25 → 1` · `opacity 0 → 1` · `blur 4px → 0`)은 **아이콘 전용**이다.
 * 패널·팝오버에는 쓰지 마라 — 큰 면이 0.25에서 자라면 화면이 출렁인다(면은 0.9~0.97에서 시작).
 *
 * `transform: scale()` 이 아니라 **독립 `scale` 속성**을 쓰는 이유는 `pressable` 과 같다:
 * 이미 `transform` 을 위치잡기에 쓰는 요소에도 그대로 얹히기 때문이다.
 *
 * ⚠ 애니메이션은 **요소가 새로 마운트될 때만** 돈다. 같은 글리프가 자리만 지키는 리렌더에서는
 *   재생되지 않는다(React 가 DOM 노드를 재사용한다) — 그래서 "토글될 때 한 번"이 저절로 성립한다.
 *
 * ⚠ **고빈도 요소에는 쓰지 마라.** 클라우드 저장 배지처럼 편집 중 몇 초마다 상태가 도는 아이콘에
 *   얹으면 하루에 수백 번 깜빡이는 장식이 된다(§4.C-6 금지 항목).
 *
 * reduced-motion 에서는 아예 선언되지 않는다 — 아이콘은 **모양 자체가 정적 단서**라 되찾을 것이 없다.
 * (되찾아야 하는 것은 "아직 일하는 중"을 말하는 스피너뿐이다 — `test/shared/reducedMotionCues.test.ts`.)
 */
export const iconSwapIn = `
  @media (prefers-reduced-motion: no-preference) {
    animation: sb-icon-swap-in var(--sb-motion-fast, 150ms) cubic-bezier(0.2, 0, 0, 1);

    @keyframes sb-icon-swap-in {
      from {
        scale: 0.25;
        opacity: 0;
        filter: blur(4px);
      }
    }
  }
`;
