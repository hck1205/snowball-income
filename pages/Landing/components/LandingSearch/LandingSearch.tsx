import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { TICKER_HUB_PATH, tickerPagePath } from '@/shared/constants/tickerPages';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY } from '../../copy';
import type { LandingTickerEntry } from './LandingSearch.types';
import {
  LANDING_SEARCH_DEBOUNCE_MS,
  LANDING_SEARCH_FALLBACK_ENTRIES,
  LANDING_SEARCH_QUERY_PARAM,
  LANDING_TICKER_INDEX,
  isSearchableQuery,
  searchTickerPages
} from './LandingSearch.utils';
import {
  ResultHubLink,
  ResultLink,
  ResultList,
  ResultName,
  ResultNote,
  ResultPanel,
  ResultSymbol,
  SearchForm,
  SearchInput,
  SearchInputWrap,
  SearchRoot,
  SearchStatus,
  VisuallyHiddenLabel
} from './LandingSearch.styled';

const copy = LANDING_COPY.search;

/**
 * 히어로 안의 종목 검색 — **자기완결형**이다(URL 을 직접 read/write 한다).
 *
 * `CommunitySearchBar`·`PrecisionSearch` 와 같은 모델이다(decisions.md 2026-07-18): 검색 상태를
 * 페이지 컨테이너로 끌어올려 뷰까지 프롭 드릴하면, 이 화면에서 검색이 유일하게 상태를 가진 부품인데도
 * 컨테이너·타입·뷰 세 파일이 함께 커진다.
 *
 * ## 규율
 * - 🔴 쿼리 파라미터는 **`q`** 다. `s`·`share`·`sv` 는 공유 링크 복원 전용이라 앱 전역에서 예약어다.
 *   `middleware.ts` 의 matcher 가 `/` 를 잡고 있어서 `?share=<영문 검색어>` 같은 주소는 랜딩 요청인데도
 *   OG 치환 경로로 새고, 복원 소비자들은 경로를 안 보고 `window.location.href` 를 직독한다.
 * - URL 반영은 **디바운스 + replace** — 타이핑마다 히스토리가 쌓이면 뒤로가기가 망가진다.
 *   조합(IME) 중에는 갱신하지 않는다(한글 조합이 깨진다).
 * - **결과는 즉시** 그린다. 11종을 훑는 동기 함수라 늦출 이유가 없다 — 디바운스는 주소창의 사정이지
 *   화면의 사정이 아니다.
 * - 🔴 `role="status"` 노드는 **항상 마운트**하고 텍스트만 바꾼다. 조건부 언마운트하면 이후 변경이
 *   낭독되지 않는다.
 * - 🔴 combobox(`aria-activedescendant`) 패턴을 쓰지 않는다. 이건 팝업이 아니라 흐름 안 목록이고,
 *   combobox 를 선언하면 지키지 않을 키보드 계약(위/아래 이동·Esc)을 약속하는 것이 된다.
 */
export default function LandingSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get(LANDING_SEARCH_QUERY_PARAM) ?? '';

  const [value, setValue] = useState(urlQuery);
  const composingRef = useRef(false);
  const inputId = useId();
  const labelId = useId();
  const statusId = useId();

  // 뒤로가기·외부 변경으로 주소가 바뀌면 입력도 맞춘다.
  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (composingRef.current) return;
    if (value.trim() === urlQuery) return;

    const timer = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const trimmed = value.trim();
          if (trimmed) next.set(LANDING_SEARCH_QUERY_PARAM, trimmed);
          else next.delete(LANDING_SEARCH_QUERY_PARAM);
          return next;
        },
        { replace: true }
      );
    }, LANDING_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [setSearchParams, urlQuery, value]);

  const query = value.trim();
  const isActive = isSearchableQuery(query);
  const results = isActive ? searchTickerPages(query) : [];
  const hasResults = results.length > 0;

  /** 화면 문구와 라이브 리전이 **같은 문장**을 쓴다 — 눈과 귀가 다른 말을 듣지 않게. */
  const statusText = !isActive ? '' : hasResults ? copy.resultCount(results.length) : copy.empty(query);

  const renderRow = (entry: LandingTickerEntry, ctaName: string) => (
    <li key={entry.symbol}>
      <ResultLink
        to={tickerPagePath(entry.slug)}
        onClick={() => trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: ctaName, ticker: entry.symbol })}
      >
        <ResultSymbol>{entry.symbol}</ResultSymbol>
        <ResultName>{entry.koreanName}</ResultName>
        <ArrowRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
      </ResultLink>
    </li>
  );

  return (
    <SearchRoot>
      <SearchForm
        role="search"
        aria-labelledby={labelId}
        onSubmit={(event) => {
          // 엔터는 즉시 반영한다(디바운스를 건너뛴다). 폼 기본 제출은 페이지를 통째로 새로 고친다.
          event.preventDefault();
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (query) next.set(LANDING_SEARCH_QUERY_PARAM, query);
              else next.delete(LANDING_SEARCH_QUERY_PARAM);
              return next;
            },
            { replace: true }
          );
        }}
      >
        {/*
          🔴 상자 전체가 `label` 이다 — 여백·아이콘 어디를 눌러도 캐럿이 잡힌다(클릭 미스 방지).
             접근명은 안쪽의 시각 숨김 텍스트가 대므로 **그 텍스트를 밖으로 빼지 마라**(이름 없는 라벨이 된다).
        */}
        <SearchInputWrap>
          <VisuallyHiddenLabel id={labelId}>{LANDING_COPY.hero.searchLabel}</VisuallyHiddenLabel>
          <Search size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          <SearchInput
            id={inputId}
            type="search"
            autoComplete="off"
            aria-describedby={statusId}
            placeholder={LANDING_COPY.hero.searchPlaceholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(event) => {
              composingRef.current = false;
              setValue(event.currentTarget.value);
            }}
          />
        </SearchInputWrap>
      </SearchForm>

      {/* 항상 마운트. 빈 문자열이면 CSS 가 자리를 접는다(:empty). */}
      <SearchStatus id={statusId} role="status" aria-live="polite">
        {statusText}
      </SearchStatus>

      {isActive ? (
        <ResultPanel>
          {hasResults ? (
            <>
              <ResultList aria-labelledby={statusId}>
                {results.map((entry) => renderRow(entry, 'landing_search_result'))}
              </ResultList>
              {results.length < LANDING_TICKER_INDEX.length ? (
                <ResultHubLink to={TICKER_HUB_PATH}>{copy.seeAll(LANDING_TICKER_INDEX.length)}</ResultHubLink>
              ) : null}
            </>
          ) : (
            <>
              {/* 🔴 "추천 종목"이 아니다 — 소개 글이 준비돼 있다는 사실만 말한다(권유 금지). */}
              <ResultNote>{copy.fallbackTitle}</ResultNote>
              <ResultList>
                {LANDING_SEARCH_FALLBACK_ENTRIES.map((entry) => renderRow(entry, 'landing_search_fallback'))}
              </ResultList>
              <ResultNote>{copy.emptyHint}</ResultNote>
            </>
          )}
        </ResultPanel>
      ) : null}
    </SearchRoot>
  );
}
