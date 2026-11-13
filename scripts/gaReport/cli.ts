/**
 * GA 트래픽 리포트 → 텔레그램 (2026-11-13). `.github/workflows/ga-traffic-report.yml` 이 매일 부른다.
 *
 * ```sh
 * REPORT_MODE=test npm run ga:report     # 연결 확인 — GA 를 읽어 어제 숫자를 텔레그램으로 한 번 보낸다
 * ```
 *
 * REPORT_MODE
 *   - `auto`(기본): 어제가 급증이면 급증 알림. 한국시간 월요일이면 주간 요약도.
 *   - `daily`: 급증이 아니어도 어제 리포트를 보낸다.  - `weekly`: 주간 요약만.  - `test`: 연결 확인.
 *
 * 환경 변수(전부 GitHub Secrets): GA_SERVICE_ACCOUNT_KEY(서비스 계정 키 JSON 전체) · GA_PROPERTY_ID ·
 * TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID. **하나라도 없으면 아무것도 하지 않고 성공으로 끝난다** —
 * 키를 등록하기 전에 매일 빨간 실행이 쌓이지 않게.
 *
 * 🔴 저장소가 **공개**라 Actions 로그도 공개다. 이 스크립트는 로그에 **숫자를 찍지 않는다** —
 * "보냈다 / 안 보냈다"만. 숫자는 텔레그램(비공개)으로만 간다.
 *
 * 의존성 0: 서비스 계정 JWT 를 `node:crypto` 로 직접 서명해 토큰을 받고, GA Data API · 텔레그램은 fetch.
 */
import { createSign } from 'node:crypto';
import process from 'node:process';

import {
  detectSpike,
  formatSpikeMessage,
  formatWeeklyMessage,
  isKstMonday,
  shortDate,
  sumTotals,
  type BreakdownRow,
  type Breakdowns,
  type DayTotals,
  type PeriodTotals
} from './trafficReport';

const LOG = '[ga-report]';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type ServiceAccount = { readonly client_email: string; readonly private_key: string };
type DateRange = { readonly startDate: string; readonly endDate: string };
type GaRow = { readonly dimensionValues?: { value: string }[]; readonly metricValues?: { value: string }[] };

const base64url = (input: string | Buffer): string => Buffer.from(input).toString('base64url');

const accessToken = async (account: ServiceAccount): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${base64url(signature)}` })
  });
  if (!response.ok) throw new Error(`구글 토큰 발급 실패 (HTTP ${response.status}) — 서비스 계정 키가 올바른지 확인`);
  return ((await response.json()) as { access_token: string }).access_token;
};

const runReport = async (token: string, propertyId: string, body: object): Promise<GaRow[]> => {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (response.status === 403) throw new Error('GA 접근 거부 (HTTP 403) — 서비스 계정 이메일을 GA 속성에 뷰어로 추가했는지 확인');
  if (!response.ok) throw new Error(`GA 보고서 실패 (HTTP ${response.status})`);
  return ((await response.json()) as { rows?: GaRow[] }).rows ?? [];
};

const TOTAL_METRICS = ['sessions', 'engagedSessions', 'activeUsers', 'screenPageViews'].map((name) => ({ name }));

const toTotals = (row: GaRow): PeriodTotals => {
  const [sessions, engagedSessions, activeUsers, pageViews] = (row.metricValues ?? []).map((metric) => Number(metric.value) || 0);
  return { sessions: sessions ?? 0, engagedSessions: engagedSessions ?? 0, activeUsers: activeUsers ?? 0, pageViews: pageViews ?? 0 };
};

const fetchDays = async (token: string, propertyId: string, range: DateRange): Promise<DayTotals[]> =>
  (await runReport(token, propertyId, { dateRanges: [range], dimensions: [{ name: 'date' }], metrics: TOTAL_METRICS })).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? '',
    ...toTotals(row)
  }));

const fetchBreakdown = async (token: string, propertyId: string, range: DateRange, dimension: string): Promise<BreakdownRow[]> =>
  (
    await runReport(token, propertyId, {
      dateRanges: [range],
      dimensions: [{ name: dimension }],
      metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
      orderBys: [{ metric: { metricName: 'engagedSessions' }, desc: true }],
      limit: 20
    })
  ).map((row) => ({
    label: row.dimensionValues?.[0]?.value || '(없음)',
    sessions: Number(row.metricValues?.[0]?.value) || 0,
    engagedSessions: Number(row.metricValues?.[1]?.value) || 0
  }));

const fetchBreakdowns = async (token: string, propertyId: string, range: DateRange): Promise<Breakdowns> => {
  const [sources, landingPages] = await Promise.all([
    fetchBreakdown(token, propertyId, range, 'sessionSourceMedium'),
    fetchBreakdown(token, propertyId, range, 'landingPage')
  ]);
  return { sources, landingPages };
};

const sendTelegram = async (botToken: string, chatId: string, text: string): Promise<void> => {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  if (!response.ok) throw new Error(`텔레그램 전송 실패 (HTTP ${response.status}) — 봇 토큰 · 채팅 ID, 봇에게 먼저 말을 걸었는지 확인`);
};

const YESTERDAY: DateRange = { startDate: 'yesterday', endDate: 'yesterday' };
const BASELINE_RANGE: DateRange = { startDate: '15daysAgo', endDate: 'yesterday' };
const THIS_WEEK: DateRange = { startDate: '7daysAgo', endDate: 'yesterday' };
const LAST_WEEK: DateRange = { startDate: '14daysAgo', endDate: '8daysAgo' };

const main = async (): Promise<void> => {
  const env = process.env;
  const mode = (env.REPORT_MODE || 'auto').trim();
  const { GA_SERVICE_ACCOUNT_KEY: key, GA_PROPERTY_ID: propertyId, TELEGRAM_BOT_TOKEN: botToken, TELEGRAM_CHAT_ID: chatId } = env;
  if (!key || !propertyId || !botToken || !chatId) {
    console.log(`${LOG} 비밀값이 아직 없다(GA_SERVICE_ACCOUNT_KEY · GA_PROPERTY_ID · TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID) — 건너뛴다.`);
    return;
  }

  const token = await accessToken(JSON.parse(key) as ServiceAccount);
  const send = (text: string) => sendTelegram(botToken, chatId, text);

  if (mode === 'test') {
    const days = await fetchDays(token, propertyId, YESTERDAY);
    const day = days[0];
    await send(
      day
        ? `✅ Hungry Hippo 리포트 연결 확인\n\n어제(${shortDate(day.date)}) 참여 세션 ${day.engagedSessions} / 전체 세션 ${day.sessions}\n\n매일 아침 급증이면 알림, 매주 월요일 주간 요약을 보냅니다.`
        : '✅ Hungry Hippo 리포트 연결 확인 — GA 는 읽혔지만 어제 데이터가 아직 없습니다.'
    );
    console.log(`${LOG} 연결 확인 메시지를 보냈다.`);
    return;
  }

  if (mode !== 'weekly') {
    const verdict = detectSpike(await fetchDays(token, propertyId, BASELINE_RANGE));
    if (verdict.day && (verdict.spike || mode === 'daily')) {
      await send(formatSpikeMessage(verdict, await fetchBreakdowns(token, propertyId, YESTERDAY)));
      console.log(`${LOG} 일일 리포트를 보냈다(${verdict.spike ? '급증' : '수동 요청'}).`);
    } else {
      console.log(`${LOG} 급증 아님 — 일일 알림 없음.`);
    }
  }

  if (mode === 'weekly' || (mode === 'auto' && isKstMonday(new Date()))) {
    const [current, previous, breakdowns] = await Promise.all([
      fetchDays(token, propertyId, THIS_WEEK),
      fetchDays(token, propertyId, LAST_WEEK),
      fetchBreakdowns(token, propertyId, THIS_WEEK)
    ]);
    const dates = current.map((day) => day.date).sort();
    await send(
      formatWeeklyMessage({
        from: dates[0] ?? '',
        to: dates.at(-1) ?? '',
        current: sumTotals(current),
        previous: sumTotals(previous),
        breakdowns
      })
    );
    console.log(`${LOG} 주간 요약을 보냈다.`);
  }
};

main().catch((error: unknown) => {
  // 메시지에는 숫자·비밀값이 없다(위 throw 들은 HTTP 상태와 조치만 담는다).
  console.error(`${LOG} 실패: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
