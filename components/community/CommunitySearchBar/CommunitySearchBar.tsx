import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  COMMUNITY_COPY,
  COMMUNITY_QUERY_PARAM,
  COMMUNITY_SEARCH_DEBOUNCE_MS,
  COMMUNITY_SEARCH_FILTERS,
  DEFAULT_COMMUNITY_SEARCH_FILTER
} from '@/shared/constants/community';
import Select from '@/components/common/Select';
import { SearchIcon } from '@/components/community/CommunityIcons';
import PrecisionSearch from '@/components/community/PrecisionSearch';
import {
  FilterField,
  SearchCluster,
  SearchForm,
  SearchInput,
  SearchInputWrap
} from './CommunitySearchBar.styled';

/**
 * 갤러리 **본문 툴바**의 검색 줄. URL(`?q=`, `?qf=`)이 유일한 진실 — 목록이 URL을 구독해 재요청한다.
 * 입력은 300ms 디바운스 후 URL을 갱신하고, 엔터는 즉시 반영한다. 빈 입력이면 `q`를 제거한다.
 *
 * IME 조합 중에는 URL을 갱신하지 않는다(한글 조합이 깨지지 않게).
 *
 * **구(舊) 자리는 앱 헤더 가운데 슬롯이었다** — 워드마크·라우트 메뉴 6개·로그인·글쓰기·더보기와 한 줄을
 * 다투다 1024px 에서 입력이 72px 로 찌그러지고 메뉴 3개가 가로 스크롤 뒤로 밀렸다(실측). 2026-07-31
 * 사용자 지시로 본문 첫 줄로 내려왔다 — "← 목록"이 같은 이유로 `CommunityTopBar` 로 내려간 것과 같은 처방이다.
 * 그래서 이 컴포넌트에는 더 이상 데스크톱/모바일 변형 prop 이 없다(인스턴스가 하나뿐이다).
 */
export default function CommunitySearchBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get(COMMUNITY_QUERY_PARAM.query) ?? '';
  const urlFilter = searchParams.get(COMMUNITY_QUERY_PARAM.queryFilter) ?? DEFAULT_COMMUNITY_SEARCH_FILTER;

  const [value, setValue] = useState(urlQuery);
  // 검색 기준은 로컬 상태로 둔다 — 검색어가 비어 있어도 선택이 즉시 반영/유지되게 한다.
  // (URL의 qf는 검색어와 함께만 실리므로, urlFilter만 구독하면 빈 검색어에서 선택이 되돌아간다.)
  const [filter, setFilter] = useState(urlFilter);
  const composingRef = useRef(false);

  // 뒤로가기/외부 변경으로 URL이 바뀌면 입력/기준도 맞춘다(입력 중이 아닐 때만 덮어써도 안전).
  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);
  useEffect(() => {
    setFilter(urlFilter);
  }, [urlFilter]);

  const commit = (nextQuery: string, nextFilter: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = nextQuery.trim();
        if (trimmed) {
          next.set(COMMUNITY_QUERY_PARAM.query, trimmed);
          next.set(COMMUNITY_QUERY_PARAM.queryFilter, nextFilter);
        } else {
          next.delete(COMMUNITY_QUERY_PARAM.query);
          next.delete(COMMUNITY_QUERY_PARAM.queryFilter);
        }
        return next;
      },
      { replace: true }
    );
  };

  // 디바운스: value가 바뀌면 300ms 뒤 URL 반영(조합 중이면 건너뛴다).
  useEffect(() => {
    if (composingRef.current) return;
    if (value === urlQuery) return;
    const timer = window.setTimeout(() => commit(value, filter), COMMUNITY_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, filter]);

  return (
    <SearchCluster>
      <SearchForm
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          commit(value, filter);
        }}
      >
        {/* 같은 줄의 검색 입력(36px)과 높이를 맞추려 size='md'. 폭은 옵션 길이에 맞춘다. */}
        <FilterField>
          <Select
            size="md"
            width="auto"
            aria-label={COMMUNITY_COPY.gallery.searchFilterAriaLabel}
            value={filter}
            onChange={(event) => {
              const nextFilter = event.target.value;
              setFilter(nextFilter);
              // 검색어가 있을 때만 URL(검색)에 반영 — 빈 검색어면 선택만 기억했다가 입력 시 적용한다.
              if (value.trim()) commit(value, nextFilter);
            }}
          >
            {COMMUNITY_SEARCH_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </Select>
        </FilterField>
        <SearchInputWrap>
          <SearchIcon size={16} strokeWidth={1.8} />
          <SearchInput
            type="search"
            role="searchbox"
            aria-label={COMMUNITY_COPY.gallery.searchAriaLabel}
            placeholder={COMMUNITY_COPY.gallery.searchPlaceholder}
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
      <PrecisionSearch />
    </SearchCluster>
  );
}
