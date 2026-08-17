/**
 * 일본 주식 ETF (2026-08-17 신설 — 사용자 요청 EWJ·EWJV·FLJP).
 *
 * 왜 `internationalDividendEtfs` 가 아닌가: 그 파일은 **배당을 기준으로 종목을 고르는** ETF 묶음이다
 * (VYMI·SCHY·IDV·DWX — 전부 고배당/배당성장 스크리닝). 여기 셋은 그렇지 않다. **일본 시장 전체 또는
 * 가치주 절반을 시가총액 비중으로 담는 국가 지수 ETF**이고, 배당은 그 결과로 따라오는 부수 효과다.
 * 같은 파일에 섞으면 "배당으로 고른 ETF 목록"이라는 그 파일의 뜻이 "배당이 나오는 ETF"로 넓어진다.
 * `coreIndexEtfs` 도 아니다 — 그쪽은 한 나라에 걸지 않는 **코어 자리**(S&P 500·전세계·전체 국제)다.
 *
 * ## 값의 출처 — 전부 2026-08-17 실측(`ticker:refresh`, Yahoo chart API)
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인이 채우고 자동 갱신된다
 * (`.github/workflows/refresh-tickers.yml`).
 *
 * ⚠ **지급 주기를 "일본은 중간·기말 연 2회"로 짐작하지 마라 — 이 파일을 만들 때 실제로 그렇게
 *   짐작했고 셋 중 둘이 틀렸다.** 실측은 EWJ·EWJV **분기**, FLJP **반기**다. 발행사(iShares·Franklin)는
 *   기초 기업의 배당 관행과 무관하게 자기 펀드의 분배 일정을 정한다. 주기는 재투자 복리 횟수를 바꾸는
 *   입력이라(`paymentsPerYearMap`) 짐작이 그대로 계산 오차가 된다 — `inferFrequency` 실측값만 쓴다.
 * ⚠ 배당률도 짐작이 절반이었다(EWJ 를 1.8% 로 뒀는데 실측 3.62%). 엔화 약세 국면에서 일본 기업의
 *   증배·자사주 매입이 이어진 결과다. 이 파일의 숫자는 전부 파이프라인이 덮는다.
 *
 * 🔴 `expectedTotalReturn` 은 **8% 균일**이다. 파이프라인이 건드리지 않는 유일한 값이고, 종목마다
 *    다르게 잡지 않는다 — 근거는 `wellKnownDividendStocks.ts` 머리말(실측 5년 배당 CAGR 을 미래
 *    가정으로 쓰면 스핀오프·삭감·특별배당에서 구조적으로 깨진다). 8% 는 이 레포가 선진국 국제 주식에
 *    쓰는 값과 같다(VXUS·VYMI 도 8). `dividendGrowth = ETR - 배당률` 이라 배당률이 가장 높은 EWJV 가
 *    자동으로 가장 낮은 성장 가정을 받는다.
 *    ⚠ 갱신 리포트가 FLJP 의 관측 배당 CAGR 을 31.5% 로 찍어 "ETR 을 올려라"고 권한다(2026-08-17).
 *      따르지 않는다 — 그 값은 최근 분배금이 튄 결과이고, 미래 총수익 가정으로 쓰면 위 함정 그대로다.
 * ⚠ 세 종목이 **같은 시장을 겹쳐 담는다**(EWJ ⊃ EWJV, EWJ ≈ FLJP). 셋을 함께 담으면 분산이 아니라
 *   같은 베팅의 반복이다 — 프리셋은 선택지를 주는 것이고 조합의 책임은 사용자에게 있다.
 */
export const JAPAN_EQUITY_ETFS = {
  EWJ: {
    ticker: 'EWJ',
    name: 'iShares MSCI Japan ETF',
    initialPrice: 98.39,
    dividendYield: 3.62,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  EWJV: {
    ticker: 'EWJV',
    name: 'iShares MSCI Japan Value ETF',
    initialPrice: 47.93,
    dividendYield: 4.66,
    dividendGrowth: 3.34,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  FLJP: {
    ticker: 'FLJP',
    name: 'Franklin FTSE Japan ETF',
    initialPrice: 41.83,
    dividendYield: 4.04,
    dividendGrowth: 3.96,
    expectedTotalReturn: 8,
    frequency: 'semiannual' as const
  },
  /*
   * DXJ — 2026-08-18 사용자 요청. 🔴 **환헤지 상품이다**(엔/달러 노출을 제거한다). 위 셋은 엔화 노출을
   * 그대로 안으므로, 같은 일본 시장을 담아도 **엔이 움직일 때 결과가 반대로 갈린다** — 엔 약세면 DXJ 가
   * 유리하고 엔 강세면 불리하다. 이 앱은 환율을 모델링하지 않으므로(표시 통화 변환만 한다) 그 차이는
   * 숫자에 나타나지 않는다. 한글명에 "환헤지"를 넣어 화면에서라도 구분되게 했다.
   * ⚠ **배당률이 위 셋의 4분의 1 수준이다**(실측 0.92% 대 3.6~4.7%). 배당가중 지수라서 배당률이 더
   *   높을 것이라 짐작했다가 실측에서 뒤집혔다. 그래서 같은 ETR 8% 안에서 이 종목만 **성장률 쪽에
   *   7.08% 가 몰린다**(위 셋은 3.3~4.4%) — 같은 일본 시장인데 배당 현금흐름의 모양이 전혀 다르게 나온다.
   */
  DXJ: {
    ticker: 'DXJ',
    name: 'WisdomTree Japan Hedged Equity Fund',
    initialPrice: 181.98,
    dividendYield: 0.92,
    dividendGrowth: 7.08,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  }
} as const;
