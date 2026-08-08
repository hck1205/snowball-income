import { describe, expect, it } from 'vitest';
import { LEDGER_OPTIONAL_FIELDS, LEDGER_REQUIRED_FIELDS } from '@/shared/lib/googleSheets';
import type { LedgerField } from '@/shared/lib/googleSheets';
import { LEDGER_MAPPING_FIELDS } from '@/pages/Ledger/types';
import { LEDGER_COPY } from '@/pages/Ledger/copy';

/**
 * 🔴 **필드 목록이 갈리지 않게 잠근다.**
 *
 * 이 레포가 같은 실수를 여섯 번 했다. 선택 필드를 한 줄씩 손으로 적어 둔 자리가 v2 에서 축이
 * 늘 때마다 옛 목록으로 남았고, 그때마다 **오류 없이 조용히** 틀렸다:
 *
 *   - `mappedColumnIndices`  조회가 새 열을 요청조차 안 함
 *   - `mappedFieldsOf`       충돌 검증이 새 열을 안 봄
 *   - `mappedFields`         쓰기가 새 열을 안 씀
 *   - `toPatch`              화면은 고쳐지는데 시트에 안 들어감
 *   - `toStoredSheetLink`    저장하면 매핑이 사라짐
 *   - `LEDGER_MAPPING_FIELDS` **매핑 화면에서 그 축을 고를 자리가 없음**
 *
 * 앞의 다섯은 상수를 돌게 고쳤고, 마지막은 화면 목록이라 상수를 그대로 쓸 수 없다(사용자가 고르는
 * 대상이 아닌 `status` 가 빠져야 한다). 그래서 **대조 테스트**로 잠근다 — 데이터 계층에 필드가
 * 늘면 이 테스트가 먼저 빨개진다.
 */

/** 사용자가 고르는 대상이 아닌 필드. `status` 는 앱이 소프트 삭제에 쓰는 칸이다. */
const NOT_USER_CHOSEN: readonly LedgerField[] = ['status'];

const dataLayerFields: readonly LedgerField[] = [...LEDGER_REQUIRED_FIELDS, ...LEDGER_OPTIONAL_FIELDS];

describe('매핑 화면 ↔ 데이터 계층 필드 대조', () => {
  it('⭐ 데이터 계층의 필드가 전부 매핑 화면에 있다 (status 제외)', () => {
    const expected = dataLayerFields.filter((field) => !NOT_USER_CHOSEN.includes(field));
    const actual = LEDGER_MAPPING_FIELDS.map((field) => field.id);

    expect([...actual].sort()).toEqual([...expected].sort());
  });

  it('🔴 매핑 화면에 데이터 계층이 모르는 필드가 없다', () => {
    for (const field of LEDGER_MAPPING_FIELDS) {
      expect(dataLayerFields, field.id).toContain(field.id);
    }
  });

  it('필수 표시가 데이터 계층의 필수와 같다', () => {
    const required = LEDGER_MAPPING_FIELDS.filter((field) => field.required).map((field) => field.id);

    expect([...required].sort()).toEqual([...LEDGER_REQUIRED_FIELDS].sort());
  });

  it('⭐ 모든 매핑 필드에 화면 라벨이 있다 (라벨 없는 셀렉트가 서지 않는다)', () => {
    for (const field of LEDGER_MAPPING_FIELDS) {
      const label = (LEDGER_COPY.mapping.fields as Record<string, string | undefined>)[field.id];
      expect(label, field.id).toBeTruthy();
    }
  });

  it('선택 필드는 라벨에 "(선택)"이 붙는다 — 별표 없는 필수처럼 보이지 않게', () => {
    for (const field of LEDGER_MAPPING_FIELDS) {
      if (field.required) continue;
      const label = (LEDGER_COPY.mapping.fields as Record<string, string>)[field.id];
      expect(label, field.id).toContain('(선택)');
    }
  });
});
