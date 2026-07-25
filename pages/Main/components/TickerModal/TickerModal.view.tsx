import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants';
import nasdaqListedJson from '@/utils/TickerParser/output/nasdaq-listed.json';
import otherListedJson from '@/utils/TickerParser/output/other-listed.json';
import { InlineField, ModalBackdrop, ModalBody, ModalTitle } from '@/components/common';
import {
  PresetFilterDrawer,
  applyPresetFilters,
  createInitialFilterState,
  derivePresetRanges,
  type PresetFilterState
} from '@/pages/Main/components/PresetFilterPanel';
import { ModalShell, TickerModalPanel } from './TickerModal.styled';
import type { TickerModalViewProps } from './TickerModal.types';
import {
  buildTickerSearchRows,
  filterPresetKeys,
  isCustomTickerInput,
  isTickerCreateDisabled,
  scoreTickerSearch,
  sortPresetKeys,
  toTotalReturnCaption,
  withDerivedTotalReturn,
  type ListedTickerMap
} from './TickerModal.utils';
import {
  PresetTickerPicker,
  PresetTickerPreview,
  TickerDraftForm,
  TickerModalActions,
  TickerModalTabs,
  TickerSearchPanel,
  type ModalTabKey
} from './components';

const SEARCH_DEBOUNCE_MS = 220;
const SEARCH_MAX_RESULTS = 120;
const SHOW_SEARCH_TAB = false;

const SEARCH_ROWS = buildTickerSearchRows(nasdaqListedJson as ListedTickerMap, otherListedJson as ListedTickerMap);

export default function TickerModalView({
  isOpen,
  mode,
  selectedPreset,
  presetTickers,
  tickerDraft,
  onBackdropClick,
  onSelectPreset,
  onChangeDraft,
  onHelpExpectedTotalReturn,
  onDelete,
  onClose,
  onSave
}: TickerModalViewProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [presetSearchKeyword, setPresetSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<ModalTabKey>('preset');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const drawerId = useId();
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const sortedPresetKeys = useMemo(() => sortPresetKeys(presetTickers), [presetTickers]);
  const presetRanges = useMemo(() => derivePresetRanges(presetTickers), [presetTickers]);
  const [presetFilter, setPresetFilter] = useState<PresetFilterState>(() => createInitialFilterState(presetRanges));

  // 드로어가 언마운트되므로 포커스 복귀는 뷰가 소유한다 — 닫을 때 트리거로 되돌린다.
  const closeFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
    filterTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('preset');
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
    setPresetSearchKeyword('');
    setIsFilterDrawerOpen(false);
    setPresetFilter(createInitialFilterState(presetRanges));
    // presetRanges 는 presetTickers 파생 memo 다. presetTickers 는 안정 참조여야 한다 —
    // 매 렌더 새 객체를 넘기면 presetRanges 가 재계산돼 이 이펙트가 필터를 매 렌더 초기화한다.
    // (현재는 DIVIDEND_UNIVERSE 상수 기반이라 안전.)
  }, [isOpen, presetRanges]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchKeyword(searchKeyword.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchKeyword]);

  // 탭을 떠나면 필터 드로어도 닫는다 — 드로어를 연 채 input 탭에 갔다 preset 으로 돌아와도
  // 다시 열린 채 재마운트되지 않게. 탭 버튼이 포커스를 가져가므로 트리거 포커스 복귀는 불필요(상태만 false).
  useEffect(() => {
    setIsFilterDrawerOpen(false);
  }, [activeTab]);

  const searchResults = useMemo(
    () => scoreTickerSearch({ rows: SEARCH_ROWS, keyword: debouncedSearchKeyword, maxResults: SEARCH_MAX_RESULTS }),
    [debouncedSearchKeyword]
  );

  const filteredPresetKeys = useMemo(() => {
    // 텍스트 검색 결과에 수치 필터를 AND 로 이어 최종 목록을 만든다.
    const textFiltered = filterPresetKeys({
      presetKeys: sortedPresetKeys,
      presetTickers,
      koreanNameByTicker: PRESET_TICKER_KOREAN_NAME_BY_TICKER,
      keyword: presetSearchKeyword
    });
    return applyPresetFilters(textFiltered, presetTickers, presetFilter);
  }, [presetSearchKeyword, presetTickers, sortedPresetKeys, presetFilter]);
  const isCreateCustomInput = isCustomTickerInput(mode, selectedPreset);
  const isCreateDisabled = isTickerCreateDisabled({ mode, selectedPreset, tickerDraft });
  // 정합 모델: 총수익률은 입력이 아니라 배당률 + 배당 성장률의 파생값이다.
  const derivedTotalReturn = withDerivedTotalReturn(tickerDraft).expectedTotalReturn;
  const totalReturnCaption = toTotalReturnCaption(tickerDraft);

  if (!isOpen) return null;
  if (!modalRoot) return null;

  return createPortal(
    <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby="ticker-modal-title" onClick={onBackdropClick}>
      <ModalShell>
      <TickerModalPanel>
        <ModalTitle id="ticker-modal-title">{mode === 'edit' ? '티커 설정 수정' : '티커 생성'}</ModalTitle>
        <ModalBody>
          {mode === 'edit'
            ? '값을 수정하면 해당 티커 설정이 업데이트됩니다.'
            : '아래 값을 저장하면 좌측 목록에 티커가 추가됩니다.'}
        </ModalBody>
        <TickerModalTabs activeTab={activeTab} mode={mode} showSearchTab={SHOW_SEARCH_TAB} onSelectTab={setActiveTab} />

        {activeTab === 'input' ? (
          <TickerDraftForm
            tickerDraft={tickerDraft}
            isCreateCustomInput={isCreateCustomInput}
            derivedTotalReturn={derivedTotalReturn}
            totalReturnCaption={totalReturnCaption}
            onChangeDraft={onChangeDraft}
            onHelpExpectedTotalReturn={onHelpExpectedTotalReturn}
          />
        ) : null}

        {activeTab === 'preset' ? (
          <InlineField>
            <PresetTickerPicker
              presetTickers={presetTickers}
              selectedPreset={selectedPreset}
              presetSearchKeyword={presetSearchKeyword}
              onChangeSearchKeyword={setPresetSearchKeyword}
              filterTriggerRef={filterTriggerRef}
              isFilterDrawerOpen={isFilterDrawerOpen}
              drawerId={drawerId}
              onToggleFilterDrawer={() => setIsFilterDrawerOpen((prev) => !prev)}
              presetFilter={presetFilter}
              presetRanges={presetRanges}
              onChangeFilter={setPresetFilter}
              filteredPresetKeys={filteredPresetKeys}
              totalPresetCount={sortedPresetKeys.length}
              onSelectPreset={onSelectPreset}
            />
            <PresetTickerPreview
              tickerDraft={tickerDraft}
              derivedTotalReturn={derivedTotalReturn}
              totalReturnCaption={totalReturnCaption}
              onHelpExpectedTotalReturn={onHelpExpectedTotalReturn}
            />
          </InlineField>
        ) : null}

        {SHOW_SEARCH_TAB && activeTab === 'search' ? (
          <TickerSearchPanel
            searchKeyword={searchKeyword}
            debouncedSearchKeyword={debouncedSearchKeyword}
            searchResults={searchResults}
            onChangeSearchKeyword={setSearchKeyword}
            onSelectPreset={onSelectPreset}
            onChangeDraft={onChangeDraft}
          />
        ) : null}
        <TickerModalActions
          mode={mode}
          isCreateDisabled={isCreateDisabled}
          onDelete={onDelete}
          onClose={onClose}
          onSave={onSave}
        />
      </TickerModalPanel>
      {activeTab === 'preset' && isFilterDrawerOpen ? (
        <PresetFilterDrawer
          open={isFilterDrawerOpen}
          drawerId={drawerId}
          filter={presetFilter}
          ranges={presetRanges}
          onChange={setPresetFilter}
          resultCount={filteredPresetKeys.length}
          onClose={closeFilterDrawer}
        />
      ) : null}
      </ModalShell>
    </ModalBackdrop>,
    modalRoot
  );
}
