/**
 * 눌리는 느낌 — 한 줄로 얹는 공용 믹스인.
 *
 * 왜 필요한가 (2026-07-30 실측)
 * ---------------------------------------------------------------------------
 * 손으로 만든 누를 수 있는 요소 **약 77개 중 6개**만 `:active` 를 갖고 있었다. 나머지는 피드백이
 * hover 색뿐인데, **터치에서는 손가락이 그 색을 덮는다.** 즉 모바일에서 이 앱은 눌렀다는 신호를
 * 사실상 주지 않았다. 공용 `Button` 도 `translateY(1px)` 뿐이었고 그나마 `transition` 목록에
 * `transform` 이 없어 **중간에 되돌릴 수 없는 스냅**이었다(누르다 말면 뚝 끊긴다).
 *
 * 왜 `transform: scale()` 이 아니라 `scale:` 인가
 * ---------------------------------------------------------------------------
 * 이 믹스인을 얹고 싶은 컨트롤 중 여럿이 **이미 `transform` 을 위치잡기에 쓰고 있다**
 * (`translateY(-50%)` 등 — ScenarioTabs·TickerPicker·Toggle·RangeSlider). `transform: scale()` 로
 * 쓰면 그 요소들에는 그냥 못 얹는다(덮어써서 위치가 깨진다). 독립 `scale` 속성은 `transform` 과
 * 따로 합성되므로 **어디에든 그대로 얹힌다.**
 *
 * 값이 0.96 인 이유: 0.95 미만은 과장돼 보인다. 이 값은 고정이다.
 *
 * ⚠ **연속 제스처에는 쓰지 마라.** 드래그 손잡이(RangeSlider thumb)를 누를 때 키우거나 줄이면
 * 시각 중심이 손가락에서 떠나 1:1 대응이 깨진다. 누름은 **불연속 동작**에만.
 *
 * ⚠ reduced-motion 은 전역 리셋이 처리한다(`globalStyles.ts` 가 `transition-duration` 을
 * 0.01ms 로 덮는다) — 즉 축소는 남고 애니메이션만 사라진다. 의도한 대로다.
 *
 * 🔴 왜 이 믹스인이 `transition` 을 선언하지 않는가 (2026-07-31 실측)
 * ---------------------------------------------------------------------------
 * 처음엔 믹스인 안에 `transition: scale …` 을 넣었다. 그런데 `transition` 은 **단축 속성**이라
 * 뒤에 오는 선언이 앞의 것을 **통째로 덮는다** — 소비처가 자기 `transition` 을 먼저 쓰고
 * 그 뒤에 이 믹스인을 얹으면 **색·테두리·그림자 전환이 전부 사라진다.**
 * 실측: 헤더 '글쓰기' 버튼의 computed `transition-property` 가 `scale` **하나뿐**이었다.
 * 공용 `Button`·`Chip`·`TickerPicker`·`PortfolioPresetBoard` 네 곳이 그 상태였다 —
 * 즉 가장 많이 눌리는 컨트롤들의 hover 가 즉시 스냅으로 죽어 있었고, 소스만 읽으면
 * 두 선언이 다 보이기 때문에 리뷰로는 잡히지 않았다.
 *
 * 그래서 **전환 목록의 소유권을 컴포넌트 한 곳으로 모은다.** 믹스인은 "눌렀을 때 무엇이
 * 일어나는가"만 말하고, 애니메이션 여부는 소비처가 자기 `transition` 에 `${pressTransition}`
 * 을 끼워 선언한다. 순서에 의존하지 않으므로 얹는 위치가 어디든 안전하다.
 * 가드: `test/shared/pressTransition.test.ts`
 */

/**
 * 소비처의 `transition` 목록에 끼워 넣는 조각.
 *
 * 토큰(`motion.fast`)이 아니라 CSS 변수를 직접 쓰는 이유는 이 파일이 `tokens` 를 import 하지
 * 않기 때문이다 — 스타일 유틸이 토큰 그래프에 얽히지 않게 유지한다.
 *
 * 사용: `transition: background-color …, ${pressTransition};`
 */
export const pressTransition = 'scale var(--sb-motion-fast, 150ms) cubic-bezier(0.2, 0, 0, 1)';

export const pressable = `
  &:active:not(:disabled):not([aria-disabled='true']) {
    scale: 0.96;
  }
`;

/**
 * 큰 면(카드·보드)용 약한 누름. 전체 폭 카드에 0.96 을 주면 화면이 출렁인다 —
 * 면적이 클수록 같은 배율이 더 크게 움직여 보이기 때문이다.
 */
export const pressableSubtle = `
  &:active:not(:disabled):not([aria-disabled='true']) {
    scale: 0.99;
  }
`;
