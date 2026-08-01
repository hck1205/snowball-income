import { useRef } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Banner, Button, Modal } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import { useLedgerOverlay } from '../../hooks';
import type { LedgerRemoveDialogProps } from './LedgerRemoveDialog.types';
import { AmountValue, BannerRow, DialogBody, TargetList } from './LedgerRemoveDialog.styled';

const copy = LEDGER_COPY;

/**
 * §4.6 삭제 확인.
 *
 * 🔴 **"정말 삭제하시겠습니까?" 단독 금지** — 본문은 언제나 아래 정의 목록(날짜·구분·분류·금액)과
 * 함께 나온다. 무엇을 지우는지 화면이 말하지 않으면 사용자는 확인할 수 없다.
 * 🔴 초기 포커스는 **취소**다 — 파괴적 동작을 기본 포커스로 두지 않는다. ⚠ ref 는 렌더가 아니라
 * **이펙트 안에서** 읽어야 한다(렌더 시점엔 아직 `null`) — `useLedgerOverlay` 가 그렇게 한다.
 * 🔴 실패해도 닫지 않는다. 배너 + 재시도.
 */
export default function LedgerRemoveDialog({
  target,
  phase,
  isOpen,
  isRemoving,
  isExpired,
  isReconnecting,
  expiredHintId,
  error,
  onConfirm,
  onClose,
  onReconnect
}: LedgerRemoveDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useLedgerOverlay(isOpen, onClose, cancelRef);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={containerRef}>
      <Modal
        title={copy.remove.title}
        phase={phase}
        onBackdropClick={handleBackdropClick}
        actions={
          <>
            <Button
              type="button"
              variant="danger"
              loading={isRemoving}
              disabled={isExpired}
              aria-describedby={isExpired ? expiredHintId : undefined}
              onClick={onConfirm}
            >
              {copy.remove.confirm}
            </Button>
            <Button type="button" variant="secondary" ref={cancelRef} onClick={onClose}>
              {copy.remove.cancel}
            </Button>
          </>
        }
      >
        {isExpired ? (
          <Banner tone="warning" role="alert" title={copy.expired.bannerTitle}>
            <BannerRow>
              {copy.expired.inFormBody}
              <Button type="button" variant="primary" loading={isReconnecting} onClick={onReconnect}>
                {copy.expired.reconnectAndRemove}
              </Button>
            </BannerRow>
          </Banner>
        ) : null}

        {error ? (
          <Banner tone="danger" role="alert" title={error.title}>
            <BannerRow>
              {error.body}
              <Button type="button" size="sm" variant="secondary" onClick={onConfirm}>
                {copy.error.retry}
              </Button>
            </BannerRow>
          </Banner>
        ) : null}

        <DialogBody>{copy.remove.body}</DialogBody>

        <TargetList>
          <dt>{copy.remove.fieldDate}</dt>
          <dd>{target.dateText}</dd>
          <dt>{copy.remove.fieldKind}</dt>
          <dd>{target.kindText}</dd>
          <dt>{copy.remove.fieldCategory}</dt>
          <dd>{target.category}</dd>
          <dt>{copy.remove.fieldAmount}</dt>
          <dd>
            <AmountValue>{target.amountText}</AmountValue>
          </dd>
        </TargetList>
      </Modal>
    </div>,
    document.body
  );
}
