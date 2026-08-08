/**
 * **자산·투자 기록의 어휘.** 순수 상수·순수 함수만.
 *
 * ## 왜 자산과 가계부가 다른 탭인가
 *
 * 가계부는 **흐름**(이번 달에 얼마 들어오고 나갔나)이고 자산은 **잔액**(지금 얼마 있나)이다.
 * 둘을 한 표에 섞으면 합계가 뜻을 잃는다 — 월세 80만 원과 예금 3,000만 원을 더한 숫자는 아무것도
 * 아니다. 널리 쓰이는 템플릿들도 이 둘을 갈라 놓았고, 그건 옳은 판단이다.
 *
 * ## ⚠ 다만 그 템플릿들은 자산을 **두 탭**으로 쪼갰다 (`자산기록` · `저축기록`)
 *
 * 우리는 하나로 둔다. 둘 다 "월말에 얼마 있나"이고, **저축은 자산의 한 종류**다. 탭을 쪼개면
 * 순자산을 구할 때 두 탭을 더해야 하고, 어느 쪽에 적어야 하는지 사용자가 매번 고민한다.
 *
 * ## 🔴 세로로 쌓는다 (가로 월 블록을 쓰지 않는다)
 *
 * 그 템플릿들은 `항목 × 월` 가로 표다. 그러면 월이 늘 때마다 열을 늘려야 하고, **행 번호가 행을
 * 식별하지 못해** API 로 한 줄 덧붙이는 것이 불가능해진다(실측된 사고다 — `monthBlockReader.ts` 머리말).
 * 우리는 `날짜 | 종류 | 이름 | 금액` 으로 아래로만 쌓는다.
 */

/**
 * 자산 종류.
 *
 * 🔴 `debt`(부채)가 이 목록에 있는 것이 중요하다. 부채를 따로 두지 않으면 **순자산을 구할 수 없다** —
 *    널리 쓰이는 템플릿들이 `순자산` 줄을 두고도 그 값을 손으로 적게 만드는 이유가 그것이다.
 */
export type LedgerHoldingKind = 'cash' | 'deposit' | 'saving' | 'insurance' | 'invest' | 'realEstate' | 'debt';

/** 시트에 적히는 말. 사용자가 읽고 고르는 글자다. */
export const LEDGER_HOLDING_LABEL: Readonly<Record<LedgerHoldingKind, string>> = {
  cash: '현금',
  deposit: '예금',
  saving: '적금',
  insurance: '보험',
  invest: '투자',
  realEstate: '부동산',
  debt: '부채'
};

/** 드롭다운 순서 = 위 선언 순서. 부채가 마지막인 것은 부호가 반대라 눈에 띄어야 하기 때문이다. */
export const LEDGER_HOLDING_KINDS: readonly LedgerHoldingKind[] = [
  'cash',
  'deposit',
  'saving',
  'insurance',
  'invest',
  'realEstate',
  'debt'
];

export const LEDGER_HOLDING_CHOICES: readonly string[] = LEDGER_HOLDING_KINDS.map(
  (kind) => LEDGER_HOLDING_LABEL[kind]
);

/**
 * 🔴 **순자산에서 빼는 종류.** 이 한 줄이 순자산의 정의다.
 *
 * 문자열로 비교하지 않고 이 함수를 쓴다 — 시트의 수식과 앱의 계산이 **같은 정의**를 봐야 한다.
 */
export const isDebtLabel = (label: string | undefined): boolean =>
  (label ?? '').trim() === LEDGER_HOLDING_LABEL.debt;

/** 자산 탭의 머리. 열 순서가 곧 파서의 계약이다. */
export const LEDGER_HOLDING_HEADERS = ['날짜', '종류', '이름', '금액', '내용'] as const;

/* ── 투자 기록 ──────────────────────────────────────────────────────────────── */

/**
 * 투자 탭의 머리.
 *
 * 🔴 **평가금액·손익·수익률 열을 두지 않는다.** 우리는 시세 공급원이 없다. 그 열을 만들면
 *    영영 비어 있거나 사용자가 손으로 채워야 하고, 앱이 채우려면 **지어낸 숫자**가 들어간다.
 *    널리 쓰이는 템플릿들은 그 열을 두고 사용자가 종가를 직접 적게 한다 — 우리는 그 대신
 *    **적은 것으로 할 수 있는 일**(배당 계산)을 한다.
 */
export const LEDGER_INVESTMENT_HEADERS = ['계좌', '티커', '수량', '매입단가', '통화', '내용'] as const;

/** 통화 선택지. 배당 계산이 환산을 하려면 이 값이 필요하다. */
export const LEDGER_CURRENCY_CHOICES: readonly string[] = ['USD', 'KRW'];
