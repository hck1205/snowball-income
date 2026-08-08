// @vitest-environment node — fetch 는 명시적으로 주입한다.
import { describe, expect, it } from 'vitest';
import { LAYOUT_PROBE_ROWS, pickHeaderRow, probeSheetLayout } from '@/shared/lib/googleSheets';

/**
 * P3 — **실제 시트에서 헤더 줄을 찾아낸다.**
 *
 * 여기가 없으면 레이아웃 감지는 실제 시트에 닿지 못한다. 연결 흐름은 그동안 **1행만** 헤더로 읽었고,
 * 널리 쓰이는 가계부 템플릿은 1행이 제목·안내문이고 진짜 헤더가 11행에 있다 — 그 시트에 1행만
 * 물으면 안내 문구를 헤더로 읽고 매핑을 하나도 못 잡는다.
 */

/** 실측 템플릿을 재현한다: 1행 제목, 2~10행 안내·요약, 11행이 진짜 헤더, 그 아래가 데이터. */
const templateRows = (blocks: number): string[][] => {
  const header: string[] = [''];
  for (let i = 0; i < blocks; i += 1) {
    header.push('날짜', '항목(복사금지)', '상세항목(복사금지)', '지출금액(원)', '상세내용', '');
  }
  const rows: string[][] = [
    ['2026 가계부 시트_1인가구 Ver2.2'],
    ['- 본 파일 사용을 위해서는 사본 만들기를 선택하세요'],
    [],
    ['', '', '항목', '합계', '0', '상세내용'],
    ['', '자동계산', '주거비', '850000'],
    ['', '자동계산', '생활비', '244290'],
    [],
    [],
    [],
    ['', '', '↓드롭다운메뉴↓'],
    header,
    ['', '고정지출', '주거비', '월세', '700000', '오피스텔 월세']
  ];
  return rows;
};

const stubFetch = (rows: readonly (readonly string[])[]): typeof fetch =>
  async () =>
    new Response(JSON.stringify({ values: rows }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

const context = (rows: readonly (readonly string[])[]) => ({ accessToken: 't', fetchImpl: stubFetch(rows) });

describe('헤더 줄 고르기', () => {
  it('⭐ 제목·안내문을 지나 진짜 헤더 줄을 고른다', () => {
    const picked = pickHeaderRow(templateRows(15));

    expect(picked).not.toBeNull();
    expect(picked?.index).toBe(10); // 0-based → 11행
  });

  it('🔴 필드가 두 개뿐인 줄은 헤더로 보지 않는다 (우연히 맞을 수 있다)', () => {
    expect(pickHeaderRow([['항목', '합계']])).toBeNull();
  });

  it('동점이면 위쪽이 이긴다 (표는 보통 위에서 시작한다)', () => {
    const rows = [
      ['날짜', '금액', '항목'],
      ['날짜', '금액', '항목']
    ];

    expect(pickHeaderRow(rows)?.index).toBe(0);
  });

  it('평범한 시트는 1행이 헤더다', () => {
    expect(pickHeaderRow([['날짜', '구분', '금액', '분류']])?.index).toBe(0);
  });
});

describe('시트 훑기', () => {
  it('⭐ 블록 템플릿을 monthBlock 으로, 헤더 줄을 11행으로 잡는다', async () => {
    const result = await probeSheetLayout(context(templateRows(15)), {
      spreadsheetId: 's',
      sheetTitle: '가계부 작성'
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layout.kind).toBe('monthBlock');
    expect(result.value.headerRow).toBe(11);
  });

  it('⭐ 구분 열이 없으면 사용자에게 물어야 한다고 알린다', async () => {
    const result = await probeSheetLayout(context(templateRows(15)), {
      spreadsheetId: 's',
      sheetTitle: '가계부 작성'
    });

    expect(result.ok && result.value.needsKindChoice).toBe(true);
  });

  it('평범한 세로 시트는 flat + 1행이다', async () => {
    const result = await probeSheetLayout(context([['날짜', '구분', '금액', '분류', '메모']]), {
      spreadsheetId: 's',
      sheetTitle: '가계부'
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layout.kind).toBe('flat');
    expect(result.value.headerRow).toBe(1);
    expect(result.value.needsKindChoice).toBe(false);
  });

  it('🔴 헤더다운 줄이 없으면 기존 흐름 그대로 1행으로 떨어진다', async () => {
    const result = await probeSheetLayout(context([['안녕하세요'], ['그냥 메모']]), {
      spreadsheetId: 's',
      sheetTitle: '아무거나'
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layout.kind).toBe('flat');
    expect(result.value.headerRow).toBe(1);
    expect(result.value.headers).toEqual(['안녕하세요']);
  });

  it('빈 시트도 실패가 아니다', async () => {
    const result = await probeSheetLayout({ accessToken: 't', fetchImpl: async () => new Response('{}', { status: 200 }) }, {
      spreadsheetId: 's',
      sheetTitle: '빈 시트'
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.headers).toEqual([]);
  });

  it('조회 실패는 지어내지 않고 그대로 돌려준다', async () => {
    const result = await probeSheetLayout(
      { accessToken: 't', fetchImpl: async () => new Response('{}', { status: 403 }) },
      { spreadsheetId: 's', sheetTitle: '가계부' }
    );

    expect(result.ok).toBe(false);
  });

  it('훑는 줄 수가 실측 헤더(11행)에 닿는다', () => {
    expect(LAYOUT_PROBE_ROWS).toBeGreaterThanOrEqual(11);
  });
});
