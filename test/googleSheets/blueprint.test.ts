import { describe, expect, it } from 'vitest';
import {
  APP_SHEET_HEADERS,
  APP_SHEET_TAB_TITLE,
  BLUEPRINT_TABS,
  BLUEPRINT_TAB_ORDER,
  KIND_CHOICES,
  BLUEPRINT_TAB_ROLE,
  buildCreateSpreadsheetBody,
  buildFormatRequests,
  findGridOverflow
} from '@/shared/lib/googleSheets';
import { LEDGER_CATEGORIES, LEDGER_HOLDING_LABEL } from '@/shared/constants/ledger';

/**
 * 앱이 만드는 스프레드시트의 **설계도**.
 *
 * 🔴 실제 시트를 만들어 눈으로 볼 수 없는 자리다(구글 계정이 필요하다). 그래서 여기서 잠그는 것은
 *    "예쁜가"가 아니라 **"틀리면 숫자가 어긋나는 것들"** 이다 — 탭 순서, 수식이 보는 열, 삭제된
 *    행 제외, 드롭다운이 앱 쓰기를 막지 않는지.
 *
 * ⚠ 서식(색·폭)은 테스트하지 않는다. 취향이고, 잘못돼도 숫자가 틀리지 않는다.
 */

const body = () => buildCreateSpreadsheetBody('테스트 가계부') as {
  properties: { title: string; locale: string; timeZone: string };
  sheets: {
    properties: { title: string; gridProperties: { columnCount: number; frozenRowCount?: number } };
    data: { rowData: { values?: { userEnteredValue: Record<string, string> }[] }[] }[];
  }[];
};

/**
 * 셀 값을 문자열로 편다.
 *
 * ⚠ 수식은 `formulaValue`, 나머지는 `stringValue` 다 — 한쪽만 읽으면 수식 검사가 통째로 헛돈다
 *   (실제로 `stringValue` 만 읽다가, 수식을 formulaValue 로 고친 순간 네 개가 조용히 빈 문자열이 됐다).
 */
const cellText = (cell: { userEnteredValue: Record<string, string> }): string =>
  cell.userEnteredValue.formulaValue ?? cell.userEnteredValue.stringValue ?? '';

const rowsOf = (title: string): string[][] => {
  const sheet = body().sheets.find((candidate) => candidate.properties.title === title);
  if (!sheet) throw new Error(`탭을 찾지 못했다: ${title}`);
  return sheet.data[0].rowData.map((row) => (row.values ?? []).map(cellText));
};

describe('탭 구성', () => {
  it('🔴 `가계부` 가 첫 탭이다 — 연결 코드가 tabs[0] 을 집는다', () => {
    expect(body().sheets[0].properties.title).toBe(APP_SHEET_TAB_TITLE);
    expect(BLUEPRINT_TAB_ORDER[0]).toBe(BLUEPRINT_TABS.ledger);
  });

  it('관심사별로 탭이 나뉘어 있다', () => {
    const titles = body().sheets.map((sheet) => sheet.properties.title);

    expect(titles).toEqual([...BLUEPRINT_TAB_ORDER]);
    expect(titles).toContain(BLUEPRINT_TABS.categories);
    expect(titles).toContain(BLUEPRINT_TABS.cashFlow);
    expect(titles).toContain(BLUEPRINT_TABS.readme);
  });

  it('한국 로케일이라 날짜·통화가 한국 표기로 읽힌다', () => {
    expect(body().properties.locale).toBe('ko_KR');
    expect(body().properties.timeZone).toBe('Asia/Seoul');
  });

  it('가계부 탭은 머리 행이 고정돼 있다', () => {
    const ledger = body().sheets[0];

    expect(ledger.properties.gridProperties.frozenRowCount).toBe(1);
  });
});

describe('가계부 탭', () => {
  it('⭐ 머리가 앱 스키마와 정확히 같다 — 다르면 앱이 매핑 단계로 떨어진다', () => {
    expect(rowsOf(BLUEPRINT_TABS.ledger)[0]).toEqual([...APP_SHEET_HEADERS]);
  });
});

describe('분류·설정 탭 — 드롭다운 원본', () => {
  it('분류 사전의 상세항목이 전부 들어 있다', () => {
    const rows = rowsOf(BLUEPRINT_TABS.categories);
    const subLabels = rows.slice(1).map((row) => row[1]);
    const expected = LEDGER_CATEGORIES.flatMap((category) => category.subcategories.map((sub) => sub.label));

    expect(subLabels).toEqual(expected);
  });

  it('머리 줄이 있다', () => {
    expect(rowsOf(BLUEPRINT_TABS.categories)[0]).toEqual(['항목', '상세항목']);
    expect(rowsOf(BLUEPRINT_TABS.settings)[0]).toEqual(['주체', '결제수단']);
  });
});

describe('🔴 수식 — 틀리면 숫자가 어긋난다', () => {
  const monthly = () => rowsOf(BLUEPRINT_TABS.monthly).flat().join('\n');
  const cashFlow = () => rowsOf(BLUEPRINT_TABS.cashFlow).flat().join('\n');

  it('⭐ 삭제된 행을 뺀다 (상태 열이 빈 칸인 것만)', () => {
    /* 앱의 소프트 삭제가 요약에 남으면 지운 기록이 계속 합계에 들어간다. */
    expect(monthly()).toContain(`'${BLUEPRINT_TABS.ledger}'!$J:$J,""`);
    expect(cashFlow()).toContain(`'${BLUEPRINT_TABS.ledger}'!$J:$J,""`);
  });

  it('⭐ 열 전체 참조를 쓴다 — 행을 늘려도 따라온다', () => {
    expect(monthly()).toContain(`'${BLUEPRINT_TABS.ledger}'!$E:$E`);
  });

  it('⭐ 이체는 지출과 따로 센다', () => {
    const text = cashFlow();

    expect(text).toContain('"수입"');
    expect(text).toContain('"지출"');
    expect(text).toContain('"이체"');
  });

  it('🔴 수입이 0 인 달의 저축률은 0% 가 아니라 빈 칸이다', () => {
    expect(cashFlow()).toMatch(/=IF\(B\d+=0,"",\(B\d+-C\d+\)\/B\d+\)/);
  });

  it('🔴 빈 가계부에서 1899년이 나오지 않는다 (빈 범위의 MIN 은 0 이다)', () => {
    /* IFERROR 로는 못 잡는다 — 오류가 아니라 0 이 온다. 개수를 먼저 세야 한다. */
    expect(monthly()).toContain('COUNT(');
    expect(monthly()).not.toContain('IFERROR(EOMONTH(MIN(');
  });

  it('🔴 월별 요약에 지출이 아닌 항목 줄을 만들지 않는다 (한 해 내내 0 인 줄 금지)', () => {
    const labels = rowsOf(BLUEPRINT_TABS.monthly)
      .slice(4, -1)
      .map((row) => row[0]);
    const incomeLabel = LEDGER_CATEGORIES.find((category) => category.flow === 'income')?.label;
    const transferLabel = LEDGER_CATEGORIES.find((category) => category.flow === 'transfer')?.label;

    expect(incomeLabel).toBeDefined();
    expect(labels).not.toContain(incomeLabel);
    expect(labels).not.toContain(transferLabel);
  });

  it('🔴 배열 리터럴을 쓰지 않는다 — 중괄호 구분자는 로케일에 따라 달라진다', () => {
    expect(rowsOf(BLUEPRINT_TABS.fixed).flat().join('\n')).not.toContain('{');
  });

  it('FILTER 는 맞는 행이 없어도 붉은 오류를 내지 않는다', () => {
    expect(rowsOf(BLUEPRINT_TABS.fixed).flat().join('\n')).toContain('IFERROR(FILTER(');
  });
});

describe('🔴 실제 400 을 냈던 자리 — 회귀 가드', () => {
  it('⭐ 격자 열 수가 실제로 쓰는 열 수보다 작지 않다', () => {
    /*
     * 실제로 시트 생성이 이 오류로 죽었다:
     *   `Invalid sheets[3].data[0]: Attempting to write column: 8, beyond the last requested column of: 7`
     * 고정비 탭의 머리를 7열에서 9열로 늘리면서 `columnCount` 를 안 고쳤기 때문이다.
     * 격자와 내용은 함께 바뀌어야 하는데 코드상 둘이 떨어져 있어 어긋날 수 있다.
     */
    expect(findGridOverflow()).toEqual([]);
  });

  it('⭐ 수식은 formulaValue 로 나간다 — stringValue 면 글자 그대로 저장된다', () => {
    const sheets = body().sheets as unknown as {
      properties: { title: string };
      data: { rowData: { values?: { userEnteredValue: Record<string, string> }[] }[] }[];
    }[];

    const cells = sheets.flatMap((sheet) =>
      sheet.data[0].rowData.flatMap((row) => row.values ?? [])
    );
    const formulaLike = cells.filter((cell) =>
      Object.values(cell.userEnteredValue).some((value) => typeof value === 'string' && value.startsWith('='))
    );

    expect(formulaLike.length).toBeGreaterThan(0);
    for (const cell of formulaLike) {
      expect(cell.userEnteredValue.formulaValue, JSON.stringify(cell)).toBeDefined();
      expect(cell.userEnteredValue.stringValue).toBeUndefined();
    }
  });
});

describe('탭 역할 — 색과 보호가 어긋나지 않는다', () => {
  it('⭐ 모든 탭에 역할이 있다 — 빠뜨리면 색도 보호도 안 걸린다', () => {
    for (const title of BLUEPRINT_TAB_ORDER) {
      expect(BLUEPRINT_TAB_ROLE[title], title).toBeDefined();
    }
  });

  it('⭐ 드롭다운 원본과 공동 가계부는 숨긴다 — 사용자는 만질 탭만 본다', () => {
    const sheets = body().sheets;
    const hidden = sheets.filter((sheet) => (sheet.properties as { hidden?: boolean }).hidden);

    /*
     * 🔴 숨기는 이유가 둘로 다르다:
     *    `분류`·`설정` 은 **기계**라 영영 안 보인다.
     *    `공동 가계부` 는 **입력 탭**인데 아직 안 켠 것이다 — 앱에서 켜면 드러난다.
     *    그래서 "숨김 = machinery" 라고 단정하면 안 된다.
     */
    expect(hidden.map((sheet) => sheet.properties.title).sort()).toEqual(
      [BLUEPRINT_TABS.categories, BLUEPRINT_TABS.settings, BLUEPRINT_TABS.ledgerShared].sort()
    );
    for (const sheet of hidden) {
      const role = BLUEPRINT_TAB_ROLE[sheet.properties.title];
      expect(role === 'machinery' || sheet.properties.title === BLUEPRINT_TABS.ledgerShared).toBe(true);
    }
  });

  it('🔴 기계 탭에만 색이 없다 — 공동 가계부는 켜면 파란 입력 탭이라 색을 미리 갖는다', () => {
    for (const sheet of body().sheets) {
      const properties = sheet.properties as { title: string; hidden?: boolean; tabColorStyle?: unknown };
      if (BLUEPRINT_TAB_ROLE[properties.title] === 'machinery') {
        expect(properties.tabColorStyle, properties.title).toBeUndefined();
      } else {
        expect(properties.tabColorStyle, properties.title).toBeDefined();
      }
    }
  });

  it('⭐ 두 가계부의 머리가 글자 하나 다르지 않다 — 다르면 한쪽이 매핑 단계로 떨어진다', () => {
    expect(rowsOf(BLUEPRINT_TABS.ledgerShared)[0]).toEqual(rowsOf(BLUEPRINT_TABS.ledger)[0]);
  });
});

describe('🔴 순자산 — 안 적은 달과 0원은 다른 사실이다', () => {
  const cashFlow = () => rowsOf(BLUEPRINT_TABS.cashFlow).flat().join('\n');

  it('⭐ 자산을 안 적은 달은 빈 칸이다 — 0 으로 적으면 추이가 바닥을 찍는다', () => {
    /* COUNTIFS 로 그 달 기록 수를 먼저 세고, 0 이면 빈 문자열을 낸다. */
    expect(cashFlow()).toContain('=IF(COUNTIFS(');
  });

  it('⭐ 부채를 뺀다 — 안 빼면 그건 순자산이 아니라 자산 합계다', () => {
    const text = cashFlow();

    expect(text).toContain(`"<>"&"${LEDGER_HOLDING_LABEL.debt}"`);
    expect(text).toContain(`,"${LEDGER_HOLDING_LABEL.debt}",`);
  });

  it('🔴 앞 달 값을 끌어오지 않는다 — 스냅샷은 그 달에 실제로 센 값이어야 한다', () => {
    /* 앞 달 참조를 쓰면 안 적은 달이 적은 것처럼 보인다. 순자산 열에 그런 참조가 없어야 한다. */
    const netWorthCells = rowsOf(BLUEPRINT_TABS.cashFlow)
      .slice(4)
      .map((row) => row[6] ?? '')
      .filter((cell) => cell.length > 0);

    expect(netWorthCells.length).toBe(12);
    for (const cell of netWorthCells) expect(cell).not.toMatch(/G\d+/);
  });
});

describe('예시 탭 — 빈 표 앞에서 얼어붙지 않게', () => {
  it('⭐ “분류를 비워도 된다”를 보여 준다 — 이게 이 시트의 다른 점이다', () => {
    const rows = rowsOf(BLUEPRINT_TABS.example);
    const dataRows = rows.slice(4);

    /* 항목(C=2)·상세항목(D=3)이 둘 다 빈 견본 줄이 있어야 한다. */
    const blankCategory = dataRows.filter((row) => (row[2] ?? '') === '' && (row[3] ?? '') === '');
    expect(blankCategory.length).toBeGreaterThan(0);

    /* 그리고 직접 적은 줄도 있어야 한다 — 둘 다 된다는 것이 요점이다. */
    expect(dataRows.some((row) => (row[2] ?? '').length > 0)).toBe(true);
  });

  it('이체 견본이 있다 — 저축이 지출이 아니라는 것이 가장 자주 틀리는 자리다', () => {
    expect(rowsOf(BLUEPRINT_TABS.example).flat()).toContain('이체');
  });
});

describe('분류 규칙 탭', () => {
  it('⭐ 견본 규칙을 심어 두지 않는다 — 우리가 고른 말로 부분 일치를 하면 조용한 오분류가 된다', () => {
    const rows = rowsOf(BLUEPRINT_TABS.rules);

    /* 머리 한 줄뿐이어야 한다. */
    expect(rows).toHaveLength(1);
  });
});

describe('서식 요청', () => {
  const SHEET_IDS = Object.fromEntries(BLUEPRINT_TAB_ORDER.map((title, index) => [title, index]));
  const requests = () => buildFormatRequests(SHEET_IDS) as Record<string, any>[];

  it('⭐ 드롭다운이 앱 쓰기를 막지 않는다 (strict: false)', () => {
    const validations = requests().filter((request) => request.setDataValidation);

    expect(validations.length).toBeGreaterThan(0);
    for (const validation of validations) {
      expect(validation.setDataValidation.rule.strict).toBe(false);
    }
  });

  it('⭐ 날짜 칸은 달력으로 고른다 — 글자로 적히면 월 구간 SUMIFS 가 그 행을 못 센다', () => {
    /*
     * 🔴 숫자 서식만으로는 달력이 뜨지 않는다. 서식은 보이는 모양, 유효성 검사는 입력 방법이다.
     *    `DATE_IS_VALID_DATE` 가 걸린 칸이라야 시트가 달력 선택기를 띄운다.
     */
    const dateRules = requests()
      .filter((request) => request.setDataValidation)
      .filter((request) => request.setDataValidation.rule.condition.type === 'DATE_IS_VALID_DATE');

    expect(dateRules.length).toBeGreaterThanOrEqual(2);
    const sheetIds = dateRules.map((request) => request.setDataValidation.range.sheetId);
    expect(sheetIds).toContain(SHEET_IDS[BLUEPRINT_TABS.ledger]);
    expect(sheetIds).toContain(SHEET_IDS[BLUEPRINT_TABS.holdings]);
    /* 🔴 첫 열(날짜)에만 걸린다. */
    for (const request of dateRules) expect(request.setDataValidation.range.startColumnIndex).toBe(0);
  });

  it('구분 드롭다운이 파서가 아는 낱말이다', () => {
    const kindRule = requests()
      .filter((request) => request.setDataValidation)
      .find((request) => request.setDataValidation.rule.condition.type === 'ONE_OF_LIST');
    const values = kindRule?.setDataValidation.rule.condition.values.map((v: { userEnteredValue: string }) => v.userEnteredValue);

    expect(values).toEqual([...KIND_CHOICES]);
  });

  it('머리 행 서식과 열 너비가 들어 있다', () => {
    const all = requests();

    expect(all.some((request) => request.repeatCell)).toBe(true);
    expect(all.some((request) => request.updateDimensionProperties)).toBe(true);
    expect(all.some((request) => request.addBanding)).toBe(true);
  });

  it('🔴 sheetId 를 못 찾으면 조용히 건너뛴다 — 서식 실패로 시트 생성을 무르지 않는다', () => {
    expect(buildFormatRequests({})).toEqual([]);
  });

  it('⭐ 보호는 경고만 한다 — 완전히 잠그면 앱도 사용자도 못 쓴다', () => {
    const protections = requests().filter((request) => request.addProtectedRange);

    expect(protections.length).toBeGreaterThan(0);
    for (const protection of protections) {
      expect(protection.addProtectedRange.protectedRange.warningOnly).toBe(true);
    }
  });

  it('⭐ 저절로 차는 탭은 전부 보호한다 — 손으로 나열하면 탭이 늘 때 빠뜨린다', () => {
    const protectedIds = new Set(
      requests()
        .filter((request) => request.addProtectedRange)
        .map((request) => request.addProtectedRange.protectedRange.range.sheetId)
    );
    const derived = BLUEPRINT_TAB_ORDER.filter((title) => BLUEPRINT_TAB_ROLE[title] === 'derived');

    expect(derived.length).toBeGreaterThan(0);
    for (const title of derived) expect(protectedIds.has(SHEET_IDS[title]), title).toBe(true);
  });

  it('🔴 분류 규칙 탭은 보호하지 않는다 — 사용자가 고치는 것이 설계 의도다', () => {
    const protectedIds = new Set(
      requests()
        .filter((request) => request.addProtectedRange)
        .map((request) => request.addProtectedRange.protectedRange.range.sheetId)
    );

    expect(protectedIds.has(SHEET_IDS[BLUEPRINT_TABS.rules])).toBe(false);
  });

  it('⭐ 가계부 머리에 열마다 메모가 붙는다 — 색 단독으로는 뜻이 전해지지 않는다', () => {
    const notes = requests()
      .filter((request) => request.repeatCell)
      .filter((request) => request.repeatCell.range.sheetId === SHEET_IDS[BLUEPRINT_TABS.ledger])
      .filter((request) => typeof request.repeatCell.cell?.note === 'string');

    expect(notes).toHaveLength(APP_SHEET_HEADERS.length);
  });
});
