import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DividendListTable } from '@/pages/DividendList/components';
import { DIVIDEND_LIST_COPY } from '@/pages/DividendList/copy';
import {
  DEFAULT_DIVIDEND_LIST_SORT,
  nextDividendListSort,
  sortDividendListRows,
  sortableDividendListKeys
} from '@/pages/DividendList/utils';
import type { DividendListRow, DividendListSort, DividendListSortKey } from '@/pages/DividendList/utils';

const copy = DIVIDEND_LIST_COPY.page;

/**
 * 표에 붙은 **네 필드**(배당률·연속 증배·5년 배당성장·섹터)의 화면 계약.
 *
 * 잠그는 것 넷:
 *  ① 네 열이 실제로 그려지고, 값이 갈리는 열은 **정렬 축**이 된다(aria-sort 가 그 사실을 말한다).
 *  ② 🔴 **부호를 색으로만 말하지 않는다** — 성장률 문자열에 `+`/`-` 가 반드시 들어 있다.
 *  ③ 🔴 빈칸이 "0"·"없음"으로 읽히지 않는다 — "—" 옆에 **이유 문장**이 보조기술용 텍스트로 함께 있다.
 *  ④ 하한("50년 이상")과 정확값("68년")이 **다른 모양**으로 그려진다.
 *
 * ⚠ 색 자체(Emotion 클래스)는 테스트하지 않는다 — 이 레포는 className 기반 테스트를 금지한다.
 *   여기서 잡는 것은 "색이 사라져도 남는 채널"이 있느냐다.
 */
const row = (ticker: string, overrides: Partial<DividendListRow> = {}): DividendListRow => ({
  ticker,
  name: `${ticker} Inc`,
  sector: 'utilities',
  sectorLabel: '유틸리티',
  yield: { known: true, text: '2.44%', value: 2.441 },
  streak: { known: true, kind: 'atLeast', text: '50년', qualifier: '이상', value: 50, source: null },
  growth: { known: true, text: '+4.46%', value: 4.46, direction: 'up' },
  confirmedBy: ['테스트 자료'],
  measuredAt: '2026-08-04',
  tickerPagePath: null,
  ...overrides
});

const ROWS: DividendListRow[] = [
  row('KO', { sector: 'consumerStaples', sectorLabel: '필수소비재' }),
  row('PG', {
    yield: { known: true, text: '3.01%', value: 3.005 },
    growth: { known: false, reason: 'growthHistory' },
    streak: { known: true, kind: 'exact', text: '68년', qualifier: null, value: 68, source: '증배 67회 · 마지막 증배 2026-04' }
  }),
  row('WRB', {
    yield: { known: false, reason: 'irregularPayout' },
    growth: { known: true, text: '-1.20%', value: -1.2, direction: 'down' }
  }),
  row('YORW', { sector: null, sectorLabel: null })
];

const SORT_KEYS: DividendListSortKey[] = ['ticker', 'name', 'yield', 'streak', 'growth', 'sector'];

/** 실제 페이지와 **같은 순수 함수**로 상태를 도는 하네스. 정렬이 도는지를 통합으로 잰다. */
function Harness({ rows = ROWS }: { rows?: DividendListRow[] }) {
  const [sort, setSort] = useState<DividendListSort>(DEFAULT_DIVIDEND_LIST_SORT);
  return (
    <MemoryRouter>
      <DividendListTable
        rows={sortDividendListRows(rows, sort)}
        caption="테스트 목록"
        sort={sort}
        onSortChange={(key) => setSort((prev) => nextDividendListSort(prev, key))}
        sortableKeys={sortableDividendListKeys(rows, SORT_KEYS)}
      />
    </MemoryRouter>
  );
}

const headerNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('columnheader')
    .map((cell) => cell.textContent ?? '');

const tickerOrder = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getAllByRole('cell')[0].textContent?.trim() ?? '');

describe('배당 목록 표의 네 필드', () => {
  it('배당률·연속 증배·5년 배당성장·섹터 열이 모두 그려진다', () => {
    render(<Harness />);
    const headers = headerNames();
    for (const header of [copy.columnYield, copy.columnStreak, copy.columnGrowth, copy.columnSector]) {
      expect(headers.some((text) => text.includes(header))).toBe(true);
    }
  });

  it('배당률 열을 누르면 순서가 바뀌고 aria-sort 가 따라온다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const before = tickerOrder();
    await user.click(screen.getByRole('button', { name: copy.columnYield }));

    // 오름차순: 2.44(KO) → 3.01(PG) → 값 없음(WRB)은 맨 아래.
    expect(tickerOrder()).not.toEqual(before);
    expect(tickerOrder()[0]).toBe('KO');
    expect(tickerOrder()[tickerOrder().length - 1]).toBe('WRB');

    const yieldHeader = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .find((cell) => (cell.textContent ?? '').includes(copy.columnYield));
    expect(yieldHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(yieldHeader!).getByRole('button'));
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('columnheader')
        .find((cell) => (cell.textContent ?? '').includes(copy.columnYield))
    ).toHaveAttribute('aria-sort', 'descending');
    // 🔴 방향을 뒤집어도 값 없는 줄은 여전히 맨 아래여야 한다.
    expect(tickerOrder()[tickerOrder().length - 1]).toBe('WRB');
  });

  it('5년 배당성장 열도 정렬 축이다 — 음수가 위로 올라오지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: copy.columnGrowth }));
    expect(tickerOrder()[0]).toBe('WRB'); // -1.20% 가 최솟값
    expect(tickerOrder()[tickerOrder().length - 1]).toBe('PG'); // 값 없음
  });

  it('섹터 열도 정렬 축이고, 섹터를 모르는 줄은 맨 아래로 간다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: copy.columnSector }));
    expect(tickerOrder()[tickerOrder().length - 1]).toBe('YORW');
  });

  it('🔴 값이 전부 같은 열은 정렬 버튼이 아니다 — 눌러도 순서가 안 바뀌는 컨트롤을 만들지 않는다', () => {
    // 연속 증배가 전부 "50년 이상"인 목록(= 배당킹의 실제 형태).
    const uniform = [row('AWR'), row('DOV'), row('KO')];
    render(<Harness rows={uniform} />);
    expect(screen.queryByRole('button', { name: copy.columnStreak })).toBeNull();
    // 열 자체는 남아 있어야 한다(정렬만 못 할 뿐 값은 정보다).
    expect(headerNames().some((text) => text.includes(copy.columnStreak))).toBe(true);
  });

  it('🔴 성장률의 부호는 색이 아니라 글자가 말한다', () => {
    render(<Harness />);
    // 색을 못 보는 사람에게도 남는 채널 — 부호가 문자열 안에 있다.
    expect(screen.getAllByText('+4.46%').length).toBeGreaterThan(0);
    expect(screen.getByText('-1.20%')).toBeInTheDocument();
    // 부호 없는 배당률과 부호 있는 성장률이 같은 자릿수로 그려진다(포맷터가 하나라는 증거).
    expect(screen.getByText('3.01%')).toBeInTheDocument();
  });

  it('🔴 빈칸은 "0"이 아니라 "—" 이고, 왜 비었는지가 화면 텍스트로 함께 있다', () => {
    render(<Harness />);

    // 값이 없는 칸은 셋이다(PG 성장률 · WRB 배당률 · YORW 섹터).
    expect(screen.getAllByText(copy.unknownMark)).toHaveLength(3);
    expect(screen.getByText(copy.unknownReason.growthHistory)).toBeInTheDocument();
    expect(screen.getByText(copy.unknownReason.irregularPayout)).toBeInTheDocument();
    expect(screen.getByText(copy.unknownReason.sectorSource)).toBeInTheDocument();
    // 0 으로 읽힐 여지를 남기지 않는다.
    expect(screen.queryByText('0%')).toBeNull();
    expect(screen.queryByText('0.00%')).toBeNull();
  });

  it('🔴 하한과 정확값이 다른 모양으로 그려진다 — "50년 이상"이 우리가 센 값으로 읽히면 안 된다', () => {
    render(<Harness />);

    // 하한에는 한정어가 붙고, 정확값에는 없다.
    expect(screen.getAllByText('이상').length).toBeGreaterThan(0);
    const exact = screen.getByText('68년');
    // 정확값의 툴팁에는 근거가 함께 붙는다 — 출처 없는 숫자를 화면에 세우지 않는다.
    expect(exact.getAttribute('title')).toContain(copy.streakExactTitle);
    expect(exact.getAttribute('title')).toContain('증배 67회');
    expect(within(exact).queryByText('이상')).toBeNull();

    const bound = screen.getAllByTitle(copy.streakBoundTitle);
    expect(bound.length).toBeGreaterThan(0);
    expect(within(bound[0]).getByText('이상')).toBeInTheDocument();
  });

  it('행 카드로 접히는 좁은 폭을 위해 모든 셀이 자기 라벨을 갖는다', () => {
    render(<Harness />);
    // 좁은 폭에서는 thead 가 사라지고 `data-label` 이 유일한 라벨이 된다 — 없으면 숫자 기둥만 남는다.
    const firstBodyRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    const labels = within(firstBodyRow)
      .getAllByRole('cell')
      .map((cell) => cell.getAttribute('data-label'));
    expect(labels).toEqual([
      copy.columnTicker,
      copy.columnName,
      copy.columnYield,
      copy.columnStreak,
      copy.columnGrowth,
      copy.columnSector,
      copy.columnConfirmedBy
    ]);
  });
});
