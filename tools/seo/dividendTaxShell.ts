import { DIVIDEND_TAX_COPY } from '../../pages/DividendTax/copy';
import { calculateDividendTax, type HealthInsuranceStatus } from '../../shared/lib/dividendTax/dividendTax';
import { escapeHtmlText } from '../../shared/lib/og';

/**
 * `/dividend/tax` 의 **크롤러용 본문**(2026-11-12). JS 를 안 돌리는 수집기에게도 "월 배당 N만원이면 세금·
 * 건보료가 얼마인가"의 답이 보이게, 대표 금액 몇 개를 빌드 때 같은 엔진으로 굽는다.
 * ⚠ 빌드 설정(vite.config)이 읽으므로 상대 경로 import 만 쓴다.
 */
const copy = DIVIDEND_TAX_COPY;
const MONTHLY_EXAMPLES_MAN = [50, 100, 150, 200, 300] as const;

const won = (value: number): string => {
  const rounded = Math.round(value / 10_000);
  if (rounded >= 10_000) {
    const eok = Math.floor(rounded / 10_000);
    const man = rounded % 10_000;
    return man === 0 ? `${eok}억원` : `${eok}억 ${man.toLocaleString('ko-KR')}만원`;
  }
  return `${rounded.toLocaleString('ko-KR')}만원`;
};

const row = (monthlyMan: number): string => {
  const usDividendAnnual = monthlyMan * 10_000 * 12;
  const at = (health: HealthInsuranceStatus) =>
    calculateDividendTax({ usDividendAnnual, otherFinancialAnnual: 0, otherTaxBase: 0, health, otherIncomeForDependent: 0, isaSeomin: false });
  const regional = at('regional');
  const dependent = at('dependent');
  return (
    `<tr><th scope="row">${escapeHtmlText(`월 ${monthlyMan}만원 (연 ${won(usDividendAnnual)})`)}</th>` +
    `<td>${escapeHtmlText(`월 ${won(regional.usNetAfterWithholding / 12)}`)}</td>` +
    `<td>${regional.comprehensive ? '대상' : '아님'}</td>` +
    `<td>${dependent.health.dependentLost ? '탈락 가능' : '유지'}</td>` +
    `<td>${escapeHtmlText(regional.health.monthlyIncrease > 0 ? `월 ${regional.health.monthlyIncrease.toLocaleString('ko-KR')}원` : '없음')}</td></tr>`
  );
};

export const renderDividendTaxShellBody = (): string =>
  '<div class="app-shell-fallback">' +
  `<h1>${escapeHtmlText(copy.heroTitle)}</h1>` +
  `<p>${escapeHtmlText(copy.lede)}</p>` +
  '<table>' +
  '<caption>미국 배당만 있을 때(다른 소득 0) 월 배당별 세금·건강보험료</caption>' +
  '<thead><tr><th scope="col">월 배당 (세전)</th><th scope="col">원천징수 뒤</th><th scope="col">금융소득종합과세</th>' +
  '<th scope="col">피부양자</th><th scope="col">지역가입자 월 보험료 증가</th></tr></thead>' +
  `<tbody>${MONTHLY_EXAMPLES_MAN.map(row).join('')}</tbody>` +
  '</table>' +
  `<p>${escapeHtmlText(copy.results.extraTaxZero)}</p>` +
  `<p>${escapeHtmlText(copy.results.isaNote)}</p>` +
  `<p>${escapeHtmlText(copy.basis)}</p>` +
  `<p class="disclaimer">${escapeHtmlText(copy.disclaimer)}</p>` +
  '</div>';
