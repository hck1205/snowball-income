// @vitest-environment node — DOM 을 쓰지 않는 순수 측정 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { EMPTY_INVESTMENT_SETTINGS } from '@/jotai';
import type { PersistedScenarioState } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import { SHARE_LENGTH_LIMIT, encodeSharedScenario } from '@/pages/Main/hooks/persistence/shareLink';

/**
 * **URL 공유가 몇 종목부터 터지는가**를 실측한다.
 *
 * ## 왜 재는가
 *
 * 공유 링크에는 길이 상한(`SHARE_LENGTH_LIMIT` = 4000자)이 있고, 넘으면 앱이 공유를 **거절**한다.
 * 그래서 DB 저장(`shared_snapshots`)을 두 번째 길로 붙였는데, 그쪽은 anon 이 무제한으로 쓸 수 있어
 * 남용 위험을 안고 있다. "DB 를 버리고 URL 만 쓰면 되지 않나"를 판단하려면 **URL 만으로 몇 명을
 * 못 담는지**를 알아야 하는데, 그 숫자를 아무도 갖고 있지 않았다.
 *
 * ⚠ 이건 합성 측정이다. 실제 사용자 포트폴리오 분포가 아니라 **실제 인코더 + 실제 티커 데이터**로
 *   "N 종목이면 몇 자"를 잰 것이다. 실사용 분포는 별도 문제다(GA 에 종목 수 지표가 없다).
 */

const TICKERS = Object.values(DIVIDEND_UNIVERSE) as Array<{
  ticker: string;
  name: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: TickerProfile['frequency'];
}>;

const KOREAN_NAME = PRESET_TICKER_KOREAN_NAME_BY_TICKER as Record<string, string | undefined>;

type NameMode = 'english' | 'korean' | 'none' | 'long-custom';

/**
 * 표본 추출 방식.
 *
 * 🔴 `head`(앞에서 N개)만 재면 **과소평가**한다. 유니버스가 프리셋 파일 순서라 앞쪽은
 * "Vanguard … ETF" 처럼 비슷한 이름끼리 뭉쳐 있고, lz-string 이 그걸 비현실적으로 잘 줄인다.
 * 실제 사용자는 여기저기서 골라 담으므로 `spread`(고르게 건너뛰며 뽑기)가 더 정직하다.
 */
type Sampling = 'head' | 'spread';

const sample = (count: number, sampling: Sampling) => {
  if (sampling === 'head') return TICKERS.slice(0, count);
  const step = Math.max(1, Math.floor(TICKERS.length / count));
  const picked = [];
  for (let index = 0; picked.length < count && index < TICKERS.length; index += step) picked.push(TICKERS[index]);
  return picked;
};

/** N 종목짜리 시나리오를 만든다. 가중치는 실사용처럼 전부 채운다(비우면 `w` 가 통째로 빠져 과소평가된다). */
const scenarioOf = (count: number, mode: NameMode, sampling: Sampling = 'spread'): PersistedScenarioState => {
  const profiles: TickerProfile[] = sample(count, sampling).map((entry, index) => ({
    id: `t-${index}`,
    ticker: entry.ticker,
    name:
      mode === 'none'
        ? ''
        : mode === 'korean'
          ? (KOREAN_NAME[entry.ticker] ?? entry.name)
          : mode === 'long-custom'
            ? /* 최악의 사용자: 직접 입력한 긴 한글 이름. 겹치는 문자열이 없게 index 를 섞는다. */
              `직접입력 종목 ${index} 배당성장형 장기보유 계좌분리 ${entry.ticker}`
            : entry.name,
    initialPrice: entry.initialPrice,
    dividendYield: entry.dividendYield,
    dividendGrowth: entry.dividendGrowth,
    expectedTotalReturn: entry.expectedTotalReturn,
    frequency: entry.frequency
  }));

  return {
    id: 'scenario-1',
    name: '내 포트폴리오',
    portfolio: {
      tickerProfiles: profiles,
      includedTickerIds: profiles.map((profile) => profile.id),
      /* 균등 비중이 아니라 제각각으로 준다 — 같은 값이 반복되면 lz-string 이 비현실적으로 잘 줄인다. */
      weightByTickerId: Object.fromEntries(
        profiles.map((profile, index) => [profile.id, Math.round((100 / count) * 100) / 100 + (index % 7) * 0.13])
      ),
      fixedByTickerId: {},
      selectedTickerId: profiles[0]?.id ?? null
    },
    investmentSettings: EMPTY_INVESTMENT_SETTINGS
  };
};

/** 상한을 넘기기 시작하는 첫 종목 수. 못 넘기면 null. */
const breakingPoint = (mode: NameMode, sampling: Sampling): { count: number; length: number } | null => {
  for (let count = 1; count <= TICKERS.length; count += 1) {
    const length = encodeSharedScenario(scenarioOf(count, mode, sampling)).length;
    if (length > SHARE_LENGTH_LIMIT) return { count, length };
  }
  return null;
};

const MODES: NameMode[] = ['english', 'korean', 'none', 'long-custom'];

describe('공유 URL 길이 실측', () => {
  it('전체 유니버스 규모를 먼저 찍는다 — 이게 측정 가능한 최대치다', () => {
    console.log(`\n[유니버스] 프리셋 티커 ${TICKERS.length}종목 · 상한 ${SHARE_LENGTH_LIMIT}자\n`);
    /* 표본이 작으면 아래 곡선이 의미를 잃는다 — 50종목 계약을 재려면 유니버스가 그보다 커야 한다. */
    expect(TICKERS.length).toBeGreaterThan(50);
  });

  it('⭐ 종목 수 대비 길이 곡선 (고르게 뽑기 — 실사용에 가깝다)', () => {
    const rows: string[] = [];
    for (const count of [1, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, TICKERS.length]) {
      if (count > TICKERS.length) continue;
      const cells = MODES.map((mode) => {
        const length = encodeSharedScenario(scenarioOf(count, mode, 'spread')).length;
        return `${String(length).padStart(6)}${length > SHARE_LENGTH_LIMIT ? '✗' : ' '}`;
      });
      rows.push(`  ${String(count).padStart(3)}종목  ${cells.join(' ')}`);
    }
    console.log('\n           영문이름  한글이름  이름없음  긴직접입력');
    console.log(rows.join('\n'), '\n');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('⭐ 상한을 넘기는 첫 지점 — 뽑는 방식이 결과를 얼마나 바꾸나', () => {
    const points: Array<{ mode: NameMode; count: number }> = [];

    for (const sampling of ['head', 'spread'] as Sampling[]) {
      const label = sampling === 'head' ? '앞에서 N개(비슷한 이름끼리 뭉침)' : '고르게 뽑기(실사용에 가까움)';
      console.log(`\n  [${label}]`);
      for (const mode of MODES) {
        const point = breakingPoint(mode, sampling);
        console.log(
          point
            ? `    ${mode.padEnd(12)} → ${String(point.count).padStart(3)}종목에서 ${point.length}자로 초과`
            : `    ${mode.padEnd(12)} → ${TICKERS.length}종목(유니버스 전체)까지도 안 넘음`
        );
        if (sampling === 'spread' && point) points.push({ mode, count: point.count });
      }
    }
    console.log('');

    /*
     * 🔴 **50종목까지는 어떤 조건에서도 URL 로 공유된다.** 이게 이 파일이 지키는 계약이다.
     *
     * 배당 포트폴리오에서 50종목은 이미 많은 축이고, 실측 임계는 그 한참 위(73~153종목)다.
     * 인코딩을 건드려 이 여유가 사라지면 **아무 오류 없이** 공유 버튼이 "너무 큽니다"로 거절하기
     * 시작한다 — 그건 사용자에게만 보이고 우리에게는 안 보인다. 그래서 숫자로 못 박는다.
     */
    for (const { mode, count } of points) {
      expect(count, `${mode}: ${count}종목에서 이미 상한을 넘는다 — 인코딩이 뚱뚱해졌다`).toBeGreaterThan(50);
    }
  });

  it('🔴 현실적인 규모(30종목)에서 상한의 60% 를 넘지 않는다', () => {
    for (const mode of MODES) {
      const length = encodeSharedScenario(scenarioOf(30, mode, 'spread')).length;
      const ratio = Math.round((length / SHARE_LENGTH_LIMIT) * 100);
      console.log(`  30종목 ${mode.padEnd(12)} ${String(length).padStart(5)}자 — 상한의 ${ratio}%`);

      /* 30종목은 "많이 담은 사용자"의 현실적 상한이다. 거기서 절반 넘게 쓰면 여유가 없는 것이다. */
      expect(ratio, `30종목 ${mode} 이 상한의 ${ratio}% 를 쓴다`).toBeLessThanOrEqual(60);
    }
    console.log('');
  });
});
