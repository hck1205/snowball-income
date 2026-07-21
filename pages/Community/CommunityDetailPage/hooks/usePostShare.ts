import { useCallback, useEffect, useRef, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';

const d = COMMUNITY_COPY.detail;

/** 공유 토스트 자동 소멸(ms) — TickerCreation 복사 토스트와 동일 타이밍. */
const SHARE_TOAST_MS = 2200;

export type SharePostInput = {
  /** 공유 대상 글 id(계측용). */
  postId: string;
  /** 표면 구분(계측용) — 갤러리='portfolio'. */
  kind: string;
  /** 네이티브 공유 시트 제목. */
  title: string;
};

export type UsePostShare = {
  /** 복사 폴백 토스트 메시지(빈 문자열이면 미노출). */
  shareToastMessage: string;
  /** 이 글의 공개 상세 URL(window.location.href)을 공유한다. */
  sharePost: (input: SharePostInput) => Promise<void>;
};

const copyToClipboard = async (value: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
    await navigator.clipboard.writeText(value);
    return;
  }
  throw new Error('clipboard unavailable');
};

/** 사용자가 공유 시트를 닫은 정상 취소(AbortError)인지 — 실제 DOMException/목 객체 모두 대응. */
const isAbortError = (error: unknown): boolean =>
  Boolean(error) && typeof error === 'object' && (error as { name?: string }).name === 'AbortError';

/**
 * 갤러리 글의 **공개 상세 URL**(SEO 페이지)을 외부로 공유하는 훅.
 * - `navigator.share` 지원(주로 모바일): OS 네이티브 공유 시트를 연다.
 * - 미지원(주로 데스크톱): 클립보드에 URL을 복사하고 토스트로 알린다.
 * - 사용자가 네이티브 시트를 취소(AbortError)하면 **조용히** 종료한다(에러 토스트 없음).
 *
 * 시뮬 상태 공유(`?s=`/`scenario_shared`)와는 별개다 — 이건 글 자체를 퍼뜨려 유입을 만든다.
 */
export const usePostShare = (): UsePostShare => {
  const [shareToastMessage, setShareToastMessage] = useState('');
  const sharingRef = useRef(false);

  useEffect(() => {
    if (!shareToastMessage) return;
    const timer = window.setTimeout(() => setShareToastMessage(''), SHARE_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [shareToastMessage]);

  const sharePost = useCallback(async ({ postId, kind, title }: SharePostInput) => {
    if (typeof window === 'undefined') return;
    if (sharingRef.current) return;
    sharingRef.current = true;
    const url = window.location.href;

    try {
      const nav = window.navigator;
      if (nav && typeof nav.share === 'function') {
        try {
          await nav.share({ title, url });
          track(ANALYTICS_EVENT.COMMUNITY_POST_SHARED, { method: 'web_share', post_id: postId, kind });
          return;
        } catch (error) {
          // 정상 취소는 조용히 종료. 그 외 공유 실패만 클립보드 복사로 폴백.
          if (isAbortError(error)) return;
        }
      }

      await copyToClipboard(url);
      track(ANALYTICS_EVENT.COMMUNITY_POST_SHARED, { method: 'copy_link', post_id: postId, kind });
      setShareToastMessage(d.shareToastCopied);
    } catch {
      // 클립보드까지 실패 — URL을 토스트로 노출해 수동 복사할 수 있게 한다.
      setShareToastMessage(`${d.shareToastFailed} ${url}`);
    } finally {
      sharingRef.current = false;
    }
  }, []);

  return { shareToastMessage, sharePost };
};
