import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEDGER_VIEW_TAB,
  LEDGER_PAYER_SCOPE_ALL,
  LEDGER_VIEW_TAB_IDS,
  LEDGER_VIEW_TAB_SHEET_TITLE,
  buildLedgerViewTabs,
  collectPayers,
  filterByPayerScope,
  resolveLedgerViewTab,
  resolvePayerScope,
  shouldOfferPayerScope
} from '@/pages/Ledger/utils';
import { BLUEPRINT_TABS } from '@/shared/lib/googleSheets';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';

const entry = (rowNumber: number, payer: string | undefined, amount: number, status?: string): LedgerEntry => ({
  ref: { snapshotId: 's1', rowNumber },
  date: '2026-08-01',
  kind: 'expense',
  amount,
  category: '식비',
  fixity: 'variable',
  ...(payer === undefined ? {} : { payer }),
  ...(status === undefined ? {} : { status }),
  seen: {}
});

describe('화면 탭', () => {
  it('⭐ 앱 시트면 넷 다 쓸 수 있다', () => {
    const tabs = buildLedgerViewTabs(true);

    expect(tabs.map((tab) => tab.id)).toEqual([...LEDGER_VIEW_TAB_IDS]);
    expect(tabs.every((tab) => tab.isAvailable)).toBe(true);
  });

  it('⭐ 앱 시트가 아니면 기록과 한눈에 보기만 쓸 수 있다', () => {
    const tabs = buildLedgerViewTabs(false);

    /*
     * 🔴 `report` 는 **시트 탭이 아니다** — 앱이 읽은 것을 그리는 화면이라, 가계부 하나만
     *    연결해도 흐름·구성은 그려진다(자산·투자 구획만 비어 있을 뿐이다).
     */
    expect(tabs.filter((tab) => tab.isAvailable).map((tab) => tab.id)).toEqual(['entries', 'report']);
  });

  it('🔴 막힌 탭에는 반드시 사유가 있다 — 무음 비활성 금지', () => {
    for (const tab of buildLedgerViewTabs(false)) {
      if (tab.isAvailable) continue;
      expect(tab.unavailableReason, tab.id).toBeTruthy();
      /* 원인을 틀리게 말하면 사용자가 엉뚱한 곳(공유 설정)을 고치려 든다. */
      expect(tab.unavailableReason).not.toContain('권한');
    }
  });

  it('🔴 시트 탭 이름을 두 곳에 적지 않는다 — 청사진에서 가져온다', () => {
    expect(LEDGER_VIEW_TAB_SHEET_TITLE.entries).toBe(BLUEPRINT_TABS.ledger);
    expect(LEDGER_VIEW_TAB_SHEET_TITLE.holdings).toBe(BLUEPRINT_TABS.holdings);
    expect(LEDGER_VIEW_TAB_SHEET_TITLE.investments).toBe(BLUEPRINT_TABS.investments);
    expect(LEDGER_VIEW_TAB_SHEET_TITLE.rules).toBe(BLUEPRINT_TABS.rules);
  });

  it('⭐ 쓸 수 없는 탭을 고르고 있으면 기본 탭으로 되돌린다 — 안 그러면 빈 화면이 나온다', () => {
    const tabs = buildLedgerViewTabs(false);

    expect(resolveLedgerViewTab('investments', tabs)).toBe(DEFAULT_LEDGER_VIEW_TAB);
    /* 쓸 수 있으면 그대로 둔다. */
    expect(resolveLedgerViewTab('investments', buildLedgerViewTabs(true))).toBe('investments');
  });

  it('기본 탭은 기록이다 — 가계부를 열었으니 기록이 먼저 보여야 한다', () => {
    expect(DEFAULT_LEDGER_VIEW_TAB).toBe('entries');
  });
});

describe('🔴 주체 범위 — 겹치지 않게 나눈다', () => {
  const entries = [
    entry(2, '아내', 10000),
    entry(3, '남편', 20000),
    entry(4, undefined, 30000),
    entry(5, LEDGER_PAYER_SHARED, 40000)
  ];

  it('⭐ 각 주체 합의 총합이 전체와 정확히 같다 — 이게 이 설계의 이유다', () => {
    const payers = collectPayers(entries);
    const total = entries.reduce((sum, item) => sum + item.amount, 0);

    const partitioned = payers.reduce(
      (sum, payer) => sum + filterByPayerScope(entries, payer).reduce((inner, item) => inner + item.amount, 0),
      0
    );

    expect(partitioned).toBe(total);
  });

  it('⭐ 한 사람을 고르면 공동은 안 들어온다 — 들어오면 사람별 합의 총합이 전체를 넘는다', () => {
    const wife = filterByPayerScope(entries, '아내');

    expect(wife).toHaveLength(1);
    expect(wife[0].amount).toBe(10000);
  });

  it('공동은 하나의 선택지다 — 빈 칸과 “공동”이라 적은 것이 같이 잡힌다', () => {
    const shared = filterByPayerScope(entries, LEDGER_PAYER_SHARED);

    expect(shared.map((item) => item.amount).sort((a, b) => a - b)).toEqual([30000, 40000]);
  });

  it('전체는 좁히지 않는다', () => {
    expect(filterByPayerScope(entries, LEDGER_PAYER_SCOPE_ALL)).toHaveLength(4);
  });

  it('공동은 목록 마지막이다', () => {
    expect(collectPayers(entries)).toEqual(['남편', '아내', LEDGER_PAYER_SHARED]);
  });

  it('🔴 지운 행의 주체는 목록에 남지 않는다', () => {
    const withDeleted = [entry(2, '아내', 10000), entry(3, '전애인', 5000, '삭제됨')];

    expect(collectPayers(withDeleted)).toEqual(['아내']);
  });

  it('🔴 혼자 쓰면 필터를 만들지 않는다 — 선택지 하나인 컨트롤은 화면의 거짓말이다', () => {
    expect(shouldOfferPayerScope(collectPayers([entry(2, undefined, 10000)]))).toBe(false);
    expect(shouldOfferPayerScope(collectPayers(entries))).toBe(true);
  });

  it('⭐ 고른 주체가 그 달에 없으면 전체로 되돌린다 — 안 그러면 빈 목록이 "기록이 사라진 것"처럼 보인다', () => {
    const onlyHusband = collectPayers([entry(2, '남편', 1000)]);

    expect(resolvePayerScope('아내', onlyHusband)).toBe(LEDGER_PAYER_SCOPE_ALL);
    expect(resolvePayerScope('남편', onlyHusband)).toBe('남편');
  });
});
