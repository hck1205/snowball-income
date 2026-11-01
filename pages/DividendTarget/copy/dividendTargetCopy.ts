/**
 * `/dividend/how-much` 화면의 모든 문자열.
 *
 * 형제 폴더에 두는 이유는 다른 페이지와 같다 — 부품(`components/*`)도 같은 카피를 읽는데, 페이지 폴더
 * 배럴에서 가져오면 `페이지 → 컴포넌트 → 페이지` 런타임 순환이 된다.
 *
 * 어법 규칙:
 *  - 🔴 **권유하지 않는다.** "이 종목이 유리합니다" · "추천" · "효율적" 같은 말을 쓰지 않는다. 숫자와
 *    그 숫자의 대가(배당률이 높으면 인상률이 낮다)를 나란히 적는 데서 멈춘다.
 *  - 🔴 가정은 가정이라고 쓴다. 물가는 매번 "가정"이 붙는다.
 *  - 배당 인상률은 **"과거 배당 인상률"** 이다 — 앞으로도 그렇다는 말이 아니다.
 */
export const DIVIDEND_TARGET_COPY = {
  meta: {
    title: '월 배당 얼마 받으려면 얼마 필요할까 — SCHD·JEPI 등 종목별 필요 투자금',
    description:
      '원하는 월 배당(세후)을 고르면 SCHD·JEPI·리얼티 인컴 등 배당 ETF·종목마다 필요한 투자 원금을 세전 배당·배당소득세까지 나눠 보여 드립니다. 과거 배당 인상률이 물가를 이겨 왔는지도 함께 비교합니다. 투자 권유가 아닙니다.'
  },
  hero: {
    eyebrow: '월 배당 계산',
    titleLead: '매달',
    titleTail: '받으려면, 얼마가 있어야 할까?',
    lede: '세금을 떼고 통장에 들어올 금액을 고르세요. 종목마다 필요한 투자 원금을 세금까지 나눠 보여 드립니다.'
  },
  picker: {
    label: '목표 월 배당 (세후)',
    customLabel: '직접 입력',
    customPlaceholder: '예: 180',
    customUnit: '만원',
    customHint: (min: number, max: number) => `${min.toLocaleString()}만원 ~ ${max.toLocaleString()}만원`,
    customApply: '적용'
  },
  breakdown: {
    sectionLabel: '자세히 보기',
    principalLabel: '필요한 투자 원금',
    principalCaption: (ticker: string, monthly: string) => `${ticker} 하나로 세후 월 ${monthly}을 받으려면`,
    stepsTitle: '이 숫자가 나온 순서',
    steps: {
      monthlyAfterTax: '목표 월 배당 (세후)',
      annualAfterTax: '세후 연 배당',
      annualPreTax: '세전 연 배당',
      annualTax: '배당소득세',
      principal: '필요 원금'
    },
    ops: {
      times12: '× 12개월',
      divideByAfterTax: (rate: string) => `÷ (1 − 세율 ${rate})`,
      divideByYield: (yieldText: string) => `÷ 배당률 ${yieldText}`
    },
    taxBasis: (rate: string) => `미국 상장 종목은 미국에서 ${rate} 원천징수로 끝납니다(국내 추가 징수 없음).`,
    taxBasisKorean: (rate: string) => `국내 상장 종목은 배당소득세 ${rate} 가 붙습니다.`,
    yieldBasisSnapshot: (asOf: string) => `배당률은 최근 12개월 실제 지급액 기준입니다 (${asOf}).`,
    yieldBasisPreset: '배당률은 큐레이션 값이라 최신이 아닐 수 있습니다.',
    frequency: {
      monthly: '매월 지급',
      quarterly: '분기 지급',
      semiannual: '반기 지급',
      annual: '연 1회 지급',
      none: '배당 없음'
    },
    perPayout: (amount: string, label: string) => `한 번 받을 때 약 ${amount} (${label})`,
    tickerPageLink: '종목 소개 보기',
    simulateCta: '이 종목으로 언제 도달하는지 계산하기'
  },
  inflation: {
    title: '물가를 이겨 왔을까',
    lede: '같은 금액이라도 물가가 오르면 살 수 있는 것이 줄어듭니다. 그래서 배당이 해마다 얼마나 늘어 왔는지를 물가와 나란히 봅니다.',
    assumptionLabel: '물가상승률 가정',
    growthLabel: '과거 배당 인상률',
    inflationLabel: '물가상승률 (가정)',
    verdict: {
      beats: (gap: string) => `물가보다 연 ${gap} 빨리 늘어 왔습니다`,
      trails: (gap: string) => `물가보다 연 ${gap} 느리게 늘어 왔습니다`,
      unknown: '배당 인상률을 계산할 지급 이력이 모자랍니다'
    },
    shortVerdict: {
      beats: '물가 이김',
      trails: '물가 못 이김',
      unknown: '자료 없음'
    },
    growthBasis: '과거 배당 인상률은 실제 지급 이력에서 계산한 연평균이고, 앞으로도 그렇다는 뜻이 아닙니다.',
    unknownValue: '자료 없음'
  },
  compare: {
    title: '다른 종목이라면',
    lede: (monthly: string) => `같은 세후 월 ${monthly}을 종목마다 받으려면 얼마가 필요한지 나란히 놓았습니다. 카드를 누르면 위에서 자세히 볼 수 있습니다.`,
    principalLabel: '필요 원금',
    yieldLabel: '배당률',
    growthLabel: '배당 인상률',
    selected: '보는 중',
    tradeoffNote:
      '아래로 내려갈수록 필요한 원금이 줄어드는 대신, 대체로 과거 배당 인상률도 낮아집니다. 어느 쪽이 맞는지는 각자의 목적에 달려 있습니다.'
  },
  notes: {
    title: '알아 두세요',
    financialIncomeTitle: '금융소득종합과세',
    financialIncome: (preTax: string) =>
      `이 목표의 세전 연 배당은 ${preTax} 로, 금융소득종합과세 기준(연 2,000만원)을 넘습니다. 넘는 금액은 다른 소득과 합쳐 누진세율로 과세될 수 있어, 위 세금은 실제보다 적게 잡혔을 수 있습니다.`,
    financialIncomeUnder:
      '세전 연 배당이 2,000만원(금융소득종합과세 기준)을 넘으면 넘는 금액이 다른 소득과 합쳐 과세될 수 있습니다. 이 목표는 그 아래입니다.',
    assumptionsTitle: '이 계산의 전제',
    assumptions: [
      { label: '배당률', value: '지금 배당률이 그대로' },
      { label: '세금', value: '배당소득세만 반영' },
      { label: '환율', value: '원금을 원화로 계산 (환율 무관)' },
      { label: '주가', value: '주가 변동은 반영하지 않음' }
    ],
    notAdvice: '투자 권유가 아닙니다. 배당은 줄거나 멈출 수 있고, 원금은 보장되지 않습니다.'
  },
  finalCta: {
    title: '한 번에 다 모을 필요는 없습니다',
    body: '매달 조금씩 넣고 배당을 다시 투자하면 언제 목표에 닿는지, 시뮬레이터가 연도별로 계산해 드립니다.',
    action: '시뮬레이터에서 계산하기'
  }
} as const;
