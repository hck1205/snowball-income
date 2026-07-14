import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FrequencySelect, InputField } from '@/components';
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
  ModalPanel,
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
  PresetChipScrollArea,
  PrimaryButton,
  SecondaryButton
} from '@/pages/Main/Main.shared.styled';
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
  const sortedPresetKeys = useMemo(() => sortPresetKeys(presetTickers), [presetTickers]);

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
  }, [isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchKeyword(searchKeyword.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchKeyword]);

  const searchResults = useMemo(
    () => scoreTickerSearch({ rows: SEARCH_ROWS, keyword: debouncedSearchKeyword, maxResults: SEARCH_MAX_RESULTS }),
    [debouncedSearchKeyword]
  );

  const filteredPresetKeys = useMemo(
    () =>
      filterPresetKeys({
        presetKeys: sortedPresetKeys,
        presetTickers,
        koreanNameByTicker: PRESET_TICKER_KOREAN_NAME_BY_TICKER,
        keyword: presetSearchKeyword
      }),
    [presetSearchKeyword, presetTickers, sortedPresetKeys]
  );
  const isCreateCustomInput = isCustomTickerInput(mode, selectedPreset);
  const isCreateDisabled = isTickerCreateDisabled({ mode, selectedPreset, tickerDraft });
  // 정합 모델: 총수익률은 입력이 아니라 배당률 + 배당 성장률의 파생값이다.
  const derivedTotalReturn = withDerivedTotalReturn(tickerDraft).expectedTotalReturn;
  const totalReturnCaption = toTotalReturnCaption(tickerDraft);

  if (!isOpen) return null;
  if (!modalRoot) return null;

  return createPortal(
    <ModalBackdrop role="dialog" aria-modal="true" aria-label="티커 생성" onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle>{mode === 'edit' ? '티커 설정 수정' : '티커 생성'}</ModalTitle>
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
            입력
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
              <InputField
                label="기대 총수익율 (CAGR)"
                helpAriaLabel="CAGR 설명 열기"
                onHelpClick={onHelpExpectedTotalReturn}
                type="number"
                value={Number.isNaN(derivedTotalReturn) ? '' : derivedTotalReturn}
                disabled
                onChange={() => undefined}
              />
              <FrequencySelect
                label="배당 지급 주기"
                value={tickerDraft.frequency}
                onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
              />
            </ModalCompactFormGrid>
            {totalReturnCaption ? (
              <ModalBody style={{ fontSize: '12px' }}>{totalReturnCaption}</ModalBody>
            ) : null}
          </>
        ) : null}

        {activeTab === 'preset' ? (
          <InlineField>
            <ModalTickerSearchWrap>
              <ModalTickerSearchIcon aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </ModalTickerSearchIcon>
              <ModalTickerSearchInput
                type="text"
                value={presetSearchKeyword}
                aria-label="프리셋 티커 검색"
                placeholder="프리셋 티커 검색"
                onChange={(event) => setPresetSearchKeyword(event.target.value)}
              />
            </ModalTickerSearchWrap>
            <ModalBody style={{ fontSize: '12px' }}>
              주의: 실시간 데이터가 아니기 때문에 실제 데이터와 다를 수 있습니다. 참고용으로만 사용해 주세요.
            </ModalBody>
            <ModalBody style={{ fontSize: '12px' }}>
              표시: {filteredPresetKeys.length} / 전체: {sortedPresetKeys.length}
            </ModalBody>
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
              <InputField label="현재 주가" type="number" min={0} value={tickerDraft.initialPrice} disabled onChange={() => undefined} />
              <InputField
                label="배당률"
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
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tickerDraft.dividendGrowth}
                disabled
                onChange={() => undefined}
              />
              <InputField
                label="기대 총수익율 (CAGR)"
                helpAriaLabel="CAGR 설명 열기"
                onHelpClick={onHelpExpectedTotalReturn}
                type="number"
                value={Number.isNaN(derivedTotalReturn) ? '' : derivedTotalReturn}
                disabled
                onChange={() => undefined}
              />
              <FrequencySelect
                label="배당 지급 주기"
                value={tickerDraft.frequency}
                disabled
                onChange={() => undefined}
              />
            </ModalCompactFormGrid>
            {totalReturnCaption ? (
              <ModalBody style={{ fontSize: '12px' }}>{totalReturnCaption}</ModalBody>
            ) : null}
          </InlineField>
        ) : null}

        {SHOW_SEARCH_TAB && activeTab === 'search' ? (
          <>
            <ModalTickerSearchWrap>
              <ModalTickerSearchIcon aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
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
            <SecondaryButton
              type="button"
              onClick={() => {
                trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                  cta_name: 'ticker_delete',
                  mode
                });
                onDelete();
              }}
            >
              티커 삭제
            </SecondaryButton>
          ) : null}
          <SecondaryButton
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
          </SecondaryButton>
          <PrimaryButton
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
          </PrimaryButton>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
