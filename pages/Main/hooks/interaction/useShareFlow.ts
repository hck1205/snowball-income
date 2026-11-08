import { useCallback, useEffect, useState } from 'react';
import { buildShareChannelUrl, type ShareChannelId } from '@/components/common';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import type { ShareLinkResult } from '../persistence';

const SHARE_TITLE = '배당 재투자 시뮬레이션 결과';
const TOAST_MS = 2200;

const POPUP_BLOCKED_MESSAGE = '브라우저가 새 창을 막았습니다. 팝업을 허용하거나 링크를 복사해 주세요.';
const COPIED_MESSAGE = '공유 링크를 클립보드에 복사했습니다.';

/**
 * 공유 버튼 하나의 **흐름**(2026-11-09 분리) — 링크 만들기 → 복사 → 막히면 공유 창 → 채널 열기.
 *
 * 설정 드로어의 "도구" 카드에 있던 상태·처리를 **동작 그대로** 옮겼다. 시뮬레이터 상단의 "결과 공유" 버튼도
 * 같은 흐름을 써야 해서다(두 벌로 두면 실패 문구·계측이 갈린다). 그리는 것은 `ShareFlowLayer` 가 한다.
 *
 * 계측: 링크가 **만들어졌을 때만** `scenario_shared`(copy_link / show_link / 채널). 버튼 클릭 자체(CTA)는
 * 버튼마다 자리가 달라 호출부가 보낸다.
 */
export const useShareFlow = (createShareLink: () => Promise<ShareLinkResult>) => {
  const [isSharing, setIsSharing] = useState(false);
  /** 링크를 만들지 못한 사유. 버튼 근처에 그대로 보여 준다(무음 실패 금지). */
  const [failureMessage, setFailureMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  /** 클립보드가 막혀 직접 보여 줘야 하는 URL. 비어 있으면 공유 창이 닫혀 있다. */
  const [dialogUrl, setDialogUrl] = useState('');

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const share = useCallback(async () => {
    if (isSharing) return;
    setFailureMessage('');
    setIsSharing(true);
    try {
      const result = await createShareLink();
      if (!result.ok) {
        setFailureMessage(result.message);
        return;
      }
      // 공유 링크 생성 성공 시에만 발화. copy_link=클립보드 복사, show_link=복사 실패로 URL 노출 폴백.
      track(ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: result.copied ? 'copy_link' : 'show_link' });
      if (result.copied) {
        setToastMessage(COPIED_MESSAGE);
        return;
      }
      /* 클립보드가 막혔다(권한·비보안 컨텍스트). 링크는 만들어졌으니 창으로 보여 주고 채널로도 보낼 수 있게 한다. */
      setDialogUrl(result.url);
    } catch {
      setFailureMessage('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  }, [createShareLink, isSharing]);

  const copyDialogUrl = useCallback(async () => {
    if (!dialogUrl) return;
    try {
      await navigator.clipboard.writeText(dialogUrl);
      setToastMessage(COPIED_MESSAGE);
    } catch {
      // 여전히 막혀 있다 — 창 안의 주소를 직접 선택해 복사하면 된다(무음 실패 금지).
      setToastMessage('복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.');
    }
  }, [dialogUrl]);

  const shareToChannel = useCallback(
    (channel: ShareChannelId) => {
      const channelUrl = buildShareChannelUrl(channel, dialogUrl, SHARE_TITLE);
      if (!channelUrl) return;

      const opened = window.open(channelUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        /* 팝업 차단 — 창을 닫지 않고 그대로 둔다(링크 복사로 넘어갈 수 있게). 계측도 하지 않는다(공유되지 않았다). */
        setToastMessage(POPUP_BLOCKED_MESSAGE);
        return;
      }

      track(ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: channel });
      setDialogUrl('');
    },
    [dialogUrl]
  );

  const closeDialog = useCallback(() => setDialogUrl(''), []);

  return { isSharing, failureMessage, toastMessage, dialogUrl, share, copyDialogUrl, shareToChannel, closeDialog };
};

export type ShareFlow = ReturnType<typeof useShareFlow>;
