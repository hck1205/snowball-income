import type { MonthlyRecapModel } from '@/pages/Portfolio/PortfolioPage/PortfolioPage.monthlyRecap';
import { PORTFOLIO_COPY } from '../../copy';
import {
  RecapBar,
  RecapChange,
  RecapLabel,
  RecapMonth,
  RecapMonthLabel,
  RecapMonths,
  RecapNote,
  RecapRoot
} from './MonthlyRecap.styled';

const copy = PORTFOLIO_COPY.recap;

/**
 * 월간 리캡 — **한 해의 배당 리듬과 이번 달의 자리**.
 *
 * ## 왜 있나
 * 이 앱은 한 번 계산하면 볼 일이 끝난다. 배당은 실제로 매달 들어오는데 앱은 그 사실을 사용자에게
 * 말해 주지 않았다 — 평가서가 "돌아올 계기가 0개"라고 짚은 자리다(P1-⑤).
 *
 * ## 🔴 확정이 아니라 **예상**이다
 * 값은 종목의 연 배당을 지급월 수로 나눈 균등 가정이다(`buildMonthlyRecap`). 실제 배당은 회차마다
 * 다르고 회사가 바꿀 수도 있다. 그래서 아래 고지 한 줄을 **지우지 마라** — 이 블록의 숫자가
 * 확정이 아니라는 유일한 표시다.
 *
 * ⚠ 지급월을 아는 종목이 하나도 없으면 이 블록을 **그리지 않는다**. 열두 칸이 전부 빈 띠는
 *   "배당이 없다"로 읽히는데, 사실은 "지급월을 모른다"라서 거짓말이 된다.
 */
export default function MonthlyRecap({ model }: { model: MonthlyRecapModel }) {
  if (model.payingMonthCount === 0) return null;

  const direction =
    model.changePercent === null || Math.abs(model.changePercent) < 0.05
      ? 'flat'
      : model.changePercent > 0
        ? 'up'
        : 'down';

  return (
    <RecapRoot aria-label={copy.label}>
      <RecapLabel>{copy.label}</RecapLabel>

      {/* 🔴 지난달이 0이면 퍼센트를 만들지 않는다 — "+100%"·"+∞%" 는 둘 다 거짓이다(문장으로 말한다). */}
      <RecapChange $direction={direction}>
        {model.changePercent === null
          ? copy.noComparison
          : direction === 'flat'
            ? copy.flat
            : copy.change(model.changePercent)}
      </RecapChange>

      <RecapMonths aria-hidden>
        {model.months.map((month) => (
          <RecapMonth key={month.month}>
            <RecapBar $ratio={month.ratio} $current={month.isCurrent} />
            <RecapMonthLabel $current={month.isCurrent}>{month.month}</RecapMonthLabel>
          </RecapMonth>
        ))}
      </RecapMonths>

      {/* 막대는 aria-hidden 이라 같은 사실을 글자로 한 번 더 말한다(색·모양이 유일 채널이 되지 않게). */}
      <RecapNote>{copy.rhythm(model.payingMonthCount)}</RecapNote>
      <RecapNote>{copy.estimateNote}</RecapNote>
    </RecapRoot>
  );
}
