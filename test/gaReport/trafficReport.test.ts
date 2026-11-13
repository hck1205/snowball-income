import { describe, expect, it } from 'vitest';
import {
  barOf,
  changeLabel,
  dayLabel,
  detectSpike,
  durationLabel,
  escapeHtml,
  formatSpikeMessage,
  formatWeeklyMessage,
  groupBy,
  isKstMonday,
  newLandingPages,
  pageLabel,
  shortDate,
  sourceLabel,
  SPIKE_MIN_ENGAGED,
  type Breakdowns,
  type DayTotals
} from '@/scripts/gaReport';

/**
 * GA 트래픽 리포트(2026-11-13) — 잠그는 것:
 * ① 급증은 **참여 세션** 기준, 절대 하한(10)과 평소 대비 2배를 **둘 다** 넘어야 한다 — 봇 세션 폭증이나
 *    "1명 → 3명" 같은 소음은 울리지 않는다
 * ② GA 원값이 사람이 읽는 이름으로 바뀌고, 같은 이름은 합쳐진다(네이버 모바일·PC → "네이버 검색")
 * ③ 문구가 HTML 로 안전하다(원값의 `<` 가 전송을 깨지 않는다) ④ 월요일 판정은 한국시간.
 */
const day = (date: string, engagedSessions: number, sessions = engagedSessions * 2): DayTotals => ({
  date,
  sessions,
  engagedSessions,
  activeUsers: engagedSessions,
  pageViews: engagedSessions * 3,
  engagementSeconds: engagedSessions * 80
});

const quietWeeks = Array.from({ length: 14 }, (_, i) => day(`202611${String(i + 1).padStart(2, '0')}`, 3));

describe('급증 판정', () => {
  it('평소 3 → 어제 12: 하한과 2배를 모두 넘어 급증', () => {
    const verdict = detectSpike([...quietWeeks, day('20261115', 12)]);
    expect(verdict.spike).toBe(true);
    expect(verdict.baseline).toBe(3);
    expect(verdict.day?.date).toBe('20261115');
  });

  it('봇만 늘어난 날(세션 40, 참여 2)은 울리지 않는다', () => {
    expect(detectSpike([...quietWeeks, day('20261115', 2, 40)]).spike).toBe(false);
  });

  it('하한 미만이면 평소의 몇 배여도 울리지 않는다', () => {
    const tiny = Array.from({ length: 14 }, (_, i) => day(`202611${String(i + 1).padStart(2, '0')}`, 1));
    expect(detectSpike([...tiny, day('20261115', SPIKE_MIN_ENGAGED - 1)]).spike).toBe(false);
  });

  it('평소가 이미 높으면 2배가 안 되는 증가는 울리지 않는다', () => {
    const busy = Array.from({ length: 14 }, (_, i) => day(`202611${String(i + 1).padStart(2, '0')}`, 20));
    expect(detectSpike([...busy, day('20261115', 35)]).spike).toBe(false);
    expect(detectSpike([...busy, day('20261115', 40)]).spike).toBe(true);
  });

  it('입력 순서와 무관하게 가장 늦은 날이 "어제"다', () => {
    expect(detectSpike([day('20261115', 12), ...quietWeeks].reverse()).day?.date).toBe('20261115');
    expect(detectSpike([])).toEqual({ spike: false, day: null, baseline: 0 });
  });
});

describe('이름 붙이기', () => {
  it('유입 경로 — 네이버 모바일·PC 검색은 같은 이름, 직접 · 블로그 · 로그인 복귀는 따로', () => {
    expect(sourceLabel('m.search.naver.com / referral')).toBe('네이버 검색');
    expect(sourceLabel('naver / organic')).toBe('네이버 검색');
    expect(sourceLabel('m.blog.naver.com / referral')).toBe('네이버 블로그');
    expect(sourceLabel('(direct) / (none)')).toBe('직접 방문(주소·북마크)');
    expect(sourceLabel('google / organic')).toBe('구글 검색');
    expect(sourceLabel('accounts.google.com / referral')).toBe('구글 로그인 후 복귀');
    expect(sourceLabel('scriblihelp.com / referral')).toBe('scriblihelp.com 링크');
    expect(sourceLabel('ticker_chip / (not set)')).toBe('ticker_chip');
  });

  it('페이지 — 고정 경로 · 연도 · 금액 · 종목, 모르는 경로는 그대로', () => {
    expect(pageLabel('/')).toBe('홈');
    expect(pageLabel('/market/us-calendar')).toBe('미국 증시 캘린더');
    expect(pageLabel('/market/us-holidays/2027')).toBe('2027년 미국 증시 휴장일');
    expect(pageLabel('/dividend/how-much/300')).toBe('월 배당 300만원 필요 원금');
    expect(pageLabel('/ticker/schd')).toBe('종목 SCHD');
    expect(pageLabel('/dividend/tax?m=100')).toBe('배당 세금 계산기');
    expect(pageLabel('/community/board/d8453882-944d')).toBe('게시판 글');
    expect(pageLabel('/totally/new')).toBe('/totally/new');
    expect(pageLabel('(not set)')).toBe('알 수 없음');
  });

  it('같은 이름은 합쳐 참여 많은 순으로', () => {
    const grouped = groupBy(
      [
        { label: 'm.search.naver.com / referral', sessions: 5, engagedSessions: 4 },
        { label: 'google / organic', sessions: 6, engagedSessions: 5 },
        { label: 'naver / organic', sessions: 3, engagedSessions: 2 }
      ],
      sourceLabel
    );
    expect(grouped).toEqual([
      { label: '네이버 검색', sessions: 8, engagedSessions: 6 },
      { label: '구글 검색', sessions: 6, engagedSessions: 5 }
    ]);
  });
});

const breakdowns: Breakdowns = {
  sources: [
    { label: 'naver / organic', sessions: 5, engagedSessions: 4 },
    { label: 'm.search.naver.com / referral', sessions: 5, engagedSessions: 4 },
    { label: '(direct) / (none)', sessions: 30, engagedSessions: 0 },
    { label: 'google / organic', sessions: 4, engagedSessions: 4 }
  ],
  landingPages: [
    { label: '/market/us-calendar', sessions: 9, engagedSessions: 6 },
    { label: '/x<b>', sessions: 2, engagedSessions: 2 }
  ],
  devices: [
    { label: 'mobile', sessions: 10, engagedSessions: 9 },
    { label: 'desktop', sessions: 30, engagedSessions: 3 }
  ],
  visitors: [
    { label: 'new', sessions: 30, engagedSessions: 8 },
    { label: 'returning', sessions: 10, engagedSessions: 4 }
  ],
  events: [
    { name: 'page_view', count: 90 },
    { name: 'simulation_result_view', count: 5 },
    { name: 'calculator_shared', count: 2 }
  ]
};

describe('급증 알림 문구', () => {
  const text = formatSpikeMessage(detectSpike([...quietWeeks, day('20261115', 12, 20)]), breakdowns);

  it('머리: 날짜·요일과 평소의 몇 배', () => {
    expect(text).toContain('<b>Hungry Hippo 트래픽 급증</b>');
    expect(text).toContain('11/15(일) · 평소의 4.0배');
    expect(text).toContain('참여 세션 <b>12</b> (직전 14일 평균 3.0)');
  });

  it('질: 세션당 쪽수 · 1인 평균 체류 · 봇 추정', () => {
    expect(text).toContain('세션당 1.8쪽 · 1인 평균 체류 1분 20초');
    expect(text).toContain('전체 세션 20 중 봇·즉시 이탈 추정 40%');
  });

  it('경로는 이름으로 묶어 비율과 함께, 참여 0 인 직접 방문은 빠진다', () => {
    expect(text).toContain('• 네이버 검색 8 (67%)\n• 구글 검색 4 (33%)');
    expect(text).not.toContain('직접 방문');
  });

  it('누가 · 무엇을 했나 — 기기·신규 비율, 자동 이벤트는 빼고 이름으로', () => {
    expect(text).toContain('모바일 75% · PC 25%');
    expect(text).toContain('처음 온 사람 67% · 다시 온 사람 33%');
    expect(text).toContain('• 시뮬레이션 결과 보기 5회\n• 계산 결과 공유 2회');
    expect(text).not.toContain('page_view');
  });

  it('🔴 GA 원값의 꺾쇠는 이스케이프된다 — 텔레그램 HTML 이 깨지지 않게', () => {
    expect(text).toContain('/x&lt;b&gt;');
    expect(text).not.toContain('/x<b>');
  });

  it('급증이 아닌 수동 리포트는 제목이 다르다', () => {
    expect(formatSpikeMessage(detectSpike([...quietWeeks, day('20261115', 3)]), breakdowns)).toContain('<b>Hungry Hippo 일일 리포트</b>');
  });
});

describe('주간 요약 문구', () => {
  const days = [day('20261109', 2), day('20261110', 8), day('20261111', 4)];
  const text = formatWeeklyMessage({
    days,
    current: { sessions: 28, engagedSessions: 14, activeUsers: 11, pageViews: 42, engagementSeconds: 880 },
    previous: { sessions: 20, engagedSessions: 10, activeUsers: 10, pageViews: 30, engagementSeconds: 600 },
    breakdowns,
    previousLandingPages: [{ label: '/market/us-calendar', sessions: 3, engagedSessions: 2 }]
  });

  it('기간 · 지난주 대비(방문자는 기간 합계를 쓴다)', () => {
    expect(text).toContain('11/9(월) ~ 11/11(수)');
    expect(text).toContain('참여 세션 <b>14</b> (지난주 10, +40%)');
    expect(text).toContain('방문자 11 (지난주 10, +10%)');
  });

  it('요일별 막대 — 가장 많은 날이 꽉 찬 막대', () => {
    expect(text).toContain('월 ▃ 2\n화 █ 8\n수 ▅ 4');
  });

  it('지난주엔 없던 첫 페이지만 "새로 유입"', () => {
    expect(text).toContain('<b>🆕 이번 주 새로 유입된 페이지</b>\n• /x&lt;b&gt; 2');
  });
});

describe('보조 함수', () => {
  it('변화율 · 시간 · 날짜 · 막대 · 이스케이프', () => {
    expect(changeLabel(0, 0)).toBe('변화 없음');
    expect(changeLabel(5, 0)).toBe('새로 생김');
    expect(changeLabel(5, 10)).toBe('-50%');
    expect(durationLabel(45)).toBe('45초');
    expect(durationLabel(120)).toBe('2분');
    expect(shortDate('')).toBe('-');
    expect(dayLabel('20261113')).toBe('11/13(금)');
    expect(barOf(0, 0)).toBe('▁');
    expect(escapeHtml('a&<b>')).toBe('a&amp;&lt;b&gt;');
  });

  it('새로 유입 — 지난주에 참여 0 이던 페이지도 "새로"로 본다', () => {
    const fresh = newLandingPages(
      [{ label: '/dividend/tax', sessions: 3, engagedSessions: 2 }],
      [{ label: '/dividend/tax', sessions: 4, engagedSessions: 0 }]
    );
    expect(fresh.map((row) => row.label)).toEqual(['배당 세금 계산기']);
  });
});

describe('월요일은 한국시간으로', () => {
  it('UTC 일요일 15:00 = 한국 월요일 00:00', () => {
    expect(isKstMonday(new Date('2026-11-15T15:00:00Z'))).toBe(true);
    expect(isKstMonday(new Date('2026-11-15T14:59:00Z'))).toBe(false);
    expect(isKstMonday(new Date('2026-11-16T00:00:00Z'))).toBe(true);
  });
});
