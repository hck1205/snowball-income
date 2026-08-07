// @vitest-environment node — fetch 는 명시적으로 주입한다.
import { describe, expect, it } from 'vitest';
import { detectLedgerLayout, readMonthBlockSheet, type MonthBlockLayout } from '@/shared/lib/googleSheets';

/**
 * P3 — **가로 월별 블록 시트를 실제로 읽는다.**
 *
 * `layout.test.ts` 가 "알아보는가"를 보고, 여기서는 "읽어서 이어 붙이는가"를 본다. 이 둘이 서면
 * 헤비 유저의 시트가 앱에 들어온다.
 *
 * 🔴 이 경로는 **읽기 전용**이다. 반환에 `ref`(쓰기 참조)가 없는 것이 그 약속의 코드다 —
 *    블록 레이아웃에서는 행 번호가 행을 식별하지 못한다(12행이 15칸에 있다).
 */

/** 블록당 6열(날짜·항목·상세항목·금액·내용·여백), 앞에 헬퍼 열 1개. */
const headerRow = (blocks: number): string[] => {
  const row: string[] = [''];
  for (let i = 0; i < blocks; i += 1) {
    row.push('날짜', '항목(복사금지)', '상세항목(복사금지)', '지출금액(원)', '상세내용', '');
  }
  return row;
};

/** 요청 순서대로 열 값을 돌려주는 fetch. 범위 개수만큼 응답을 만든다. */
const stubFetch = (columnsByRange: readonly (readonly string[])[]): typeof fetch => {
  return async () =>
    new Response(
      JSON.stringify({
        valueRanges: columnsByRange.map((values) => (values.length === 0 ? {} : { values: [values] }))
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
};

const layoutOf = (blocks: number): MonthBlockLayout =>
  detectLedgerLayout(headerRow(blocks), 11) as MonthBlockLayout;

describe('블록 읽기', () => {
  it('⭐ 두 달 블록의 기록을 한 줄기로 이어 붙인다', async () => {
    const layout = layoutOf(2);
    /*
     * 블록마다 매핑된 열은 날짜·항목·상세항목·금액·내용 다섯이다(`구분` 열이 없어 날짜 열을
     * 빌려 쓰므로 실제 요청 열은 다섯). 순서는 열 인덱스 오름차순.
     */
    const block1 = [['2026-01-03'], ['식비'], ['외식'], ['29000'], ['하나로마트']];
    const block2 = [['2026-02-05'], ['주거'], ['월세'], ['700000'], ['오피스텔']];

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: stubFetch([...block1, ...block2]) },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout, assumeKind: 'expense' }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.entries).toHaveLength(2);
    expect(result.value.entries[0]).toMatchObject({ date: '2026-01-03', amount: 29_000, category: '식비' });
    expect(result.value.entries[1]).toMatchObject({ date: '2026-02-05', amount: 700_000, category: '주거' });
  });

  it('⭐ 구분 열이 없는 시트는 호출부가 정한 구분으로 읽힌다', async () => {
    /* 🔴 블록은 최소 2개여야 감지된다(한 번만 나오는 `항목` 은 반복이 아니다). 두 번째는 비운다. */
    const layout = layoutOf(2);
    const block = [['2026-01-03'], ['식비'], ['외식'], ['29000'], ['하나로마트'], [], [], [], [], []];

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: stubFetch(block) },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout, assumeKind: 'expense' }
    );

    expect(result.ok && result.value.entries[0].kind).toBe('expense');
  });

  it('🔴 반환 항목에 쓰기 참조(ref)가 없다 — 읽기 전용이라는 약속의 코드', async () => {
    /* 🔴 블록은 최소 2개여야 감지된다(한 번만 나오는 `항목` 은 반복이 아니다). 두 번째는 비운다. */
    const layout = layoutOf(2);
    const block = [['2026-01-03'], ['식비'], ['외식'], ['29000'], ['하나로마트'], [], [], [], [], []];

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: stubFetch(block) },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout, assumeKind: 'expense' }
    );

    expect(result.ok && 'ref' in result.value.entries[0]).toBe(false);
  });

  it('값이 있는 블록 수를 센다 ("15개월 중 2개월만 쓰셨습니다")', async () => {
    const layout = layoutOf(3);
    const filled = [['2026-01-03'], ['식비'], ['외식'], ['29000'], ['하나로마트']];
    const empty = [[], [], [], [], []];

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: stubFetch([...filled, ...empty, ...filled]) },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout, assumeKind: 'expense' }
    );

    expect(result.ok && result.value.blocksWithData).toBe(2);
  });

  it('🔴 못 읽은 행은 몇 번째 달인지와 함께 보고된다 (시트에서 찾을 수 있어야 한다)', async () => {
    const layout = layoutOf(2);
    const good = [['2026-01-03'], ['식비'], ['외식'], ['29000'], ['하나로마트']];
    const broken = [['어제'], ['주거'], ['월세'], ['700000'], ['오피스텔']];

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: stubFetch([...good, ...broken]) },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout, assumeKind: 'expense' }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.entries).toHaveLength(1);
    expect(result.value.unreadableRows[0].reasons[0]).toContain('2번째 달');
  });

  it('조회가 실패하면 지어내지 않고 실패로 돌려준다', async () => {
    const layout = layoutOf(2);
    const failing: typeof fetch = async () => new Response(JSON.stringify({}), { status: 500 });

    const result = await readMonthBlockSheet(
      { accessToken: 't', fetchImpl: failing },
      { spreadsheetId: 's', sheetTitle: '가계부 작성', layout }
    );

    expect(result.ok).toBe(false);
  });
});
