import { useId } from 'react';
import { Button, Card, Select } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerBlendSourceKey } from '../../types';
import { LEDGER_BLEND_LABEL_MAX_LENGTH } from '../../utils';
import type { LedgerBlendSetupProps } from './LedgerBlendSetup.types';
import {
  ActionRow,
  BlockedHint,
  Field,
  FieldHint,
  FieldLabel,
  LabelInput,
  Note,
  NoteList,
  SourceFieldset,
  SourceGrid,
  SourceLegend
} from './LedgerBlendSetup.styled';

const copy = LEDGER_COPY;

/**
 * B-3 **블렌딩 설정** — 합쳐 볼 가계부 두 개를 고르고 각각을 부를 이름을 붙인다.
 *
 * 🔴 **여기서 고르는 것은 "이 브라우저에 저장된 링크"의 참조뿐**이다(D3-3). 저장되는 값은 시트 주소·
 *    탭 번호·사용자 라벨이고, 가계부 값이 들어갈 자리가 없다 — 그 사실을 `privacyNote` 가 말한다.
 * 🔴 **같은 가계부를 두 번 고르면 제출이 막힌다**(모든 금액이 두 배가 된다). 판정은 화면이 새로
 *    만들지 않고 `createLedgerBlendConfig` 와 같은 규칙을 훅이 모델로 접어 준다.
 * 🔴 **통화 전제를 문장으로 말한다**(D3-6) — 앱은 두 시트의 통화가 다른지 감지할 방법이 없다.
 * 🔴 **두 구성 경로를 모두 열어 둔다** — 같은 시트의 두 탭도, 서로 다른 시트도 된다(스펙 §8:
 *    공유받은 시트의 피커 노출은 미확인이지 실패가 아니다).
 */
export default function LedgerBlendSetup({
  model,
  onChangeSource,
  onChangeLabel,
  onSubmit,
  onCancel,
  onClear
}: LedgerBlendSetupProps) {
  const idPrefix = useId();
  const blockedHintId = `${idPrefix}-blend-blocked`;
  const isBlocked = model.blockedReason !== null;

  const renderSource = (source: LedgerBlendSourceKey, legend: string) => {
    const field = model[source];
    const selectId = `${idPrefix}-${source}-pick`;
    const labelId = `${idPrefix}-${source}-label`;
    const labelHintId = `${idPrefix}-${source}-label-hint`;

    return (
      <SourceFieldset $source={source}>
        <SourceLegend>{legend}</SourceLegend>
        <Field>
          <FieldLabel htmlFor={selectId}>{copy.blend.setup.pick}</FieldLabel>
          <Select
            id={selectId}
            value={field.value ?? ''}
            onChange={(event) => onChangeSource(source, event.target.value)}
          >
            {/* 아직 고르지 않은 상태를 값으로 둔다 — 첫 항목이 자동으로 선택된 척하지 않는다. */}
            <option value="">{copy.mapping.unset}</option>
            {model.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={labelId}>{copy.blend.setup.label}</FieldLabel>
          <LabelInput
            id={labelId}
            type="text"
            value={field.label}
            maxLength={LEDGER_BLEND_LABEL_MAX_LENGTH}
            aria-describedby={labelHintId}
            onChange={(event) => onChangeLabel(source, event.target.value)}
          />
          <FieldHint id={labelHintId}>{copy.blend.setup.labelHint(LEDGER_BLEND_LABEL_MAX_LENGTH)}</FieldHint>
        </Field>
      </SourceFieldset>
    );
  };

  return (
    <Card tone="sunken" title={copy.blend.setup.title} subtitle={copy.blend.setup.subtitle}>
      <NoteList>
        <Note>{copy.blend.setup.pathNote}</Note>
        <Note>{copy.blend.currencyNote}</Note>
        <Note>{copy.blend.setup.privacyNote}</Note>
      </NoteList>

      <SourceGrid>
        {renderSource('a', copy.blend.setup.legendA)}
        {renderSource('b', copy.blend.setup.legendB)}
      </SourceGrid>

      {/* 이름을 아직 못 읽었으면 그 사실을 말한다 — 중립 문구가 진짜 이름인 척하지 않는다. */}
      {model.isLoadingNames ? <BlockedHint>{copy.blend.setup.loadingNames}</BlockedHint> : null}

      {model.blockedReason === null ? null : (
        <BlockedHint id={blockedHintId}>{model.blockedReason}</BlockedHint>
      )}

      <ActionRow>
        <Button
          type="button"
          variant="primary"
          disabled={isBlocked}
          aria-describedby={isBlocked ? blockedHintId : undefined}
          onClick={onSubmit}
        >
          {copy.blend.setup.submit}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {copy.blend.setup.cancel}
        </Button>
        {model.canClear ? (
          <Button type="button" variant="ghost" onClick={onClear}>
            {copy.blend.setup.clear}
          </Button>
        ) : null}
      </ActionRow>

      {model.canClear ? <BlockedHint>{copy.blend.setup.clearHint}</BlockedHint> : null}
    </Card>
  );
}
