import { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { InflationRateChoice } from '@/shared/constants/inflation';
import { buildSingleTickerPrefillState } from '@/shared/constants/portfolioPrefill';
import { DIVIDEND_TARGET_PATH, SIMULATOR_PATH, parseDividendTargetAmountSegment } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  buildDividendTargetModel,
  findTickerRequirement,
  type DividendTargetModel,
  type TickerRequirement
} from '@/shared/lib/dividendTarget';
import {
  DETAIL_REGION_ID,
  parseDividendTargetQuery,
  toDividendTargetQuery,
  type DividendTargetQueryState
} from '../utils';

export type DividendTargetState = {
  /** 금액별 주소(`/dividend/how-much/100`)로 들어왔으면 그 금액(만원), 아니면 `null`. */
  readonly amountPageMan: number | null;
  readonly query: DividendTargetQueryState;
  readonly model: DividendTargetModel;
  /** 자세히 보는 종목. 큐레이션↔유니버스가 어긋나 하나도 못 찾으면 `null`(테스트가 막는 상태다). */
  readonly selected: TickerRequirement | null;
  readonly changeMonthly: (monthlyMan: number, source: 'chip' | 'custom') => void;
  readonly selectTicker: (ticker: string) => void;
  readonly changeInflation: (rate: InflationRateChoice) => void;
  /** slot = 이 화면의 어느 버튼에서 왔는가(계측). */
  readonly simulate: (ticker: string, slot: 'detail' | 'final') => void;
};

/**
 * 상세 카드로 데려간다. 비교 카드들은 상세 **아래**에 있어서, 아래 카드를 누른 사람에게 바뀐 상세가
 * 보이지 않으면 클릭이 먹통처럼 느껴진다. 모션을 줄이는 사용자에게는 순간 이동이다.
 * ⚠ `scrollIntoView` 가 없는 환경(jsdom·일부 임베드 뷰)에서는 조용히 건너뛴다.
 */
const scrollToDetail = (): void => {
  const detail = document.getElementById(DETAIL_REGION_ID);
  if (!detail || typeof detail.scrollIntoView !== 'function') return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  detail.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

/**
 * `/dividend/how-much` 의 상태·행동 — **쿼리가 유일한 저장소다.**
 *
 * 목표·종목·물가 가정 셋을 전부 `?m=&t=&i=` 로 들고 다닌다(계약은 `utils/dividendTargetQuery.ts`).
 * 컴포넌트 상태를 따로 두지 않는 이유: 검색으로 온 사람이 "SCHD 로 월 300" 을 맞춰 놓고 그 주소를
 * 그대로 보낼 수 있어야 한다. 저장소가 둘이면 어느 쪽이 진실인지가 매번 문제가 된다.
 * 🔴 `replace` 로 쓴다 — 칩을 다섯 번 누른 사람의 뒤로 가기가 다섯 번 이 화면에 머물면 안 된다.
 *
 * ## 계산기로 넘길 때
 * 종목 비교가 이미 쓰는 프리필 계약(`buildSingleTickerPrefillState` → `location.state`)을 그대로 쓴다.
 * 목표 금액은 싣지 않는다 — 그 계약에 그 자리가 없고, 시뮬레이터의 목표 입력은 별도 흐름이다.
 * ⚠ 계약을 넓히고 싶어지면 `shared/constants/portfolioPrefill` 의 sanitize 를 함께 넓혀야 한다.
 *
 * ## 계측
 * 만진 것마다 `dividend_target_interaction`, 계산기로 넘어가는 클릭은 `content_to_simulator`
 * (surface='how_much') — 지면마다 새 이름을 만들지 않는다는 그 이벤트의 원칙(analytics.ts).
 */
export const useDividendTargetState = (): DividendTargetState => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { monthly: amountSegment } = useParams<{ monthly?: string }>();
  const amountPageMan = parseDividendTargetAmountSegment(amountSegment);

  const query = useMemo(
    () => parseDividendTargetQuery(searchParams, amountPageMan ?? undefined),
    [searchParams, amountPageMan]
  );
  const model = useMemo(
    () => buildDividendTargetModel(query.monthlyMan * 10_000, query.inflationRate),
    [query.monthlyMan, query.inflationRate]
  );

  const update = useCallback(
    (patch: Partial<DividendTargetQueryState>) => {
      const next = toDividendTargetQuery({ ...query, ...patch });
      /*
       * 금액별 주소에서 무엇이든 바꾸면 **기본 주소 + 쿼리**로 옮긴다(2026-11-09). `/dividend/how-much/100?m=300`
       * 처럼 주소와 쿼리가 다른 금액을 말하는 상태를 만들지 않는다. 기본 금액이 아니면 `m` 이 쿼리에 실리므로
       * 금액은 그대로 이어진다(`toDividendTargetQuery` 는 기본값만 생략한다).
       */
      if (amountPageMan !== null) {
        const search = next.toString();
        navigate(search ? `${DIVIDEND_TARGET_PATH}?${search}` : DIVIDEND_TARGET_PATH, { replace: true });
        return;
      }
      setSearchParams(next, { replace: true });
    },
    [amountPageMan, navigate, setSearchParams, query]
  );

  const changeMonthly = useCallback(
    (monthlyMan: number, source: 'chip' | 'custom') => {
      /* 🔴 `source` 가 아니라 `input_method` — `source` 는 GA4 예약어라 유입 출처를 덮어쓴다(reservedParams 가드). */
      trackEvent(ANALYTICS_EVENT.DIVIDEND_TARGET_INTERACTION, {
        action: 'amount',
        value: String(monthlyMan),
        input_method: source
      });
      update({ monthlyMan });
    },
    [update]
  );

  const selectTicker = useCallback(
    (ticker: string) => {
      trackEvent(ANALYTICS_EVENT.DIVIDEND_TARGET_INTERACTION, { action: 'ticker', value: ticker });
      update({ ticker });
      scrollToDetail();
    },
    [update]
  );

  const changeInflation = useCallback(
    (inflationRate: InflationRateChoice) => {
      trackEvent(ANALYTICS_EVENT.DIVIDEND_TARGET_INTERACTION, { action: 'inflation', value: String(inflationRate) });
      update({ inflationRate });
    },
    [update]
  );

  const simulate = useCallback(
    (ticker: string, slot: 'detail' | 'final') => {
      trackEvent(ANALYTICS_EVENT.CONTENT_TO_SIMULATOR, { surface: 'how_much', slot, ticker });
      const prefill = buildSingleTickerPrefillState(ticker);
      navigate(SIMULATOR_PATH, prefill === null ? undefined : { state: prefill });
    },
    [navigate]
  );

  /* 파서가 티커를 큐레이션 안으로 강제하므로 못 찾는 것은 큐레이션↔유니버스 불일치뿐이다(테스트가 막는다). */
  const selected = findTickerRequirement(model, query.ticker) ?? model.all[0] ?? null;

  return { amountPageMan, query, model, selected, changeMonthly, selectTicker, changeInflation, simulate };
};
