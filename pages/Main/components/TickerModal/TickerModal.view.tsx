import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants';
import nasdaqListedJson from '@/utils/TickerParser/output/nasdaq-listed.json';
import otherListedJson from '@/utils/TickerParser/output/other-listed.json';
import { InlineField, ModalBody, SideDrawer } from '@/components/common';
import {
  PresetFilterDrawer,
  applyPresetFilters,
  createInitialFilterState,
  derivePresetRanges,
  type PresetFilterState
} from '@/pages/Main/components/PresetFilterPanel';
import type { TickerModalViewProps } from './TickerModal.types';
import { Button } from '@/components';
import { StageActionRow, TickerDrawerLayout } from './TickerModal.styled';
import {
  buildTickerSearchRows,
  filterPresetKeys,
  isCustomTickerInput,
  isTickerCreateDisabled,
  removeStaged,
  resolveCreateTargets,
  scoreTickerSearch,
  sortPresetKeys,
  stageCustomDraft,
  toPreviewDisplayName,
  toggleStagedPreset,
  toTotalReturnCaption,
  withDerivedTotalReturn,
  type ListedTickerMap,
  type StagedTicker
} from './TickerModal.utils';
import {
  PresetTickerPicker,
  PresetTickerPreview,
  StagedTickerList,
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
  onSelectPreset,
  onChangeDraft,
  onHelpExpectedTotalReturn,
  onDelete,
  onClose,
  onSave
}: TickerModalViewProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [presetSearchKeyword, setPresetSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<ModalTabKey>('preset');
  /**
   * 생성 대기 목록 — **뷰가 소유한다.** 모달을 닫으면 사라져야 하는 임시 상태라 jotai 로 올리지
   * 않는다(올리면 공유 링크·영속 페이로드에 새 필드가 생길 이유가 없는데도 생긴다).
   */
  const [staged, setStaged] = useState<readonly StagedTicker[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const panelId = useId();
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

  /*
   * 🔴 뒤로가기·Escape·배경 스크롤 잠금은 **공용 `SideDrawer` 가 소유한다**(2026-08-11 드로어 전환).
   *
   * 이 파일에는 그 셋이 직접 배선돼 있었다(모달 시절). 드로어로 바뀐 뒤에도 남겨 두면 같은 층이
   * 스택에 **두 번** 등록돼 뒤로가기 한 번에 두 칸이 소비되고, 잠금은 `html`(여기) 과 `body`
   * (드로어) 두 곳이 서로 모르는 채 걸린다. 그래서 전부 걷어냈다 — 중첩 순서(설정 → 티커 →
   * 필터)는 `SideDrawer` 와 `PresetFilterDrawer` 가 각자 등록하는 같은 스택이 그대로 정한다.
   */

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('preset');
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
    setPresetSearchKeyword('');
    setIsFilterDrawerOpen(false);
    // 담은 목록은 모달을 열 때마다 빈 상태로 시작한다 — 지난번에 담다 만 것이 되살아나면 사고다.
    setStaged([]);
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
  /**
   * 이름 칸에 보여 줄 이름. 판정은 `toPreviewDisplayName` 한 곳이 소유한다 — 프리셋 선택과
   * **수정 모드**(저장된 name 이 빈 문자열인 경우)를 같은 규칙으로 처리해야 한다.
   */
  const previewDisplayName = toPreviewDisplayName({
    tickerDraft,
    selectedPreset,
    presetTickers,
    koreanNameByTicker: PRESET_TICKER_KOREAN_NAME_BY_TICKER
  });

  /** 칩의 선택 표시용 — 담은 항목의 키(프리셋 키)들. */
  const stagedPresetKeys = useMemo(() => staged.map((item) => item.key), [staged]);
  const isCreateCustomInput = isCustomTickerInput(mode, selectedPreset);

  /**
   * 프리셋 칩을 누르면 **담기 토글 + 미리보기 갱신**을 함께 한다.
   *
   * 미리보기(`onSelectPreset` → tickerDraft)는 담을 때만 갱신한다 — 빼는 순간 미리보기까지
   * 지우면 "방금 뺀 것이 무엇이었는지"를 확인할 화면이 사라진다.
   */
  const handleTogglePreset = useCallback(
    (preset: 'custom' | keyof typeof presetTickers) => {
      if (preset === 'custom') {
        onSelectPreset(preset);
        return;
      }
      const willStage = !staged.some((item) => item.key === preset);
      setStaged((prev) => toggleStagedPreset(prev, preset, presetTickers[preset]));
      if (willStage) onSelectPreset(preset);
    },
    [onSelectPreset, presetTickers, staged]
  );

  /** 직접 입력 폼을 목록에 담고 폼을 비운다 — 연속 입력이 되게(주기는 방금 고른 값을 유지). */
  const handleStageCustomDraft = useCallback(() => {
    setStaged((prev) => stageCustomDraft(prev, tickerDraft));
    onChangeDraft((prev) => ({
      ticker: '',
      name: '',
      initialPrice: Number.NaN,
      dividendYield: Number.NaN,
      dividendGrowth: Number.NaN,
      expectedTotalReturn: Number.NaN,
      frequency: prev.frequency
    }));
  }, [onChangeDraft, tickerDraft]);

  /**
   * 담은 목록 노드. **탭마다 자리가 다르므로** 노드를 한 번 만들어 두 곳에서 쓴다(탭은 배타라
   * 실제로 그려지는 것은 언제나 하나다).
   *
   * 🔴 자리: 프리셋 탭은 **칩 목록 바로 밑**(2026-08-11 사용자 지시) — 고른 것이 어디로 갔는지
   *    눈이 움직이는 거리가 가장 짧다. 직접 입력 탭은 담기 버튼 밑이다(같은 이유).
   */
  const stagedList =
    mode === 'create' ? (
      <StagedTickerList
        staged={staged}
        onRemove={(key) => setStaged((prev) => removeStaged(prev, key))}
        onClear={() => setStaged([])}
      />
    ) : null;

  /* 🔴 라벨·잠금·저장이 **같은 목록**을 본다. 세 곳이 따로 세면 개수와 결과가 어긋난다. */
  const createTargets = resolveCreateTargets({ staged, tickerDraft, isCustomInputTab: activeTab === 'input' });
  const isCreateDisabled =
    mode === 'edit'
      ? isTickerCreateDisabled({ mode, selectedPreset, tickerDraft })
      : createTargets.length === 0;
  // 정합 모델: 총수익률은 입력이 아니라 배당률 + 배당 성장률의 파생값이다.
  const derivedTotalReturn = withDerivedTotalReturn(tickerDraft).expectedTotalReturn;
  const totalReturnCaption = toTotalReturnCaption(tickerDraft);

  if (!isOpen) return null;

  /*
   * 🔴 **설정 드로어 위에 겹치는 드로어**다(2026-08-11 사용자 지시로 모달 → 드로어).
   *
   * 모달이던 시절에는 화면 가운데 520px 패널이 떠서, 설정 드로어에서 "종목을 담는" 동작이
   * 다른 좌표계로 튀어나갔다. 지금은 같은 왼쪽 가장자리에서 한 겹 위로 올라온다 — 뒤로가기·
   * Escape 로 한 겹씩 벗겨지는 동선이 화면 형태와 일치한다.
   *
   * ⚠ 설정 드로어(560px)보다 **넓다**(600px). 아래 층을 완전히 덮어 "지금 만지는 것은 이 층"이
   *   분명해진다 — 살짝 좁게 두면 뒤 패널이 한 줄 삐져나와 어느 층이 위인지 흔들린다.
   * ⚠ `dimBelow='always'` — 전 폭에서 아래 층을 덮는다. 이 층은 "고르고 돌아오는" 한 갈래 동선이라
   *   설정 드로어처럼 "만지면서 결과를 본다"가 아니다.
   */
  return (
    <SideDrawer
      id={panelId}
      isOpen={isOpen}
      stacked
      dimBelow="always"
      width="min(96vw, 600px)"
      title={mode === 'edit' ? '티커 설정 수정' : '티커 생성'}
      closeLabel={mode === 'edit' ? '티커 설정 수정 닫기' : '티커 생성 닫기'}
      onClose={onClose}
    >
      <TickerDrawerLayout>
        <ModalBody>
          {mode === 'edit'
            ? '값을 수정하면 해당 티커 설정이 업데이트됩니다.'
            : '아래 값을 저장하면 종목 목록에 티커가 추가됩니다.'}
        </ModalBody>
        <TickerModalTabs activeTab={activeTab} mode={mode} showSearchTab={SHOW_SEARCH_TAB} onSelectTab={setActiveTab} />

        {activeTab === 'input' ? (
          <>
            <TickerDraftForm
              tickerDraft={tickerDraft}
              isCreateCustomInput={isCreateCustomInput}
              derivedTotalReturn={derivedTotalReturn}
              totalReturnCaption={totalReturnCaption}
              onChangeDraft={onChangeDraft}
              onHelpExpectedTotalReturn={onHelpExpectedTotalReturn}
            />
            {/*
              🔴 직접 입력이 다중 생성에서 소외되지 않게 하는 한 칸(2026-08-10). 담으면 폼이 비워져
                 **여러 개를 연달아** 적을 수 있고, 프리셋에서 담은 것들과 같은 목록에 섞인다.
              ⚠ 담지 않고 바로 생성해도 이 폼 값은 함께 만들어진다(`resolveCreateTargets`) — 이 버튼은
                "여러 개를 적으려면" 쓰는 것이고, 한 개만 만들 사람에게 강요되는 단계가 아니다.
            */}
            {mode === 'create' ? (
              <StageActionRow>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isTickerCreateDisabled({ mode, selectedPreset: 'custom', tickerDraft })}
                  onClick={handleStageCustomDraft}
                >
                  목록에 담고 계속 입력
                </Button>
              </StageActionRow>
            ) : null}
            {stagedList}
          </>
        ) : null}

        {activeTab === 'preset' ? (
          <InlineField>
            <PresetTickerPicker
              presetTickers={presetTickers}
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
              stagedPresetKeys={stagedPresetKeys}
              onSelectPreset={handleTogglePreset}
            />
            {stagedList}
            {/*
              🔴 미리보기는 **항상 보인다**(2026-08-11 사용자 지적으로 되돌림). 두 개 이상 담으면
                 숨기게 해 뒀었는데, 사용자에게는 "두 개째부터 담기 표시만 남고 값이 사라지는 버그"로
                 읽혔다 — 맞는 지적이다. 방금 누른 종목의 값을 확인하는 창은 담은 개수와 무관하게
                 필요하다(무엇을 담았는지는 아래 목록이 따로 말한다).
            */}
            <PresetTickerPreview
              tickerDraft={tickerDraft}
              displayName={previewDisplayName}
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
          createCount={createTargets.length}
          onDelete={onDelete}
          onClose={onClose}
          /* 수정 모드는 목록 개념이 없다 — 인자를 비워 종전 단일 저장 경로로 보낸다. */
          onSave={() => onSave(mode === 'edit' ? undefined : createTargets)}
        />
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
      </TickerDrawerLayout>
    </SideDrawer>
  );
}
