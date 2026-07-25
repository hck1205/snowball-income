// per-icon named import → 이 아이콘만 번들에 포함된다(트리셰이킹).
import { Search } from 'lucide-react';
import { ModalBody } from '@/components/common';
import {
  SearchResultButton,
  SearchResultList,
  SearchResultName,
  SearchResultTicker,
  ModalTickerSearchIcon,
  ModalTickerSearchInput,
  ModalTickerSearchWrap
} from '@/pages/Main/Main.shared.styled';
import type { TickerSearchPanelProps } from './TickerSearchPanel.types';

/**
 * "검색" 탭 — 상장 티커 전체 검색 결과에서 하나를 골라 직접 입력 드래프트를 채운다.
 * TickerModal 본체에서 뷰 조각만 분리했다 — 현재는 탭 노출 플래그가 꺼져 있다.
 */
function TickerSearchPanel({
  searchKeyword,
  debouncedSearchKeyword,
  searchResults,
  onChangeSearchKeyword,
  onSelectPreset,
  onChangeDraft
}: TickerSearchPanelProps) {
  return (
    <>
      <ModalTickerSearchWrap>
        <ModalTickerSearchIcon aria-hidden="true">
          <Search size={14} aria-hidden focusable={false} />
        </ModalTickerSearchIcon>
        <ModalTickerSearchInput
          type="text"
          value={searchKeyword}
          aria-label="티커 검색"
          placeholder="티커 검색"
          onChange={(event) => onChangeSearchKeyword(event.target.value)}
        />
      </ModalTickerSearchWrap>
      {debouncedSearchKeyword ? (
        searchResults.length > 0 ? (
          <SearchResultList>
            {searchResults.map((item) => (
              <li key={item.ticker}>
                <SearchResultButton
                  type="button"
                  onClick={() => {
                    onSelectPreset('custom');
                    onChangeDraft((prev) => ({
                      ...prev,
                      ticker: item.ticker,
                      name: item.name
                    }));
                  }}
                >
                  <SearchResultTicker>{item.ticker}</SearchResultTicker>
                  <SearchResultName>{item.name}</SearchResultName>
                </SearchResultButton>
              </li>
            ))}
          </SearchResultList>
        ) : (
          <ModalBody>검색 결과가 없습니다.</ModalBody>
        )
      ) : (
        <ModalBody>티커 또는 종목명을 입력해 주세요.</ModalBody>
      )}
    </>
  );
}

export default TickerSearchPanel;
