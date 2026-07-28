import { useCallback, useEffect, useRef, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { buildShareChannelUrl, isNativeShareIdiomatic, type ShareChannelId } from '@/components/common';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';

const d = COMMUNITY_COPY.detail;

/** 공유 토스트 자동 소멸(ms) — TickerCreation 복사 토스트와 동일 타이밍. */
const SHARE_TOAST_MS = 2200;

/** 공유가 일어난 표면 — 계측에서 피드(카드/행)와 상세를 구분한다. */
export type SharePlacement = 'feed' | 'detail';

export type SharePostInput = {
  /** 공유 대상 글 id(계측용). */
  postId: string;
  /** 표면 구분(계측용) — 갤러리='portfolio', 게시판='board'. */
  kind: string;
  /** 네이티브 공유 시트 제목. */
  title: string;
  /**
   * 공유할 **공개 URL**. 피드 카드는 그 글의 정규 상세 URL을 넘긴다.
   * 미지정이면 현재 페이지(`window.location.href`) — 상세 페이지 공유의 기본값.
   */
  url?: string;
  /** 공유 표면(계측) — 피드 카드='feed', 상세='detail'. */
  placement: SharePlacement;
};

/** 열려 있는 공유 창이 무엇을 공유하는가. `null` 이면 창은 닫혀 있다. */
export type ShareTarget = {
  url: string;
  title: string;
} & Pick<SharePostInput, 'postId' | 'kind' | 'placement'>;

export type UsePostShare = {
  /** 복사 폴백 토스트 메시지(빈 문자열이면 미노출). */
  shareToastMessage: string;
  /** 데스크톱 공유 창의 대상. `null` 이면 닫혀 있다. */
  shareTarget: ShareTarget | null;
  /** 직전 복사가 성공했는가 — 공유 창의 버튼 라벨이 이걸로 "복사했습니다"가 된다. */
  isShareLinkCopied: boolean;
  /** 이 글의 공개 상세 URL을 공유한다(터치=OS 시트, 그 외=공유 창). */
  sharePost: (input: SharePostInput) => Promise<void>;
  /** 공유 창의 "링크 복사". */
  copyShareLink: () => Promise<void>;
  /** 공유 창의 채널 버튼. */
  shareToChannel: (channel: ShareChannelId) => void;
  closeShare: () => void;
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
 * 글의 **공개 상세 URL**(SEO 페이지)을 외부로 공유하는 훅 — 상세 페이지와 피드 카드가 공유한다.
 *
 * - **터치가 주 입력인 기기**(`isNativeShareIdiomatic`): OS 네이티브 공유 시트를 연다. 카카오톡·문자 등
 *   그 기기에 설치된 앱으로 바로 보낼 수 있어 이 자리에선 OS 시트가 최선이다.
 * - **그 외(데스크톱)**: `navigator.share` 가 있어도 **쓰지 않는다**. 데스크톱 브라우저의 그 API 는
 *   운영체제 공유 창을 여는데 앱이 크기·위치를 손댈 수 없고 잘려 보인다는 신고가 있었다. 대신 우리가
 *   그린 공유 창(`ShareDialog`)을 연다 — 1급 동작은 링크 복사이고 채널 버튼이 따라온다.
 * - 네이티브 시트를 사용자가 취소(AbortError)하면 **조용히** 종료한다(에러 토스트 없음).
 * - 네이티브 시트가 취소가 아닌 이유로 실패하면 공유 창으로 내려간다(무음 실패 금지).
 *
 * 시뮬 상태 공유(`?s=`/`scenario_shared`)와는 별개다 — 이건 글 자체를 퍼뜨려 유입을 만든다.
 */
export const usePostShare = (): UsePostShare => {
  const [shareToastMessage, setShareToastMessage] = useState('');
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [isShareLinkCopied, setIsShareLinkCopied] = useState(false);
  const sharingRef = useRef(false);

  useEffect(() => {
    if (!shareToastMessage) return;
    const timer = window.setTimeout(() => setShareToastMessage(''), SHARE_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [shareToastMessage]);

  const sharePost = useCallback(async ({ postId, kind, title, url, placement }: SharePostInput) => {
    if (typeof window === 'undefined') return;
    if (sharingRef.current) return;
    sharingRef.current = true;
    const shareUrl = url ?? window.location.href;

    try {
      if (isNativeShareIdiomatic()) {
        try {
          await window.navigator.share({ title, url: shareUrl });
          track(ANALYTICS_EVENT.COMMUNITY_POST_SHARED, {
            method: 'web_share',
            post_id: postId,
            kind,
            placement
          });
          return;
        } catch (error) {
          // 정상 취소는 조용히 종료. 그 외 실패만 공유 창으로 내려간다.
          if (isAbortError(error)) return;
        }
      }

      setIsShareLinkCopied(false);
      setShareTarget({ url: shareUrl, title, postId, kind, placement });
    } finally {
      sharingRef.current = false;
    }
  }, []);

  const closeShare = useCallback(() => {
    setShareTarget(null);
    setIsShareLinkCopied(false);
  }, []);

  const copyShareLink = useCallback(async () => {
    if (!shareTarget) return;

    try {
      await copyToClipboard(shareTarget.url);
      setIsShareLinkCopied(true);
      setShareToastMessage(d.shareToastCopied);
      track(ANALYTICS_EVENT.COMMUNITY_POST_SHARED, {
        method: 'copy_link',
        post_id: shareTarget.postId,
        kind: shareTarget.kind,
        placement: shareTarget.placement
      });
    } catch {
      // 클립보드가 막힌 환경(권한 거부·비보안 컨텍스트) — 창 안의 주소 입력으로 직접 복사할 수 있다.
      setIsShareLinkCopied(false);
      setShareToastMessage(`${d.shareToastFailed} ${shareTarget.url}`);
    }
  }, [shareTarget]);

  const shareToChannel = useCallback(
    (channel: ShareChannelId) => {
      if (!shareTarget) return;
      const channelUrl = buildShareChannelUrl(channel, shareTarget.url, shareTarget.title);
      if (!channelUrl) return;

      // `noopener` 없이 새 창을 열면 그 창이 `window.opener` 로 이 탭을 조작할 수 있다.
      window.open(channelUrl, '_blank', 'noopener,noreferrer');
      track(ANALYTICS_EVENT.COMMUNITY_POST_SHARED, {
        method: channel,
        post_id: shareTarget.postId,
        kind: shareTarget.kind,
        placement: shareTarget.placement
      });
      setShareTarget(null);
    },
    [shareTarget]
  );

  return {
    shareToastMessage,
    shareTarget,
    isShareLinkCopied,
    sharePost,
    copyShareLink,
    shareToChannel,
    closeShare
  };
};
