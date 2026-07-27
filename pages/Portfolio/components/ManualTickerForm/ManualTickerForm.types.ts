export type ManualTickerSubmitInput = {
  /** 대문자로 정규화된 심볼. */
  ticker: string;
  /** USD */
  price: number;
  /** 연 배당률(%) */
  dividendYield: number;
};

/** 제출 결과 — 중복은 폼이 알 수 없으므로 호출부가 알려 준다(무음 실패 금지). */
export type ManualTickerSubmitResult = { ok: true } | { ok: false; reason: 'duplicate' };

export type ManualTickerFormProps = {
  /** 검색 결과가 0개면 펼친 상태로 보여 준다 — 막다른 길을 만들지 않는다. */
  forceOpen: boolean;
  onSubmit: (input: ManualTickerSubmitInput) => ManualTickerSubmitResult;
};
