import { hasPortfolioPayoutMonths, resolvePortfolioMarketInfo } from './PortfolioMarketInfo';
import { resolvePortfolioPayoutDay } from './PortfolioSchedule';
import { normalizePortfolioQuantity, normalizePortfolioTicker } from './PortfolioHolding';
import type {
  PortfolioHolding,
  PortfolioMarketInfoResolver,
  PortfolioPayoutMonthsSource
} from './PortfolioTypes';

/**
 * **"내 배당 달력" 의 한 달** — 보유 수량으로 계산한 그 달의 배당 예정.
 *
 * ## 왜 여기(계산 계층)에 있나
 *
 * 배당 달력 화면(`/dividend/calendar`)은 지금까지 "언제 주는가"만 답했다. 금액을 붙이려면
 * **보유 수량**이 필요하고, 그 계산은 이미 이 폴더가 갖고 있다(`computePortfolioSummary` 의 #6).
 * 그래서 새 공식을 만들지 않고 **같은 분배 규칙과 같은 일자 판정을 재사용**한다 —
 * 두 화면이 같은 종목·같은 달에 다른 금액을 말하면 그 순간 둘 다 신뢰를 잃는다.
 *
 * ## 🔴 정직성 규칙 (이 파일이 존재하는 이유)
 *
 * 스냅샷이 주는 것은 **연 배당률 하나**뿐이다. 그래서 두 가지를 지어내지 않는다.
 *
 *  ① **회차별 금액**: 연배당을 지급월 수로 **균등 분배**한다(`PortfolioSummary` 의 `monthlyPayoutOf`
 *     와 같은 규칙). 실제 지급액은 회차마다 다르지만 편차를 만들 근거가 없다.
 *  ② **날짜**: 근거가 있는 종목(`payoutMonthsSource === 'pay'` + 관측된 예상 지급일)만 일자를 갖고,
 *     나머지는 `day: null`("N월 중")이다. 배당락 기반('ex')은 실제 입금이 다음 달일 수 있어 일자를
 *     붙이지 않는다.
 *
 * 화면은 이 두 사실을 **숨기지 않고 표시해야 한다**(추정 표기 + 출처 배지). 금액이 정확해 보이면
 * 사용자는 그 숫자로 생활비를 계획한다.
 *
 * ⚠ 전부 **USD** 다. 원화 환산은 표시 계층 소관이다(이 폴더의 규율 — `PortfolioTypes` 머리주석).
 */
export type PortfolioCalendarEntry = {
  /** 대문자·트림된 심볼. */
  ticker: string;
  /**
   * 그 달의 예상 지급일(1-31). **근거가 없으면 `null`** — 화면은 "N월 중"으로 적는다.
   * 지어낸 1일·말일이 아니라 "모른다"를 그대로 들고 다닌다.
   */
  day: number | null;
  /** 그 달의 예상 배당(세전, USD). 연배당 ÷ 지급월 수. */
  amountUsd: number;
  /** 지급월의 근거. 화면이 그대로 사용자에게 보여 준다('pay' = 입금 이력 / 'ex' = 배당락 추정). */
  source: PortfolioPayoutMonthsSource;
};

export type PortfolioMonthCalendar = {
  year: number;
  month: number;
  /** 일자를 아는 항목이 먼저(일자 오름차순), 그다음 "N월 중" 항목이 티커순. */
  entries: PortfolioCalendarEntry[];
  /** 그 달 예정 합계(세전, USD). */
  totalUsd: number;
  /**
   * 금액을 낼 수 없어 빠진 보유 종목 수. **무음 제외 금지** — 화면이 이 수를 알린다
   * (수량 미입력·시장데이터 없음·지급월 모름 중 하나).
   */
  unknownCount: number;
};

export type PortfolioMonthCalendarOptions = {
  year: number;
  /** 1-12. */
  month: number;
  /** 시장 정보 해석기. 테스트·다른 유니버스 주입용(기본은 스냅샷+프리셋). */
  resolve?: PortfolioMarketInfoResolver;
};

/**
 * 보유 목록 → 그 달의 배당 예정.
 *
 * 제외 규칙은 `computePortfolioSummary` 의 `includedInSchedule` 과 같다: 수량이 없거나 시장 정보가
 * 없거나 지급월을 모르면 금액을 낼 수 없다. 그 종목들은 **버리지 않고 세어서** 알린다.
 */
export const buildPortfolioMonthCalendar = (
  holdings: readonly PortfolioHolding[],
  options: PortfolioMonthCalendarOptions
): PortfolioMonthCalendar => {
  const { year, month, resolve = resolvePortfolioMarketInfo } = options;

  const entries: PortfolioCalendarEntry[] = [];
  let unknownCount = 0;

  for (const holding of holdings) {
    const quantity = normalizePortfolioQuantity(holding.quantity);
    const market = resolve(holding);

    /* 금액을 낼 수 없는 행 — 사유를 가르지 않고 수만 센다(화면이 사유별로 안내할 곳은 포트폴리오다). */
    if (quantity === null || !market || !hasPortfolioPayoutMonths(market)) {
      unknownCount += 1;
      continue;
    }

    const payoutMonths = market.payoutMonths ?? [];
    /* 이 달에 지급하지 않는 종목은 "모르는 것"이 아니다 — 그냥 이 달에 없다. */
    if (!payoutMonths.includes(month)) continue;

    const annualDividendUsd = (quantity * market.price * market.dividendYield) / 100;

    entries.push({
      ticker: normalizePortfolioTicker(holding.ticker),
      day: resolvePortfolioPayoutDay(market, year, month),
      amountUsd: annualDividendUsd / payoutMonths.length,
      source: market.payoutMonthsSource ?? 'none'
    });
  }

  /*
   * 일자를 아는 것이 먼저, 모르는 것이 뒤. 같은 조건이면 티커순 —
   * 정렬이 흔들리면 같은 달을 다시 열 때마다 순서가 바뀌어 "뭔가 달라졌나" 하게 된다.
   */
  entries.sort((left, right) => {
    if (left.day !== null && right.day !== null) {
      return left.day === right.day ? left.ticker.localeCompare(right.ticker) : left.day - right.day;
    }
    if (left.day !== null) return -1;
    if (right.day !== null) return 1;
    return left.ticker.localeCompare(right.ticker);
  });

  let totalUsd = 0;
  for (const entry of entries) totalUsd += entry.amountUsd;

  return { year, month, entries, totalUsd, unknownCount };
};
