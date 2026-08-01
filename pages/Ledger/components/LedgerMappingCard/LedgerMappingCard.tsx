import { useId } from 'react';
import { Banner, Button, Card, Chip, DataTable, HintText, InlineField, InlineFieldHeader, Select } from '@/components/common';
import { LEDGER_MAPPING_FIELDS } from '../../types';
import type { LedgerPreviewRow } from '../../types';
import { LEDGER_COPY } from '../../copy';
import type { LedgerMappingCardProps } from './LedgerMappingCard.types';
import {
  ActionHint,
  ActionRow,
  MappingBlock,
  MappingGrid,
  PreviewBlock,
  PreviewTitle,
  SelectSkeleton,
  UnreadableText
} from './LedgerMappingCard.styled';

const copy = LEDGER_COPY;

/** 미리보기 표의 열 순서 = 필드 순서. 값은 이미 문자열이라 표는 그리기만 한다. */
const PREVIEW_HEADERS = [
  copy.mapping.fields.date,
  copy.mapping.fields.kind,
  copy.mapping.fields.amount,
  copy.mapping.fields.category,
  copy.mapping.fields.memo
];

/**
 * §4.2 열 매핑 — 피커로 고른 **기존 시트 전용**.
 *
 * 🔴 **무음 비활성 금지**: 제출 버튼이 비활성이면 언제나 `missing` 사유 줄이 함께 있고, 버튼이
 * `aria-describedby` 로 그것을 가리킨다.
 * 🔴 `aria-invalid` 는 쓰지 않는다 — 아직 "틀린 값"이 아니라 "고르지 않은 값"이다.
 * ⚠ 라벨-입력은 **명시적** `htmlFor`/`id` 로 짝짓는다(암시적 중첩에만 기대지 않는다). "필수" 칩이
 * 라벨 안에 있어 접근명이 `"금액 필수"` 로 읽히는 것은 의도다.
 */
export default function LedgerMappingCard({
  model,
  phase,
  onMappingChange,
  onConfirm,
  onReselect
}: LedgerMappingCardProps) {
  const idPrefix = useId();
  const previewTitleId = `${idPrefix}-preview`;
  const missingHintId = `${idPrefix}-missing`;
  const hasMissing = model.missingNames.length > 0;

  const previewColumns = PREVIEW_HEADERS.map((header, index) => ({
    key: `col-${index}`,
    header,
    render: (row: LedgerPreviewRow) =>
      row.unreadable ? (
        // 🔴 danger 색이 아니다 — 사실 보고이지 오류가 아니다.
        <UnreadableText>{index === 0 ? copy.mapping.preview.unreadable : copy.mapping.preview.empty}</UnreadableText>
      ) : (
        (row.cells[index] ?? copy.mapping.preview.empty)
      )
  }));

  return (
    <Card tone="default" title={copy.mapping.title} subtitle={copy.mapping.subtitle}>
      <HintText>{copy.mapping.sheetLine(model.sheetName)}</HintText>

      <MappingBlock>
        {/* info 는 틴트 면이 없는 톤이다 — 이 화면의 틴트 상한을 지킨다. */}
        <Banner tone="info" role="status">
          {model.matchedCount > 0 ? copy.mapping.autoMatched(model.matchedCount) : copy.mapping.autoMatchedNone}
        </Banner>
      </MappingBlock>

      <MappingBlock>
        <MappingGrid aria-busy={model.isPreviewLoading || undefined}>
          {LEDGER_MAPPING_FIELDS.map((field) => {
            const selectId = `${idPrefix}-${field.id}`;
            return (
              <InlineField key={field.id} htmlFor={selectId}>
                <InlineFieldHeader>
                  {copy.mapping.fields[field.id]}
                  {field.required ? <Chip variant="neutral">{copy.mapping.required}</Chip> : null}
                </InlineFieldHeader>
                {model.columns.length === 0 ? (
                  <SelectSkeleton aria-hidden />
                ) : (
                  <Select
                    id={selectId}
                    size="lg"
                    width="full"
                    value={model.draft[field.id] ?? ''}
                    onChange={(event) => onMappingChange(field.id, event.target.value || null)}
                  >
                    <option value="">{copy.mapping.unset}</option>
                    {model.columns.map((column) => (
                      <option key={column.letter} value={column.letter}>
                        {copy.mapping.columnOption(column.letter, column.header)}
                      </option>
                    ))}
                  </Select>
                )}
              </InlineField>
            );
          })}
        </MappingGrid>
      </MappingBlock>

      <PreviewBlock aria-labelledby={previewTitleId}>
        <PreviewTitle id={previewTitleId}>{copy.mapping.preview.title}</PreviewTitle>
        <HintText>{copy.mapping.preview.body}</HintText>

        {/* 전 행 파싱 실패는 알리되 **제출을 막지 않는다** — 헤더 행만 있는 시트를 연결할 수 있다. */}
        {model.allUnreadable ? (
          <Banner tone="warning" role="status">
            {copy.mapping.preview.allUnreadable}
          </Banner>
        ) : null}

        {model.canPreview && model.previewRows.length > 0 ? (
          // 🔴 `caption` 이 표의 이름이다. `aria-label` 을 덧붙이지 마라(label 이 이겨서 caption 이 죽는다).
          <DataTable caption={copy.mapping.preview.caption} columns={previewColumns} rows={[...model.previewRows]} />
        ) : (
          // 행이 0이면 빈 표를 그리지 않는다.
          <HintText>{copy.mapping.preview.noRows}</HintText>
        )}
      </PreviewBlock>

      {hasMissing ? <ActionHint id={missingHintId}>{copy.mapping.missing([...model.missingNames])}</ActionHint> : null}

      <ActionRow>
        <Button
          type="button"
          variant="primary"
          disabled={hasMissing}
          aria-describedby={hasMissing ? missingHintId : undefined}
          loading={phase === 'connecting'}
          onClick={onConfirm}
        >
          {copy.mapping.submit}
        </Button>
        <Button type="button" variant="secondary" loading={phase === 'picking'} onClick={onReselect}>
          {copy.mapping.reselect}
        </Button>
      </ActionRow>
    </Card>
  );
}
