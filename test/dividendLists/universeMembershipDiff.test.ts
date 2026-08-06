// @vitest-environment node — 네트워크·DOM 없는 순수 판정 테스트.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assessCollectionHealth,
  diffUniverseMembership,
  formatMembershipReport,
  ListSourceError,
  readUniverseMembership
} from '@/scripts/dividendLists';
import type { UniverseMembershipView } from '@/scripts/dividendLists';

/**
 * 월간 크론(`.github/workflows/refresh-dividend-universe.yml`)의 **자동 머지 판정**을 고정 입력으로 못 박는다.
 *
 * 워크플로 자체는 로컬에서 돌려 볼 수 없다. 그래서 이 파이프라인에서 실제로 사고가 날 수 있는 자리
 * — ① 종목이 빠졌는데 자동 머지되는 것 ② 상시 신고 때문에 자동 머지가 영원히 죽는 것
 * ③ 야후가 러너 IP 를 막은 날 실측치가 전부 지워진 파일이 머지되는 것 — 을 전부 여기서 잡는다.
 */

const REPO_ROOT = resolve(__dirname, '../..');

/* 실제 생성물(2026-08-04 수집본, 262종)의 형태를 그대로 축소한 픽스처. */
const snapshot = (
  overrides: {
    asOf?: string;
    entries?: Array<Record<string, unknown>>;
    issues?: Array<Record<string, unknown>>;
  } = {}
): Record<string, unknown> => ({
  asOf: overrides.asOf ?? '2026-08-02',
  sourceAsOf: { proShares: '2026-07-31', sdy: '2026-07-31' },
  memberCountByEtf: { NOBL: 2, SDY: 1, REGL: 0, SMDV: 0 },
  entries: overrides.entries ?? [
    {
      ticker: 'KO',
      name: 'Coca-Cola',
      sector: 'consumerStaples',
      sourceSectorLabel: 'Consumer Staples',
      sourceEtfs: ['NOBL', 'SDY'],
      minimumStreakYears: 25,
      metrics: { price: 80, forwardYieldPercent: 2.441, measuredAt: '2026-08-02' }
    },
    {
      ticker: 'PG',
      name: 'Procter & Gamble',
      sector: 'consumerStaples',
      sourceSectorLabel: 'Consumer Staples',
      sourceEtfs: ['NOBL'],
      minimumStreakYears: 25,
      metrics: { price: 150, forwardYieldPercent: 3.005, measuredAt: '2026-08-02' }
    }
  ],
  issues: overrides.issues ?? [],
  coverage: { total: 2, withMetrics: 2, withSector: 2, withGrowth: 2 }
});

const view = (raw: Record<string, unknown>): UniverseMembershipView => readUniverseMembership(raw, '테스트');

describe('스냅샷 읽기 — 기준본은 과거 스키마일 수 있다', () => {
  it('티커·이름·편입 ETF·막는 신고만 뽑는다', () => {
    const parsed = view(
      snapshot({
        issues: [
          { ticker: 'WRB', kind: 'abnormalLatestPayment', detail: '특별배당', blocking: true },
          { ticker: 'AGM', kind: 'sectorMissing', detail: '섹터 없음', blocking: false }
        ]
      })
    );
    expect(parsed.members.map((member) => member.ticker)).toEqual(['KO', 'PG']);
    expect(parsed.members[0].sourceEtfs).toEqual(['NOBL', 'SDY']);
    expect(parsed.members[0].hasMetrics).toBe(true);
    // 비막는 신고(sectorMissing)는 판정에 쓰지 않는다 — 20종이 상시로 떠 있는 값이다.
    expect(parsed.blockingIssues.map((issue) => issue.ticker)).toEqual(['WRB']);
    expect(parsed.coverage).toEqual({ total: 2, withMetrics: 2, withSector: 2, withGrowth: 2 });
  });

  it('필드가 더 있거나 빠져도 읽는다 — 그래야 몇 달 전 커밋본과 비교할 수 있다', () => {
    const parsed = view({
      entries: [{ ticker: 'KO', 미래필드: 1 }],
      somethingNew: true
    });
    expect(parsed.members).toEqual([{ ticker: 'KO', name: 'KO', sourceEtfs: [], hasMetrics: false }]);
    expect(parsed.asOf).toBeNull();
    expect(parsed.coverage).toBeNull();
  });

  it('entries 가 없거나 ticker 가 비면 조용히 넘기지 않고 실패한다', () => {
    expect(() => view({ issues: [] })).toThrow(ListSourceError);
    expect(() => view({ entries: [{ name: '이름만 있다' }] })).toThrow(ListSourceError);
    expect(() => readUniverseMembership('문자열', '테스트')).toThrow(ListSourceError);
  });

  it('fetchFailed 는 막는 신고와 별개로 센다 — 전면 차단 판정의 근거다', () => {
    const parsed = view(
      snapshot({
        issues: [
          { ticker: 'KO', kind: 'fetchFailed', detail: 'HTTP 429', blocking: true },
          { ticker: 'PG', kind: 'fetchFailed', detail: 'HTTP 429', blocking: true }
        ]
      })
    );
    expect(parsed.fetchFailedCount).toBe(2);
  });
});

describe('자동 머지 판정 — 필드 변화는 통과, 구성 변화는 정지', () => {
  it('가격·배당률만 바뀌면 막지 않는다 (매달 반드시 일어나는 변화다)', () => {
    const base = view(snapshot());
    const head = view(
      snapshot({
        asOf: '2026-09-02',
        entries: [
          {
            ticker: 'KO',
            name: 'Coca-Cola',
            sourceEtfs: ['NOBL', 'SDY'],
            metrics: { price: 91, forwardYieldPercent: 2.144, measuredAt: '2026-09-02' }
          },
          {
            ticker: 'PG',
            name: 'Procter & Gamble',
            sourceEtfs: ['NOBL'],
            metrics: { price: 141, forwardYieldPercent: 3.196, measuredAt: '2026-09-02' }
          }
        ]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.membershipChanged).toBe(false);
    expect(diff.blocked).toBe(false);
    expect(diff.blockReasons).toEqual([]);
  });

  it('🔴 종목이 빠지면 막는다 — 배당 삭감이나 지수 탈락이라 사람이 봐야 한다', () => {
    const base = view(snapshot());
    const head = view(
      snapshot({
        entries: [{ ticker: 'KO', name: 'Coca-Cola', sourceEtfs: ['NOBL', 'SDY'], metrics: { price: 80 } }]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.removedTickers.map((member) => member.ticker)).toEqual(['PG']);
    expect(diff.membershipChanged).toBe(true);
    expect(diff.blocked).toBe(true);
    expect(diff.blockReasons.join(' ')).toContain('제외 1종(PG)');
  });

  it('종목이 추가돼도 막는다', () => {
    const base = view(snapshot());
    const head = view(
      snapshot({
        entries: [
          ...(snapshot().entries as Array<Record<string, unknown>>),
          { ticker: 'JNJ', name: 'Johnson & Johnson', sourceEtfs: ['NOBL'], metrics: { price: 160 } }
        ]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.addedTickers.map((member) => member.ticker)).toEqual(['JNJ']);
    expect(diff.blocked).toBe(true);
  });

  it('🔴 종목은 남았는데 편입 ETF 만 바뀌어도 막는다 — NOBL 탈락이 여기서만 보인다', () => {
    const base = view(snapshot());
    const head = view(
      snapshot({
        entries: [
          { ticker: 'KO', name: 'Coca-Cola', sourceEtfs: ['SDY'], metrics: { price: 80 } },
          { ticker: 'PG', name: 'Procter & Gamble', sourceEtfs: ['NOBL'], metrics: { price: 150 } }
        ]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.removedTickers).toEqual([]);
    expect(diff.etfChanges).toEqual([{ ticker: 'KO', name: 'Coca-Cola', joined: [], left: ['NOBL'] }]);
    expect(diff.membershipChanged).toBe(true);
    expect(diff.blocked).toBe(true);
  });

  it('여러 종목이 한꺼번에 바뀌면 티커 순으로 정렬해 보고한다', () => {
    const base = view(
      snapshot({
        entries: [
          { ticker: 'MMM', name: '3M', sourceEtfs: ['NOBL'] },
          { ticker: 'KO', name: 'Coca-Cola', sourceEtfs: ['NOBL'] },
          { ticker: 'ABBV', name: 'AbbVie', sourceEtfs: ['NOBL'] }
        ]
      })
    );
    const head = view(
      snapshot({
        entries: [
          { ticker: 'KO', name: 'Coca-Cola', sourceEtfs: ['NOBL'] },
          { ticker: 'ZTS', name: 'Zoetis', sourceEtfs: ['SMDV'] },
          { ticker: 'AOS', name: 'A. O. Smith', sourceEtfs: ['NOBL'] }
        ]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.addedTickers.map((member) => member.ticker)).toEqual(['AOS', 'ZTS']);
    expect(diff.removedTickers.map((member) => member.ticker)).toEqual(['ABBV', 'MMM']);
    expect(diff.counts).toEqual({ base: 3, head: 3 });
  });
});

describe('막는 신고 — 새로 생긴 것만 막는다', () => {
  const knownIssue = { ticker: 'WRB', kind: 'abnormalLatestPayment', detail: '특별배당 혼입', blocking: true };

  it('🔴 상시로 떠 있는 신고(FCPT·STAG·RLI·WRB·MBGL)로는 막지 않는다 — 막으면 자동 머지 경로가 영원히 죽는다', () => {
    const base = view(snapshot({ issues: [knownIssue] }));
    const head = view(snapshot({ issues: [{ ...knownIssue, detail: '특별배당 혼입(금액만 바뀜)' }] }));
    const diff = diffUniverseMembership(base, head);
    expect(diff.newBlockingIssues).toEqual([]);
    expect(diff.blocked).toBe(false);
  });

  it('없던 종류의 막는 신고가 생기면 막는다 — 연속증배 종목의 삭감이 여기로 온다', () => {
    const base = view(snapshot({ issues: [knownIssue] }));
    const head = view(
      snapshot({
        issues: [knownIssue, { ticker: 'KO', kind: 'streakContradiction', detail: '1회 지급액이 줄었다', blocking: true }]
      })
    );
    const diff = diffUniverseMembership(base, head);
    expect(diff.newBlockingIssues).toEqual([
      { ticker: 'KO', kind: 'streakContradiction', detail: '1회 지급액이 줄었다' }
    ]);
    expect(diff.blocked).toBe(true);
    // 구성은 그대로다 — "구성 변화"와 "새 신고"를 뭉개지 않는다.
    expect(diff.membershipChanged).toBe(false);
  });

  it('풀린 신고는 막지 않고 기록만 한다', () => {
    const base = view(snapshot({ issues: [knownIssue] }));
    const head = view(snapshot());
    const diff = diffUniverseMembership(base, head);
    expect(diff.clearedBlockingIssues.map((issue) => issue.ticker)).toEqual(['WRB']);
    expect(diff.blocked).toBe(false);
  });
});

describe('비교 기준본이 없을 때 — 모르면 사람에게', () => {
  it('첫 실행(기준본 없음)은 통과가 아니라 차단이다', () => {
    const diff = diffUniverseMembership(null, view(snapshot()));
    expect(diff.baselineMissing).toBe(true);
    expect(diff.blocked).toBe(true);
    expect(diff.blockReasons[0]).toContain('비교할 직전 생성물이 없다');
    // 262종 전부를 "편입"으로 늘어놓지 않는다 — 그건 변화가 아니라 기준이 없는 것이다.
    expect(diff.addedTickers).toEqual([]);
    expect(diff.counts.base).toBe(0);
  });
});

describe('수집 건강도 — 야후가 러너 IP 를 막은 날', () => {
  const withFetchFailures = (failed: number, total: number): UniverseMembershipView =>
    view(
      snapshot({
        entries: Array.from({ length: total }, (_, index) => ({
          ticker: `T${index}`,
          name: `Ticker ${index}`,
          sourceEtfs: ['NOBL'],
          metrics: index < failed ? null : { price: 10 }
        })),
        issues: Array.from({ length: failed }, (_, index) => ({
          ticker: `T${index}`,
          kind: 'fetchFailed',
          detail: 'HTTP 429',
          blocking: true
        }))
      })
    );

  it('전면 차단(전 종목 실패)은 커밋 전에 잡는다 — 통과시키면 실측치가 지워진 파일이 머지된다', () => {
    const health = assessCollectionHealth(withFetchFailures(100, 100));
    expect(health.ok).toBe(false);
    expect(health.detail).toContain('러너 IP');
  });

  it('개별 종목의 일시 실패(10% 이내)는 통과시킨다', () => {
    expect(assessCollectionHealth(withFetchFailures(10, 100)).ok).toBe(true);
    expect(assessCollectionHealth(withFetchFailures(11, 100)).ok).toBe(false);
    expect(assessCollectionHealth(withFetchFailures(0, 100)).ok).toBe(true);
  });

  it('종목이 0종이면 소스 파싱이 통째로 깨진 것이다', () => {
    const empty = { ...view(snapshot()), members: [], fetchFailedCount: 0 };
    expect(assessCollectionHealth(empty).ok).toBe(false);
  });
});

describe('PR 본문 — 사람이 이 글만 읽고 머지 여부를 정할 수 있어야 한다', () => {
  it('막힌 경우 판정과 이유·해당 종목이 본문에 있다', () => {
    const base = view(snapshot());
    const head = view(
      snapshot({
        entries: [{ ticker: 'KO', name: 'Coca-Cola', sourceEtfs: ['NOBL', 'SDY'], metrics: { price: 80 } }]
      })
    );
    const diff = diffUniverseMembership(base, head);
    const report = formatMembershipReport(diff, head, assessCollectionHealth(head));
    expect(report).toContain('자동 머지를 막았다');
    expect(report).toContain('제외 -1');
    expect(report).toContain('`PG` Procter & Gamble');
    expect(report).toContain('배당 삭감이나 지수 탈락');
  });

  it('통과한 경우도 무엇이 바뀌었는지 밝힌다', () => {
    const head = view(snapshot());
    const diff = diffUniverseMembership(view(snapshot()), head);
    const report = formatMembershipReport(diff, head, assessCollectionHealth(head));
    expect(report).toContain('필드만 바뀌었다');
    expect(report).toContain('지표 2/2');
  });
});

describe('워크플로 계약 — 실행해 볼 수 없으니 참조만이라도 잠근다', () => {
  const WORKFLOW_DIR = resolve(REPO_ROOT, '.github/workflows');
  const workflowFiles = readdirSync(WORKFLOW_DIR).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
  const packageScripts = Object.keys(
    (JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf-8')) as { scripts: Record<string, string> })
      .scripts
  );
  const universeWorkflow = readFileSync(resolve(WORKFLOW_DIR, 'refresh-dividend-universe.yml'), 'utf-8');

  it('워크플로가 부르는 npm 스크립트는 전부 package.json 에 실재한다', () => {
    const missing: string[] = [];
    for (const file of workflowFiles) {
      const source = readFileSync(resolve(WORKFLOW_DIR, file), 'utf-8');
      for (const match of source.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)) {
        if (!packageScripts.includes(match[1])) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('매월 2일에 돌고, 기존 티커 갱신(매월 1일)과 같은 날 겹치지 않는다', () => {
    expect(universeWorkflow).toContain("cron: '0 20 2 * *'");
    const tickerWorkflow = readFileSync(resolve(WORKFLOW_DIR, 'refresh-tickers.yml'), 'utf-8');
    expect(tickerWorkflow).toContain("cron: '0 21 1 * *'");
  });

  it('🔴 머지 명령 앞에 구성 변화 차단이 있다', () => {
    const mergeIndex = universeWorkflow.indexOf('gh pr merge');
    const guardIndex = universeWorkflow.indexOf('if [ "$BLOCKED" != "false" ]; then\n            echo "::warning::');
    expect(mergeIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(mergeIndex);
  });

  it('수동 실행과 부분 실행 옵션이 노출돼 있다', () => {
    expect(universeWorkflow).toContain('workflow_dispatch:');
    expect(universeWorkflow).toContain('--limit=');
    expect(universeWorkflow).toContain('--delay=');
  });
});
