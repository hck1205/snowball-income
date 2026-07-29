import type { ConditionStripInput, ConditionStripItem } from './ConditionStrip.types';

/**
 * "이 결과는 어떤 조건으로 계산됐는가"를 한 줄로 만든다. **순수 함수**다.
 *
 * 표시 규칙: 0/미설정 항목은 기본적으로 **생략**하되, 생략이 숫자를 오해하게 만드는 항목만
 * 사유 문구로 남긴다.
 *  - `monthly`   : 월 적립 유무는 결과를 통째로 바꾸는 사실이라 0이어도 "월 적립 없음"으로 말한다.
 *  - `tax`       : 미입력이면 엔진이 **0%** 를 적용한다 — 생략하면 세전 숫자를 세후로 오해한다.
 *  - `reinvest`  : 복리가 붙는지 여부라 꺼져 있어도 말한다.
 *  - `initial`   : 기본값이 0이라 상시 표시하면 소음이다 → 0이면 생략.
 *  - `target`    : 요약 타일이 이미 `미설정`을 말한다 → 0이면 생략.
 */
export const buildConditionStripItems = (input: ConditionStripInput): ConditionStripItem[] => {
  const items: ConditionStripItem[] = [];

  items.push({ key: 'duration', text: `${input.durationYears}년` });

  items.push({
    key: 'monthly',
    text: input.monthlyContribution > 0 ? `월 ${input.formatAmount(input.monthlyContribution)}` : '월 적립 없음'
  });

  if (input.initialInvestment > 0) {
    items.push({ key: 'initial', text: `초기 ${input.formatAmount(input.initialInvestment)}` });
  }

  items.push({
    key: 'tax',
    text:
      input.taxRatePercent === undefined ? '세율 미입력 (0% 적용)' : `세율 ${input.taxRatePercent}%`
  });

  items.push({
    key: 'reinvest',
    text: input.reinvestDividends ? `재투자 ${input.reinvestDividendPercent}%` : '재투자 안 함'
  });

  items.push({ key: 'tickers', text: `${input.includedTickerCount}종목` });

  if (input.targetMonthlyDividend > 0) {
    items.push({ key: 'target', text: `목표 월 ${input.formatAmount(input.targetMonthlyDividend)}` });
  }

  /* 구 카드 제목("시뮬레이션 결과 (간편)/(정밀)")이 사라진 자리를 대신한다 — 어떤 모드의 숫자인지는
     결과를 읽는 데 필요한 사실이라 어디선가는 반드시 말해야 한다. */
  items.push({ key: 'mode', text: input.showQuickEstimate ? '간편 추정' : '정밀 계산' });

  return items;
};
