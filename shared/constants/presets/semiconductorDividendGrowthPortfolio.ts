import { AI_INFRA_ETFS_AND_STOCKS } from './aiInfraEtfsAndStocks';

/**
 * 반도체 배당 성장 포트폴리오.
 *
 * 🔴 **AVGO·TSM·ASML·ETN·VRT 5종은 여기서 정의하지 않는다** — `aiInfraEtfsAndStocks.ts` 의 정의를
 * **참조**한다. 두 프리셋이 같은 티커를 담는 것은 의도된 구성이지만(반도체·AI 인프라는 겹친다),
 * 티커 하나의 수치는 레포 전체에서 **한 곳에서만** 정의돼야 한다.
 *
 * 왜 이렇게까지 하나: `CURATED_DIVIDEND_UNIVERSE`(`index.ts`)는 프리셋을 스프레드로 합치므로 같은
 * 키가 두 파일에 있으면 **뒤에 오는 쪽만 살고 앞의 정의는 영원히 죽은 값**이 된다. 파일만 봐서는
 * 어느 쪽이 사는 값인지 알 수 없어, 배당률·주가를 갱신하러 온 사람이 죽은 쪽을 고치고 "왜 화면이
 * 안 바뀌지" 하게 된다(실제로 2026-07-31 까지 그 상태였다 — 이 5종의 값이 두 파일에서 서로 달랐다).
 * 참조로 바꾸면 "어느 쪽이 이기나"라는 질문 자체가 사라진다.
 *
 * 삭제가 아니라 참조인 이유: ①이 포트폴리오의 구성(어느 티커가 들어가는가)은 제품 정의라 보존한다
 * ②키를 지우면 유니버스의 **키 순서**가 바뀌어(스프레드는 첫 등장 위치를 유지한다) 종목 선택 목록의
 * 노출 순서가 조용히 달라진다.
 *
 * 가드: `test/presets/presetTickerSingleSource.test.ts`(중복 키는 반드시 동일 객체 참조여야 한다).
 */
export const SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO = {
  AVGO: AI_INFRA_ETFS_AND_STOCKS.AVGO,
  TXN: {
    ticker: 'TXN',
    name: 'Texas Instruments Incorporated',
    initialPrice: 190,
    dividendYield: 3.0,
    dividendGrowth: 8,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ADI: {
    ticker: 'ADI',
    name: 'Analog Devices, Inc.',
    initialPrice: 210,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  LRCX: {
    ticker: 'LRCX',
    name: 'Lam Research Corporation',
    initialPrice: 900,
    dividendYield: 1.2,
    dividendGrowth: 11.8,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  KLAC: {
    ticker: 'KLAC',
    name: 'KLA Corporation',
    initialPrice: 800,
    dividendYield: 1.1,
    dividendGrowth: 10.9,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  AMAT: {
    ticker: 'AMAT',
    name: 'Applied Materials, Inc.',
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  TSM: AI_INFRA_ETFS_AND_STOCKS.TSM,
  ASML: AI_INFRA_ETFS_AND_STOCKS.ASML,
  ETN: AI_INFRA_ETFS_AND_STOCKS.ETN,
  VRT: AI_INFRA_ETFS_AND_STOCKS.VRT
} as const;
