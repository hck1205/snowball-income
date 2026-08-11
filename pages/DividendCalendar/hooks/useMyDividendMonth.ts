import { useMemo } from 'react';
import { useDisplayCurrencyViewAtomValue } from '@/jotai';
import { createResultAmountFormatter } from '@/pages/Main/utils';
// 보유 수량의 정본은 포트폴리오 화면이 소유한다 — 같은 저장소를 두 번 읽지 않도록 그 훅을 그대로 쓴다
// (가계부(`pages/Ledger`)가 이미 같은 방식으로 이 훅을 쓴다).
import { usePortfolioHoldings } from '@/pages/Portfolio/hooks';
import { toPortfolioHoldings } from '@/pages/Portfolio/utils';
import { buildPortfolioMonthCalendar } from '@/shared/lib/portfolio';
import { formatUSD } from '@/shared/utils';

/**
 * **"내 배당" 탭이 쓰는 한 달치 요약.**
 *
 * 달력의 다른 축(선택 종목·검색·달 이동)은 그대로 두고, 이 훅은 두 가지만 답한다:
 * "이 달에 내 보유에서 무엇이 들어오나"와 "얼마인가".
 *
 * 🔴 **금액은 USD 로 계산되고 여기서만 통화가 붙는다.** 계산 계층(`shared/lib/portfolio`)은 통화
 *    중립이고 환산은 표시 계층의 일이다. 그 경계를 여기서 한 번만 넘는다 — 여러 곳에서 넘으면
 *    한쪽이 환율을 빼먹어도 화면에 아무 표시가 안 난다.
 *
 * ⚠ **`createResultAmountFormatter` 는 원화 입력을 받는다**(달러 표시일 때 rate 로 나눈다).
 *   USD 값을 그대로 넘기면 **달러 숫자에 ₩ 가 붙는다** — 환율이 없으면 실효 통화가 원화로 떨어지기
 *   때문이다. 그래서 환율이 없을 때는 포맷터를 아예 부르지 않고 `formatUSD` 로 떨어진다
 *   (포트폴리오 화면이 같은 함정을 밟고 남긴 규약 그대로다).
 */
export type MyDividendMonth = {
  /** 보유 목록 읽기 상태. 'read-error' 면 화면이 사유를 말한다(빈 목록으로 위장하지 않는다). */
  status: 'loading' | 'ready' | 'read-error';
  /** 수량이 입력된 보유가 하나라도 있는가 — 빈 상태 안내를 가른다. */
  hasHoldings: boolean;
  /**
   * 이 달에 지급 예정인 보유 티커. **달력의 "선택"을 대신한다** — 내 배당 탭에서는 사용자가 고른
   * 목록이 아니라 실제 보유가 달력을 채운다.
   */
  tickers: string[];
  /** 티커 → 표시 문자열(적용 통화). 그 달에 지급이 없는 종목은 키 자체가 없다. */
  amountLabelByTicker: Record<string, string>;
  /** 그 달 합계 표시 문자열. 항목이 없으면 `null`. */
  totalLabel: string | null;
  /** 금액을 낼 수 없어 빠진 보유 수(수량 미입력·시장데이터 없음·지급월 모름). */
  unknownCount: number;
};

export const useMyDividendMonth = (year: number, month: number): MyDividendMonth => {
  const { status, items } = usePortfolioHoldings();
  const display = useDisplayCurrencyViewAtomValue();

  const holdings = useMemo(() => toPortfolioHoldings(items), [items]);

  const calendar = useMemo(
    () => buildPortfolioMonthCalendar(holdings, { year, month }),
    [holdings, month, year]
  );

  const rate = display.rate;
  const formatKrwBased = useMemo(
    () => createResultAmountFormatter(display.currency, rate),
    [display.currency, rate]
  );

  return useMemo(() => {
    /* USD 한 값 → 화면 문자열. 위 ⚠ 의 가드가 여기 한 줄이다. */
    const format = (usd: number) => (rate === null ? formatUSD(usd) : formatKrwBased(usd * rate, false));

    const amountLabelByTicker: Record<string, string> = {};
    for (const entry of calendar.entries) amountLabelByTicker[entry.ticker] = format(entry.amountUsd);

    return {
      status,
      hasHoldings: holdings.length > 0,
      tickers: calendar.entries.map((entry) => entry.ticker),
      amountLabelByTicker,
      totalLabel: calendar.entries.length > 0 ? format(calendar.totalUsd) : null,
      unknownCount: calendar.unknownCount
    };
  }, [calendar, formatKrwBased, holdings.length, rate, status]);
};
