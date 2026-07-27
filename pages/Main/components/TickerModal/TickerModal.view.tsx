import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants';
import nasdaqListedJson from '@/utils/TickerParser/output/nasdaq-listed.json';
import otherListedJson from '@/utils/TickerParser/output/other-listed.json';
import { InlineField, ModalBackdrop, ModalBody, ModalTitle } from '@/components/common';
import { useDrawerBackClose } from '@/shared/hooks';
import { BREAKPOINT } from '@/shared/styles';
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

/** 설정 패널이 오버레이 드로어가 아닌(= 좌측 정적 컬럼) 폭. MobileMenuDrawer 와 같은 경계를 토큰에서 가져온다. */
const STATIC_COLUMN_QUERY = `(min-width: ${BREAKPOINT.drawer + 1}px)`;

function matchesStaticColumn(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(STATIC_COLUMN_QUERY).matches;
}

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

  /**
   * 모바일 뒤로가기로 모달 닫기 — 사용자는 이 모달을 드로어류로 인식한다(드로어 3곳과 같은 훅).
   * 중첩: 모달(마커1) → 필터 드로어(마커2). 마커가 인스턴스별 고유 id라 뒤로가기 1회는 필터만,
   * 한 번 더는 모달만 닫는다. URL 은 한 글자도 바뀌지 않는다(훅 JSDoc 계약).
   */
  useDrawerBackClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  /**
   * 열려 있는 동안 배경 페이지 스크롤 잠금 — 없으면 모바일에서 모달 위 터치가 뒤 페이지를 굴린다.
   *
   * ⚠ 잠그는 대상이 `body` 가 아니라 **`html`** 인 이유: 모바일에서 이 모달은 설정 드로어
   * (MobileMenuDrawer) 위에 열리는데, 그 드로어가 `document.body.style.overflow` 를 같은
   * 저장·복원 방식으로 소유한다. 저장 시점 값이 서로 얽혀 있어(모달은 드로어가 심어둔 'hidden'을
   * 저장한다) 둘이 같은 값을 두고 겹치면 잠금이 남을 수 있다. 실측(QA)으로 확인된 영구 잠금 경로는
   * **순차 닫힘** — 드로어가 먼저 닫혀 body 를 ''로 되돌린 뒤, 모달이 열린 채 남았다가 나중에
   * 닫히며 자기가 저장해 둔 'hidden'을 복원한다 → 페이지가 영영 잠긴다.
   * (티커 저장처럼 **같은 커밋에서 함께 닫히는** 경우는 React 18 passive 정리 순서상 언마운트되는
   * 모달 정리가 드로어의 의존성 변경 정리보다 먼저 돌아 우연히 상쇄된다 — 정리 순서에 기댄 취약한
   * 초록이라 근거로 삼지 않는다.)
   * 뷰포트 스크롤은 html 이 visible 일 때만 body 로 전파되므로, 서로 다른 엘리먼트를 잠그면
   * 두 잠금이 독립적이고 순서와 무관하게 항상 정확히 풀린다.
   */
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    // 오버레이 폭(≤ BREAKPOINT.drawer)에서만 잠근다 — 데스크톱은 배경 스크롤 오작동이 없는 반면,
    // 클래식 스크롤바(Windows)에서 잠그는 순간 스크롤바가 사라져 배경이 ~15px 밀리는 시각 변화가 생긴다.
    if (matchesStaticColumn()) return undefined;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
