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
 */
export const pressable = `
  transition: scale var(--sb-motion-fast, 150ms) cubic-bezier(0.2, 0, 0, 1);

  &:active:not(:disabled):not([aria-disabled='true']) {
    scale: 0.96;
  }
`;

/**
 * 큰 면(카드·보드)용 약한 누름. 전체 폭 카드에 0.96 을 주면 화면이 출렁인다 —
 * 면적이 클수록 같은 배율이 더 크게 움직여 보이기 때문이다.
 */
export const pressableSubtle = `
  transition: scale var(--sb-motion-fast, 150ms) cubic-bezier(0.2, 0, 0, 1);

  &:active:not(:disabled):not([aria-disabled='true']) {
    scale: 0.99;
  }
`;
