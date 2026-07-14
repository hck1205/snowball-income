import type { YearlySeriesKey } from '../yearlySeries';

export const HELP_CONTENT = {
  dividendYield: {
    title: '배당률',
    body: '현재 주가 대비 1년 배당 비율입니다. 예: 3.5는 연 3.5%를 의미합니다.'
  },
  dividendGrowth: {
    title: '배당 성장률',
    body:
      '배당금(DPS)과 주가가 매년 얼마나 성장한다고 가정할지 입력합니다. 배당과 주가가 같은 속도로 자란다고 보기 때문에 배당률이 일정하게 유지됩니다.\n' +
      '음수도 입력할 수 있습니다. 예: 커버드콜 ETF처럼 분배금을 많이 주는 대신 원금(NAV)이 깎이는 자산은 -3처럼 음수로 표현합니다.'
  },
  expectedTotalReturn: {
    title: '기대 총수익율 (CAGR)',
    body:
      '배당률 + 배당 성장률로 자동 계산되는 값입니다(직접 입력하지 않습니다). 예: 배당률 3.34% + 성장 6.66% = 총수익률 10%.\n' +
      '높은 배당률이 곧 높은 수익률을 뜻하지 않습니다. 총수익률을 그대로 두고 배당률만 올리면 그만큼 성장률이 내려갑니다.'
  },
  frequency: {
    title: '배당 지급 주기',
    body: '배당이 실제로 지급되는 횟수입니다. 월/분기/반기/연 중 선택합니다.'
  },
  reinvestTiming: {
    title: '재투자 시점',
    body: '당월 재투자는 배당을 받은 같은 달에 재매수합니다. 익월 재투자는 다음 달에 재매수해 더 보수적인 결과가 나옵니다.'
  },
  dpsGrowthMode: {
    title: 'DPS 성장 반영',
    body: '연 단위 점프는 해가 바뀔 때만 배당이 증가합니다. 월 단위 스무딩은 월별로 부드럽게 증가시켜 반영합니다.'
  },
  resultMode: {
    title: '결과 표시 모드',
    body: '정밀 시뮬레이션은 월 단위 계산(지급주기/세금/재투자 타이밍)을 반영합니다. 간편 추정(빠른 추정)은 재투자 비율과 세금을 반영한 단일 수익률로 빠르게 확인하는 근사치입니다.'
  },
  allocationRatio: {
    title: '티커 비율',
    body: '여러 티커를 함께 선택하면 월 투자금을 입력한 비율대로 나눠서 투자합니다. 예: SCHD 6, JEPI 4이면 60:40 비율입니다.'
  },
  scenarioTabs: {
    title: '포트폴리오 탭',
    body:
      '• + 버튼으로 포트폴리오 탭을 최대 10개까지 추가할 수 있습니다.\n• 탭을 더블클릭하면 이름 변경과 삭제를 할 수 있습니다.\n• 탭을 드래그하면 순서를 바꿀 수 있습니다.'
  },
  yearlyTotalContribution: {
    title: '누적 투자금',
    body: '지금까지 사용자가 실제로 투입한 원금의 누적 합계입니다.'
  },
  yearlyAssetValue: {
    title: '자산 가치',
    body: '해당 시점의 보유 자산 평가금액입니다. 원금과 평가손익이 반영됩니다.'
  },
  yearlyAnnualDividend: {
    title: '연 배당',
    body: '해당 연도에 실제 지급된 배당금 합계(세후)입니다.'
  },
  yearlyMonthlyDividend: {
    title: '월 평균 배당',
    body: '연 배당을 12로 나눈 값으로, 월 기준 평균치입니다.'
  },
  simulationMonthlyAverageDividend: {
    title: '월배당(월평균)',
    body: '연간 배당금 합계를 12로 나눈 월평균 배당입니다.'
  },
  simulationRecentPayoutMonthDividend: {
    title: '최근 실지급 배당',
    body: '가장 최근 지급월에 실제로 지급된 배당 금액입니다.'
  },
  yearlyCumulativeDividend: {
    title: '누적 배당',
    body: '시작 시점부터 현재까지 누적된 세후 배당금 총합입니다.'
  }
} as const;

export type HelpKey = keyof typeof HELP_CONTENT;

export const YEARLY_SERIES_HELP_KEY: Record<YearlySeriesKey, HelpKey> = {
  totalContribution: 'yearlyTotalContribution',
  assetValue: 'yearlyAssetValue',
  annualDividend: 'yearlyAnnualDividend',
  monthlyDividend: 'yearlyMonthlyDividend',
  cumulativeDividend: 'yearlyCumulativeDividend'
};
