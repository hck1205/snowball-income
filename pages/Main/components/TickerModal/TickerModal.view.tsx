import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FrequencySelect, InputField } from '@/components';
import type { PresetTickerKey } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import type { Frequency } from '@/shared/types';
import nasdaqListedJson from '@/utils/TickerParser/output/nasdaq-listed.json';
import otherListedJson from '@/utils/TickerParser/output/other-listed.json';
import {
  FormGrid,
  InlineField,
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
  PrimaryButton,
  SecondaryButton
} from '@/pages/Main/Main.shared.styled';
import type { TickerModalViewProps } from './TickerModal.types';

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
  const [activeTab, setActiveTab] = useState<ModalTabKey>('input');
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
    setActiveTab('input');
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
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
            active={activeTab === 'input'}
            aria-selected={activeTab === 'input'}
            onClick={() => setActiveTab('input')}
          >
            입력
          </ModalTabButton>
          <ModalTabButton
            type="button"
            role="tab"
            active={activeTab === 'preset'}
            aria-selected={activeTab === 'preset'}
            onClick={() => setActiveTab('preset')}
          >
            프리셋
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
          <FormGrid>
            <InputField
              label="티커"
              value={tickerDraft.ticker}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, ticker: event.target.value, name: '' }))}
            />
            <InputField
              label="현재 주가"
              type="number"
              min={0}
              value={tickerDraft.initialPrice}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, initialPrice: Number(event.target.value) }))}
            />
            <InputField
              label="배당률"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={tickerDraft.dividendYield}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, dividendYield: Number(event.target.value) }))}
            />
            <InputField
              label="배당 성장률"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={tickerDraft.dividendGrowth}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, dividendGrowth: Number(event.target.value) }))}
            />
            <InputField
              label="기대 총수익율 (CAGR)"
              helpAriaLabel="CAGR 설명 열기"
              onHelpClick={onHelpExpectedTotalReturn}
              type="number"
              min={-100}
              max={100}
              step={0.1}
              value={tickerDraft.expectedTotalReturn}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, expectedTotalReturn: Number(event.target.value) }))}
            />
            <FrequencySelect
              label="배당 지급 주기"
              value={tickerDraft.frequency}
              onChange={(event) => onChangeDraft((prev) => ({ ...prev, frequency: event.target.value as Frequency }))}
            />
          </FormGrid>
        ) : null}

        {activeTab === 'preset' ? (
          <InlineField>
            <PresetChipGrid role="listbox" aria-label="프리셋 티커 목록">
              {sortedPresetKeys.map((presetKey) => (
                <PresetChipButton
                  key={presetKey}
                  type="button"
                  role="option"
                  selected={selectedPreset === presetKey}
                  aria-selected={selectedPreset === presetKey}
                  aria-label={`${getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name)} 선택`}
                  onClick={() => onSelectPreset(presetKey)}
                >
                  {getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name)}
                </PresetChipButton>
              ))}
            </PresetChipGrid>
            <FormGrid>
              <InputField label="티커" value={tickerDraft.ticker} disabled onChange={() => undefined} />
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
            </FormGrid>
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
            <SecondaryButton type="button" onClick={onDelete}>
              티커 삭제
            </SecondaryButton>
          ) : null}
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onSave}>
            {mode === 'edit' ? '저장' : '생성'}
          </PrimaryButton>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
