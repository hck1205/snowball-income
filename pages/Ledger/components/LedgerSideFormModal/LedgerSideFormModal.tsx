import { useId } from 'react';
import { Banner, Button, Modal } from '@/components/common';
import { LEDGER_SIDE_FIELDS } from '../../utils';
import type { LedgerSideField } from '../../utils';
import type { LedgerSideFormModalProps } from './LedgerSideFormModal.types';
import {
  SideError,
  SideField,
  SideFormGrid,
  SideHint,
  SideInput,
  SideLabel,
  SideSelect
} from './LedgerSideFormModal.styled';

/**
 * `자산` · `투자` 에 **직접 적는** 모달.
 *
 * ## 왜 앱에서도 적나 (2026-08-09 사용자 결정)
 *
 * 처음에는 "적는 것은 시트에서 한다"였다 — 입력 경로가 둘이면 검증이 갈린다는 이유였다.
 * 그 우려를 없애는 방법은 경로를 하나로 줄이는 것 말고도 있다: **규칙을 하나로 두는 것.**
 * 검증도 행 만들기도 `pages/Ledger/utils/ledgerSideForm.ts` **한 곳**에 있고, 화면은 그 스펙을
 * 그리기만 한다. 그래서 이 파일에는 "무엇이 필수인가"가 한 줄도 없다.
 *
 * ## 🔴 칸을 여기서 나열하지 않는다
 *
 * 필드 정의를 화면에 다시 적으면 시트 머리와 어긋나 금액이 이름 칸에 들어간다. `LEDGER_SIDE_FIELDS`
 * 를 돌면 스펙·검증·행 만들기·화면이 한 목록을 본다 — 이 레포가 "손으로 나열한 목록"으로
 * 여섯 번 조용히 틀린 이력이 있다.
 */

const TITLE: Readonly<Record<LedgerSideFormModalProps['kind'], string>> = {
  holdings: '자산 적기',
  investments: '투자 적기'
};

const SUBMIT: Readonly<Record<LedgerSideFormModalProps['kind'], string>> = {
  holdings: '자산 추가',
  investments: '종목 추가'
};

/** 넓은 칸으로 둘 필드 — 글이 길어지는 자리다. */
const isFullWidth = (field: LedgerSideField): boolean => field.id === 'memo';

export default function LedgerSideFormModal({
  kind,
  draft,
  errors,
  isSaving,
  writeError,
  onChange,
  onSubmit,
  onClose
}: LedgerSideFormModalProps) {
  const idPrefix = useId();
  const formId = `${idPrefix}-side-form`;

  return (
    <Modal
      size="lg"
      title={TITLE[kind]}
      onBackdropClick={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving ? '저장하는 중입니다' : SUBMIT[kind]}
          </Button>
        </>
      }
    >
      {/* 🔴 저장 실패해도 모달은 열린 채 남는다 — 입력값을 버리지 않는다. */}
      {writeError ? (
        <Banner tone="danger" role="alert" title={writeError.title}>
          {writeError.body}
        </Banner>
      ) : null}

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SideFormGrid>
          {LEDGER_SIDE_FIELDS[kind].map((field) => {
            const fieldId = `${idPrefix}-${field.id}`;
            const errorId = `${fieldId}-error`;
            const hintId = `${fieldId}-hint`;
            const error = errors[field.id];
            const describedBy = [error ? errorId : null, field.hint ? hintId : null]
              .filter((value): value is string => value !== null)
              .join(' ');

            return (
              <SideField key={field.id} $full={isFullWidth(field)}>
                <SideLabel htmlFor={fieldId}>
                  {field.label}
                  {field.required ? '' : ' (선택)'}
                </SideLabel>

                {field.kind === 'choice' ? (
                  <SideSelect
                    id={fieldId}
                    value={draft[field.id] ?? ''}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy.length > 0 ? describedBy : undefined}
                    onChange={(event) => onChange({ [field.id]: event.target.value })}
                  >
                    {(field.choices ?? []).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </SideSelect>
                ) : (
                  <SideInput
                    id={fieldId}
                    /* 🔴 날짜는 `type="date"` 다 — 칸을 누르면 달력이 열린다(아래 onClick 과 짝). */
                    type={field.kind === 'date' ? 'date' : 'text'}
                    inputMode={field.kind === 'number' ? 'decimal' : undefined}
                    placeholder={field.placeholder}
                    value={draft[field.id] ?? ''}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy.length > 0 ? describedBy : undefined}
                    onClick={
                      field.kind === 'date'
                        ? (event) => {
                            /*
                             * ⚠ 미지원 브라우저·이미 열린 상태에서는 던진다. 실패해도 할 일이 없다 —
                             *   `type="date"` 의 기본 동작(아이콘 클릭)이 그대로 남는다.
                             */
                            const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
                            try {
                              input.showPicker?.();
                            } catch {
                              /* 조용히 넘어간다. */
                            }
                          }
                        : undefined
                    }
                    onChange={(event) => onChange({ [field.id]: event.target.value })}
                  />
                )}

                {field.hint ? <SideHint id={hintId}>{field.hint}</SideHint> : null}
                {error ? <SideError id={errorId}>{error}</SideError> : null}
              </SideField>
            );
          })}
        </SideFormGrid>
      </form>
    </Modal>
  );
}
