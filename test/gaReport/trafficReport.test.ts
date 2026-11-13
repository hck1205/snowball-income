import { describe, expect, it } from 'vitest';
import {
  changeLabel,
  detectSpike,
  formatSpikeMessage,
  formatWeeklyMessage,
  isKstMonday,
  shortDate,
  SPIKE_MIN_ENGAGED,
  sumTotals,
  type DayTotals
} from '@/scripts/gaReport';

/**
 * GA 트래픽 리포트(2026-11-13) — 잠그는 것:
 * ① 급증은 **참여 세션** 기준, 절대 하한(10)과 평소 대비 2배를 **둘 다** 넘어야 한다 — 봇 세션 폭증이나
 *    "1명 → 3명" 같은 소음은 울리지 않는다 ② 문구에 참여/전체 세션이 함께 나온다 ③ 월요일 판정은 한국시간.
 */
const day = (date: string, engagedSessions: number, sessions = engagedSessions * 2): DayTotals => ({
  date,
  sessions,
  engagedSessions,
  activeUsers: engagedSessions,
  pageViews: engagedSessions * 3
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

describe('문구', () => {
  const breakdowns = {
    sources: [
      { label: 'naver / organic', sessions: 10, engagedSessions: 8 },
      { label: '(direct) / (none)', sessions: 30, engagedSessions: 0 },
      { label: 'google / organic', sessions: 4, engagedSessions: 4 }
    ],
    landingPages: [{ label: '/market/us-calendar', sessions: 9, engagedSessions: 7 }]
  };

  it('급증 알림: 참여/전체 세션, 평소 대비, 참여 순 유입 경로(참여 0 은 뺀다)', () => {
    const text = formatSpikeMessage(detectSpike([...quietWeeks, day('20261115', 12, 20)]), breakdowns);
    expect(text).toContain('트래픽 급증 — 11/15');
    expect(text).toContain('참여 세션 12 (전체 세션 20, 봇·이탈 추정 40%)');
    expect(text).toContain('참여 세션 3.0 → +300%');
    expect(text).toContain('1. naver / organic — 참여 8 / 세션 10\n2. google / organic');
    expect(text).not.toContain('(direct)');
    expect(text).toContain('1. /market/us-calendar — 참여 7 / 세션 9');
  });

  it('주간 요약: 기간과 지난주 대비', () => {
    const text = formatWeeklyMessage({
      from: '20261109',
      to: '20261115',
      current: sumTotals([day('20261109', 10), day('20261110', 5)]),
      previous: sumTotals([day('20261102', 10)]),
      breakdowns: { sources: [], landingPages: [] }
    });
    expect(text).toContain('주간 트래픽 — 11/9~11/15');
    expect(text).toContain('지난주 대비 참여 세션 +50% (지난주 10)');
    expect(text).toContain('(참여 세션 없음)');
  });

  it('보조 함수', () => {
    expect(changeLabel(0, 0)).toBe('변화 없음');
    expect(changeLabel(5, 0)).toBe('새로 생김');
    expect(changeLabel(5, 10)).toBe('-50%');
    expect(shortDate('')).toBe('-');
  });
});

describe('월요일은 한국시간으로', () => {
  it('UTC 일요일 15:00 = 한국 월요일 00:00', () => {
    expect(isKstMonday(new Date('2026-11-15T15:00:00Z'))).toBe(true);
    expect(isKstMonday(new Date('2026-11-15T14:59:00Z'))).toBe(false);
    expect(isKstMonday(new Date('2026-11-16T00:00:00Z'))).toBe(true);
  });
});
