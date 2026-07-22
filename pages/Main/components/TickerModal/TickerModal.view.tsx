import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// per-icon named import → 이 아이콘들만 번들에 포함된다(트리셰이킹). 기본 SVG/탭 아이콘을 lucide로.
import { LayoutGrid, Pencil, Search } from 'lucide-react';
import { Button, FrequencySelect, InputField } from '@/components';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants';
import type { Frequency } from '@/shared/types';
import nasdaqListedJson from '@/utils/TickerParser/output/nasdaq-listed.json';
import otherListedJson from '@/utils/TickerParser/output/other-listed.json';
import {
  FormGrid,
  InlineField,
  ModalCompactFormGrid,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  SearchResultButton,
  SearchResultList,
  SearchResultName,
  SearchResultTicker,
  ModalTabButton,
  ModalTabList,
  ModalTickerSearchIcon,
  ModalTickerSearchInput,
  ModalTickerSearchWrap,
  ModalTitle,
  PresetChipButton,
  PresetChipGrid,
  PresetChipScrollArea
} from '@/pages/Main/Main.shared.styled';
import {
  PresetFilterDrawer,
  PresetFilterStatus,
  PresetFilterTrigger,
  applyPresetFilters,
  countActiveFilters,
  createInitialFilterState,
  derivePresetRanges,
  type PresetFilterState
} from '@/pages/Main/components/PresetFilterPanel';
import { FieldWithCaption, ModalCaption, ModalShell, TickerModalPanel } from './TickerModal.styled';
import type { TickerModalViewProps } from './TickerModal.types';
import {
  buildTickerSearchRows,
  filterPresetKeys,
  isCustomTickerInput,
  isTickerCreateDisabled,
  parseNumericInputOrNaN,
  scoreTickerSearch,
  sortPresetKeys,
  toTotalReturnCaption,
  withDerivedTotalReturn,
  type ListedTickerMap
} from './TickerModal.utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

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
  type ModalTabKey = 'input' | 'preset' | 'search';
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
        <ModalTabList role="tablist" aria-label="티커 생성 탭">
          <ModalTabButton
            type="button"
            role="tab"
            active={activeTab === 'preset'}
            aria-selected={activeTab === 'preset'}
            onClick={() => {
              trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                cta_name: 'ticker_modal_tab_preset',
                mode
              });
              setActiveTab('preset');
            }}
          >
            <LayoutGrid size={15} aria-hidden focusable={false} />
            프리셋
          </ModalTabButton>
          <ModalTabButton
            type="button"
            role="tab"
            active={activeTab === 'input'}
            aria-selected={activeTab === 'input'}
            onClick={() => {
              trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                cta_name: 'ticker_modal_tab_input',
                mode
              });
              setActiveTab('input');
            }}
          >
            <Pencil size={15} aria-hidden focusable={false} />
            직접 입력
          </ModalTabButton>
          {SHOW_SEARCH_TAB ? (
            <ModalTabButton
              type="button"
              role="tab"
              active={activeTab === 'search'}
              aria-selected={activeTab === 'search'}
              onClick={() => setActiveTab('search')}
            >
              검색
            </ModalTabButton>
          ) : null}
        </ModalTabList>

        {activeTab === 'input' ? (
          <>
            <InputField
              label="티커"
              value={tickerDraft.ticker}
              placeholder="예: SCHD"
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, ticker: event.target.value, name: '' }))}
            />
            <ModalCompactFormGrid>
              <InputField
                label="현재 주가"
                prefix="$"
                type="number"
                min={0}
                value={isCreateCustomInput && Number.isNaN(tickerDraft.initialPrice) ? '' : tickerDraft.initialPrice}
                placeholder="예: 100"
                onChange={(event) =>
                  onChangeDraft((prev) => ({
                    ...prev,
                    initialPrice: parseNumericInputOrNaN(event.target.value)
                  }))
                }
              />
              <InputField
                label="배당률"
                suffix="%"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={isCreateCustomInput && Number.isNaN(tickerDraft.dividendYield) ? '' : tickerDraft.dividendYield}
                placeholder="예: 3.5"
                onChange={(event) =>
                  onChangeDraft((prev) =>
                    withDerivedTotalReturn({
                      ...prev,
                      dividendYield: parseNumericInputOrNaN(event.target.value)
                    })
                  )
                }
              />
              <InputField
                label="배당 성장률"
                suffix="%"
                type="number"
                min={-100}
                max={100}
                step={0.1}
                value={isCreateCustomInput && Number.isNaN(tickerDraft.dividendGrowth) ? '' : tickerDraft.dividendGrowth}
                placeholder="예: 7 (음수 가능)"
                onChange={(event) =>
                  onChangeDraft((prev) =>
                    withDerivedTotalReturn({
                      ...prev,
                      dividendGrowth: parseNumericInputOrNaN(event.target.value)
                    })
                  )
                }
              />
              <FieldWithCaption>
                <InputField
                  label="기대 총수익율 (CAGR)"
                  suffix="%"
                  helpAriaLabel="CAGR 설명 열기"
                  onHelpClick={onHelpExpectedTotalReturn}
                  type="number"
                  value={Number.isNaN(derivedTotalReturn) ? '' : derivedTotalReturn}
                  disabled
                  onChange={() => undefined}
                />
                {totalReturnCaption ? <ModalCaption>{totalReturnCaption}</ModalCaption> : null}
              </FieldWithCaption>
              <FrequencySelect
                label="배당 지급 주기"
                value={tickerDraft.frequency}
                onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
              />
            </ModalCompactFormGrid>
          </>
        ) : null}

        {activeTab === 'preset' ? (
          <InlineField>
            <ModalTickerSearchWrap>
              <ModalTickerSearchIcon aria-hidden="true">
                <Search size={14} aria-hidden focusable={false} />
              </ModalTickerSearchIcon>
              <ModalTickerSearchInput
                type="text"
                value={presetSearchKeyword}
                aria-label="프리셋 티커 검색"
                placeholder="프리셋 티커 검색"
                onChange={(event) => setPresetSearchKeyword(event.target.value)}
              />
              <PresetFilterTrigger
                ref={filterTriggerRef}
                isOpen={isFilterDrawerOpen}
                activeCount={countActiveFilters(presetFilter, presetRanges)}
                drawerId={drawerId}
                onToggle={() => setIsFilterDrawerOpen((prev) => !prev)}
              />
            </ModalTickerSearchWrap>
            <PresetFilterStatus filter={presetFilter} ranges={presetRanges} onChange={setPresetFilter} />
            <ModalCaption>
              주의: 실시간 데이터가 아니기 때문에 실제 데이터와 다를 수 있습니다. 참고용으로만 사용해 주세요.
            </ModalCaption>
            <ModalCaption>
              표시: {filteredPresetKeys.length} / 전체: {sortedPresetKeys.length}
            </ModalCaption>
            {filteredPresetKeys.length > 0 ? (
              <PresetChipScrollArea>
                <PresetChipGrid role="listbox" aria-label="프리셋 티커 목록">
                  {filteredPresetKeys.map((presetKey) => (
                    <PresetChipButton
                      key={presetKey}
                      type="button"
                      role="option"
                      selected={selectedPreset === presetKey}
                      aria-selected={selectedPreset === presetKey}
                      aria-label={`${presetTickers[presetKey].ticker} 선택`}
                      onClick={() => {
                        trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                          cta_name: 'ticker_preset_select',
                          ticker: presetTickers[presetKey].ticker
                        });
                        onSelectPreset(presetKey);
                      }}
                    >
                      {presetTickers[presetKey].ticker}
                    </PresetChipButton>
                  ))}
                </PresetChipGrid>
              </PresetChipScrollArea>
            ) : (
              <ModalBody>일치하는 프리셋 티커가 없습니다. 입력 탭에서 직접 생성해주세요.</ModalBody>
            )}
            <FormGrid>
              <InputField label="티커" value={tickerDraft.ticker} disabled onChange={() => undefined} />
              <InputField label="이름" value={tickerDraft.name} disabled onChange={() => undefined} />
            </FormGrid>
            <ModalCompactFormGrid>
              <InputField label="현재 주가" prefix="$" type="number" min={0} value={tickerDraft.initialPrice} disabled onChange={() => undefined} />
              <InputField
                label="배당률"
                suffix="%"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tickerDraft.dividendYield}
                disabled
                onChange={() => undefined}
              />
              <InputField
                label="배당 성장률"
                suffix="%"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tickerDraft.dividendGrowth}
                disabled
                onChange={() => undefined}
              />
              <FieldWithCaption>
                <InputField
                  label="기대 총수익율 (CAGR)"
                  suffix="%"
                  helpAriaLabel="CAGR 설명 열기"
                  onHelpClick={onHelpExpectedTotalReturn}
                  type="number"
                  value={Number.isNaN(derivedTotalReturn) ? '' : derivedTotalReturn}
                  disabled
                  onChange={() => undefined}
                />
                {totalReturnCaption ? <ModalCaption>{totalReturnCaption}</ModalCaption> : null}
              </FieldWithCaption>
              <FrequencySelect
                label="배당 지급 주기"
                value={tickerDraft.frequency}
                disabled
                onChange={() => undefined}
              />
            </ModalCompactFormGrid>
          </InlineField>
        ) : null}

        {SHOW_SEARCH_TAB && activeTab === 'search' ? (
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
                onChange={(event) => setSearchKeyword(event.target.value)}
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
        ) : null}
        <ModalActions>
          {mode === 'edit' ? (
            // 되돌릴 수 없는 액션 → danger. 취소/저장과 시각적으로 구분되어야 오클릭이 준다.
            <Button
              variant="danger"
              // 삭제는 왼쪽 끝으로 밀어서 '저장' 옆에 붙지 않게 한다.
              style={{ marginRight: 'auto' }}
              onClick={() => {
                trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                  cta_name: 'ticker_delete',
                  mode
                });
                onDelete();
              }}
            >
              티커 삭제
            </Button>
          ) : null}
          <Button variant="secondary"
            type="button"
            onClick={() => {
              trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                cta_name: 'ticker_modal_cancel',
                mode
              });
              onClose();
            }}
          >
            취소
          </Button>
          <Button variant="primary"
            type="button"
            disabled={isCreateDisabled}
            onClick={() => {
              if (isCreateDisabled) return;
              trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                cta_name: mode === 'edit' ? 'ticker_save' : 'ticker_create',
                mode
              });
              onSave();
            }}
          >
            {mode === 'edit' ? '저장' : '생성'}
          </Button>
        </ModalActions>
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
