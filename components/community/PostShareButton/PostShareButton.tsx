import { useCallback, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ShareDialog } from '@/components/common';
import { ShareIcon } from '@/components/community/CommunityIcons';
import { usePostShare, type SharePlacement } from '@/components/community/hooks';
import { ShareIconButton, ShareToast } from './PostShareButton.styled';

export type PostShareButtonProps = {
  /** 공유 대상 글 id(계측). */
  postId: string;
  /** 표면 구분(계측) — 갤러리='portfolio', 게시판='board'. */
  kind: string;
  /** 네이티브 공유 시트 제목. */
  title: string;
  /** 공유할 공개 URL(그 글의 정규 상세 URL). 미지정 시 훅이 현재 페이지로 폴백한다. */
  url?: string;
  /** 공유 표면(계측). */
  placement: SharePlacement;
  /** 정렬용 클래스 — 부모가 `styled(PostShareButton)`으로 위치를 덮을 때 버튼 루트에 얹힌다. */
  className?: string;
};

const d = COMMUNITY_COPY.detail;

/**
 * 피드 카드/행에서 쓰는 **아이콘 전용 공유 버튼**(+ 데스크톱 공유 창 / 복사 토스트).
 * 카드/행 전체가 상세로 가는 `<Link>`라, 이 버튼이 링크 안에 들어가도 **네비게이션되면 안 된다**:
 * onClick에서 `preventDefault`(앵커 기본 이동 차단) + `stopPropagation`(Link onClick으로 버블 차단)을
 * 둘 다 건다. 버튼 자체는 독립 포커스·활성화되는 `<button>`이라 키보드로 링크와 따로 다뤄진다.
 * 공유 계산/계측은 상세와 **동일한** `usePostShare`를 재사용한다(표면만 placement로 구분).
 *
 * 공유 창은 카드 안이 아니라 `document.body` 로 포털된다(`ShareDialog` 내부) — 카드에는 `overflow`·
 * 라운딩이 걸려 있어 카드 안에 그리면 잘린다.
 */
export function PostShareButton({ postId, kind, title, url, placement, className }: PostShareButtonProps) {
  const { shareToastMessage, shareTarget, isShareLinkCopied, sharePost, copyShareLink, shareToChannel, closeShare } =
    usePostShare();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      // 링크 안의 버튼 — 상세 이동/버블을 막고 그 자리에서 공유만 실행한다.
      event.preventDefault();
      event.stopPropagation();
      void sharePost({ postId, kind, title, url, placement });
    },
    [sharePost, postId, kind, title, url, placement]
  );

  const toastRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      <ShareIconButton type="button" className={className} aria-label={d.shareAria} onClick={handleClick}>
        <ShareIcon size={16} />
      </ShareIconButton>
      {shareTarget ? (
        <ShareDialog
          url={shareTarget.url}
          isCopied={isShareLinkCopied}
          onCopy={copyShareLink}
          onSelectChannel={shareToChannel}
          onClose={closeShare}
        />
      ) : null}
      {shareToastMessage && toastRoot
        ? createPortal(
            <ShareToast role="status" aria-live="polite">
              {shareToastMessage}
            </ShareToast>,
            toastRoot
          )
        : null}
    </>
  );
}
