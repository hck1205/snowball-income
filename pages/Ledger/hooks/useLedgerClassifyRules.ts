import { useCallback, useRef, useState } from 'react';
import { readClassifyRules } from '@/shared/lib/googleSheets';
import type { SheetLink, SheetsRequestContext } from '@/shared/lib/googleSheets';
import type { LedgerClassifyRule } from '@/shared/lib/ledger';

/**
 * 사용자 분류 규칙(`분류 규칙` 탭)의 **읽기와 캐시**.
 *
 * 🔴 `useLedgerConnection`(813줄)에서 갈라 냈다(2026-08-31). 그 훅의 상태 17개 중 이것만 바깥과
 * **의존이 하나도 없었다** — 원래 `useCallback` 의 의존 배열이 빈 채로 서 있었다. 나머지(매핑
 * 세션·연결 단계)는 `setSession`·`setState` 를 여섯 곳에서 함께 쓰고 있어 떼면 오히려 얽힌다.
 *
 * ⚠ 갈라 내면서 동작은 한 글자도 바뀌지 않았다 — 호출부가 같은 이름으로 그대로 쓴다.
 */
export const useLedgerClassifyRules = () => {
  /*
   * 사용자 분류 규칙(`분류 규칙` 탭) 캐시. 스프레드시트별로 한 번만 읽는다.
   *
   * 🔴 **기록을 읽을 때마다 규칙도 다시 읽지 않는다.** 규칙은 사용자가 시트에서 손으로 고치는
   *    드문 일이고, 매 새로고침마다 요청을 하나 더 보내면 429(할당량)에 그만큼 가까워진다.
   *    시트에서 규칙을 고친 뒤 앱에 바로 반영하고 싶으면 다시 연결하면 된다.
   * ⚠ 규칙 읽기가 실패해도 **기록 읽기를 무르지 않는다.** 규칙이 없으면 사다리 1단만 빠지고
   *   나머지(내장 사전·미분류)는 그대로 동작한다 — 분류가 조금 덜 채워지는 것과 화면이 안 뜨는
   *   것은 비교할 수 없다.
   */
  const rulesBySpreadsheetRef = useRef<Map<string, readonly LedgerClassifyRule[]>>(new Map());
  /**
   * 같은 규칙을 **쓰기 훅도** 본다(저장할 때 빈 항목을 채운다).
   *
   * 🔴 ref 만 두면 안 된다 — 쓰기 훅은 렌더 사이에 값을 읽으므로 state 가 필요하고,
   *    ref 는 "한 번만 읽는다"는 판단에 쓴다. 둘의 역할이 다르다.
   */
  const [classifyRules, setClassifyRules] = useState<readonly LedgerClassifyRule[]>([]);

  const ensureRules = useCallback(
    async (
      context: SheetsRequestContext,
      target: SheetLink
    ): Promise<readonly LedgerClassifyRule[]> => {
      /* 앱이 만든 시트가 아니면 그 탭이 아예 없다 — 부르지 않는 것이 정상이다. */
      if (!target.createdByApp) return [];

      const cached = rulesBySpreadsheetRef.current.get(target.spreadsheetId);
      if (cached !== undefined) {
        setClassifyRules(cached);
        return cached;
      }

      const read = await readClassifyRules(context, target.spreadsheetId);
      const rules = read.ok ? read.value.records : [];
      rulesBySpreadsheetRef.current.set(target.spreadsheetId, rules);
      setClassifyRules(rules);
      return rules;
    },
    []
  );

  return { classifyRules, ensureRules };
};
