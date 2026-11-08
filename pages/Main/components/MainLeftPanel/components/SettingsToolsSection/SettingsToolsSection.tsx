import { memo, useCallback } from 'react';
import { Card } from '@/components';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import { HintText } from '@/components/common';
import ShareFlowLayer from '@/pages/Main/components/ShareFlowLayer';
import { useShareFlow } from '@/pages/Main/hooks';
import { TOUR_TARGET } from '@/shared/constants';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { SettingsToolsSectionProps } from './SettingsToolsSection.types';
import { ToolButton, ToolRow } from './SettingsToolsSection.styled';

/*
 * 공유 흐름(링크 생성 → 복사 → 막히면 공유 창 → 채널)은 `useShareFlow` + `ShareFlowLayer` 로 옮겼다(2026-11-09).
 * 시뮬레이터 상단의 "결과 공유" 버튼과 같은 흐름을 쓴다 — 실패 문구·계측이 두 벌로 갈리지 않게.
 */
function SettingsToolsSectionComponent({ onCreateShareLink }: SettingsToolsSectionProps) {
  const flow = useShareFlow(onCreateShareLink);
  const { share } = flow;

  const handleShareClick = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'quick_action_share',
      placement: 'ticker_creation_quick_actions'
    });
    void share();
  }, [share]);

  return (
    <>
      <Card title="도구">
        <ToolRow data-tour={TOUR_TARGET.quickActions}>
          <ToolButton type="button" aria-label="공유" disabled={flow.isSharing} onClick={handleShareClick}>
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
        {flow.failureMessage ? <HintText role="alert">{flow.failureMessage}</HintText> : null}
      </Card>

      {/* 표시 전용 금일 원↔달러 환율(참고용). 계산 엔진과 분리 — 엔진에 아무것도 넘기지 않아
          저장/공유/시뮬레이션 결과에 영향이 없다. 자기 면(surface+border)을 가진 위젯이라
          위 도구 카드 **안**에 넣지 않는다(카드 안의 카드 금지). */}
      <ExchangeRateWidget />

      <ShareFlowLayer flow={flow} />
    </>
  );
}

const SettingsToolsSection = memo(SettingsToolsSectionComponent);

export default SettingsToolsSection;
