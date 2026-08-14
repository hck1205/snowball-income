/**
 * 종목을 **어떤 계좌에 담았는가** (2026-08-15 신설).
 *
 * ## 왜 세율 치환이 아니라 계좌인가
 * ISA 의 가치는 "세율이 낮다"가 아니라 **계좌 안에서 세금을 떼지 않고 재투자된다**는 데 있다.
 * 세율만 9.9% 로 낮춰 흉내 내면 매 지급마다 떼는 구조는 그대로라, 이 계좌를 쓰는 **진짜 이유**
 * (과세이연 복리)가 결과에 나타나지 않는다. 그래서 계좌 유형을 입력으로 받고 **과세 시점**을 옮긴다.
 *
 * ## 🔴 ISA 에는 국내 상장 종목만 담을 수 있다
 * 국내 ISA 는 **국내 상장 상품**만 편입할 수 있다 — 미국 상장 ETF·개별주(SCHD·JEPI·SBUX…)를
 * 직접 담지 못한다. 그래서 `isAccountTypeSelectable` 이 미국 상장 종목에는 ISA 선택지를 아예 주지
 * 않는다. 고를 수 있게 두면 **현실에 없는 조합으로 계산된 숫자**가 나오고, 그건 틀린 답이다.
 * (국내 상장 미국배당 ETF — `koreanDividendTickers` 의 `.KS` 종목들 — 이 실제 대상이다.)
 *
 * ## 🔴 연금저축·IRP 는 여기 없다
 * 일부러 뺐다. 인출 시점의 연금소득세가 **연령·인출 방식에 따라 3.3~5.5%** 로 갈리는데,
 * 시뮬레이션 종료 시점이 곧 인출 시점이라는 보장이 없다. 가정을 겹쳐 쌓아 숫자를 만드느니
 * 다루지 않는다(이 레포의 "지어낸 숫자 0" 규칙). 넣으려면 인출 연령·방식을 입력으로 받아야 한다.
 */
export type AccountType = 'taxable' | 'isa';

export const DEFAULT_ACCOUNT_TYPE: AccountType = 'taxable';

/**
 * ISA 분리과세율(%). 비과세 한도를 넘은 **순이익**에만 붙는다.
 * 출처: 조세특례제한법 — 9.9%(소득세 9% + 지방소득세 0.9%).
 */
export const ISA_SEPARATE_TAX_RATE = 9.9;

/**
 * ISA 비과세 한도(원) — 일반형 기준.
 *
 * ⚠ 서민형·농어민형은 400만원이지만 **가입 자격이 소득 요건으로 갈린다.** 사용자에게 소득을 묻지
 *   않는 이상 어느 쪽인지 알 수 없어, 더 보수적인(세금을 더 많게 잡는) 일반형을 기본으로 쓴다.
 *   과소추정보다 과대추정이 안전한 방향이다.
 */
export const ISA_TAX_FREE_ALLOWANCE = 2_000_000;

/**
 * 그 계좌에서 **배당 지급 시점에** 떼는 세율(%).
 *
 * 🔴 ISA 가 0 인 것은 "비과세"라는 뜻이 아니라 **그때 떼지 않는다**는 뜻이다. 정산은 종료 시점에
 *    `estimateIsaSettlementTax` 가 한 번에 한다 — 둘을 같이 보지 않으면 세금이 통째로 사라진다.
 */
export const payoutTaxRateFor = (accountType: AccountType, taxableRatePercent: number): number =>
  accountType === 'isa' ? 0 : taxableRatePercent;

/**
 * ISA 종료 정산세(원). 계좌 안에서 미뤄 둔 세금을 마지막에 한 번 계산한다.
 *
 *     max(0, 누적 순배당 − 비과세 한도) × 9.9%
 *
 * ⚠ **손익통산은 다루지 않는다.** 실제 ISA 는 계좌 내 손실과 통산해 순이익에만 과세하는데,
 *   이 시뮬레이터에는 매도 손익이라는 개념이 없다(배당 재투자만 한다). 그래서 여기서 말하는
 *   "순이익"은 **누적 배당**이고, 실제보다 세금을 많게 잡을 수 있다 — 보수적인 방향이다.
 */
export const estimateIsaSettlementTax = (cumulativeDividend: number): number => {
  const taxable = Math.max(0, cumulativeDividend - ISA_TAX_FREE_ALLOWANCE);
  return (taxable * ISA_SEPARATE_TAX_RATE) / 100;
};

/**
 * 이 종목에 **ISA 를 고를 수 있는가**.
 *
 * 🔴 국내 ISA 는 국내 상장 상품만 편입한다 — 미국 상장 ETF·개별주(SCHD·JEPI·SBUX…)를 직접 담지
 * 못한다. 그래서 화면은 미국 상장 종목에 ISA 선택지를 **주지 않는다.** 고를 수 있게 두면
 * 현실에 없는 조합으로 계산된 숫자가 나오고, 그건 틀린 답이다.
 *
 * ⚠ 판정 근거는 티커 표기(`.KS`/`.KQ`)다 — 큐레이션이 접미사를 못 박아 두었기 때문에 믿을 수 있다
 *   (`koreanDividendTickers.ts`: 야후가 틀린 접미사에도 200 을 답해서 자동 판정을 금지했다).
 * ⚠ **스키마는 이 제약을 걸지 않는다.** 저장된 옛 데이터·남의 공유 링크가 열려야 하기 때문이다.
 *   여기는 "새로 고를 때" 만 막는 화면 규칙이다.
 */
export const isIsaSelectableFor = (ticker: string): boolean =>
  ticker.trim().toUpperCase().endsWith('.KS') || ticker.trim().toUpperCase().endsWith('.KQ');

/** 화면에 보일 계좌 이름. */
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  taxable: '일반 과세계좌',
  isa: 'ISA'
};
