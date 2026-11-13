import { createPortal } from 'react-dom';
import { Share2 } from 'lucide-react';
import { Button, ShareDialog } from '@/components/common';
import { DIVIDEND_TAX_COPY } from '../../copy';
import { useResultShare } from '../../hooks';
import { ShareHint, ShareRow, ShareToast } from './ResultShare.styled';

const copy = DIVIDEND_TAX_COPY.share;

export type ResultShareProps = {
  /** 누르는 순간의 조건으로 공유 주소를 만든다. */
  readonly buildUrl: () => string;
  readonly title: string;
};

/** "이 결과 공유하기" — 버튼 · 공유 창 · 복사 알림(2026-11-13). 흐름은 `useResultShare`. */
export default function ResultShare({ buildUrl, title }: ResultShareProps) {
  const flow = useResultShare(buildUrl, title);
  return (
    <>
      <ShareRow>
        <Button
          variant="secondary"
          startIcon={<Share2 aria-hidden size={16} strokeWidth={1.8} />}
          onClick={() => void flow.share()}
        >
          {copy.button}
        </Button>
        <ShareHint>{copy.hint}</ShareHint>
      </ShareRow>
      {flow.dialogUrl ? (
        <ShareDialog
          url={flow.dialogUrl}
          isCopied={flow.isCopied}
          onCopy={flow.copyLink}
          onSelectChannel={flow.toChannel}
          onClose={flow.close}
        />
      ) : null}
      {flow.toast && typeof document !== 'undefined'
        ? createPortal(
            <ShareToast role="status" aria-live="polite">
              {flow.toast}
            </ShareToast>,
            document.body
          )
        : null}
    </>
  );
}
