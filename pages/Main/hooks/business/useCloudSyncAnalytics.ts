import { useEffect, useRef } from 'react';
import { useCloudSyncStateValue } from '@/jotai/snowball/cloud';
import { ANALYTICS_EVENT, setUserProperties, trackEvent } from '@/shared/lib/analytics';

/**
 * 클라우드 동기화 상태 전이를 GA4로 흘린다.
 *
 * 엔진(`jotai/snowball/cloud`)은 **순수(무계측)**라 그 안에서 발화하지 않는다. 대신 상태 atom을
 * 구독하는 이 경계에서 전이를 감지해 발화한다: saved → cloud_save_completed / error →
 * operation_error(operation=cloud_save, 기존 이벤트 재사용). 첫 렌더(idle)는 전이가 아니라 무발화.
 */
export const useCloudSyncAnalytics = (): void => {
  const state = useCloudSyncStateValue();
  const prevStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === prevStatus.current) return;
    prevStatus.current = state.status;

    if (state.status === 'saved') {
      trackEvent(ANALYTICS_EVENT.CLOUD_SAVE_COMPLETED, {});
      // 클라우드 저장에 도달한 사용자 코호트(User Property, 멱등).
      setUserProperties({ has_saved: true });
    } else if (state.status === 'error') {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'cloud_save' });
    }
  }, [state.status]);
};
