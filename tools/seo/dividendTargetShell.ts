import { DIVIDEND_TARGET_COPY } from '../../pages/DividendTarget/copy';
import { formatKoreanWon, formatManWon, formatPercent } from '../../pages/DividendTarget/utils';
import { DEFAULT_INFLATION_RATE } from '../../shared/constants/inflation';
import {
  DIVIDEND_TARGET_AMOUNT_PAGES_MAN,
  DIVIDEND_TARGET_PATH,
  SIMULATOR_PATH,
  dividendTargetAmountPath
} from '../../shared/constants/routes';
import { buildDividendTargetModel } from '../../shared/lib/dividendTarget';
import { escapeHtmlText } from '../../shared/lib/og';

/**
 * `/dividend/how-much`(+ 금액별 `/dividend/how-much/100` …)의 **크롤러용 본문**(2026-11-09).
 *
 * ## 왜
 * 이 화면은 검색어("월 100만원 배당 받으려면 얼마")를 받으려고 만든 지면인데, 정적 셸에는 제목·설명 두 줄만
 * 있었다. JS 를 실행하지 않는 수집기(네이버 Yeti 등)에게는 **답이 하나도 없는 페이지**였다. 이 함수는 빌드 때
 * 종목별 필요 원금 표를 HTML 로 굽는다 — 숫자는 화면과 같은 모델(`buildDividendTargetModel`)에서 온다.
 *
 * ## 다른 금액으로 가는 링크
 * 금액 지면끼리 서로 잇는다. 크롤러가 한 장만 읽어도 나머지 여섯 장을 발견하고, 사람은 자기 금액으로 건너간다.
 *
 * ⚠ 빌드 시점의 시세로 굽힌다. 시장 데이터는 갱신 PR 이 머지될 때마다 재배포되므로 그 주기를 따른다.
 */
export const renderDividendTargetShellBody = (monthlyMan: number): string => {
  const model = buildDividendTargetModel(monthlyMan * 10_000, DEFAULT_INFLATION_RATE);
  const amountLabel = formatManWon(monthlyMan);
  const copy = DIVIDEND_TARGET_COPY;

  const rows = model.all
    .filter((item) => item.requirement !== null)
    .map((item) => {
      const requirement = item.requirement!;
      const name = escapeHtmlText(`${item.ticker} ${item.name}`);
      const label = item.tickerPagePath ? `<a href="${item.tickerPagePath}">${name}</a>` : name;
      return (
        `<tr><th scope="row">${label}</th>` +
        `<td>${escapeHtmlText(formatPercent(item.dividendYieldPercent))}</td>` +
        `<td>${escapeHtmlText(formatKoreanWon(requirement.requiredPrincipal))}</td></tr>`
      );
    })
    .join('');

  const otherAmounts = DIVIDEND_TARGET_AMOUNT_PAGES_MAN.filter((man) => man !== monthlyMan)
    .map((man) => `<li><a href="${dividendTargetAmountPath(man)}">월 ${escapeHtmlText(formatManWon(man))}</a></li>`)
    .join('');

  const preTax = model.all.find((item) => item.requirement !== null)?.requirement?.annualPreTax;
  const taxNote =
    model.exceedsFinancialIncomeThreshold && preTax !== undefined
      ? copy.notes.financialIncome(formatKoreanWon(preTax))
      : copy.notes.financialIncomeUnder;

  return (
    '<div class="app-shell-fallback">' +
    `<h1>${escapeHtmlText(`월 ${amountLabel} 배당 받으려면 얼마가 필요할까?`)}</h1>` +
    `<p>${escapeHtmlText(
      `세후 월 ${amountLabel}(연 ${formatKoreanWon(model.monthlyAfterTax * 12)})의 배당을 받으려면 종목마다 필요한 투자 원금입니다. ` +
        '배당소득세(미국 상장 15%)를 떼고 손에 쥐는 금액 기준이며, 지금 배당률이 그대로라고 가정했습니다.'
    )}</p>` +
    '<table>' +
    `<caption>${escapeHtmlText(`세후 월 ${amountLabel}에 필요한 원금(종목별)`)}</caption>` +
    '<thead><tr><th scope="col">종목</th><th scope="col">배당률</th><th scope="col">필요 원금</th></tr></thead>' +
    `<tbody>${rows}</tbody>` +
    '</table>' +
    `<p>${escapeHtmlText(taxNote)}</p>` +
    (otherAmounts
      ? `<nav aria-label="다른 금액"><h2>다른 금액으로 보기</h2><ul>${otherAmounts}` +
        `<li><a href="${DIVIDEND_TARGET_PATH}">금액 직접 고르기</a></li></ul></nav>`
      : '') +
    `<p><a href="${SIMULATOR_PATH}">배당을 재투자하면 몇 년 뒤 얼마가 되는지 시뮬레이터로 계산하기</a></p>` +
    '<p class="disclaimer">투자 권유가 아닌 계산 예시입니다. 배당과 주가는 바뀝니다.</p>' +
    '<noscript><p class="disclaimer">이 화면을 직접 사용하려면 브라우저에서 JavaScript를 활성화해 주세요.</p></noscript>' +
    '</div>'
  );
};
