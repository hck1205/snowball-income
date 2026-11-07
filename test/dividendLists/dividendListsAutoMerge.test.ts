import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { diffDividendListMembership, formatMembershipDeltas } from '@/scripts/dividendLists';

/**
 * 배당 목록 월간 갱신의 **자동 머지 판정**(2026-11-06).
 *
 * 이 워크플로는 늘 사람 확인을 기다렸다. 2026-11-05 부터 매달 배당률도 다시 재면서 멤버십이 그대로인
 * 달에도 PR 이 열리게 됐고, 머지하지 않으면 배당률이 다시 멈춘다. 그래서 **종목이 들고 나지 않은 달은
 * 자동 머지**한다. 지키는 것은 둘이다 — ① 종목이 빠졌는데 자동 머지되는 것 ② 값만 바뀌었는데 멈추는 것.
 */

const snapshot = (overrides: { kings?: string[]; aristocrats?: string[]; hidden?: string[]; dex?: string[] } = {}) => ({
  lists: {
    lists: {
      aristocrats: { asOf: '2026-11-05', members: (overrides.aristocrats ?? ['ABBV', 'KO']).map((ticker) => ({ ticker, forwardYieldPercent: 2 })) },
      ...(overrides.kings ? { kings: { members: overrides.kings.map((ticker) => ({ ticker })) } } : {})
    }
  },
  hiddenStars: { asOf: '2026-11-03', members: (overrides.hidden ?? ['NSP']).map((ticker) => ({ ticker })) },
  dex: { asOf: '2026-11-05', entries: (overrides.dex ?? ['ABBV', 'KO', 'NSP']).map((ticker, index) => ({ number: index + 1, ticker })) }
});

describe('멤버십 변화 판정', () => {
  it('🔴 값·날짜만 바뀌면 변화 없음 — 자동 머지 경로가 산다', () => {
    const before = snapshot();
    const after = snapshot();
    (after.lists.lists.aristocrats as { asOf: string }).asOf = '2026-12-05';
    after.lists.lists.aristocrats.members[0].forwardYieldPercent = 2.4;
    after.dex.asOf = '2026-12-05';

    expect(diffDividendListMembership(before, after)).toEqual([]);
  });

  it('🔴 목록에서 종목이 빠지면 변화 있음 — 사람이 본다', () => {
    const deltas = diffDividendListMembership(snapshot(), snapshot({ aristocrats: ['ABBV'] }));
    expect(deltas).toEqual([{ scope: '목록 aristocrats', added: [], removed: ['KO'] }]);
  });

  it('히든스타 편입도 변화다', () => {
    const deltas = diffDividendListMembership(snapshot(), snapshot({ hidden: ['NSP', 'EMN'] }));
    expect(deltas).toEqual([{ scope: '히든스타', added: ['EMN'], removed: [] }]);
  });

  it('도감 카드 추가도 변화다 — 번호는 append-only 라 되돌릴 수 없다', () => {
    const deltas = diffDividendListMembership(snapshot(), snapshot({ dex: ['ABBV', 'KO', 'NSP', 'EMN'] }));
    expect(deltas).toEqual([{ scope: '도감', added: ['EMN'], removed: [] }]);
  });

  it('목록이 새로 생기거나 사라지는 것도 변화다', () => {
    const deltas = diffDividendListMembership(snapshot(), snapshot({ kings: ['KO'] }));
    expect(deltas).toEqual([{ scope: '목록 kings', added: ['KO'], removed: [] }]);
  });

  it('PR 본문 요약 줄', () => {
    expect(formatMembershipDeltas([{ scope: '히든스타', added: ['EMN'], removed: ['EIX', 'APOG'] }])).toEqual([
      '- **히든스타** — 편입 EMN / 제외 EIX, APOG'
    ]);
  });

  it('🔴 실제 생성물의 모양을 읽는다 — 필드 이름이 틀리면 늘 "변화 없음"이 되어 사건을 놓친다', () => {
    const read = (path: string) => JSON.parse(readFileSync(resolve(__dirname, '../..', path), 'utf8')) as unknown;
    const real = {
      lists: read('shared/constants/dividendLists/dividendLists.generated.json'),
      hiddenStars: read('shared/constants/dividendLists/dividendLists.hiddenStars.generated.json'),
      dex: read('shared/constants/dividendDex/dividendDex.generated.json')
    };
    const empty = { lists: { lists: {} }, hiddenStars: { members: [] }, dex: { entries: [] } };
    const scopes = diffDividendListMembership(empty, real).map((delta) => delta.scope);

    expect(scopes).toContain('목록 aristocrats');
    expect(scopes).toContain('히든스타');
    expect(scopes).toContain('도감');
  });
});

describe('워크플로 배선', () => {
  const dir = resolve(__dirname, '../../.github/workflows');
  const read = (name: string) => readFileSync(resolve(dir, name), 'utf8').replace(/\r\n/g, '\n');
  const lists = read('refresh-dividend-lists.yml');

  it('🔴 판정은 커밋 전에, 자동 머지는 "변화 없음"일 때만', () => {
    expect(lists.indexOf('npm run dividend:lists:membership')).toBeLessThan(lists.indexOf('name: Commit the refreshed lists'));
    expect(lists).toMatch(/name: Auto-merge when membership is unchanged\n\s+if: steps\.commit\.outputs\.committed == 'true' && steps\.membership\.outputs\.changed == 'false'/);
    expect(lists).toMatch(/name: Open the PR for review\n\s+if: steps\.commit\.outputs\.committed == 'true' && steps\.membership\.outputs\.changed != 'false'/);
  });

  it('🔴 판정이 비면(단계 실패) 사람 확인 쪽으로 간다 — `!= false` 라서', () => {
    // changed 가 비어 있으면 자동 머지 조건(== false)은 거짓, 사람 확인 조건(!= false)은 참이다.
    expect(lists).not.toMatch(/name: Open the PR for review\n\s+if:[^\n]*changed == 'true'/);
  });

  /**
   * 2026-11-06 에 "머지 전 `sleep 30`"을 넣었으나 다음 날 같은 실패가 그대로 났다 — 봇이 만든 PR 의 CI 실행은
   * 승인 대기에서 시작하지 못하므로 기다려도 소용이 없다(CLAUDE.md "CI 빨간 PR"). 효과 없는 대기가
   * 다시 들어와 갱신 잡마다 시간을 버리지 않게 잠근다.
   */
  it('🔴 자동 머지 직전에 대기를 넣지 않는다 — 기다려도 "작업 0개 실패"는 안 고쳐진다', () => {
    const autoMerging = readdirSync(dir).filter((name) => name.startsWith('refresh-') && read(name).includes('gh pr merge'));
    expect(autoMerging.length).toBeGreaterThan(5);
    for (const name of autoMerging) {
      expect(read(name), name).not.toMatch(/^\s*sleep \d+\s*\n\s*gh pr merge /m);
    }
  });
});
