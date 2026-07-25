import { Button } from '@/components';
import { ModalActions } from '@/components/common';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { TickerModalActionsProps } from './TickerModalActions.types';

/**
 * 티커 모달 푸터 — 삭제(수정 모드) / 취소 / 저장·생성.
 * TickerModal 본체에서 뷰 조각만 분리했다 — analytics 호출과 disabled 가드 순서는 그대로다.
 */
function TickerModalActions({ mode, isCreateDisabled, onDelete, onClose, onSave }: TickerModalActionsProps) {
  return (
    <ModalActions>
      {mode === 'edit' ? (
        // 되돌릴 수 없는 액션 → danger. 취소/저장과 시각적으로 구분되어야 오클릭이 준다.
        <Button
          variant="danger"
          // 삭제는 왼쪽 끝으로 밀어서 '저장' 옆에 붙지 않게 한다.
          style={{ marginRight: 'auto' }}
          onClick={() => {
            trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
              cta_name: 'ticker_delete',
              mode
            });
            onDelete();
          }}
        >
          티커 삭제
        </Button>
      ) : null}
      <Button variant="secondary"
        type="button"
        onClick={() => {
          trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
            cta_name: 'ticker_modal_cancel',
            mode
          });
          onClose();
        }}
      >
        취소
      </Button>
      <Button variant="primary"
        type="button"
        disabled={isCreateDisabled}
        onClick={() => {
          if (isCreateDisabled) return;
          trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
            cta_name: mode === 'edit' ? 'ticker_save' : 'ticker_create',
            mode
          });
          onSave();
        }}
      >
        {mode === 'edit' ? '저장' : '생성'}
      </Button>
    </ModalActions>
  );
}

export default TickerModalActions;
