import { useCallback, useEffect, useRef, useState } from 'react';
import { buildShareChannelUrl, isNativeShareIdiomatic, type ShareChannelId } from '@/components/common';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { DIVIDEND_TAX_COPY } from '../copy';

const copy = DIVIDEND_TAX_COPY.share;
const TOAST_MS = 2200;

const isAbortError = (error: unknown): boolean =>
  Boolean(error) && typeof error === 'object' && (error as { name?: string }).name === 'AbortError';

/**
 * 계산 결과 공유(2026-11-13) — 커뮤니티 글 공유(`usePostShare`)와 같은 흐름이다.
 *   - 터치 기기: OS 공유 시트(카카오톡·문자로 바로). 사용자가 닫으면(AbortError) 조용히 끝낸다.
 *   - 그 외: 공용 공유 창(`ShareDialog`) — 링크 복사가 1급, 채널 버튼이 뒤따른다.
 * 계측은 `calculator_shared`(글 공유와 따로 센다 — 이쪽은 "계산 결과가 퍼지나"를 본다).
 * 주소는 **누르는 순간**의 조건으로 만든다(`buildUrl`) — 입력할 때마다 주소창을 바꾸지 않는다(뒤로 가기 오염 0).
 */
export const useResultShare = (buildUrl: () => string, title: string) => {
  const [dialogUrl, setDialogUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [toast, setToast] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const share = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const url = buildUrl();
    try {
      if (isNativeShareIdiomatic()) {
        try {
          await window.navigator.share({ title, url });
          track(ANALYTICS_EVENT.CALCULATOR_SHARED, { method: 'web_share', calculator: 'dividend_tax' });
          return;
        } catch (error) {
          if (isAbortError(error)) return;
        }
      }
      setIsCopied(false);
      setDialogUrl(url);
    } finally {
      busy.current = false;
    }
  }, [buildUrl, title]);

  const close = useCallback(() => {
    setDialogUrl(null);
    setIsCopied(false);
  }, []);

  const copyLink = useCallback(async () => {
    if (!dialogUrl) return;
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(dialogUrl);
      setIsCopied(true);
      setToast(copy.toastCopied);
      track(ANALYTICS_EVENT.CALCULATOR_SHARED, { method: 'copy_link', calculator: 'dividend_tax' });
    } catch {
      // 클립보드가 막힌 환경 — 창 안의 주소 칸에서 직접 복사할 수 있다.
      setIsCopied(false);
      setToast(copy.toastFailed);
    }
  }, [dialogUrl]);

  const toChannel = useCallback(
    (channel: ShareChannelId) => {
      if (!dialogUrl) return;
      const target = buildShareChannelUrl(channel, dialogUrl, title);
      if (!target) return;
      const opened = window.open(target, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // 팝업 차단 — 사유를 말하고 창은 열어 둔다(링크 복사가 그 안에 있다). 공유가 안 됐으니 계측도 없다.
        setToast(copy.toastPopupBlocked);
        return;
      }
      track(ANALYTICS_EVENT.CALCULATOR_SHARED, { method: channel, calculator: 'dividend_tax' });
      setDialogUrl(null);
    },
    [dialogUrl, title]
  );

  return { share, dialogUrl, isCopied, toast, close, copyLink, toChannel };
};
