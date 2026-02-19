import type { YearlySeriesKey } from '../yearlySeries';

export const HELP_CONTENT = {
  dividendYield: {
    title: '배당률',
    body: '현재 주가 대비 1년 배당 비율입니다. 예: 3.5는 연 3.5%를 의미합니다.'
  },
  dividendGrowth: {
    title: '배당 성장률',
    body: '배당금(DPS)이 매년 얼마나 증가한다고 가정할지 입력합니다.'
  },
  expectedTotalReturn: {
    title: '기대 총수익율 (CAGR)',
    body: '장기 총수익률(주가 + 배당)을 연평균 기준으로 입력합니다. 시뮬레이션은 내부적으로 주가 성장률을 파생 계산합니다.'
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
    body: '정밀 시뮬레이션은 월 단위 계산(지급주기/세금/재투자 타이밍)을 반영합니다. 간편 추정(빠른 추정)은 단일 수익률 기반으로 빠르게 확인하는 근사치입니다.'
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
