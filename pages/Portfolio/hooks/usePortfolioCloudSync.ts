import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsLoggedInAtomValue, useSessionAtomValue } from '@/jotai/community';
import { getSupabaseClient, fetchCloudPortfolio, pushCloudPortfolio } from '@/shared/lib/supabase';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { PortfolioHolding } from '@/shared/lib/portfolio';
import {
  buildPortfolioRecord,
  decidePortfolioSync,
  hasPortfolioContent,
  parseCloudPayload,
  readPortfolioRecord,
  toCloudPayload
} from '../utils';

/**
 * 내 포트폴리오 ↔ 클라우드 동기화 **배선**. 정책은 `portfolioCloudSync`(순수 함수)가 갖는다.
 *
 * 하는 일은 셋뿐이다:
 *  1. **로그인 전환 시 1회** — 클라우드를 읽어 정책대로 적용하거나 올린다.
 *  2. **편집이 멎으면** 클라우드에 올린다(디바운스).
 *  3. 화면이 말할 것을 상태로 준다 — 비로그인 유도, "클라우드 것으로 맞췄다" 안내.
 *
 * ⚠ 이 훅은 **로컬 저장소를 직접 만지지 않는다.** 적용은 `usePortfolioHoldings` 의 `replaceAll` 로만
 * 간다(모든 편집이 지나는 유일한 경로를 우회하면 저장 예약·실행취소 버퍼가 어긋난다).
 *
 * ⚠ 비로그인이면 **아무 것도 하지 않는다** — 네트워크도 치지 않는다. 그 상태에서 이 화면은
 * 로컬(IndexedDB)만으로 완전히 동작한다.
 */

/** 편집이 멎고 이만큼 지나면 올린다. 로컬 저장(즉시)과 달리 네트워크라 조금 더 기다린다. */
const PUSH_DEBOUNCE_MS = 1200;

export type PortfolioCloudStatus =
  /** 로그인하지 않음 — 화면은 "새로고침하면 사라진다"고 말해야 한다. */
  | 'signed-out'
  /** 로그인했고 첫 동기화가 도는 중. */
  | 'syncing'
  /** 클라우드와 맞음. */
  | 'synced'
  /** 클라우드에 있던 것으로 로컬을 덮었다 — 화면이 그 사실을 말한다(무음 덮어쓰기 금지). */
  | 'applied-cloud'
  /** 네트워크·권한 문제로 못 맞췄다. 로컬은 그대로 살아 있다. */
  | 'failed';

export type UsePortfolioCloudSyncResult = {
  status: PortfolioCloudStatus;
  /** `applied-cloud` 안내를 사용자가 닫았을 때. */
  dismissApplied: () => void;
  /**
   * 실패 뒤 처음부터 다시 시도한다(클라우드 읽기부터).
   *
   * 실패가 **되돌릴 길 없는 막다른 길이면 안 된다** — 권한·네트워크 문제는 사용자가 다른 데서
   * 고치고 돌아올 수 있고, 그때 화면을 새로고침하게 만들 이유가 없다.
   */
  retry: () => void;
};

export type UsePortfolioCloudSyncOptions = {
  /** 지금 화면의 보유 목록 — 바뀌면 디바운스 뒤 올린다. */
  holdings: readonly PortfolioHolding[];
  taxPercent: number;
  /** 로컬 하이드레이션이 끝났는가. 끝나기 전에는 올리지도 덮지도 않는다. */
  isReady: boolean;
  /** 클라우드 정본을 화면에 적용한다(`usePortfolioHoldings.actions.replaceAll`). */
  applyFromCloud: (holdings: readonly PortfolioHolding[], taxPercent: number) => void;
  /** 배당 캘린더 선택 — 같은 payload 에 함께 실린다. */
  calendarTickers?: readonly string[];
};

export const usePortfolioCloudSync = (
  options: UsePortfolioCloudSyncOptions
): UsePortfolioCloudSyncResult => {
  const isLoggedIn = useIsLoggedInAtomValue();
  const userId = useSessionAtomValue()?.user?.id ?? '';

  const [status, setStatus] = useState<PortfolioCloudStatus>('signed-out');
  /**
   * 첫 동기화를 **시도**한 사용자. 같은 사용자로 두 번 돌지 않게 막는 재진입 가드일 뿐이다.
   * 실패하면 다시 `null` 로 풀어 `retry()` 가 처음부터 돌 수 있게 한다.
   */
  const attemptedForUserRef = useRef<string | null>(null);
  /**
   * 첫 동기화에 **성공**한 사용자. 올리기(push)는 오직 이 값이 맞을 때만 한다.
   *
   * ⚠ 시도와 성공을 한 ref 로 합치면 안 된다 — 클라우드를 **못 읽은 채** 로컬을 올리게 되고,
   * 그러면 "클라우드가 이긴다" 정책이 지키려던 그 데이터를 이 화면이 덮어버린다.
   */
  const syncedForUserRef = useRef<string | null>(null);
  const pushTimerRef = useRef<number | null>(null);
  /** `retry()` 가 첫 동기화 이펙트를 다시 트리거하는 수단(값 자체에는 의미가 없다). */
  const [retryNonce, setRetryNonce] = useState(0);

  /* 최신 값을 타이머 콜백이 읽게 한다 — deps 에 넣으면 타건마다 타이머가 재설정된다. */
  const latestRef = useRef(options);
  latestRef.current = options;

  const dismissApplied = useCallback(() => {
    setStatus((current) => (current === 'applied-cloud' ? 'synced' : current));
  }, []);

  const retry = useCallback(() => {
    attemptedForUserRef.current = null;
    setRetryNonce((n) => n + 1);
  }, []);

  /** 지금 화면 상태를 클라우드에 올린다. 실패는 조용히 삼키지 않는다(계측 + 상태). */
  const push = useCallback(async () => {
    const { holdings, taxPercent, calendarTickers } = latestRef.current;
    const record = buildPortfolioRecord(holdings, taxPercent);
    if (!hasPortfolioContent(record)) return; // 빈 슬롯을 만들지 않는다

    try {
      const client = await getSupabaseClient();
      if (!client) return;
      await pushCloudPortfolio(client, toCloudPayload(record, calendarTickers ?? []));
      setStatus((current) => (current === 'applied-cloud' ? current : 'synced'));
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'portfolio_cloud_push', reason: 'push-failed' });
      setStatus('failed');
    }
  }, []);

  /* 1) 로그인 전환 시 1회 동기화. 같은 사용자로 다시 돌지 않는다(attemptedForUserRef). */
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      attemptedForUserRef.current = null;
      syncedForUserRef.current = null;
      setStatus('signed-out');
      return;
    }
    if (!options.isReady) return; // 로컬을 못 읽은 상태에서 덮으면 순서가 뒤집힌다
    if (attemptedForUserRef.current === userId) return;
    attemptedForUserRef.current = userId;

    let cancelled = false;
    setStatus('syncing');

    const run = async () => {
      try {
        const client = await getSupabaseClient();
        if (!client || cancelled) return;

        const [row, localRead] = await Promise.all([fetchCloudPortfolio(client), readPortfolioRecord()]);
        if (cancelled) return;

        const cloud = row ? parseCloudPayload(row.payload) : null;
        const local = localRead.ok ? localRead.value : null;
        const outcome = decidePortfolioSync({ cloud, local });

        /*
         * 여기서부터 올리기를 허용한다 — **클라우드를 읽는 데 성공한 뒤**여야 한다.
         * 읽기 전에 허용하면 편집 한 번이 클라우드 정본을 로컬로 덮는다.
         */
        syncedForUserRef.current = userId;

        if (outcome.type === 'applied-cloud') {
          latestRef.current.applyFromCloud(outcome.record.holdings, outcome.record.taxPercent);
          setStatus('applied-cloud');
          trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'portfolio_cloud_applied', placement: 'portfolio' });
          return;
        }

        if (outcome.type === 'pushed-local') {
          await push();
          return;
        }

        setStatus('synced');
      } catch {
        if (cancelled) return;
        /*
         * 막다른 길로 두지 않는다 — 가드를 풀어 `retry()` 가 **처음부터**(클라우드 읽기부터) 다시
         * 돌 수 있게 한다. `syncedForUserRef` 는 건드리지 않는다: 읽기에 실패했으므로 올리기는
         * 여전히 금지다.
         */
        attemptedForUserRef.current = null;
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'portfolio_cloud_sync', reason: 'sync-failed' });
        setStatus('failed');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, options.isReady, push, retryNonce, userId]);

  /* 2) 편집이 멎으면 올린다. 첫 동기화가 끝나기 전에는 올리지 않는다(덮어쓰기 경쟁 방지). */
  useEffect(() => {
    if (!isLoggedIn || !options.isReady) return;
    if (syncedForUserRef.current !== userId) return;
    if (status === 'syncing') return;

    if (pushTimerRef.current !== null) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      void push();
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimerRef.current !== null) window.clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    };
    // holdings/taxPercent/calendarTickers 가 바뀔 때마다 다시 예약한다.
  }, [isLoggedIn, options.holdings, options.isReady, options.taxPercent, options.calendarTickers, push, status, userId]);

  return { status, dismissApplied, retry };
};
