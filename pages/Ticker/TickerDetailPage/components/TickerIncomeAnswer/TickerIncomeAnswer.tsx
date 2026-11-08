import { DIVIDEND_TARGET_PATH } from '@/shared/constants/routes';
import { TICKER_INCOME_COPY, formatIncomeWon, formatPrincipalLabel } from '@/shared/lib/tickerIncome';
import {
  AnswerHeading,
  AnswerLead,
  AnswerLeadCaption,
  AnswerLeadItem,
  AnswerLeadLabel,
  AnswerLeadValue,
  AnswerLink,
  AnswerNote,
  AnswerSection,
  AnswerTable
} from './TickerIncomeAnswer.styled';
import type { TickerIncomeAnswerProps } from './TickerIncomeAnswer.types';

const copy = TICKER_INCOME_COPY;

/**
 * 티커 페이지 본문 첫 블록 — **"{티커}에 1억을 넣으면 매달 얼마?"** 에 숫자로 답한다(2026-11-09).
 *
 * 검색으로 들어온 사람이 묻는 것은 배당률이 아니라 "그래서 매달 얼마냐"다. 그 답이 시뮬레이터에 가야만
 * 나오면 휴대폰 방문자는 그 전에 떠난다(네이버 모바일 평균 체류 45초). 그래서 **히어로 바로 아래**에 둔다.
 *
 * 숫자는 전부 `buildTickerIncomeAnswer`(엔진·원금 식 정본)에서, 문장은 `TICKER_INCOME_COPY` 에서 온다 —
 * 크롤러 HTML(`server/handlers/TickerHtml` 의 `renderIncomeAnswer`)도 같은 둘을 쓴다. 여기서는 그리기만 한다.
 */
const TickerIncomeAnswer = ({ answer, onToTarget }: TickerIncomeAnswerProps) => {
  const { ticker, headline, rows, years } = answer;
  const [principalHead, nowHead, reinvestHead] = copy.tableHead(years);

  return (
    <AnswerSection aria-labelledby="income-answer-heading">
      <AnswerHeading id="income-answer-heading">{copy.heading(ticker, headline.principal)}</AnswerHeading>

      <AnswerLead>
        <AnswerLeadItem>
          <AnswerLeadLabel>{copy.nowLabel}</AnswerLeadLabel>
          <AnswerLeadValue>월 {formatIncomeWon(headline.monthlyAfterTax)}</AnswerLeadValue>
          <AnswerLeadCaption>연 {formatIncomeWon(headline.annualAfterTax)}</AnswerLeadCaption>
        </AnswerLeadItem>
        <AnswerLeadItem>
          <AnswerLeadLabel>{copy.reinvestLabel(years)}</AnswerLeadLabel>
          <AnswerLeadValue>월 {formatIncomeWon(headline.monthlyAfterReinvest)}</AnswerLeadValue>
          <AnswerLeadCaption>{copy.reinvestCaption(years)}</AnswerLeadCaption>
        </AnswerLeadItem>
      </AnswerLead>

      <AnswerTable>
        <caption>{copy.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{principalHead}</th>
            <th scope="col">{nowHead}</th>
            <th scope="col">{reinvestHead}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.principal}>
              <th scope="row">{formatPrincipalLabel(row.principal)}</th>
              <td>{formatIncomeWon(row.monthlyAfterTax)}</td>
              <td>{formatIncomeWon(row.monthlyAfterReinvest)}</td>
            </tr>
          ))}
        </tbody>
      </AnswerTable>

      <AnswerNote>{copy.assumption(answer)}</AnswerNote>

      <AnswerLink to={DIVIDEND_TARGET_PATH} onClick={onToTarget}>
        {copy.toTarget}
      </AnswerLink>
    </AnswerSection>
  );
};

export default TickerIncomeAnswer;
