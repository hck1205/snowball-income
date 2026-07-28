import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components';
import { ShareDialog, buildShareChannelUrl, type ShareChannelId } from '@/components/common';
import { TOUR_TARGET } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import { ANALYTICS_EVENT, track, trackEvent } from '@/shared/lib/analytics';
import type { TickerCreationProps } from './TickerCreation.types';
import {
  HintText,
  TickerChipWrap,
  TickerCreateButton,
  TickerGearButton,
  TickerGridWrap,
  TickerQuickActionButton,
  TickerQuickActionIcon,
  TickerQuickActionRow,
  TickerItemButton,
  TickerList
} from '@/components/common';
import { ShareToast } from './TickerCreation.styled';

type SecondaryActionKey = 'share' | 'coffee';

/** 채널 인텐트에 함께 실어 보내는 제목. 링크가 무엇인지 한 줄로 말한다. */
const SHARE_TITLE = '배당 재투자 시뮬레이션 결과';

function TickerCreationComponent({
  topContent,
  tickerProfiles,
  includedTickerIds,
  onOpenCreate,
  onCreateShareLink,
  onTickerClick,
  onTickerPressStart,
  onTickerPressEnd,
  onOpenEdit
}: TickerCreationProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [isSharing, setIsSharing] = useState(false);
  const [shareResultMessage, setShareResultMessage] = useState('');
  const [shareToastMessage, setShareToastMessage] = useState('');
  /** 복사가 안 됐을 때만 세우는 공유 창 대상. 복사가 됐으면 토스트 한 줄로 끝난다(창을 띄우지 않는다). */
  const [shareDialogUrl, setShareDialogUrl] = useState('');

  useEffect(() => {
    if (!shareToastMessage) return;
    const timer = window.setTimeout(() => setShareToastMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [shareToastMessage]);

  const handleShareLink = useCallback(async () => {
    if (isSharing) return;
    setShareResultMessage('');
    setIsSharing(true);
    try {
      const result = await onCreateShareLink();
      if (!result.ok) {
        setShareResultMessage(result.message);
        return;
      }
      // 공유 링크 생성 성공 시에만 발화. copy_link=클립보드 복사, show_link=복사 실패로 URL 노출 폴백.
      track(ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: result.copied ? 'copy_link' : 'show_link' });
      if (result.copied) {
        setShareResultMessage('');
        setShareToastMessage('공유 링크를 클립보드에 복사했습니다.');
        return;
      }
      /*
       * 클립보드가 막힌 환경(권한 거부·비보안 컨텍스트). 예전에는 긴 주소를 카드 안 한 줄 힌트로
       * 뱉었는데, 그 자리는 설정 드로어 안이라 주소가 잘려 보이고 선택도 어려웠다. 공유 창이
       * 주소를 읽기 전용 입력으로 보여 주고 다시 복사·채널 전송까지 그 자리에서 끝낸다.
       */
      setShareDialogUrl(result.url);
    } catch {
      setShareResultMessage('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, onCreateShareLink]);

  const handleCopyShareDialogUrl = useCallback(async () => {
    if (!shareDialogUrl) return;
    try {
      await navigator.clipboard.writeText(shareDialogUrl);
      setShareToastMessage('공유 링크를 클립보드에 복사했습니다.');
    } catch {
      // 여전히 막혀 있다 — 창 안의 주소를 직접 선택해 복사하면 된다(무음 실패 금지).
      setShareToastMessage('복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.');
    }
  }, [shareDialogUrl]);

  const handleShareChannel = useCallback(
    (channel: ShareChannelId) => {
      const channelUrl = buildShareChannelUrl(channel, shareDialogUrl, SHARE_TITLE);
      if (!channelUrl) return;
      window.open(channelUrl, '_blank', 'noopener,noreferrer');
      track(ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: channel });
      setShareDialogUrl('');
    },
    [shareDialogUrl]
  );

  const handleSecondaryAction = useCallback(
    (key: SecondaryActionKey) => {
      trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
        cta_name: `quick_action_${key}`,
        placement: 'ticker_creation_quick_actions'
      });
      if (key === 'share') {
        void handleShareLink();
      }
    },
    [handleShareLink]
  );

  // "데이터 저장"은 자동저장(클라우드 동기화)으로 대체돼 제거됐고, Capture도 폐기됨. 남는 퀵액션: Share / Coffee(숨김).
  const secondaryActions: Array<{ key: SecondaryActionKey; label: string; icon: JSX.Element }> = useMemo(
    () => [
      {
        key: 'share',
        label: '공유',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.3 10.9 15.7 6.1" />
            <path d="M8.3 13.1 15.7 17.9" />
          </svg>
        )
      },
      {
        key: 'coffee',
        label: 'Coffee',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 10h10v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
            <path d="M15 11h2a2 2 0 1 1 0 4h-2" />
            <path d="M8 6v2M11 6v2" />
          </svg>
        )
      }
    ],
    []
  );

  return (
    <Card>
      {topContent}
      <TickerQuickActionRow data-tour={TOUR_TARGET.quickActions}>
        {secondaryActions.map((action) => (
          <TickerQuickActionButton
            key={action.key}
            type="button"
            aria-label={action.label}
            style={action.key === 'coffee' ? { display: 'none' } : undefined}
            disabled={action.key === 'share' ? isSharing : false}
            onClick={() => handleSecondaryAction(action.key)}
          >
            <TickerQuickActionIcon>{action.icon}</TickerQuickActionIcon>
            <span>{action.label}</span>
          </TickerQuickActionButton>
        ))}
      </TickerQuickActionRow>
      {/* 공유 창은 스스로 body 로 포털한다 — 이 카드는 설정 드로어 안에 있어 여기 그리면 잘린다. */}
      {shareDialogUrl ? (
        <ShareDialog
          url={shareDialogUrl}
          onCopy={handleCopyShareDialogUrl}
          onSelectChannel={handleShareChannel}
          onClose={() => setShareDialogUrl('')}
        />
      ) : null}
      {shareToastMessage && modalRoot
        ? createPortal(
            <ShareToast role="status" aria-live="polite">
              {shareToastMessage}
            </ShareToast>,
            modalRoot
          )
        : null}
      {shareResultMessage ? <HintText>{shareResultMessage}</HintText> : null}
      <TickerCreateButton
        type="button"
        data-tour={TOUR_TARGET.tickerCreate}
        aria-label="티커 생성 열기"
        onClick={onOpenCreate}
      >
        티커 생성
      </TickerCreateButton>
      {tickerProfiles.length === 0 ? (
        <HintText>아직 생성된 티커가 없습니다.</HintText>
      ) : (
        <TickerGridWrap>
          <TickerList>
            {tickerProfiles.map((profile) => (
              <li key={profile.id}>
                <TickerChipWrap>
                  <TickerItemButton
                    type="button"
                    data-chip="true"
                    selected={includedTickerIds.includes(profile.id)}
                    aria-pressed={includedTickerIds.includes(profile.id)}
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 선택`}
                    onClick={() => onTickerClick(profile)}
                    onKeyDown={(event) => {
                      if (event.key !== 'F2') return;
                      event.preventDefault();
                      onOpenEdit(profile);
                    }}
                    onMouseDown={() => onTickerPressStart(profile)}
                    onMouseUp={onTickerPressEnd}
                    onMouseLeave={onTickerPressEnd}
                    onTouchStart={() => onTickerPressStart(profile)}
                    onTouchEnd={onTickerPressEnd}
                    onTouchCancel={onTickerPressEnd}
                  >
                    {getTickerDisplayName(profile.ticker, profile.name)}
                  </TickerItemButton>
                  <TickerGearButton
                    type="button"
                    data-gear="true"
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 설정`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenEdit(profile);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M9.6 3.4a1 1 0 0 1 1-.8h2.8a1 1 0 0 1 1 .8l.3 1.8a7.5 7.5 0 0 1 1.5.8l1.7-.7a1 1 0 0 1 1.2.4l1.4 2.4a1 1 0 0 1-.2 1.3l-1.4 1.2c.1.6.1 1.1 0 1.7l1.4 1.2a1 1 0 0 1 .2 1.3l-1.4 2.4a1 1 0 0 1-1.2.4l-1.7-.7c-.5.3-1 .6-1.5.8l-.3 1.8a1 1 0 0 1-1 .8h-2.8a1 1 0 0 1-1-.8l-.3-1.8c-.5-.2-1-.5-1.5-.8l-1.7.7a1 1 0 0 1-1.2-.4L2.8 16a1 1 0 0 1 .2-1.3l1.4-1.2a7 7 0 0 1 0-1.7L3 10.6a1 1 0 0 1-.2-1.3l1.4-2.4a1 1 0 0 1 1.2-.4l1.7.7c.5-.3 1-.6 1.5-.8l.3-1.8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </TickerGearButton>
                </TickerChipWrap>
              </li>
            ))}
          </TickerList>
        </TickerGridWrap>
      )}
    </Card>
  );
}

const TickerCreation = memo(TickerCreationComponent);

export default TickerCreation;
