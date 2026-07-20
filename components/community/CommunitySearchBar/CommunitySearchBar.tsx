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

export type CommunitySearchBarProps = {
  /** 모바일 오토포커스(펼침 시). */
  autoFocus?: boolean;
  /**
   * 배치 컨텍스트. desktop(기본)=헤더 인라인(정밀 필터=앵커 팝오버),
   * mobile=헤더 아래 펼침 바(정밀 필터=in-flow 인라인 패널·전체폭). 반응형은 이 prop으로 상호배타.
   */
  variant?: 'desktop' | 'mobile';
};

/**
 * 헤더 인라인 검색. URL(`?q=`, `?qf=`)이 유일한 진실 — 목록이 URL을 구독해 재요청한다.
 * 입력은 300ms 디바운스 후 URL을 갱신하고, 엔터는 즉시 반영한다. 빈 입력이면 `q`를 제거한다.
 *
 * IME 조합 중에는 URL을 갱신하지 않는다(한글 조합이 깨지지 않게).
 */
export default function CommunitySearchBar({ autoFocus, variant = 'desktop' }: CommunitySearchBarProps) {
  const isMobile = variant === 'mobile';
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
    <SearchCluster mobile={isMobile}>
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
          <SearchIcon size={16} />
          <SearchInput
            type="search"
            role="searchbox"
            aria-label={COMMUNITY_COPY.gallery.searchAriaLabel}
            placeholder={COMMUNITY_COPY.gallery.searchPlaceholder}
            value={value}
            autoFocus={autoFocus}
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
      <PrecisionSearch layout={isMobile ? 'inline' : 'popover'} />
    </SearchCluster>
  );
}
