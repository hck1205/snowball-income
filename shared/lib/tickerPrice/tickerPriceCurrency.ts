import { isKoreanListedTicker } from '@/shared/constants/tax';

export type TickerPriceCurrency = 'KRW' | 'USD';

/**
 * **이 앱의 `initialPrice` 필드에는 두 통화가 섞여 있다.**
 *
 * 프리셋 정본이 국내 상장 종목은 원화를(TIGER… 15,175), 미국 상장 종목은 **달러 숫자를 그대로**
 * 담는다(QQQM 302.34 · SCHD 31.61). 환산하는 곳은 어디에도 없었다.
 *
 * ## 왜 여태 아무 증상이 없었나 (2026-08-23 발견)
 * 금액 기반 시뮬레이션에서는 **주가가 모든 출력에서 약분된다.** 엔진이
 * `shares = 금액 ÷ 주가` 로 나눴다가 `평가액 = shares × 주가`, `배당 = shares × 주가 × 배당률` 로
 * 되곱하기 때문에, 주가는 내부 단위일 뿐 어떤 결과에도 남지 않는다. 실측으로 확인했다 —
 * 같은 조건에서 주가만 1400배 하면 종료 자산·월 배당이 그대로이고 **주식 수만** 373,708 → 267 로 바뀐다.
 *
 * 🔴 그래서 이 불일치는 **주식 수를 입력·표시하는 순간에만** 드러난다. 그 자리가 이 모듈이다.
 *    사용자 신고: QQQM·SCHD 를 6000주씩 넣었는데 초기 보유가 200만원으로 잡혔다
 *    (6000 × 302.34 = 1,814,040 — 25억이어야 할 값이다).
 *
 * ⚠ 상장지 판정은 **티커 접미사**(`.KS`/`.KQ`)뿐이다 — 세율 파생이 쓰는 것과 **같은 함수**다.
 *   접미사 없이 손으로 만든 국내 종목은 미국 상장으로 간주돼 환율이 곱해진다. 판정을 여기서 따로
 *   구현하면 세금과 통화가 서로 다른 상장지를 믿게 되므로, 틀리더라도 **같이 틀리는** 쪽을 택했다.
 *   화면이 적용 환율을 밝혀 사용자가 그 가정을 볼 수 있게 한다.
 */
export const resolveTickerPriceCurrency = (ticker: string): TickerPriceCurrency =>
  isKoreanListedTicker(ticker) ? 'KRW' : 'USD';

export type KrwUnitPriceParams = {
  ticker: string;
  /** 종목 프로필의 `initialPrice` — 상장지에 따라 원 또는 달러다(위 머리말). */
  price: number;
  /** 1 USD = N KRW. 조회 실패·로딩 중이면 `null`. */
  fxRate: number | null;
};

/**
 * 주가를 **원 단위 한 통화로** 되맞춘다. 낼 수 없으면 `null`.
 *
 * `null` 인 경우는 하나뿐이다 — 미국 상장 종목인데 환율이 아직 없을 때. 이때 0 이나 원가격을
 * 대신 돌려주면 주식 수가 1400배 어긋난 채 조용히 계산된다. **모른다는 것을 값으로 말한다.**
 */
export const toKrwUnitPrice = ({ ticker, price, fxRate }: KrwUnitPriceParams): number | null => {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (resolveTickerPriceCurrency(ticker) === 'KRW') return price;
  if (fxRate === null || !Number.isFinite(fxRate) || fxRate <= 0) return null;

  return price * fxRate;
};
