import { MARKET_GUIDE_COPY } from '../../pages/MarketGuide/copy';
import {
  MARKET_FOMC_GUIDE_PATH,
  MARKET_HOLIDAY_GUIDE_YEARS,
  MARKET_WEEK_GUIDE_PATH,
  marketHolidayGuidePath
} from '../../shared/constants/routes';
import { buildFomcGuide, buildHolidayGuide, buildWeekGuide } from '../../shared/lib/marketGuide';
import { escapeHtmlText } from '../../shared/lib/og';

/**
 * 미국 증시 안내 지면의 **크롤러용 본문**(2026-11-11). JS 를 실행하지 않는 수집기(네이버 Yeti 등)에게
 * 날짜 표가 그대로 보이게 빌드 때 굽는다 — 숫자는 화면과 같은 함수(`shared/lib/marketGuide`)에서 온다.
 *
 * ⚠ "이번 주"·"지남" 표시는 **빌드 시각** 기준이다. 시장 데이터 갱신 PR 이 머지될 때마다 재배포되므로
 *   주 단위로 따라간다(화면은 방문 시각 기준으로 다시 그린다).
 */
const copy = MARKET_GUIDE_COPY;

const table = (caption: string, head: readonly string[], rows: readonly (readonly string[])[]): string =>
  '<table>' +
  `<caption>${escapeHtmlText(caption)}</caption>` +
  `<thead><tr>${head.map((cell) => `<th scope="col">${escapeHtmlText(cell)}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtmlText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>` +
  '</table>';

const relatedNav = (current: string): string => {
  const links = [
    { href: MARKET_WEEK_GUIDE_PATH, label: copy.relatedLinks.week.title },
    { href: MARKET_FOMC_GUIDE_PATH, label: copy.relatedLinks.fomc.title },
    ...MARKET_HOLIDAY_GUIDE_YEARS.map((year) => ({ href: marketHolidayGuidePath(year), label: copy.relatedLinks.holidays(year).title })),
    { href: '/market/us-calendar', label: copy.relatedLinks.calendar.title }
  ].filter((link) => link.href !== current);
  return (
    `<nav aria-label="${escapeHtmlText(copy.related)}"><h2>${escapeHtmlText(copy.related)}</h2><ul>` +
    links.map((link) => `<li><a href="${link.href}">${escapeHtmlText(link.label)}</a></li>`).join('') +
    '</ul></nav>'
  );
};

const wrap = (inner: string): string => `<div class="app-shell-fallback">${inner}</div>`;

export const renderHolidayGuideShellBody = (year: number): string =>
  wrap(
    `<h1>${escapeHtmlText(copy.holidays.heroTitle(year))}</h1>` +
      `<p>${escapeHtmlText(copy.holidays.lede(year))}</p>` +
      table(
        copy.holidays.tableCaption(year),
        ['날짜', '휴장 사유', '거래'],
        buildHolidayGuide(year).map((row) => [row.dateLabel, row.name, row.note])
      ) +
      `<p>${escapeHtmlText(copy.holidays.source)}</p>` +
      relatedNav(marketHolidayGuidePath(year))
  );

export const renderFomcGuideShellBody = (today: Date = new Date()): string =>
  wrap(
    `<h1>${escapeHtmlText(copy.fomc.heroTitle)}</h1>` +
      `<p>${escapeHtmlText(copy.fomc.lede)}</p>` +
      table(
        copy.fomc.tableCaption,
        ['회의', '결정 발표 (한국시간)', '점도표'],
        buildFomcGuide(today).map((row) => [row.meetingLabel, row.kstLabel, row.withProjections ? '발표' : '—'])
      ) +
      `<p>${escapeHtmlText(copy.fomc.projectionsNote)}</p>` +
      `<p>${escapeHtmlText(copy.fomc.nextYearNote)}</p>` +
      `<p>${escapeHtmlText(copy.fomc.source)}</p>` +
      relatedNav(MARKET_FOMC_GUIDE_PATH)
  );

export const renderWeekGuideShellBody = (today: Date = new Date()): string => {
  const rows = buildWeekGuide(today);
  return wrap(
    `<h1>${escapeHtmlText(copy.week.heroTitle)}</h1>` +
      `<p>${escapeHtmlText(copy.week.lede)}</p>` +
      (rows.length > 0
        ? table(
            copy.week.tableCaption,
            ['날짜', '구분', '일정', '한국시간'],
            rows.map((row) => [row.dateLabel, row.kind, row.label, row.kstLabel])
          )
        : `<p>${escapeHtmlText(copy.week.empty)}</p>`) +
      `<p>${escapeHtmlText(copy.week.source)}</p>` +
      relatedNav(MARKET_WEEK_GUIDE_PATH)
  );
};
