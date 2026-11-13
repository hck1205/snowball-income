/**
 * 은퇴 후 월 소득 계산기 문구 — 정본 1곳(2026-11-13). 화면 메타와 정적 셸이 같은 제목을 쓴다.
 * 격식체(앱 카피 어미 규칙). 세무·연금 자문이 아닌 **계산 예시**라는 틀을 유지한다.
 * ⚠ 정적 셸(tools/seo)이 이 파일을 읽으므로 상대 경로 import 만 쓴다(빌드 설정은 @/ 를 못 읽는다).
 */
export const RETIREMENT_INCOME_COPY = {
  meta: {
    title: '은퇴 후 월 소득 계산기 — 국민연금·연금저축(IRP)·배당 합산, 나이별 생활비 부족액',
    description:
      '국민연금 예상액, 연금저축·IRP 적립금, 배당을 나이 순서대로 합쳐 은퇴 후 매달 받는 돈과 목표 생활비와의 차이를 계산합니다. 연금소득세와 은퇴 후 건강보험 피부양자 자격까지 함께 봅니다.'
  },
  heroTitle: '은퇴 후 월 소득 계산기',
  lede: '국민연금·연금저축(IRP)·배당은 받기 시작하는 나이가 다릅니다. 나이 구간마다 매달 들어오는 돈과 목표 생활비와의 차이를 보여 드립니다.',
  sections: {
    plan: '은퇴 계획',
    nps: '국민연금',
    account: '연금저축·IRP',
    dividend: '배당 (일반계좌)'
  },
  inputs: {
    retireAge: '은퇴 나이',
    targetMonthly: '목표 생활비 (월)',
    npsMonthly: '국민연금 예상 월액 (세전)',
    npsMonthlyHint: '국민연금공단 누리집이나 "내 곁에 국민연금" 앱에서 예상 연금액을 확인할 수 있습니다.',
    npsStartAge: '국민연금 받는 나이',
    npsStartAgeHint: '1969년생 이후는 65세입니다. 일찍(최대 5년) 받으면 줄고, 늦추면 늘어납니다.',
    accountBalance: '연금 받기 시작할 때 적립금',
    accountStartAge: '연금 받기 시작하는 나이',
    accountStartAgeHint: '55세부터 받을 수 있습니다.',
    accountYears: '나눠 받는 기간',
    accountReturn: '받는 동안 연 수익률',
    dividendMonthly: '배당 월액 (세전)',
    dividendMonthlyHint: '목표 배당이 얼마나 필요한지는 "월 배당 필요 금액"에서 계산할 수 있습니다.'
  },
  units: { age: '세', man: '만원', years: '년', percent: '%' },
  results: {
    heading: '나이별 월 소득',
    legend: { nps: '국민연금 (세전)', account: '연금저축·IRP (세후)', dividend: '배당 (미국 원천징수 뒤)' },
    stageRange: (from: number, to: number | null) => (to === null ? `${from}세부터` : from === to ? `${from}세` : `${from}~${to}세`),
    total: '월 합계',
    targetLegend: (value: string) => `세로선 = 목표 생활비 월 ${value}`,
    short: (value: string) => `목표보다 월 ${value} 모자람`,
    surplus: (value: string) => `목표보다 월 ${value} 여유`,
    exact: '목표와 같음',
    accountTax: (rate: string) => `연금소득세 ${rate}`,
    empty: '입력한 수입원이 없습니다. 국민연금·연금계좌·배당 중 하나 이상을 넣어 주세요.',
    healthHeading: '은퇴 후 건강보험',
    healthFrom: (age: number) => `${age}세부터 (국민연금 + 배당 기준)`,
    dependentLost: '피부양자 자격을 잃을 수 있습니다',
    dependentKept: '피부양자 소득요건 안입니다',
    dependentDetail: (income: string) => `판정 소득 연 ${income} (국민연금 100% + 배당 전액) — 기준은 연 2,000만원 이하입니다.`,
    regional: (value: string) => `지역가입자가 되면 소득분 보험료 월 약 ${value} (재산분 제외)`,
    healthNote:
      '연금저축·IRP 수령액은 건강보험료 계산에 넣지 않았습니다(사적연금 제외 — 2차 자료 기준). 재산이 있으면 지역 보험료가 더 늘어납니다.',
    comprehensiveWarn: '배당만으로 연 2,000만원을 넘어 금융소득종합과세 대상이 될 수 있습니다.',
    taxLink: '이 조건으로 세금·건보료 자세히 보기',
    targetLink: '목표 배당에 필요한 금액 계산하기'
  },
  assumptions: [
    '국민연금은 세전 금액입니다. 물가에 맞춰 오르는 부분은 반영하지 않았습니다.',
    '연금저축·IRP는 원리금 균등으로 나눠 받고, 연 수령액 1,500만원 이하면 나이별 연금소득세(70세 미만 5.5% · 70대 4.4% · 80세 이상 3.3%), 넘으면 16.5%로 계산했습니다. 세액공제를 받지 않은 원금의 비과세는 반영하지 않았습니다(보수적).',
    '배당은 미국 원천징수 15%를 뺀 금액이며, 배당이 늘거나 줄지 않는다고 봤습니다.'
  ],
  disclaimer:
    '연금·세무 자문이 아닌 계산 예시입니다. 실제 연금액과 세금·보험료는 가입 이력·다른 소득·재산에 따라 달라집니다. 중요한 결정은 국민연금공단·국세청·국민건강보험공단에 확인하세요.'
} as const;
