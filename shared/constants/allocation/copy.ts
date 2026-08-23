/**
 * 포트폴리오 비중 조절 UI 카피.
 *
 * 두 "잠금" 개념을 명칭·안내로 확실히 가른다:
 *  - A) 전역 "비율 조절 잠금" 토글 — 모든 슬라이더를 disabled (자물쇠 메타포).
 *  - B) 종목별 "고정" 버튼 — 그 종목 비중만 고정하고 나머지를 재분배 (핀 메타포).
 * 슬라이더가 왜 비활성인지(무음 비활성 금지)는 범례 하단 단일 힌트 줄로 우선순위 안내한다.
 */
export const ALLOCATION_COPY = {
  /* ① 전역 "비율 조절 잠금" 토글 (A) */
  /** 스위치 접근명(스크린리더) — 켜짐의 의미가 드러나는 긴 문장. */
  lockToggleLabel: '비율 조절 잠금',
  /** 카드 헤더에 보이는 짧은 라벨 — 자물쇠 글리프와 나란히 놓여 맥락이 이미 서 있다. */
  lockToggleShortLabel: '잠금',

  /* ①-2 파이 중앙 배당 표시 토글 (2026-08-14) */
  /**
   * 🔴 중앙 라벨은 **모드마다 다르다** — 값과 이름이 함께 움직여야 한다.
   *    `runRate` 는 "받았다"가 아니라 "이 상태가 유지되면"이라는 **추정**이라 이름이 그 사실을
   *    드러내야 하고(`예상`), `average` 는 그 해 실제 수령액의 평균이라 성격이 다르다.
   *    (근거: `jotai/snowball/atoms/ui` 의 `dividendCenterModeAtom` 주석)
   */
  dividendCenterLabelAverage: '월평균 배당',
  dividendCenterLabelRunRate: '예상 월배당',
  /** 카드 헤더 스위치 — 켜짐 = 종료 시점 보유 기준 예상 월배당. 꺼짐 = 월평균(연÷12). */
  dividendCenterToggleShortLabel: '예상',
  dividendCenterToggleLabel: '파이 중앙에 예상 월배당 표시 (끄면 그 해 월평균)',

  /* ② 종목별 "고정" 버튼 (B) */
  fixButtonText: '고정',
  fixButtonAriaFix: (name: string) => `${name} 비중 고정`,
  fixButtonAriaUnfix: (name: string) => `${name} 비중 고정 해제`,
  fixButtonTitleFix: '비중 고정',
  fixButtonTitleUnfix: '비중 고정 해제',

  /* 비활성 사유 힌트 (우선순위로 하나만 노출) */
  /** 화면에 보이는 스위치 라벨(lockToggleShortLabel)을 그대로 인용한다 — 라벨을 바꾸면 이 문장도 함께 고칠 것. */
  hintLocked: "비중 조절이 잠겨 있습니다. 오른쪽 위 '잠금' 스위치를 끄면 드래그할 수 있습니다.",
  hintOneAdjustable: '다른 종목이 고정돼 조절할 여지가 없습니다. 고정을 풀면 다시 드래그할 수 있습니다.',
  hintSingleTicker: '종목이 하나뿐이라 비중은 100%입니다.',

  /* '고정 전체 해제' 단축 액션 */
  clearAllFixedLabel: '고정 전체 해제',
  clearAllFixedAria: '모든 종목 비중 고정 해제',

  /* ③ 보유 줄 — 주식 수 입력과 그 결과 (2026-08-23) */
  /**
   * 수량 입력의 접근성 이름. 시각 라벨이 없는 자리라 **필수**다(`QuantityInput` 규약).
   * '보유'라고 부르는 이유: 이 값은 시작 시점에 들고 시작하는 주식 수다.
   */
  sharesInputAria: (name: string) => `${name} 보유 주식 수`,
  /** 낭독용 항목 이름 — 화면에서는 열 위치와 단위 표기가 대신한다. */
  holdingAmountSrLabel: '평가 금액',
  holdingDividendSrLabel: '월 배당',
  /** 금액 앞에 붙는 기간 표기. 숫자 자체는 포맷터가 만든다. */
  holdingDividendPrefix: '월',
  holdingTotalLabel: '합계',
  /**
   * 🔴 합계 줄에 **한 번만** 적는 기준. 두 가지를 동시에 말한다.
   *  - '지금 조건 기준' — 이 값은 **시작 시점**이다. 결과 카드·파이 중앙의 '예상 월배당'은
   *    시뮬레이션 **종료 시점** 값이라 훨씬 크다. 두 숫자가 다른 질문에 답한다는 걸 밝히지 않으면
   *    같은 화면에서 배당이 두 개로 보인다.
   *  - '세후' — 계좌·상장지별 세율이 이미 반영돼 있다(`computeHoldingMonthlyDividend`).
   */
  holdingBasisNote: '지금 조건 기준 · 세후',
  /**
   * 적용 환율 표기. 🔴 **숨기지 않는다** — 미국 상장 종목의 주식 수는 달러 주가에 환율을 곱해
   * 낸 값이라(`toKrwUnitPrice`), 어떤 환율을 썼는지 모르면 사용자가 그 숫자를 검산할 수 없다.
   * 환율이 실제로 곱해진 경우에만 붙는다(국내 상장 종목만 담았으면 나오지 않는다).
   */
  holdingFxBasis: (rate: string) => `환율 ${rate}원 적용`,
  /**
   * 환율을 아직 못 구했을 때 잠긴 수량 입력의 사유. **무음 비활성 금지** — 이 레포의 규율이다.
   * ⚠ 금액과 월 배당은 이때도 정확하다(환율과 무관하게 나온다). 못 내는 것은 주식 수뿐이라
   *   문장이 그 범위를 정확히 말한다 — "계산할 수 없습니다"로 넓히면 옆의 맞는 숫자까지 의심받는다.
   */
  holdingFxUnavailable: '환율을 불러오는 중에는 미국 상장 종목의 주식 수를 입력할 수 없습니다. 금액과 월 배당은 그대로 정확합니다.'
} as const;
