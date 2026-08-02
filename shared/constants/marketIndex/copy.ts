/**
 * 주요 지수 스트립(`components/MarketIndexStrip`) 카피.
 *
 * 재사용 컴포넌트의 카피 상수는 도메인별 폴더에 둔다(`shared/constants/allocation/copy.ts` 관례).
 * ⚠ 이 폴더는 최상위 배럴(`shared/constants/index.ts`)에 **연결하지 않는다** — 소비처가 스트립 하나뿐이라
 * 배럴에 얹으면 전 화면이 전이로 끌고 다닌다(`shared/constants/community`·`shared/constants/tickers` 와 같은 격리).
 * 소비는 폴더 경로로만: `import { MARKET_INDEX_COPY } from '@/shared/constants/marketIndex'`.
 *
 * ⚠ **헤더에 시각(asOf)을 찍지 않는다.** 스냅샷의 `asOf` 는 *서버가 조회한 시각*이고 지수별 시각은 항목마다
 * 다르다(각 `MarketIndexQuote.asOf`). 5개 시장의 세션 종료 시각이 서로 달라 하나의 "기준 시각"은 반드시 일부
 * 항목에 대해 거짓이 된다 — "오늘 날짜로 위장하지 않는다"는 기존 원칙의 연장이다. 신선도 신호는 stale 표식이 맡는다.
 *
 * ⚠ `changeAria` 는 환율 위젯(`ExchangeRateWidget`)의 같은 문장과 **일부러 중복**이다. 공용 카피 모듈을 만들면
 * 환율 위젯이 "marketIndex" 카피를 import 하게 된다 — 숫자 포맷만 공용(`formatChangePercent`)이면 표기가 어긋날 여지가 없다.
 *
 * 어조는 격식체("~습니다"). "전일 대비"·"불러오지 못함" 같은 라벨·명사구는 종결어미가 없어 그 규칙 밖이다.
 */
export const MARKET_INDEX_COPY = {
  title: '주요 지수',
  /**
   * 헤더 우측 메타 — 무엇 대비인지·성격을 한 번만 말한다(셀마다 "전일 대비" 라벨을 반복하지 않는 근거).
   *
   * 🔴 **"실시간이 아니다"를 문장에서 빼지 마라.** 엣지 캐시가 15분이고 탭 복귀 재조회도 5분 throttle 이라
   * 화면의 숫자는 구조적으로 지연된 값이다(`jotai/snowball/atoms/marketIndices` 참고). "참고용" 만으로는
   * 그 지연이 읽히지 않아, 사용자가 이 숫자로 매매 시점을 판단할 여지가 남는다.
   */
  meta: '전일 대비 · 실시간이 아닌 참고용 시세',
  /** 갱신 실패(stale) 표식 — 값은 직전 성공값을 그대로 유지한다. */
  stale: ' · 업데이트 실패',
  /** 보여줄 값이 하나도 없을 때(error). 가짜 시세를 그리지 않는다. */
  failure: '지수 시세를 불러오지 못했습니다.',
  /** 값은 있으나 전일 종가가 없을 때 — 0% 로 위장하지 않고 모른다고 말한다. */
  changeUnknown: '전일 대비 정보가 없습니다',
  /** 이 지수만 못 받았을 때(부분 실패). 지수명은 앞 요소가 이미 읽어 준다. */
  quoteUnavailable: '시세를 불러오지 못했습니다',
  /** 위 문장의 셀 안 축약 표기(명사구). */
  quoteUnavailableShort: '불러오지 못함',
  /** 지수는 금액이 아니라 포인트다 — 스크린리더에만 단위를 붙인다(화면은 숫자만). */
  unit: ' 포인트',
  /** 값·변동률이 없는 자리를 비워 두는 표식(자리는 유지하고 결손을 말한다). */
  dash: '—',
  /**
   * 등락 방향의 **모양** 신호. 색(dataPositive/dataNegative)과 부호(+/-)에 더하는 세 번째 채널이라
   * 색을 못 보는 사용자에게도 방향이 남는다(색 단독 채널 금지).
   *
   * 🔴 `flat` 키를 만들지 마라 — 보합에는 마크를 그리지 않는다. `formatChangePercent` 가 보합에 부호를
   * 붙이지 않으므로(`shared/utils/percent.ts`) 표기가 "0.00%" 하나로 충분하고, 가운뎃줄(`–`) 글리프는
   * 구분자 용도의 en-dash 금지 규칙과 겹친다.
   * ⚠ 등락률 자체가 `aria-hidden` 이고 방향은 `changeAria` 문장이 말한다 — 이 마크도 화면 전용이다.
   */
  directionMark: { up: '▲', down: '▼' },
  /** 색·부호가 말하는 방향을 문장으로 옮긴다(색은 단독 채널이 될 수 없다). */
  changeAria: (change: { percent: number; direction: 'up' | 'down' | 'flat' }): string =>
    change.direction === 'flat'
      ? '전일 대비 변동 없음'
      : `전일 대비 ${Math.abs(change.percent).toFixed(2)}% ${change.direction === 'up' ? '상승' : '하락'}`
} as const;
