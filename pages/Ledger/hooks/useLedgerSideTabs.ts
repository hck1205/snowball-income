import { useCallback, useEffect, useRef, useState } from 'react';
import { ledgerError, readClassifyRules, readHoldings, readInvestments } from '@/shared/lib/googleSheets';
import type { LedgerError, SheetsRequestContext } from '@/shared/lib/googleSheets';
import type { LedgerSideTabState } from '../components';
import {
  buildHoldingsModel,
  buildInvestmentsModel,
  buildRulesModel,
  isExpiredCode,
  toErrorModel,
  toFailureReason
} from '../utils';
import type { LedgerViewTabId } from '../utils';

type SideTabId = Exclude<LedgerViewTabId, 'entries'>;

const IDLE: LedgerSideTabState = { status: 'idle' };
const EMPTY_STATES: Readonly<Record<SideTabId, LedgerSideTabState>> = {
  holdings: IDLE,
  investments: IDLE,
  rules: IDLE
};

/**
 * **옆탭 읽기** — `자산` · `투자` · `분류 규칙`.
 *
 * ## 🔴 고른 탭만 읽는다 (게으르게)
 *
 * 연결하자마자 셋을 다 읽으면 요청이 넷이 되고(기록 + 셋), 대부분의 사용자는 `가계부` 탭만 본다.
 * 안 볼 표를 읽는 것은 사용자의 할당량을 쓰는 일이다 — 구글 시트 API 는 분당 한도가 있고,
 * 429 를 맞으면 **정작 필요한 기록 읽기가 막힌다.**
 *
 * ## 🔴 한 번 읽은 탭은 다시 읽지 않는다
 *
 * 탭을 오갈 때마다 읽으면 왕복하는 것만으로 할당량이 준다. 다시 읽고 싶으면 패널의 버튼을 누른다
 * (그 버튼이 있는 이유가 이것이다 — 자동 갱신 대신 **사용자가 정하는** 갱신).
 *
 * ⚠ 시트를 바꾸면 캐시를 버린다. 안 버리면 A 시트의 자산이 B 시트 화면에 남는다 —
 *   같은 종류의 사고가 이 레포에서 여러 번 났다(스냅샷·매핑).
 */
export const useLedgerSideTabs = (params: {
  readonly spreadsheetId: string | null;
  /** 앱이 만든 시트인가. 아니면 이 탭들이 아예 없다. */
  readonly createdByApp: boolean;
  readonly readContext: () => SheetsRequestContext | null;
  /**
   * 실패를 화면 상태로 옮긴다. **`connection.applyError` 를 그대로 넘긴다** —
   * 🔴 만료·충돌 배너를 켜는 경로를 두 벌로 만들지 않는다(한쪽만 고쳐지면 다른 쪽이 우회로가 된다).
   */
  readonly onError: (error: LedgerError) => void;
}) => {
  const { spreadsheetId, createdByApp, readContext, onError } = params;
  const [byTab, setByTab] = useState<Readonly<Record<SideTabId, LedgerSideTabState>>>(EMPTY_STATES);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * 이미 읽었거나 읽는 중인 탭.
   *
   * 🔴 **이 판단을 `setByTab` 업데이터 안에서 하지 마라.** 처음에 그렇게 썼고 실제로 깨졌다 —
   *    업데이터 안에서 플래그를 세우고 그 밖에서 바로 읽었는데, React 는 업데이터를 **동기로
   *    실행하지 않는다.** 그래서 플래그가 언제나 `false` 로 읽혀 함수가 곧바로 반환되고,
   *    상태만 `loading` 으로 남아 **“읽고 있습니다…” 가 영영 사라지지 않았다.**
   *    `useState` 값으로 판단해도 같은 문제가 난다(`load` 가 그 값을 클로저로 잡아 한 박자 늦다).
   *    그래서 **ref** 로 본다 — 렌더와 무관하게 지금 값이다.
   */
  const startedRef = useRef<Set<SideTabId>>(new Set());

  /* 🔴 시트가 바뀌면 읽어 둔 것을 버린다 — 남기면 다른 시트의 값이 화면에 남는다. */
  useEffect(() => {
    startedRef.current = new Set();
    setByTab(EMPTY_STATES);
  }, [spreadsheetId]);

  /**
   * 실패를 상태로 옮긴다.
   *
   * 🔴 만료는 **전용 배너**가 있다 — 패널 안에 또 적으면 같은 사실이 두 곳이 되고, 사용자는
   *    두 군데서 재연결을 시도한다. 그때는 이 탭을 `idle` 로 되돌려 재연결 뒤 다시 읽히게 한다.
   */
  const applyFailure = useCallback(
    (tab: SideTabId, error: LedgerError) => {
      if (isExpiredCode(error.code)) {
        /* 만료는 전용 배너가 낸다. 이 탭은 `idle` 로 되돌려 재연결 뒤 다시 읽히게 한다. */
        onError(error);
        startedRef.current.delete(tab);
        setByTab((previous) => ({ ...previous, [tab]: IDLE }));
        return;
      }
      /* 실패한 탭은 다시 시도할 수 있어야 한다 — 시작 표시를 지운다. */
      startedRef.current.delete(tab);
      setByTab((previous) => ({
        ...previous,
        [tab]: { status: 'error', message: toErrorModel(toFailureReason(error.code)).body }
      }));
    },
    [onError]
  );

  const load = useCallback(
    async (tab: SideTabId, options?: { readonly force?: boolean }) => {
      if (spreadsheetId === null || !createdByApp) return;

      /* 이미 읽었거나 읽는 중이면 그대로 둔다. 다시 읽기는 `force` 로만. */
      if (!options?.force && startedRef.current.has(tab)) return;
      startedRef.current.add(tab);
      setByTab((previous) => ({ ...previous, [tab]: { status: 'loading' } }));

      const context = readContext();
      if (context === null) {
        applyFailure(tab, ledgerError('auth-expired'));
        return;
      }

      /*
       * 🔴 탭마다 따로 분기한다. 하나의 `await` 로 합치면 결과가 세 종류의 합집합이 되어
       *    타입 단정(`as`)이 필요해지고, 그러면 파서가 바뀌었을 때 컴파일러가 안 잡는다.
       */
      if (tab === 'holdings') {
        const result = await readHoldings(context, spreadsheetId);
        if (!isMountedRef.current) return;
        if (!result.ok) return applyFailure(tab, result.error);
        const holdings = buildHoldingsModel(result.value.records, result.value.skipped);
        setByTab((previous) => ({ ...previous, holdings: { status: 'ready', holdings } }));
        return;
      }

      if (tab === 'investments') {
        const result = await readInvestments(context, spreadsheetId);
        if (!isMountedRef.current) return;
        if (!result.ok) return applyFailure(tab, result.error);
        const investments = buildInvestmentsModel(result.value.records, result.value.skipped);
        setByTab((previous) => ({ ...previous, investments: { status: 'ready', investments } }));
        return;
      }

      const result = await readClassifyRules(context, spreadsheetId);
      if (!isMountedRef.current) return;
      if (!result.ok) return applyFailure(tab, result.error);
      const rules = buildRulesModel(result.value.records, result.value.skipped);
      setByTab((previous) => ({ ...previous, rules: { status: 'ready', rules } }));
    },
    [applyFailure, createdByApp, readContext, spreadsheetId]
  );

  return { byTab, load } as const;
};
