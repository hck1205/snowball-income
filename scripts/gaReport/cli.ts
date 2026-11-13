/**
 * GA 트래픽 리포트 → 텔레그램 (2026-11-13). `.github/workflows/ga-traffic-report.yml` 이 매일 부른다.
 *
 * ```sh
 * REPORT_MODE=test npm run ga:report     # 연결 확인 — 어제 리포트를 한 번 보낸다
 * ```
 *
 * REPORT_MODE
 *   - `auto`(기본): 어제가 급증이면 급증 알림. 한국시간 월요일이면 주간 요약도.
 *   - `daily`: 급증이 아니어도 어제 리포트를 보낸다.  - `weekly`: 주간 요약만.
 *   - `test`: 연결 확인 줄 + 어제 리포트.
 *
 * 환경 변수: GA_SERVICE_ACCOUNT_KEY(서비스 계정 키 JSON 전체) · GA_PROPERTY_ID ·
 * TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID. **하나라도 없으면 아무것도 하지 않고 성공으로 끝난다** —
 * 키를 등록하기 전에 매일 빨간 실행이 쌓이지 않게. (워크플로가 저장소 비밀값 이름을 여기로 옮겨 준다.)
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
  type BreakdownRow,
  type Breakdowns,
  type DayTotals,
  type EventRow,
  type PeriodTotals,
  sumTotals
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

const num = (row: GaRow, index: number): number => Number(row.metricValues?.[index]?.value) || 0;

const TOTAL_METRICS = ['sessions', 'engagedSessions', 'activeUsers', 'screenPageViews', 'userEngagementDuration'].map((name) => ({ name }));

const toTotals = (row: GaRow): PeriodTotals => ({
  sessions: num(row, 0),
  engagedSessions: num(row, 1),
  activeUsers: num(row, 2),
  pageViews: num(row, 3),
  engagementSeconds: num(row, 4)
});

const fetchDays = async (token: string, propertyId: string, range: DateRange): Promise<DayTotals[]> =>
  (await runReport(token, propertyId, { dateRanges: [range], dimensions: [{ name: 'date' }], metrics: TOTAL_METRICS })).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? '',
    ...toTotals(row)
  }));

/** 기간 전체 합계 — 날짜별 합을 더하면 방문자(중복 제거)가 부풀므로 따로 묻는다. */
const fetchPeriod = async (token: string, propertyId: string, range: DateRange): Promise<PeriodTotals> => {
  const [row] = await runReport(token, propertyId, { dateRanges: [range], metrics: TOTAL_METRICS });
  return row ? toTotals(row) : sumTotals([]);
};

const fetchBreakdown = async (token: string, propertyId: string, range: DateRange, dimension: string): Promise<BreakdownRow[]> =>
  (
    await runReport(token, propertyId, {
      dateRanges: [range],
      dimensions: [{ name: dimension }],
      metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
      orderBys: [{ metric: { metricName: 'engagedSessions' }, desc: true }],
      limit: 50
    })
  ).map((row) => ({ label: row.dimensionValues?.[0]?.value || '(not set)', sessions: num(row, 0), engagedSessions: num(row, 1) }));

const fetchEvents = async (token: string, propertyId: string, range: DateRange): Promise<EventRow[]> =>
  (
    await runReport(token, propertyId, {
      dateRanges: [range],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50
    })
  ).map((row) => ({ name: row.dimensionValues?.[0]?.value ?? '', count: num(row, 0) }));

const fetchBreakdowns = async (token: string, propertyId: string, range: DateRange): Promise<Breakdowns> => {
  const [sources, landingPages, devices, visitors, events] = await Promise.all([
    fetchBreakdown(token, propertyId, range, 'sessionSourceMedium'),
    fetchBreakdown(token, propertyId, range, 'landingPage'),
    fetchBreakdown(token, propertyId, range, 'deviceCategory'),
    fetchBreakdown(token, propertyId, range, 'newVsReturning'),
    fetchEvents(token, propertyId, range)
  ]);
  return { sources, landingPages, devices, visitors, events };
};

const sendTelegram = async (botToken: string, chatId: string, text: string): Promise<void> => {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
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

  if (mode !== 'weekly') {
    const verdict = detectSpike(await fetchDays(token, propertyId, BASELINE_RANGE));
    const forced = mode === 'daily' || mode === 'test';
    if (verdict.day && (verdict.spike || forced)) {
      const report = formatSpikeMessage(verdict, await fetchBreakdowns(token, propertyId, YESTERDAY));
      await send(mode === 'test' ? `✅ 연결 확인 — 아래처럼 받습니다.\n\n${report}` : report);
      console.log(`${LOG} 일일 리포트를 보냈다(${verdict.spike ? '급증' : `수동: ${mode}`}).`);
    } else if (mode === 'test') {
      await send('✅ Hungry Hippo 리포트 연결 확인 — GA 는 읽혔지만 어제 데이터가 아직 없습니다.');
      console.log(`${LOG} 연결 확인 메시지를 보냈다(어제 자료 없음).`);
    } else {
      console.log(`${LOG} 급증 아님 — 일일 알림 없음.`);
    }
  }

  if (mode === 'weekly' || (mode === 'auto' && isKstMonday(new Date()))) {
    const [days, current, previous, breakdowns, previousLandingPages] = await Promise.all([
      fetchDays(token, propertyId, THIS_WEEK),
      fetchPeriod(token, propertyId, THIS_WEEK),
      fetchPeriod(token, propertyId, LAST_WEEK),
      fetchBreakdowns(token, propertyId, THIS_WEEK),
      fetchBreakdown(token, propertyId, LAST_WEEK, 'landingPage')
    ]);
    await send(formatWeeklyMessage({ days, current, previous, breakdowns, previousLandingPages }));
    console.log(`${LOG} 주간 요약을 보냈다.`);
  }
};

main().catch((error: unknown) => {
  // 메시지에는 숫자·비밀값이 없다(위 throw 들은 HTTP 상태와 조치만 담는다).
  console.error(`${LOG} 실패: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
