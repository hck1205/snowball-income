/**
 * 미국 상장 **레버리지 ETF**(일간 배수 추종) 8종 — 2026-08-16 확충.
 *
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과 같은 경로(Yahoo chart API →
 * `scripts/tickerRefresh/derive` 의 `computeTtmYield`·`inferFrequency`)로 2026-08-16 에 실측했다.
 * 8종 모두 분기 분배금을 주지만 배당률은 0.0~0.7% 로 사실상 없다 — 이 종목들은 배당이 아니라
 * **주가 성장**으로 담는다(정합 모델에서 `dividendGrowth` 가 곧 주가 성장률이다).
 *
 * ## 🔴 `expectedTotalReturn` 을 "기초지수 × 배수" 로 적지 않는 이유
 *
 * 이 앱은 QYLD 를 "배당률 10%" 로만 보이게 두지 않고 음(-)의 성장률로 NAV 잠식을 드러냈다
 * (`optionIncomeEtfs.ts` 머리말). 레버리지도 **같은 규율**이다. 3배 ETF 의 `expectedTotalReturn`
 * 을 기초지수의 3배로 적으면 30년 시뮬레이션이 수백 배로 튀는데, 그 숫자는 일간 재조정 상품이
 * 실제로 만들어 낼 수 없는 값이다. 배수는 **하루치 수익률**에만 걸리고, 장기 복리에는 변동성
 * 손실·차입비용·보수가 함께 붙기 때문이다.
 *
 * 그래서 기하평균 기준 장기 기대수익률을 표준 근사식으로 계산해 큐레이터 가정으로 삼았다.
 *
 * ```
 * m_L = L·ln(1+g) − ((L² − L)/2)·σ² − (L−1)·ln(1+r) − f
 * expectedTotalReturn = e^(m_L) − 1
 * ```
 *
 * | 기호 | 뜻 | 이 파일이 쓴 값 |
 * |---|---|---|
 * | `L` | 일간 배수 | 2 또는 3 |
 * | `g` | 기초지수의 장기 총수익률 | **이 레포가 이미 큐레이션한 값**을 그대로 쓴다 |
 * | `σ` | 기초지수 연환산 변동성 | S&P 500 16% · 나스닥100 22% · 러셀2000 22% · 반도체 30% |
 * | `r` | 차입 금리 | **3.0%** — 수십 년 시계열을 굴리는 앱이라 현재 단기금리가 아닌 장기 중립 수준 |
 * | `f` | 총보수(대략) | 종목별 주석 |
 *
 * `g` 를 새로 지어내지 않고 레포 값을 재사용하는 것이 이 표의 핵심이다 — QQQ 11%
 * (`CORE_INDEX_ETFS.QQQ`), S&P 500 9.5%(`CORE_INDEX_ETFS.VOO`), 반도체 12%
 * (`AI_INFRA_ETFS_AND_STOCKS.SMH`). 러셀2000 만 대응 프리셋이 없어 8% 로 잡았다.
 * 기초지수 가정을 고치면 여기 숫자도 함께 고쳐야 두 곳이 어긋나지 않는다.
 *
 * ## 결과가 말해 주는 것 (이 표의 존재 이유)
 *
 *   UPRO/SPXL 13.6 > QLD 12.9 > SSO 12.5 > TQQQ 10.6 > USD 10.3 > TNA 1.7 > SOXL 0.2
 *
 * **배수가 클수록 기대수익률이 큰 구조가 아니다.** 변동성이 낮은 S&P 500 은 3배가 2배를 이기지만
 * (13.6 > 12.5), 변동성이 큰 나스닥100 은 3배(TQQQ 10.6)가 2배(QLD 12.9)에 진다. 변동성 30% 인
 * 반도체를 3배로 끌면(SOXL) 기대값이 0 부근까지 깎인다. σ² 항이 배수의 제곱으로 커지기 때문이다.
 *
 * ⚠ **정합 모델은 변동성을 표현하지 못한다.** 이 앱은 매달 정확히 같은 비율로 오르는 결정론적
 *   모형이라, 레버리지의 실제 위험(고점 대비 -90% 급 낙폭, 회복 불가 구간)은 어떤 숫자로도
 *   화면에 나타나지 않는다. 위 `expectedTotalReturn` 은 그 위험을 **기대값에만** 반영한 것이지
 *   "안전하다"는 뜻이 아니다.
 * ⚠ `expectedTotalReturn` 은 0 이상이어야 한다 — 프리셋 필터의 기대총수익률 하한이 0 이라
 *   (`PresetFilterPanel.utils.ts` 의 `derivePresetRanges`) 음수면 **기본 상태에서 목록에 아예
 *   안 뜬다**. `PresetFilterPanel.utils.test.ts` 의 "빈 필터는 실제 프리셋을 전량 통과시킨다" 가
 *   그 상태를 실패로 만든다.
 * ⚠ **단일 종목 레버리지(NVDL·TSLL·CONL 등)는 일부러 넣지 않았다.** σ 가 50%를 넘어 위 식이 늘
 *   음수를 주고, TTM 배당률도 연말 자본이득 분배금에 오염돼(TSLL 실측 11.2%) 갱신 파이프라인이
 *   덮어쓸 때마다 "고배당 종목"으로 둔갑한다. 같은 이유로 TECL 도 제외했다(실측 3.84%가 전액
 *   2025-12-10 자본이득 분배분이다).
 */
export const LEVERAGED_INDEX_ETFS = {
  QLD: {
    ticker: 'QLD',
    name: 'ProShares Ultra QQQ',
    initialPrice: 94.15,
    dividendYield: 0.12,
    /* 나스닥100 2배. g=11%, σ=22%, f=0.95% → 12.9% */
    dividendGrowth: 12.78,
    expectedTotalReturn: 12.9,
    frequency: 'quarterly' as const
  },
  TQQQ: {
    ticker: 'TQQQ',
    name: 'ProShares UltraPro QQQ',
    initialPrice: 76.79,
    dividendYield: 0.49,
    /* 나스닥100 3배. g=11%, σ=22%, f=0.84% → 10.6% (같은 지수 2배인 QLD 보다 낮다 — 위 머리말) */
    dividendGrowth: 10.11,
    expectedTotalReturn: 10.6,
    frequency: 'quarterly' as const
  },
  SSO: {
    ticker: 'SSO',
    name: 'ProShares Ultra S&P500',
    initialPrice: 72.2,
    dividendYield: 0.63,
    /* S&P 500 2배. g=9.5%, σ=16%, f=0.89% → 12.5% */
    dividendGrowth: 11.87,
    expectedTotalReturn: 12.5,
    frequency: 'quarterly' as const
  },
  UPRO: {
    ticker: 'UPRO',
    name: 'ProShares UltraPro S&P 500',
    initialPrice: 156.63,
    dividendYield: 0.69,
    /* S&P 500 3배. g=9.5%, σ=16%, f=0.91% → 13.6% */
    dividendGrowth: 12.91,
    expectedTotalReturn: 13.6,
    frequency: 'quarterly' as const
  },
  SPXL: {
    ticker: 'SPXL',
    name: 'Direxion Daily S&P 500 Bull 3X Shares',
    initialPrice: 299.31,
    dividendYield: 0.48,
    /* S&P 500 3배(디렉시온). g=9.5%, σ=16%, f=0.87% → 13.6%.
       UPRO 와 같은 지수·같은 배수라 기대수익률이 겹치는 것이 정상이다 — 보수 0.04%p 차이는
       소수 첫째 자리에서 사라진다. 두 종목을 모두 두는 이유는 "내가 가진 티커"로 찾기 위함이다. */
    dividendGrowth: 13.12,
    expectedTotalReturn: 13.6,
    frequency: 'quarterly' as const
  },
  USD: {
    ticker: 'USD',
    name: 'ProShares Ultra Semiconductors',
    initialPrice: 94.16,
    dividendYield: 0.32,
    /* 반도체 2배. g=12%, σ=30%, f=0.95% → 10.3% */
    dividendGrowth: 9.98,
    expectedTotalReturn: 10.3,
    frequency: 'quarterly' as const
  },
  SOXL: {
    ticker: 'SOXL',
    name: 'Direxion Daily Semiconductor Bull 3X Shares',
    initialPrice: 144.95,
    dividendYield: 0.01,
    /* 반도체 3배. g=12%, σ=30%, f=0.90% → 0.2%.
       🔴 오타가 아니다. 변동성 30% 짜리 지수를 3배로 끌면 σ² 손실(연 27%p)이 기초지수 수익률
          3배(연 34%p)를 거의 다 먹는다. 같은 지수 2배(USD 10.3%)와 비교되도록 나란히 둔다. */
    dividendGrowth: 0.19,
    expectedTotalReturn: 0.2,
    frequency: 'quarterly' as const
  },
  TNA: {
    ticker: 'TNA',
    name: 'Direxion Daily Small Cap Bull 3X Shares',
    initialPrice: 77.14,
    dividendYield: 0.27,
    /* 러셀2000 3배. g=8%, σ=22%, f=1.00% → 1.7%.
       기초지수 8% 는 이 파일의 가정이다(러셀2000 대응 프리셋이 레포에 없다). */
    dividendGrowth: 1.43,
    expectedTotalReturn: 1.7,
    frequency: 'quarterly' as const
  }
} as const;
