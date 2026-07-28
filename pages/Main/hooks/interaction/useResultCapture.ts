import { useCallback, useRef, useState } from 'react';
import { useStore } from 'jotai/react';
import { activeScenarioIdAtom, scenarioTabsAtom } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { toResultCaptureFailure, toResultCaptureFailureReason } from './resultCaptureError';
import type { ResultCaptureFailure } from './resultCaptureError';

/**
 * 결과 영역 **이미지로 저장** 배선.
 *
 * `usePdfReport`와 같은 두 규율을 따른다:
 *
 * 1. **구독 0.** 시나리오 이름은 클릭 시점에 store 에서 스냅샷으로 읽는다 — 탭 이름 편집 한 글자마다
 *    이 버튼이 리렌더되면 결과 그리드 위 컨트롤 줄 전체가 흔들린다.
 * 2. **초기 번들 격리.** 캡처 파이프라인(html2canvas)은 `await import()` 로만 로드한다. 버튼이
 *    화면에 있는 것만으로는 아무것도 받지 않는다.
 */

export type ResultCaptureController = {
  /** 캡처 중 — 버튼을 비활성/aria-busy 로 만들고 라벨을 바꾼다. */
  isCapturing: boolean;
  /** 직전 시도의 실패 안내(없으면 null). 조용히 실패하지 않는다. */
  failure: ResultCaptureFailure | null;
  /** 성공 시 true. */
  captureResult: () => Promise<boolean>;
  /** 실패 안내를 닫는다. */
  dismissFailure: () => void;
};

export const useResultCapture = (): ResultCaptureController => {
  const store = useStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [failure, setFailure] = useState<ResultCaptureFailure | null>(null);
  /** 더블클릭으로 파이프라인이 두 번 도는 것을 막는다(state 는 비동기라 게이트로 못 쓴다). */
  const inFlightRef = useRef(false);

  const dismissFailure = useCallback(() => setFailure(null), []);

  const captureResult = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setIsCapturing(true);
    setFailure(null);

    try {
      const activeId = store.get(activeScenarioIdAtom);
      const scenarioName = store.get(scenarioTabsAtom).find((tab) => tab.id === activeId)?.name ?? '';

      const { captureResultImage } = await import('./resultCapturePipeline');
      await captureResultImage({ scenarioName });

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'result_capture', placement: 'scenario_tabs_row' });
      return true;
    } catch (error) {
      // 무음 실패 금지 — 사유와 함께 버튼 아래 알림으로 보여준다(계측에도 사유를 싣는다).
      const reason = toResultCaptureFailureReason(error);
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'result_capture', reason });
      setFailure(toResultCaptureFailure(reason));
      return false;
    } finally {
      inFlightRef.current = false;
      setIsCapturing(false);
    }
  }, [store]);

  return { isCapturing, failure, captureResult, dismissFailure };
};
