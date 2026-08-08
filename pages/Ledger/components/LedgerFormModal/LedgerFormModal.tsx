import { useCallback, useEffect, useId, useRef } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Banner, Button, ComboBox, Modal } from '@/components/common';
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
  CheckboxRow,
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
  const categoryHintId = `${idPrefix}-category-hint`;
  const subcategoryId = `${idPrefix}-subcategory`;
  const payerId = `${idPrefix}-payer`;
  const payerHintId = `${idPrefix}-payer-hint`;
  const methodId = `${idPrefix}-method`;
  const fixedId = `${idPrefix}-fixed`;
  const fixedHintId = `${idPrefix}-fixed-hint`;
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

  /**
   * 날짜 칸을 누르면 달력을 띄운다.
   *
   * ⚠ `showPicker()` 는 **사용자 제스처 안에서만** 부를 수 있고, 미지원 브라우저(사파리 일부)와
   *   이미 열려 있는 상태에서는 던진다. 실패해도 할 일이 없다 — `type="date"` 의 기본 동작이
   *   그대로 남아 아이콘으로는 여전히 열린다. 그래서 조용히 삼킨다.
   * 🔴 `onFocus` 가 아니라 `onClick` 이다. 포커스는 코드가 옮기기도 하는데(자동 포커스),
   *   제스처 없이 부르면 브라우저가 `NotAllowedError` 를 던지고 콘솔이 더러워진다.
   */
  const openDatePicker = useCallback((event: MouseEvent<HTMLInputElement>) => {
    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
    try {
      input.showPicker?.();
    } catch {
      /* 미지원·이미 열림 — 기본 동작으로 충분하다. */
    }
  }, []);

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
        /* 🔴 칸이 열 개라 520px 에서는 언제나 세로 스크롤이 생겼다 — 넓혀서 두 칸씩 세운다. */
        size="lg"
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
            {/*
              🔴 **구분이 맨 위다**(2026-08-09 사용자 요청). 이 값이 정해져야 나머지 칸의 뜻이
                 정해진다 — 같은 5만 원이 수입인지 지출인지 이체인지에 따라 완전히 다른 기록이다.
                 아래에 두면 금액을 먼저 치고 나서 구분을 고치는 순서가 되어, 고치는 걸 잊으면
                 지출이 수입으로 저장된다.
              ⚠ 전폭이라 그 아래 **날짜와 금액이 한 줄로** 나란히 선다.
            */}
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
                  <KindOptionFace>
                    <ArrowDownToLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    {copy.form.kindIncome}
                  </KindOptionFace>
                </KindOption>
                <KindOption>
                  <input
                    type="radio"
                    name={`${idPrefix}-kind`}
                    value="expense"
                    checked={model.draft.kind === 'expense'}
                    onChange={() => onChange({ kind: 'expense' })}
                  />
                  <KindOptionFace>
                    <ArrowUpFromLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    {copy.form.kindExpense}
                  </KindOptionFace>
                </KindOption>
                {/* 🔴 이체는 수입도 지출도 아니다 — 저축·투자 납입이 여기 온다. 월 요약의 지출에서 빠진다. */}
                <KindOption>
                  <input
                    type="radio"
                    name={`${idPrefix}-kind`}
                    value="transfer"
                    checked={model.draft.kind === 'transfer'}
                    onChange={() => onChange({ kind: 'transfer' })}
                  />
                  <KindOptionFace>
                    <ArrowLeftRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                    {copy.form.kindTransfer}
                  </KindOptionFace>
                </KindOption>
              </KindOptions>
            </KindFieldset>

            <Field>
              <FieldLabel htmlFor={dateId}>{copy.form.date}</FieldLabel>
              {/*
                🔴 **칸 아무 데나 눌러도 달력이 열린다**(2026-08-08 사용자 요청).
                   `type="date"` 만으로는 크롬에서 오른쪽 끝 작은 달력 아이콘을 정확히 눌러야
                   열린다 — 손가락으로는 거의 못 맞춘다. `showPicker()` 로 칸 전체를 그 버튼으로 만든다.
              */}
              <FieldInput
                id={dateId}
                ref={dateRef}
                data-field="date"
                type="date"
                value={model.draft.date}
                aria-invalid={errors.date ? true : undefined}
                aria-describedby={errors.date ? `${dateId}-error` : undefined}
                onClick={openDatePicker}
                onChange={(event) => onChange({ date: event.target.value })}
              />
              {errors.date ? <FieldError id={`${dateId}-error`}>{errors.date}</FieldError> : null}
            </Field>


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

            {/*
              🔴 **내용이 금액 바로 밑에 있다**(2026-08-08 사용자 요청). 항목을 비워도 되는 지금,
                 분류를 정하는 것은 이 칸이다 — 아래쪽에 두면 "선택 칸" 처럼 보여 비우고 넘어간다.
              🔴 제안 목록은 `분류 규칙` 탭의 **포함하는 말**이다. 그 말을 그대로 고르면 규칙이
                 반드시 걸린다 — 손으로 치다 한 글자 틀리면 규칙이 안 걸리고, 그 사실은 저장한
                 뒤에야 보인다.
            */}
            <Field $full>
              <FieldLabel htmlFor={memoId}>{copy.form.memo}</FieldLabel>
              <ComboBox
                id={memoId}
                dataField="memo"
                options={model.memoOptions}
                listLabel={copy.form.memoListLabel}
                value={model.draft.memo}
                ariaInvalid={Boolean(errors.memo)}
                ariaDescribedBy={errors.memo ? `${memoId}-error` : undefined}
                onChange={(next) => onChange({ memo: next.slice(0, LEDGER_MEMO_MAX_LENGTH) })}
              />
              {errors.memo ? <FieldError id={`${memoId}-error`}>{errors.memo}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={categoryId}>{copy.form.category}</FieldLabel>
              {/*
                🔴 **검색되는 제안 목록**(2026-08-08 사용자 요청). 종전 판단은 네이티브 `<datalist>` 였다 —
                   "커스텀 콤보박스는 오버레이 층을 하나 더 만든다"가 그 이유였고, 그 우려는 여전히
                   맞다. 그래서 `ComboBox` 는 **포털을 쓰지 않고**(모달 안에 절대 배치) **ESC 를 삼킨다**
                   (목록만 닫히고 모달은 남는다). 그 둘이 오버레이 층 문제의 실체다.
                🔴 여전히 **자유 입력**이다 — 목록에 없는 말도 그대로 저장된다("사용자 시트가 정본").
              */}
              <ComboBox
                id={categoryId}
                dataField="category"
                options={model.categoryOptions}
                listLabel={copy.form.categoryListLabel}
                placeholder={copy.form.categoryPlaceholder}
                value={model.draft.category}
                ariaInvalid={Boolean(errors.category)}
                ariaDescribedBy={describedBy(
                  errors.category ? `${categoryId}-error` : undefined,
                  categoryHintId
                )}
                onChange={(next) => onChange({ category: next })}
              />
              <FieldHint id={categoryHintId}>{copy.form.categoryHint}</FieldHint>
              {errors.category ? <FieldError id={`${categoryId}-error`}>{errors.category}</FieldError> : null}
            </Field>

            {/*
              ── v2 축 넷 (2026-08-08) ────────────────────────────────────────
              🔴 전부 **선택**이다. 별표도 required 도 붙이지 않는다 — 1인 가구가 매번 네 칸을 더
                 채우게 만들면 입력이 무거워져 가계부 자체를 안 쓰게 된다. 라벨의 "(선택)"이 그 약속이다.
              🔴 주체·결제수단은 사전이 없다. 제안 목록은 **시트에서 관측한 값**뿐이라 처음에는 비어
                 있고, 한 번 쓰면 다음부터 뜬다. 설정 화면을 따로 만들지 않은 이유가 이것이다.
            */}
            <Field>
              <FieldLabel htmlFor={subcategoryId}>{copy.form.subcategory}</FieldLabel>
              <ComboBox
                id={subcategoryId}
                dataField="subcategory"
                options={model.subcategoryOptions}
                listLabel={copy.form.subcategoryListLabel}
                placeholder={copy.form.subcategoryPlaceholder}
                value={model.draft.subcategory}
                ariaInvalid={Boolean(errors.subcategory)}
                ariaDescribedBy={errors.subcategory ? `${subcategoryId}-error` : undefined}
                onChange={(next) => onChange({ subcategory: next })}
              />
              {errors.subcategory ? (
                <FieldError id={`${subcategoryId}-error`}>{errors.subcategory}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={methodId}>{copy.form.method}</FieldLabel>
              <ComboBox
                id={methodId}
                dataField="method"
                options={model.methodOptions}
                listLabel={copy.form.methodListLabel}
                placeholder={copy.form.methodPlaceholder}
                value={model.draft.method}
                ariaInvalid={Boolean(errors.method)}
                ariaDescribedBy={errors.method ? `${methodId}-error` : undefined}
                onChange={(next) => onChange({ method: next })}
              />
              {errors.method ? <FieldError id={`${methodId}-error`}>{errors.method}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={payerId}>{copy.form.payer}</FieldLabel>
              <ComboBox
                id={payerId}
                dataField="payer"
                options={model.payerOptions}
                listLabel={copy.form.payerListLabel}
                placeholder={copy.form.payerPlaceholder}
                value={model.draft.payer}
                ariaInvalid={Boolean(errors.payer)}
                ariaDescribedBy={describedBy(errors.payer ? `${payerId}-error` : undefined, payerHintId)}
                onChange={(next) => onChange({ payer: next })}
              />
              <FieldHint id={payerHintId}>{copy.form.payerHint}</FieldHint>
              {errors.payer ? <FieldError id={`${payerId}-error`}>{errors.payer}</FieldError> : null}
            </Field>

            {/* 고정 여부는 한 줄짜리 스위치라 전폭에 두는 편이 읽기 좋다. */}
            <Field $full>
              <CheckboxRow>
                <input
                  id={fixedId}
                  data-field="isFixed"
                  type="checkbox"
                  checked={model.draft.isFixed}
                  aria-describedby={fixedHintId}
                  onChange={(event) => onChange({ isFixed: event.target.checked })}
                />
                <FieldLabel htmlFor={fixedId}>{copy.form.fixed}</FieldLabel>
              </CheckboxRow>
              <FieldHint id={fixedHintId}>{copy.form.fixedHint}</FieldHint>
            </Field>

          </FormGrid>
        </form>
      </Modal>
    </div>,
    document.body
  );
}
