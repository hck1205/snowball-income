import { RETIREMENT_INCOME_COPY } from '../../pages/RetirementIncome/copy';
import { calculateRetirementIncome } from '../../shared/lib/retirementIncome/retirementIncome';
import { escapeHtmlText } from '../../shared/lib/og';

/**
 * `/retirement/income` 의 **크롤러용 본문**(2026-11-13). JS 를 안 돌리는 수집기에게도 "국민연금 + 연금저축 +
 * 배당이면 나이별로 매달 얼마인가"의 예시 답이 보이게, 화면 기본값과 같은 조건을 같은 엔진으로 굽는다.
 * ⚠ 빌드 설정(vite.config)이 읽으므로 상대 경로 import 만 쓴다.
 */
const copy = RETIREMENT_INCOME_COPY;
const MAN = 10_000;

const man = (won: number): string => `${Math.round(won / MAN).toLocaleString('ko-KR')}만원`;

export const renderRetirementIncomeShellBody = (): string => {
  const example = calculateRetirementIncome({
    retireAge: 60,
    targetMonthly: 300 * MAN,
    npsMonthly: 100 * MAN,
    npsStartAge: 65,
    accountBalance: 10_000 * MAN,
    accountStartAge: 60,
    accountYears: 20,
    accountReturn: 0.03,
    dividendMonthly: 100 * MAN
  });
  const rows = example.stages
    .map(
      (stage) =>
        `<tr><th scope="row">${escapeHtmlText(copy.results.stageRange(stage.fromAge, stage.toAge))}</th>` +
        `<td>${man(stage.nps)}</td><td>${man(stage.account)}</td><td>${man(stage.dividend)}</td>` +
        `<td>${man(stage.total)}</td><td>${escapeHtmlText(stage.gap < 0 ? `-${man(-stage.gap)}` : `+${man(stage.gap)}`)}</td></tr>`
    )
    .join('');
  return (
    '<div class="app-shell-fallback">' +
    `<h1>${escapeHtmlText(copy.heroTitle)}</h1>` +
    `<p>${escapeHtmlText(copy.lede)}</p>` +
    '<table>' +
    '<caption>예시: 60세 은퇴 · 목표 생활비 월 300만원 · 국민연금 월 100만원(65세) · 연금저축·IRP 1억원(60세부터 20년, 연 3%) · 배당 월 100만원</caption>' +
    '<thead><tr><th scope="col">나이</th><th scope="col">국민연금(세전)</th><th scope="col">연금저축·IRP(세후)</th>' +
    '<th scope="col">배당(원천징수 뒤)</th><th scope="col">월 합계</th><th scope="col">목표 대비</th></tr></thead>' +
    `<tbody>${rows}</tbody>` +
    '</table>' +
    copy.assumptions.map((line) => `<p>${escapeHtmlText(line)}</p>`).join('') +
    `<p>${escapeHtmlText(copy.results.healthNote)}</p>` +
    `<p class="disclaimer">${escapeHtmlText(copy.disclaimer)}</p>` +
    '</div>'
  );
};
