import { describe, expect, it } from 'vitest';
import {
  APP_SHEET_HEADERS,
  APP_SHEET_TAB_TITLE,
  BLUEPRINT_TABS,
  BLUEPRINT_TAB_ORDER,
  KIND_CHOICES,
  buildCreateSpreadsheetBody,
  buildFormatRequests
} from '@/shared/lib/googleSheets';
import { LEDGER_CATEGORIES } from '@/shared/constants/ledger';

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
  sheets: { properties: { title: string; gridProperties: { frozenRowCount?: number } }; data: { rowData: { values?: { userEnteredValue: { stringValue: string } }[] }[] }[] }[];
};

const rowsOf = (title: string): string[][] => {
  const sheet = body().sheets.find((candidate) => candidate.properties.title === title);
  if (!sheet) throw new Error(`탭을 찾지 못했다: ${title}`);
  return sheet.data[0].rowData.map((row) => (row.values ?? []).map((cell) => cell.userEnteredValue.stringValue));
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
});
