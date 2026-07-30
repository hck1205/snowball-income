import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  CALENDAR_TICKERS_PARAM,
  parseCalendarTickersParam,
  readCalendarSelection,
  writeCalendarSelection
} from '../utils';
import type { CalendarTickerEntry } from '../utils';
// types leaf 직접 참조 — 페이지 배럴은 페이지 컴포넌트(이 훅의 소비자)를 재수출해 import 순환이 된다.
import type { CalendarLastAction, CalendarLoadStatus } from '../DividendCalendarPage/DividendCalendarPage.types';

/** 계측 파라미터의 표면 이름(기존 택소노미 재사용 — 새 이벤트를 만들지 않는다). */
const CALENDAR_ANALYTICS_SOURCE = 'dividend_calendar';

/**
 * 주소에 있었지만 유니버스에 없어 버려진 심볼. 파싱 자체는 로직 레이어가 하고, 여기서는
 * "무엇이 빠졌는지"만 다시 훑는다 — 조용히 사라지면 사용자는 링크가 깨졌다고 느낀다.
 */
const collectUnknownTickers = (search: string, known: string[]): string[] => {
  const raw = new URLSearchParams(search).get(CALENDAR_TICKERS_PARAM);
  if (!raw) return [];

  const knownSet = new Set(known);
  const seen = new Set<string>();
  const unknown: string[] = [];

  for (const piece of raw.split(',')) {
    const symbol = piece.trim().toUpperCase();
    if (symbol.length === 0 || knownSet.has(symbol) || seen.has(symbol)) continue;
    seen.add(symbol);
    unknown.push(symbol);
  }

  return unknown;
};

export type CalendarSelectionApi = {
  selected: string[];
  status: CalendarLoadStatus;
  lastAction: CalendarLastAction;
  unknownTickers: string[];
  toggleTicker: (ticker: string) => void;
  clearSelection: () => void;
};

/**
 * 캘린더 선택 상태의 단일 소유자.
 *
 * 초기 선택 우선순위는 **URL `?tickers=` > IndexedDB > 빈 상태**다. 링크로 들어온 사람은
 * 그 조합을 보러 온 것이므로 URL이 이기고, 그 선택을 **방문자의 저장소에 기록하지 않는다**
 * (남의 링크 한 번 열었다고 내 저장이 덮이면 안 된다). 저장은 사용자가 직접 고르거나 비울 때만,
 * 그리고 실패해도 화면은 계속 간다 — 세션 안의 선택은 이 메모리 상태가 책임진다.
 *
 * 🔴 **주소는 읽기 전용이다 — 선택이 바뀌어도 주소를 갱신하지 않는다**(2026-07-30, 사용자 요청).
 * 구 코드에는 선택 ↔ 주소 동기화 이펙트가 있었고 주석은 *"주소 복사가 곧 공유가 된다"* 고 적었는데,
 * **캘린더에는 공유 버튼도 공유 안내도 없다** — 주소창을 복사하라고 알려주는 장치가 하나도 없으니
 * 도달 가능한 기능이 아니라 선언된 의도였을 뿐이고, 대가로 종목을 누를 때마다 주소가 흔들렸다.
 * 읽기만 남기는 이유는 **이미 밖에 나가 있는 링크와 앱 안의 생산자**다(`pages/Portfolio/utils/
 * portfolioShareUrl.ts` 가 `/dividend/calendar?tickers=…` 를 만든다). 나중에 공유 버튼이 생기면
 * 이 동기화를 되살릴 게 아니라 **그 버튼이 직접 URL 을 만들면 된다**(직렬화 유틸은 그대로 있다).
 */
export const useCalendarSelection = (universe: CalendarTickerEntry[]): CalendarSelectionApi => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<CalendarLoadStatus>('loading');
  const [lastAction, setLastAction] = useState<CalendarLastAction>('none');
  const [unknownTickers, setUnknownTickers] = useState<string[]>([]);

  // 진입 시점의 쿼리스트링만 초기 선택의 근거다 — 이후 주소 변화는 선택에 영향을 주지 않는다.
  const initialSearch = useRef(searchParams.toString()).current;
  /** 진입 파람 정리를 **한 번만** 하기 위한 빗장(아래 정리 이펙트). */
  const urlParamCleanedRef = useRef(false);
  /**
   * 사용자가 이미 손을 댔는가. IndexedDB 읽기는 비동기라 **로딩 중에도 목록은 조작 가능**한데
   * (검색·선택은 정적 상수만으로 즉시 동작한다), 뒤늦게 도착한 저장값이 그 조작을 덮으면
   * 방금 누른 종목이 눈앞에서 되돌아간다. 사람이 지금 한 선택이 과거의 저장값보다 항상 우선한다.
   */
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const fromUrl = parseCalendarTickersParam(initialSearch, universe);
    setUnknownTickers(collectUnknownTickers(initialSearch, fromUrl));

    if (fromUrl.length > 0) {
      setSelected(fromUrl);
      setStatus('ready');
      return;
    }

    let cancelled = false;

    void readCalendarSelection().then((stored) => {
      if (cancelled) return;

      // 로딩 중 조작이 있었으면 저장값은 버린다 — 로딩 해제만 하고 선택은 사용자 것을 유지한다.
      if (userInteractedRef.current) {
        setStatus('ready');
        return;
      }

      // 저장 이력 없음(null)과 빈 저장([])은 화면상 같지만, 유니버스에서 사라진 티커는 여기서 걸러진다.
      const known = new Set(universe.map((entry) => entry.ticker));
      setSelected(stored ? stored.filter((ticker) => known.has(ticker)) : []);
      setStatus('ready');
    })
      // 현 계약(readCalendarSelection 은 실패를 null 로 접는다)상 도달 불가. 저장 계층이 언젠가
      // 던지도록 바뀌어도 화면이 영구 로딩으로 굳거나 unhandled rejection 이 나지 않게 막는 방어선이다.
      .catch(() => {
        if (cancelled) return;
        setStatus('ready');
      });

    return () => {
      cancelled = true;
    };
  }, [initialSearch, universe]);

  /**
   * 진입 링크 정리 — 읽고 난 `?tickers=` 를 **딱 한 번** 지운다.
   *
   * 안 지우면 링크로 들어온 사람이 종목을 바꾼 순간 주소가 화면과 어긋난 채 남고, 새로고침하면
   * **저장된 자기 선택이 아니라 남의 링크 선택으로 되돌아간다**(위 우선순위상 URL 이 이긴다).
   * 주소를 안 쓰기로 한 이상 그 유령은 정리하는 편이 옳다.
   *
   * `replace` 라 히스토리 항목이 늘지 않는다 — 뒤로가기는 여전히 이 페이지에 오기 **전** 화면으로 간다.
   * 대가: 링크로 들어와 아무 것도 건드리지 않고 새로고침하면 선택이 사라진다(저장소로 떨어진다).
   * 그쪽이 낫다고 본 이유는 **사용자가 실제로 한 조작**(= IndexedDB 에 남는다)을 링크가 덮는 편이
   * 더 나쁘기 때문이다.
   */
  useEffect(() => {
    if (urlParamCleanedRef.current) return;
    urlParamCleanedRef.current = true;

    if (!new URLSearchParams(initialSearch).has(CALENDAR_TICKERS_PARAM)) return;

    const next = new URLSearchParams(searchParams);
    next.delete(CALENDAR_TICKERS_PARAM);
    setSearchParams(next, { replace: true });
  }, [initialSearch, searchParams, setSearchParams]);

  /** 선택을 바꾸는 **유일한** 경로 — 토글·비우기·빠른 선택이 전부 여기로 모인다(경합 플래그도 여기 하나). */
  const applySelection = useCallback((next: string[], action: CalendarLastAction) => {
    userInteractedRef.current = true;
    setSelected(next);
    setLastAction(action);
    // fire-and-forget — 저장 성공 여부는 UI 상태가 아니다(실패해도 이 세션의 선택은 유지된다).
    void writeCalendarSelection(next);
  }, []);

  const toggleTicker = useCallback(
    (ticker: string) => {
      const symbol = ticker.trim().toUpperCase();
      const isSelected = selected.includes(symbol);

      trackEvent(ANALYTICS_EVENT.TICKER_SELECTED, {
        ticker: symbol,
        source: CALENDAR_ANALYTICS_SOURCE,
        selected: !isSelected
      });

      applySelection(
        isSelected ? selected.filter((item) => item !== symbol) : [...selected, symbol],
        'none'
      );
    },
    [applySelection, selected]
  );

  const clearSelection = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'dividend_calendar_clear',
      placement: CALENDAR_ANALYTICS_SOURCE
    });
    applySelection([], 'cleared');
  }, [applySelection]);

  return { selected, status, lastAction, unknownTickers, toggleTicker, clearSelection };
};
