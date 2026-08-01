import { useEffect, useId, useRef } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Banner, Button, Modal } from '@/components/common';
import { formatKRW } from '@/shared/utils';
import { LEDGER_COPY } from '../../copy';
import { LEDGER_MEMO_MAX_LENGTH, firstInvalidField, parseLedgerAmount } from '../../utils';
import { useLedgerOverlay } from '../../hooks';
import type { LedgerFormModalProps } from './LedgerFormModal.types';
import {
  AmountInput,
  AmountRow,
  AmountUnit,
  BannerRow,
  Field,
  FieldError,
  FieldHint,
  FieldInput,
  FieldLabel,
  FormGrid,
  KindFieldset,
  KindLegend,
  KindOption,
  KindOptionFace,
  KindOptions
} from './LedgerFormModal.styled';

const copy = LEDGER_COPY;

/**
 * §4.5 항목 추가 / 수정 모달.
 *
 * 🔴 **수정 모달 안에 삭제 버튼을 두지 않는다.** 삭제는 목록 행에서만 시작한다 — 모달 위에 모달을
 * 띄우면 두 `Modal` 이 각자 `documentElement` 의 `overflow` 를 저장·복원해 순차 닫힘에서 페이지가
 * 영구 잠긴다(pitfalls 2026-07-27).
 *
 * 🔴 **제출 시도 전에는 오류를 그리지 않는다**(입력 중 빨간 줄 금지). 시도 후에는 첫 오류 필드로
 * 포커스를 옮기고, 그 입력이 `aria-invalid` + `aria-describedby` 로 오류 문장을 가리킨다.
 *
 * 🔴 짧은 폼이라 오류 **요약 배너를 만들지 않는다** — 필드 오류만 남긴다(요약은 소음이다).
 */
export default function LedgerFormModal({
  model,
  phase,
  isOpen,
  isExpired,
  isReconnecting,
  expiredHintId,
  isConflict,
  onChange,
  onSubmit,
  onClose,
  onReconnect,
  onRefresh
}: LedgerFormModalProps) {
  const idPrefix = useId();
  const formId = `${idPrefix}-form`;
  const dateId = `${idPrefix}-date`;
  const amountId = `${idPrefix}-amount`;
  const categoryId = `${idPrefix}-category`;
  const memoId = `${idPrefix}-memo`;
  const categoryListId = `${idPrefix}-categories`;
  const categoryHintId = `${idPrefix}-category-hint`;
  const amountHintId = `${idPrefix}-amount-hint`;

  const dateRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useLedgerOverlay(isOpen, onClose, dateRef);

  const { errors } = model;

  /** 제출 시도 후 첫 오류 필드로 포커스. 🔴 deps 에 `onClose` 를 넣지 마라(렌더마다 포커스가 튄다). */
  useEffect(() => {
    const target = firstInvalidField(errors);
    if (target === null) return;
    const element = containerRef.current?.querySelector<HTMLElement>(`[data-field="${target}"]`);
    element?.focus();
  }, [containerRef, errors]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const parsedAmount = parseLedgerAmount(model.draft.amount);
  const amountHint = Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatKRW(parsedAmount) : undefined;

  if (typeof document === 'undefined') return null;

  const describedBy = (errorId: string | undefined, hintId: string | undefined): string | undefined => {
    const ids = [errorId, hintId].filter((id): id is string => typeof id === 'string');
    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  return createPortal(
    <div ref={containerRef}>
      <Modal
        title={model.mode === 'create' ? copy.form.createTitle : copy.form.editTitle}
        phase={phase}
        onBackdropClick={handleBackdropClick}
        actions={
          <>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              loading={model.isSaving}
              disabled={isExpired}
              aria-describedby={isExpired ? expiredHintId : undefined}
            >
              {model.mode === 'create' ? copy.form.submitCreate : copy.form.submitEdit}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {copy.form.cancel}
            </Button>
          </>
        }
      >
        {/* 🔴 만료돼도 모달을 닫지 않는다. 입력값은 그대로 남고, 재연결이 성공하면 저장이 이어서 실행된다. */}
        {isExpired ? (
          <Banner tone="warning" role="alert" title={copy.expired.bannerTitle}>
            <BannerRow>
              {copy.expired.inFormBody}
              <Button type="button" variant="primary" loading={isReconnecting} onClick={onReconnect}>
                {copy.expired.reconnectAndSave}
              </Button>
            </BannerRow>
          </Banner>
        ) : null}

        {isConflict ? (
          <Banner tone="warning" role="alert" title={copy.conflict.title}>
            <BannerRow>
              {copy.conflict.body}
              <Button type="button" size="sm" variant="primary" onClick={onRefresh}>
                {copy.conflict.refresh}
              </Button>
            </BannerRow>
          </Banner>
        ) : null}

        {model.writeError ? (
          <Banner tone="danger" role="alert" title={model.writeError.title}>
            <BannerRow>
              {model.writeError.body}
              <Button type="button" size="sm" variant="secondary" onClick={onSubmit}>
                {copy.error.retry}
              </Button>
            </BannerRow>
          </Banner>
        ) : null}

        <form id={formId} onSubmit={handleSubmit}>
          <FormGrid>
            <Field>
              <FieldLabel htmlFor={dateId}>{copy.form.date}</FieldLabel>
              <FieldInput
                id={dateId}
                ref={dateRef}
                data-field="date"
                type="date"
                value={model.draft.date}
                aria-invalid={errors.date ? true : undefined}
                aria-describedby={errors.date ? `${dateId}-error` : undefined}
                onChange={(event) => onChange({ date: event.target.value })}
              />
              {errors.date ? <FieldError id={`${dateId}-error`}>{errors.date}</FieldError> : null}
            </Field>

            <KindFieldset>
              <KindLegend>{copy.form.kindLegend}</KindLegend>
              <KindOptions>
                <KindOption>
                  <input
                    type="radio"
                    name={`${idPrefix}-kind`}
                    data-field="kind"
                    value="income"
                    checked={model.draft.kind === 'income'}
                    onChange={() => onChange({ kind: 'income' })}
                  />
                  {/* 선택 신호는 이 면에 얹힌다(`input:checked + span`) — 라벨이 아니다. */}
                  <KindOptionFace>{copy.form.kindIncome}</KindOptionFace>
                </KindOption>
                <KindOption>
                  <input
                    type="radio"
                    name={`${idPrefix}-kind`}
                    value="expense"
                    checked={model.draft.kind === 'expense'}
                    onChange={() => onChange({ kind: 'expense' })}
                  />
                  <KindOptionFace>{copy.form.kindExpense}</KindOptionFace>
                </KindOption>
              </KindOptions>
            </KindFieldset>

            <Field>
              <FieldLabel htmlFor={amountId}>{copy.form.amount}</FieldLabel>
              <AmountRow>
                <AmountInput
                  id={amountId}
                  data-field="amount"
                  type="text"
                  inputMode="numeric"
                  value={model.draft.amount}
                  aria-invalid={errors.amount ? true : undefined}
                  aria-describedby={describedBy(
                    errors.amount ? `${amountId}-error` : undefined,
                    amountHint ? amountHintId : undefined
                  )}
                  onChange={(event) => onChange({ amount: event.target.value })}
                />
                <AmountUnit>{copy.form.amountUnit}</AmountUnit>
              </AmountRow>
              {/* 자릿수 확인용 — 값 자체는 바꾸지 않는다. */}
              {amountHint ? <FieldHint id={amountHintId}>{amountHint}</FieldHint> : null}
              {errors.amount ? <FieldError id={`${amountId}-error`}>{errors.amount}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={categoryId}>{copy.form.category}</FieldLabel>
              {/* 🔴 네이티브 `<datalist>` — 커스텀 콤보박스는 오버레이 층을 하나 더 만든다.
                  제안일 뿐 강제가 아니라서 "사용자 시트가 정본" 원칙과도 맞는다. */}
              <FieldInput
                id={categoryId}
                data-field="category"
                type="text"
                list={categoryListId}
                placeholder={copy.form.categoryPlaceholder}
                value={model.draft.category}
                aria-invalid={errors.category ? true : undefined}
                aria-describedby={describedBy(
                  errors.category ? `${categoryId}-error` : undefined,
                  categoryHintId
                )}
                onChange={(event) => onChange({ category: event.target.value })}
              />
              <datalist id={categoryListId} aria-label={copy.form.categoryListLabel}>
                {model.categoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <FieldHint id={categoryHintId}>{copy.form.categoryHint}</FieldHint>
              {errors.category ? <FieldError id={`${categoryId}-error`}>{errors.category}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={memoId}>{copy.form.memo}</FieldLabel>
              <FieldInput
                id={memoId}
                data-field="memo"
                type="text"
                maxLength={LEDGER_MEMO_MAX_LENGTH}
                value={model.draft.memo}
                aria-invalid={errors.memo ? true : undefined}
                aria-describedby={errors.memo ? `${memoId}-error` : undefined}
                onChange={(event) => onChange({ memo: event.target.value })}
              />
              {errors.memo ? <FieldError id={`${memoId}-error`}>{errors.memo}</FieldError> : null}
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </div>,
    document.body
  );
}
