import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components';
import { TOUR_TARGET } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
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
} from '@/pages/Main/Main.shared.styled';
import { ShareToast } from './TickerCreation.styled';

type SecondaryActionKey = 'share' | 'coffee';

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
      if (result.copied) {
        setShareResultMessage('');
        setShareToastMessage('공유 링크를 클립보드에 복사했습니다.');
      } else {
        setShareResultMessage(`공유 링크: ${result.url}`);
      }
    } catch {
      setShareResultMessage('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, onCreateShareLink]);

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
