import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent, KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  COMMUNITY_COPY,
  countActiveFilters,
  parseGalleryFilters,
  serializeGalleryFilters,
  type GalleryFilters
} from '@/shared/constants/community';
import { Button } from '@/components/common';
import { AlertIcon, CloseIcon, FilterIcon } from '@/components/community/CommunityIcons';
import type { FilterDraft, PrecisionSearchProps } from './PrecisionSearch.types';
import {
  draftToFilters,
  EMPTY_DRAFT,
  filtersToDraft,
  formatThousands,
  normalizeDigits,
  validateFilters
} from './PrecisionSearch.utils';
import {
  Badge,
  FieldError,
  Fieldset,
  FieldShell,
  FilterRoot,
  FilterTrigger,
  Form,
  Hint,
  Legend,
  NumberInput,
  Panel,
  PanelFooter,
  PanelHeader,
  PanelTitle,
  RangeRow,
  RangeSep,
  RangeUnit,
  Suffix,
  TriggerLabel
} from './PrecisionSearch.styled';

const g = COMMUNITY_COPY.gallery;

/**
 * 갤러리 "정밀 검색" 드롭다운(월배당·목표·기간 facet 필터). URL(`?mdmin=`…)이 유일한 진실 —
 * `useGallery`가 같은 URL을 파싱해 조회에 얹는다(자기완결형, CommunitySearchBar와 같은 패턴).
 *
 * 2단계 커밋: 패널은 로컬 드래프트를 들고, "적용"이 드래프트→URL로 커밋한다(매 키입력 리페치 회피).
 * "초기화"는 필터 파라미터만 지우고 정렬·텍스트검색(sort/q/qf)은 보존한다.
 * 팝오버는 비모달(포커스 트랩 없음) — Esc·바깥클릭·Tab-out으로 닫는다(ThemePresetSwitcher 계약 재사용).
 */
export default function PrecisionSearch({ layout = 'popover' }: PrecisionSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const committed = parseGalleryFilters(searchParams);
  const activeCount = countActiveFilters(committed);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const panelId = useId();
  const titleId = useId();
  const hintId = useId();

  // 열릴 때만 커밋값으로 드래프트 시딩 — 열려 있는 동안 URL 변경이 입력을 덮지 않게 `open`만 의존한다.
  useEffect(() => {
    if (!open) return;
    setDraft(filtersToDraft(parseGalleryFilters(searchParams)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 첫 입력 포커스(첫 마운트 시 .current null 회피 — effect 안에서 읽는다, CommunityModal 함정).
  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
  }, [open]);

  // 바깥 pointerdown 닫기(팝오버·인라인 공통 — 인라인에선 "패널 접기"로 동작).
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const draftFilters = draftToFilters(draft);
  const error = validateFilters(draftFilters);

  const commit = (filters: GalleryFilters) => {
    setSearchParams((prev) => serializeGalleryFilters(prev, filters), { replace: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Tab이 루트 밖으로 나가면 닫는다(포커스 트랩 없는 비모달 팝오버).
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && rootRef.current?.contains(event.relatedTarget as Node)) return;
    setOpen(false);
  };

  const handleApply = (event: FormEvent) => {
    event.preventDefault();
    if (error) return;
    commit(draftFilters);
    setOpen(false);
  };

  const handleReset = () => {
    setDraft(EMPTY_DRAFT);
    commit({}); // 필터 param만 삭제 → sort/q/qf 보존
  };

  const onMoneyChange =
    (key: keyof FilterDraft) => (event: ChangeEvent<HTMLInputElement>) =>
      setDraft((prev) => ({ ...prev, [key]: formatThousands(event.target.value) }));

  const onYearChange =
    (key: keyof FilterDraft) => (event: ChangeEvent<HTMLInputElement>) =>
      setDraft((prev) => ({ ...prev, [key]: normalizeDigits(event.target.value) }));

  const triggerAria =
    activeCount > 0 ? `${g.filterTriggerAria}, ${g.filterActiveCountAria(activeCount)}` : g.filterTriggerAria;

  return (
    <FilterRoot ref={rootRef} layout={layout} onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <FilterTrigger
        ref={triggerRef}
        type="button"
        active={activeCount > 0}
        block={layout === 'inline'}
        aria-label={triggerAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FilterIcon size={16} />
        {layout === 'inline' ? <TriggerLabel>{g.filterTitle}</TriggerLabel> : null}
        {activeCount > 0 ? <Badge aria-hidden="true">{activeCount}</Badge> : null}
      </FilterTrigger>

      {open ? (
        <Panel layout={layout} role="dialog" aria-modal="false" aria-labelledby={titleId} id={panelId}>
          <PanelHeader>
            <PanelTitle id={titleId}>{g.filterTitle}</PanelTitle>
            <Button variant="ghost" size="sm" iconOnly aria-label={g.filterClose} onClick={() => setOpen(false)}>
              <CloseIcon size={16} />
            </Button>
          </PanelHeader>

          <Form onSubmit={handleApply}>
            <Fieldset>
              <Legend>{g.filterMonthlyLabel}</Legend>
              <RangeRow>
                <FieldShell>
                  <NumberInput
                    ref={firstFieldRef}
                    inputMode="numeric"
                    aria-label={g.filterMonthlyMinAria}
                    aria-describedby={hintId}
                    placeholder="예: 100"
                    value={draft.mdMin}
                    onChange={onMoneyChange('mdMin')}
                  />
                  <Suffix aria-hidden="true">{g.unitManwon}</Suffix>
                </FieldShell>
                <RangeSep aria-hidden="true">~</RangeSep>
                <FieldShell>
                  <NumberInput
                    inputMode="numeric"
                    aria-label={g.filterMonthlyMaxAria}
                    placeholder="예: 1,000"
                    value={draft.mdMax}
                    onChange={onMoneyChange('mdMax')}
                  />
                  <Suffix aria-hidden="true">{g.unitManwon}</Suffix>
                </FieldShell>
              </RangeRow>
              <Hint id={hintId}>{g.filterMonthlyHint}</Hint>
            </Fieldset>

            <Fieldset>
              <Legend>{g.filterTargetLabel}</Legend>
              <RangeRow>
                <FieldShell>
                  <NumberInput
                    inputMode="numeric"
                    aria-label={g.filterTargetMinAria}
                    placeholder="예: 300"
                    value={draft.tgtMin}
                    onChange={onMoneyChange('tgtMin')}
                  />
                  <Suffix aria-hidden="true">{g.unitManwon}</Suffix>
                </FieldShell>
                <RangeUnit aria-hidden="true">{g.filterTargetSuffix}</RangeUnit>
              </RangeRow>
            </Fieldset>

            <Fieldset>
              <Legend>{g.filterDurationLabel}</Legend>
              <RangeRow>
                <FieldShell>
                  <NumberInput
                    inputMode="numeric"
                    aria-label={g.filterDurationMinAria}
                    placeholder="예: 5"
                    value={draft.durMin}
                    onChange={onYearChange('durMin')}
                  />
                  <Suffix aria-hidden="true">{g.unitYear}</Suffix>
                </FieldShell>
                <RangeSep aria-hidden="true">~</RangeSep>
                <FieldShell>
                  <NumberInput
                    inputMode="numeric"
                    aria-label={g.filterDurationMaxAria}
                    placeholder="예: 30"
                    value={draft.durMax}
                    onChange={onYearChange('durMax')}
                  />
                  <Suffix aria-hidden="true">{g.unitYear}</Suffix>
                </FieldShell>
              </RangeRow>
            </Fieldset>

            {/* 티커 필터는 TICKER_FILTER_ENABLED=false로 완전 숨김(G2) — 준비되면 여기에 TickerFieldset 추가. */}

            {error ? (
              <FieldError role="alert">
                <AlertIcon size={14} />
                {error}
              </FieldError>
            ) : null}

            <PanelFooter>
              <Button variant="ghost" size="sm" type="button" onClick={handleReset}>
                {g.filterReset}
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={Boolean(error)}>
                {g.filterApply}
              </Button>
            </PanelFooter>
          </Form>
        </Panel>
      ) : null}
    </FilterRoot>
  );
}
