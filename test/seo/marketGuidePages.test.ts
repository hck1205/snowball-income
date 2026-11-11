import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURATED_FROM_YEAR, CURATED_THROUGH_YEAR } from '@/shared/constants/marketCalendar';
import {
  MARKET_FOMC_GUIDE_PATH,
  MARKET_HOLIDAY_GUIDE_YEARS,
  MARKET_WEEK_GUIDE_PATH,
  marketHolidayGuidePath,
  parseMarketHolidayGuideYear
} from '@/shared/constants/routes';
import { buildFomcGuide, buildHolidayGuide, buildWeekGuide, formatGuideKst } from '@/shared/lib/marketGuide';
import { ROUTE_SHELLS } from '@/tools/seo/routeShells';

/**
 * 미국 증시 안내 지면(2026-11-11). 잠그는 것:
 * ① 연도 목록 = 큐레이션 구간(없는 해의 휴장일을 "없다"고 말하는 지면 금지)
 * ② 지면마다 정적 셸(본문 표 포함)·사이트맵·vercel rewrite 가 빠짐없이 있다
 * ③ 한국시각 환산(서머타임·다음 날)과 표 내용
 */
const GUIDE_PATHS = [...MARKET_HOLIDAY_GUIDE_YEARS.map(marketHolidayGuidePath), MARKET_FOMC_GUIDE_PATH, MARKET_WEEK_GUIDE_PATH];

describe('미국 증시 안내 지면', () => {
  it('🔴 연도 목록이 큐레이션 구간과 같다', () => {
    const curated = Array.from({ length: CURATED_THROUGH_YEAR - CURATED_FROM_YEAR + 1 }, (_, i) => CURATED_FROM_YEAR + i);
    expect([...MARKET_HOLIDAY_GUIDE_YEARS]).toEqual(curated);
    expect(parseMarketHolidayGuideYear('2027')).toBe(2027);
    expect(parseMarketHolidayGuideYear('2031')).toBeNull();
  });

  it('🔴 지면마다 정적 셸(표 포함)·사이트맵·vercel rewrite 가 있다', () => {
    const vite = readFileSync('vite.config.ts', 'utf8');
    const vercel = readFileSync('vercel.json', 'utf8');
    for (const path of GUIDE_PATHS) {
      const shell = ROUTE_SHELLS.find((route) => route.path === path);
      expect(shell, path).toBeDefined();
      expect(shell!.bodyHtml ?? '', path).toContain('<table>');
      expect(vite, path).toContain(`path: '${path}'`);
      expect(vercel, path).toContain(`"source": "${path}", "destination": "${path}.html"`);
    }
  });

  it('휴장일: 2027 성금요일이 들어 있고 조기 폐장은 한국시간을 함께 쓴다', () => {
    const rows = buildHolidayGuide(2027);
    expect(rows.some((row) => row.date === '2027-03-26' && row.kind === 'holiday')).toBe(true);
    const early = rows.find((row) => row.kind === 'earlyClose');
    expect(early?.note).toMatch(/한국시간 (다음 날 )?0[23]:00/);
  });

  it('🔴 FOMC 성명은 미 동부 14:00 → 한국시간 다음 날 새벽(서머타임 03:00 · 아닐 때 04:00)', () => {
    const rows = buildFomcGuide(new Date(2026, 0, 1));
    expect(rows.find((row) => row.decisionDate === '2026-07-29')?.kstLabel).toBe('다음 날 03:00');
    expect(rows.find((row) => row.decisionDate === '2026-12-09')?.kstLabel).toBe('다음 날 04:00');
    expect(rows.find((row) => row.decisionDate === '2026-12-09')?.withProjections).toBe(true);
    expect(formatGuideKst(null)).toBe('—');
  });

  it('이번 주: 휴장일이 낀 주에는 휴장 줄이 맨 앞에 선다', () => {
    const rows = buildWeekGuide(new Date(2026, 10, 23)); // 11/26 추수감사절 주
    const thanksgiving = rows.find((row) => row.date === '2026-11-26');
    expect(thanksgiving?.kind).toBe('휴장');
  });
});
