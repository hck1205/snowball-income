import { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import { HintText, ShareDialog, buildShareChannelUrl, type ShareChannelId } from '@/components/common';
import { TOUR_TARGET } from '@/shared/constants';
import { ANALYTICS_EVENT, track, trackEvent } from '@/shared/lib/analytics';
import type { SettingsToolsSectionProps } from './SettingsToolsSection.types';
import { ShareToast, ToolButton, ToolRow } from './SettingsToolsSection.styled';

/** 채널 인텐트에 함께 실어 보내는 제목. 링크가 무엇인지 한 줄로 말한다. */
const SHARE_TITLE = '배당 재투자 시뮬레이션 결과';

/** 채널 새 창이 브라우저 팝업 차단에 막혔을 때 — 아무 일도 안 일어난 것처럼 보이면 안 된다. */
const POPUP_BLOCKED_MESSAGE = '브라우저가 새 창을 막았습니다. 팝업을 허용하거나 링크를 복사해 주세요.';

/**
 * 설정 드로어의 **마지막 섹션 — 도구**(공유 · 환율).
 *
 * 자리 이유. 종전에는 이 공유 버튼이 드로어 **맨 위**에 전폭 고스트 버튼으로 앉아 있었다. 즉
 * 드로어에서 시각적으로 가장 먼저 닿는 요소가 **가장 드물게 쓰는 동작**이었고, 전폭 고스트라
 * 빈 입력칸으로도 읽혔다. 지금 순서는 ①종목 ②투자 조건 ③계산 방식 ④도구다 — 자주 쓰는 것이 위다.
 * (투어 단계 순서도 원래 `ticker-create → investment-settings → quick-actions` 라 DOM 이 투어를 따라온 셈이다.)
 *
 * 공유 로직은 `TickerCreation` 에서 **옮겨 온 것**이다(복제 아님) — 티커 카드는 이제 종목만 말한다.
 */
function SettingsToolsSectionComponent({ onCreateShareLink }: SettingsToolsSectionProps) {
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

      const opened = window.open(channelUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        /*
         * 팝업 차단(반환 null). 조용히 끝내면 버튼이 고장 난 것으로 보인다 — 사유를 말하고
         * 공유 창은 **열어 둔다**(그 안의 링크 복사가 대안이다). 공유가 없었으니 계측도 없다.
         */
        setShareToastMessage(POPUP_BLOCKED_MESSAGE);
        return;
      }

      track(ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: channel });
      setShareDialogUrl('');
    },
    [shareDialogUrl]
  );

  const handleShareClick = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'quick_action_share',
      placement: 'ticker_creation_quick_actions'
    });
    void handleShareLink();
  }, [handleShareLink]);

  return (
    <>
      <Card title="도구">
        <ToolRow data-tour={TOUR_TARGET.quickActions}>
          <ToolButton type="button" aria-label="공유" disabled={isSharing} onClick={handleShareClick}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <path d="M8.3 10.9 15.7 6.1" />
              <path d="M8.3 13.1 15.7 17.9" />
            </svg>
            <span>공유</span>
          </ToolButton>
          {/* 후원(Coffee) — 스코프는 살아 있고 노출만 꺼 둔 자리다(이전 퀵액션 툴바에서 그대로 옮겨 왔다).
              지우면 되살릴 때 다시 배선해야 하므로 마크업만 남긴다. */}
          <ToolButton type="button" aria-label="Coffee" style={{ display: 'none' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 10h10v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
              <path d="M15 11h2a2 2 0 1 1 0 4h-2" />
              <path d="M8 6v2M11 6v2" />
            </svg>
            <span>Coffee</span>
          </ToolButton>
        </ToolRow>
        <HintText>지금 조건 그대로 링크를 만들어 복사합니다.</HintText>
        {shareResultMessage ? <HintText role="alert">{shareResultMessage}</HintText> : null}
      </Card>

      {/* 표시 전용 금일 원↔달러 환율(참고용). 계산 엔진과 분리 — 엔진에 아무것도 넘기지 않아
          저장/공유/시뮬레이션 결과에 영향이 없다. 자기 면(surface+border)을 가진 위젯이라
          위 도구 카드 **안**에 넣지 않는다(카드 안의 카드 금지). */}
      <ExchangeRateWidget />

      {/* 공유 창은 스스로 body 로 포털한다 — 이 카드는 설정 드로어 안이라 여기 그리면 잘린다. */}
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
    </>
  );
}

const SettingsToolsSection = memo(SettingsToolsSectionComponent);

export default SettingsToolsSection;
