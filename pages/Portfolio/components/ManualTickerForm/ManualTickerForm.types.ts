export type ManualTickerSubmitInput = {
  /** 대문자로 정규화된 심볼. */
  ticker: string;
  /** USD */
  price: number;
  /** 연 배당률(%) */
  dividendYield: number;
};

/**
 * 제출 결과 — 폼이 알 수 없는 사유는 호출부가 알려 준다(무음 실패 금지).
 *
 * `loading` = 저장소를 아직 못 읽어 편집을 받지 않는 상태. `duplicate` 로 접으면 있지도 않은
 * "이미 보유 중"을 알리게 되므로 **사유를 접지 않는다**.
 */
export type ManualTickerSubmitResult = { ok: true } | { ok: false; reason: 'duplicate' | 'loading' };

export type ManualTickerFormProps = {
  /** 검색 결과가 0개면 펼친 상태로 보여 준다 — 막다른 길을 만들지 않는다. */
  forceOpen: boolean;
  onSubmit: (input: ManualTickerSubmitInput) => ManualTickerSubmitResult;
};
