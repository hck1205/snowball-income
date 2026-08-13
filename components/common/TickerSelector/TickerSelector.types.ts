/**
 * 종목 선택 UI 의 타입.
 *
 * 🔴 이 컴포넌트는 **비교 유니버스를 모른다.** 어떤 티커가 비교 가능한지, 주소를 어떻게 만드는지는
 * 전부 호출부(`pages/Ticker/hooks` 의 `useCompareSelection`)가 정해 props 로 넘긴다.
 * 이유는 번들이다 — 이 폴더는 `@/components/common` 배럴에 실리는데, 배럴이 프리셋 유니버스
 * 218종을 물면 그 배럴을 import 하는 **모든 화면**이 유니버스를 함께 싣는다
 * (현재 `components/common` 안에 `shared/constants/presets` 를 import 하는 파일은 하나도 없다 —
 * 그 경계를 여기서 깨지 않는다).
 */

export type TickerSelectorCheckboxProps = {
  /** 표시용 티커. 라벨과 `aria-label` 에 그대로 쓰인다. */
  ticker: string;
  checked: boolean;
  /**
   * 비교 표가 열 수 없는 종목이면 `true`.
   *
   * 🔴 **숨기지 않고 끈다.** 무배당·미수록 종목의 체크박스를 아예 안 그리면 표의 첫 열이 들쭉날쭉해져
   * 눈으로 훑기 어렵고, "왜 어떤 줄만 고를 수 있지?"라는 질문에 화면이 답하지 못한다.
   */
  disabled?: boolean;
  /** 끈 이유. `title` 로 붙어 마우스를 올리면 읽힌다. */
  disabledReason?: string;
  onToggle: (ticker: string) => void;
};

export type TickerSelectorUnknownProps = {
  /** 왜 체크박스가 없는지. `title` 로 붙어 마우스를 올리면 읽힌다. */
  reason: string;
};

export type TickerSelectorBarProps = {
  /** 고른 순서 그대로. 바가 이 순서로 칩을 그린다. */
  selected: readonly string[];
  /** 상한. 문구("최대 N개")에만 쓰인다 — 상한 자체를 강제하는 건 선택을 더하는 쪽이다. */
  max: number;
  /** 비교를 열 수 있는 최소 개수. 못 채웠으면 CTA 대신 몇 개가 더 필요한지 알린다. */
  min: number;
  /** `/ticker/compare?t=...&from=...`. 호출부가 만든다. */
  href: string;
  onRemove: (ticker: string) => void;
  onClear: () => void;
};
