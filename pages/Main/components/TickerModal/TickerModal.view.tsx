import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FrequencySelect, InputField } from '@/components';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER, type PresetTickerKey } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
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
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

type ListedTickerMeta = { name: string; issuer?: string };
type ListedTickerMap = Record<string, ListedTickerMeta>;
type SearchRow = { ticker: string; name: string; issuer: string; tickerUpper: string; nameUpper: string };

const SEARCH_DEBOUNCE_MS = 220;
const SEARCH_MAX_RESULTS = 120;
const SHOW_SEARCH_TAB = false;

const nasdaqListed = nasdaqListedJson as ListedTickerMap;
const otherListed = otherListedJson as ListedTickerMap;

const SEARCH_ROWS: SearchRow[] = (() => {
  const merged = new Map<string, ListedTickerMeta>();
  for (const [ticker, meta] of Object.entries(nasdaqListed)) merged.set(ticker.toUpperCase(), meta);
  for (const [ticker, meta] of Object.entries(otherListed)) {
    const normalizedTicker = ticker.toUpperCase();
    if (!merged.has(normalizedTicker)) merged.set(normalizedTicker, meta);
  }

  return Array.from(merged.entries()).map(([ticker, meta]) => ({
    ticker,
    name: meta.name ?? '',
    issuer: meta.issuer ?? '',
    tickerUpper: ticker,
    nameUpper: (meta.name ?? '').toUpperCase()
  }));
})();

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
  const sortedPresetKeys = useMemo(
    () =>
      (Object.keys(presetTickers) as PresetTickerKey[]).sort((leftKey, rightKey) => {
        const leftLabel = getTickerDisplayName(presetTickers[leftKey].ticker, presetTickers[leftKey].name);
        const rightLabel = getTickerDisplayName(presetTickers[rightKey].ticker, presetTickers[rightKey].name);
        return leftLabel.localeCompare(rightLabel, 'en', { sensitivity: 'base' });
      }),
    [presetTickers]
  );

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

  const searchResults = useMemo(() => {
    const query = debouncedSearchKeyword.toUpperCase();
    if (!query) return [] as Array<SearchRow & { score: number }>;

    const queryChars = Array.from(new Set(query.replace(/[^A-Z0-9]/g, '').split('').filter(Boolean)));

    const scored = SEARCH_ROWS.map((row) => {
      const searchableTicker = row.tickerUpper;
      const includesQuery = searchableTicker.includes(query);
      const charHitCount = queryChars.reduce((count, ch) => (searchableTicker.includes(ch) ? count + 1 : count), 0);
      if (!includesQuery && charHitCount === 0) return null;

      let score = charHitCount * 12;
      if (row.tickerUpper === query) score += 1200;
      else if (row.tickerUpper.startsWith(query)) score += 800;
      else if (row.tickerUpper.includes(query)) score += 520;

      return { ...row, score };
    })
      .filter((item): item is SearchRow & { score: number } => item !== null)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.ticker.localeCompare(right.ticker, 'en', { sensitivity: 'base' });
      });

    return scored.slice(0, SEARCH_MAX_RESULTS);
  }, [debouncedSearchKeyword]);

  const filteredPresetKeys = useMemo(() => {
    const query = presetSearchKeyword.trim().toUpperCase();
    if (!query) return sortedPresetKeys;

    return sortedPresetKeys.filter((presetKey) => {
      const ticker = presetTickers[presetKey].ticker.toUpperCase();
      const displayName = getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name).toUpperCase();
      const koreanName = PRESET_TICKER_KOREAN_NAME_BY_TICKER[presetKey].toUpperCase();
      return ticker.includes(query) || displayName.includes(query) || koreanName.includes(query);
    });
  }, [presetSearchKeyword, presetTickers, sortedPresetKeys]);
  const isCreateCustomInput = mode === 'create' && selectedPreset === 'custom';
  const isCreateDisabled =
    isCreateCustomInput &&
    (tickerDraft.ticker.trim() === '' ||
      Number.isNaN(tickerDraft.initialPrice) ||
      Number.isNaN(tickerDraft.dividendYield) ||
      Number.isNaN(tickerDraft.dividendGrowth) ||
      Number.isNaN(tickerDraft.expectedTotalReturn));

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
                    initialPrice: event.target.value === '' ? Number.NaN : Number(event.target.value)
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
                  onChangeDraft((prev) => ({
                    ...prev,
                    dividendYield: event.target.value === '' ? Number.NaN : Number(event.target.value)
                  }))
                }
              />
              <InputField
                label="배당 성장률"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={isCreateCustomInput && Number.isNaN(tickerDraft.dividendGrowth) ? '' : tickerDraft.dividendGrowth}
                placeholder="예: 7"
                onChange={(event) =>
                  onChangeDraft((prev) => ({
                    ...prev,
                    dividendGrowth: event.target.value === '' ? Number.NaN : Number(event.target.value)
                  }))
                }
              />
              <InputField
                label="기대 총수익율 (CAGR)"
                helpAriaLabel="CAGR 설명 열기"
                onHelpClick={onHelpExpectedTotalReturn}
                type="number"
                min={-100}
                max={100}
                step={0.1}
                value={isCreateCustomInput && Number.isNaN(tickerDraft.expectedTotalReturn) ? '' : tickerDraft.expectedTotalReturn}
                placeholder="예: 10"
                onChange={(event) =>
                  onChangeDraft((prev) => ({
                    ...prev,
                    expectedTotalReturn: event.target.value === '' ? Number.NaN : Number(event.target.value)
                  }))
                }
              />
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
                type="number"
                min={-100}
                max={100}
                step={0.1}
                value={tickerDraft.expectedTotalReturn}
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
